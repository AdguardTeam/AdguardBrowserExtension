/**
 * Copyright (c) 2015-2026 Adguard Software Ltd.
 *
 * @file
 * This file is part of AdGuard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * AdGuard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * AdGuard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with AdGuard Browser Extension. If not, see <http://www.gnu.org/licenses/>.
 */

import React, {
    type Dispatch,
    type MutableRefObject,
    type SetStateAction,
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react';

import { debounce } from 'lodash-es';

import { translator } from '../../../../common/translators/translator';
import { messenger } from '../../../services/messenger';
import { logger } from '../../../../common/logger';
import { type NotificationParams, NotificationType } from '../../../common/types';
import { TelemetryEventName, TelemetryScreenName } from '../../../../common/telemetry';
import { type TelemetryStore } from '../../../common/telemetry';

import {
    type PendingDeletedBlock,
    type RuleLineGroup,
    LINE_TERMINATOR_RE,
    createPendingDeletedBlock,
    deleteLinesFromRules,
    getInlineEditorGroupSeed,
    getLogicalLineIndex,
    insertLinesIntoRules,
    isInlineDraftUnchanged,
    replaceGroupLinesInRules,
    restoreDeletedBlockWithAnchor,
    restorePendingDeletedBlock,
    serializeCommentDraft,
    serializeRuleDraft,
    setRuleDisabled,
} from './rule-parser';

import styles from './UserRulesList.module.pcss';

/**
 * Debounce delay in milliseconds for persisting a rule enable/disable toggle
 * to the background storage.
 */
const TOGGLE_SAVE_DEBOUNCE_MS = 300;

/**
 * Shows the shared "failed to save user rules" error notification. Kept in one
 * place so every mutation path (delete, undo, inline save, create) reports a
 * failed write the same way.
 *
 * @param addNotification Callback used to show a snackbar notification.
 */
const notifySaveError = (
    addNotification?: (params: NotificationParams) => string | null,
): void => {
    addNotification?.({
        type: NotificationType.Error,
        text: translator.getMessage('options_editor_save_error'),
    });
};

/**
 * Outcome of a write attempted through the mutation hook's `persistRules`.
 */
interface PersistRulesResult {
    /**
     * Whether the write reached the background.
     */
    saved: boolean;

    /**
     * Whether a newer mutation started before this write settled. In that
     * case the newer mutation owns the shared state and pending-delete
     * bookkeeping, so the caller must not roll them back or report an error.
     */
    superseded: boolean;
}

/**
 * Pending deleted block with a stable id, so an Undo snackbar can find the
 * block again after a later create/edit shifted its logical position.
 */
type PendingDeleteRecord = PendingDeletedBlock & {
    /**
     * Identifies the block across the immutable updates that shift its logical
     * indices.
     */
    id: number;

    /**
     * Whether the logical indices were taken from a different visible text.
     * Only the blocks pending when an external change lands become stale; blocks
     * deleted afterwards have indices for the current text and stay accurate.
     */
    indicesStale: boolean;

    /**
     * Number of deleted lines that belonged to the rules created since the
     * search query changed. Restoring the block has to grow the tracked created
     * prefix back, so an Undo keeps pinning the restored row.
     */
    removedCreatedLineCount: number;
};

/**
 * Props accepted by {@link useUserRulesMutations}.
 */
export type UseUserRulesMutationsProps = {
    /**
     * Ref mirroring the latest `userRules` value. Kept in sync on every
     * render by the owning component, so deferred callbacks (e.g. the undo
     * button onClick) read the actual current state instead of a stale
     * closure value.
     */
    userRulesRef: MutableRefObject<string>;

    /**
     * Setter for the component's `userRules` state. Optimistic updates are
     * pushed through this setter so the list re-renders immediately, before
     * the background save resolves.
     */
    setUserRules: Dispatch<SetStateAction<string>>;

    /**
     * Optional callback used to show a snackbar notification (e.g. the undo
     * snackbar shown after deleting a rule). When omitted, no notifications
     * are shown.
     */
    addNotification?: (params: NotificationParams) => string | null;

    /**
     * Optional callback used to remove a previously shown snackbar notification
     * by its ID. Used to dismiss an undo snackbar when its Undo button is
     * clicked, so the notification does not stay visible after the undo is
     * performed.
     */
    removeNotification?: (id: string) => void;

    /**
     * Optional callback used to re-check the MV3 dynamic rules limit after a
     * mutation is persisted.
     */
    checkLimitations?: () => Promise<void>;

    /**
     * Optional telemetry store used to record checkbox toggle interactions
     * on the user rules screen.
     */
    telemetryStore?: TelemetryStore;
};

/**
 * Return value of {@link useUserRulesMutations}.
 */
export type UseUserRulesMutationsResult = {
    /**
     * `true` while at least one mutation is in flight. Row action buttons stay
     * disabled until the last in-flight mutation settles.
     */
    isSaving: boolean;

    /**
     * Monotonic mutation sequence counter, bumped on every mutation. Exposed so
     * the owning component's background-sync effect can capture the value
     * before an async refetch and skip applying a stale result if a newer
     * mutation started meanwhile (otherwise the refetch would briefly revert
     * the optimistic update).
     *
     * Consumers should treat this as read-only; only the hook mutates it.
     */
    mutationSeqRef: MutableRefObject<number>;

    /**
     * Number of persistRules / saveToggleDebounced calls currently in flight.
     * Exposed so the owning component's background-sync effect can skip a
     * refetch triggered by a `UserFilterUpdated` event while a save is still
     * in flight — the save's own refetch will apply the correct state, and
     * the event-driven refetch might read a stale backend state (e.g. before
     * a second rapid delete has been persisted).
     *
     * Consumers should treat this as read-only; only the hook mutates it.
     */
    inFlightCountRef: MutableRefObject<number>;

    /**
     * Number of lines added by creates since the search query last changed.
     * Created rules are prepended, so they are the first
     * {@link createdRuleCount} raw lines of the rules text and have to stay
     * visible while a search is active even when they do not match it.
     */
    createdRuleCount: number;

    /**
     * Forgets the created rules tracked for the current search query, e.g. when
     * the query changes.
     */
    resetCreatedRuleCount: () => void;

    /**
     * Optimistically toggles a single rule's disabled state and persists the
     * change. The write is debounced; a pending write is flushed on unmount and
     * when the page is hidden, so a quick reload or a List → Edit switch does
     * not lose the toggle. On save failure the shared save-error notification
     * is shown and the UI is refetched from the backend to reflect the actual
     * persisted state.
     *
     * Reads `userRules` via the ref (not the closure) so this callback keeps a
     * stable identity across mutations — otherwise every toggle/delete would
     * recreate it and force every memoized {@link RuleRow} (incl. WASM
     * highlighting) to re-render. The ref mirrors `userRules` synchronously on
     * each render.
     *
     * @param lineIndex Zero-based index of the raw line within the rules text.
     * @param disabled Whether the rule should be disabled (marker added).
     */
    handleToggleRuleDisabled: (lineIndex: number, disabled: boolean) => void;

    /**
     * Deletes a rule (or comment block) immediately and shows a snackbar
     * notification with an "Undo" button that restores the previous rules.
     * Shows the shared save-error notification when the delete cannot be
     * persisted.
     *
     * @param group The rule line group to delete.
     *
     * @returns `true` if the delete was persisted, `false` otherwise.
     */
    handleDeleteRequest: (group: RuleLineGroup) => Promise<boolean>;

    /**
     * Persists an inline edit of a rule or comment block through the optimistic
     * save pipeline. The caller is responsible for leaving editing mode on
     * success only; on failure the list reverts to the stored rules, the
     * save-error notification is shown and the editor stays open with the
     * draft. Saving an empty draft deletes the row (with Undo) unless the
     * stored line was empty as well, and a draft equal to the stored line is
     * not persisted at all.
     *
     * @param group The edited row's line group.
     * @param draft Current inline editor content.
     *
     * @returns `true` when the draft is fully handled (nothing changed, or the
     * save/delete succeeded), `false` when the save failed.
     */
    handleInlineSaveRequest: (group: RuleLineGroup, draft: string) => Promise<boolean>;

    /**
     * Persists a newly created rule as the first line of the user rules text.
     *
     * Unlike the other mutations this is deliberately not optimistic: the
     * create row stays open with its draft until the save succeeds, so a
     * failed save cannot lose the typed rule. A failed save also shows the
     * shared save-error notification, like every other mutation path.
     *
     * @param draft Current inline editor content. Multi-line drafts create one
     * rule per non-empty line, in order.
     *
     * @returns `true` if the save succeeded, `false` otherwise.
     */
    handleCreateSaveRequest: (draft: string) => Promise<boolean>;
};

/**
 * Encapsulates the optimistic mutation logic for the user rules list: every
 * write path (toggle, delete, undo, inline save, create), plus the concurrency
 * bookkeeping that prevents in-flight saves/refetches from clobbering newer
 * optimistic updates.
 *
 * The hook owns the mutation sequence/in-flight counters and the `isSaving`
 * flag so the component can stay focused on search, virtualization and
 * rendering. All handlers keep stable identities (via `useCallback`) so
 * memoized {@link RuleRow}s do not re-render unnecessarily.
 *
 * The owning component passes the `userRulesRef` (which it keeps in sync on
 * every render) so mutations read the latest rules text without adding a
 * dependency that would destabilise the callback identities.
 *
 * @param props See {@link UseUserRulesMutationsProps}.
 *
 * @returns See {@link UseUserRulesMutationsResult}.
 */
export const useUserRulesMutations = ({
    userRulesRef,
    setUserRules,
    addNotification,
    removeNotification,
    checkLimitations,
    telemetryStore,
}: UseUserRulesMutationsProps): UseUserRulesMutationsResult => {
    const [isSaving, setIsSaving] = useState(false);

    // Blocks deleted from the visible text that have not been restored yet,
    // oldest first. They stay tracked after their snackbar expires: their
    // missing lines still shift the real indices used by later undos. The
    // logical indices keep stacked deletes ordered even when a neighbour was
    // itself deleted and is still missing from the visible text.
    const pendingDeletesRef = useRef<PendingDeleteRecord[]>([]);
    // Monotonic id of the next pending delete.
    const nextPendingDeleteIdRef = useRef(0);

    // Number of rules created since the search query last changed. Creating a
    // rule works the same with and without a search: the query is kept and the
    // new rules stay visible at the top of the results even when they do not
    // match it. The created rules are prepended, so they are the first
    // `createdRuleCount` raw lines. Deleting one of them shrinks the count and
    // Undo grows it back, so an older rule with the same text is not kept
    // visible by mistake.
    const [createdRuleCount, setCreatedRuleCount] = useState(0);
    // Mirrors `createdRuleCount` synchronously for the stable mutation
    // callbacks, which must not depend on the state value.
    const createdRuleCountRef = useRef(0);

    /**
     * Applies a delta to the tracked created-rule count and mirrors it in the
     * ref immediately, so consecutive mutations in the same tick see the
     * updated value.
     *
     * @param delta Number of lines to add (positive) or remove (negative).
     */
    const adjustCreatedRuleCount = useCallback((delta: number) => {
        createdRuleCountRef.current += delta;
        setCreatedRuleCount(createdRuleCountRef.current);
    }, []);

    /**
     * Forgets the created rules tracked for the current search query.
     */
    const resetCreatedRuleCount = useCallback(() => {
        createdRuleCountRef.current = 0;
        setCreatedRuleCount(0);
        // A pending delete taken under the old query must not grow the count
        // for the new one: its Undo restores the line, but it is no longer a
        // rule created under the active query.
        pendingDeletesRef.current.forEach((block) => {
            block.removedCreatedLineCount = 0;
        });
    }, []);

    // Monotonic counter identifying the latest mutation. Each persistRules call
    // captures its own sequence number; a save/refetch round-trip only applies
    // its result if no newer mutation has started meanwhile. This prevents an
    // in-flight refetch from clobbering a more recent optimistic update (e.g.
    // rapid successive deletes).
    const mutationSeqRef = useRef(0);
    // Number of persistRules calls currently in flight. isSaving stays true
    // until the last one settles, keeping row buttons disabled throughout.
    const inFlightCountRef = useRef(0);

    // Tracks whether the component is still mounted. The unmount flush persists
    // the pending toggle *after* the component is gone, so every state update
    // (isSaving, userRules) and every follow-up backend refetch must be skipped
    // once this flips to false — otherwise React warns about a state update on
    // an unmounted component and the work is wasted. The MV3 limits check is
    // deliberately not guarded here: see the `.finally` handler below.
    const isMountedRef = useRef(true);

    // Visible rules text that the pending logical indices describe. If the
    // text diverges (another tab, the Edit view, a refetch with foreign edits),
    // only the blocks already pending become stale and Undo falls back to their
    // captured anchors; later deletes are taken from the new text and keep
    // using their indices.
    const expectedRulesTextRef = useRef('');
    const markPendingDeletesStaleIfTextChanged = useCallback((currentRules: string) => {
        if (expectedRulesTextRef.current === currentRules) {
            return;
        }

        pendingDeletesRef.current.forEach((pendingBlock) => {
            pendingBlock.indicesStale = true;
        });
        expectedRulesTextRef.current = currentRules;
    }, []);

    // Tracks whether the optimistic toggle currently shown in the UI is known
    // to be persisted. Set when a toggle is applied, and cleared only by a
    // write that carries it: the toggle's own debounced save, or a
    // `persistRules` write, which is always derived from the optimistic text.
    // `persistRules` reads it on failure: the state it reverts to may still
    // contain a toggle whose queued save was dropped as superseded, so that
    // reverted state has to be persisted again. Otherwise the checkbox would
    // stay toggled while the toggle is never saved, and a reload would lose it.
    // The flag deliberately survives the re-queue: the re-queued save can itself
    // be superseded by yet another failing write, which then has to re-queue it
    // again. The only other place that clears it is the toggle's own failure
    // path, where the follow-up refetch drops the toggle from the UI anyway.
    const unsavedToggleRef = useRef(false);

    // Latest `addNotification` prop. The debounced toggle save keeps a stable
    // identity (see the empty deps below), so it reads the callback through a
    // ref instead of capturing a stale one.
    const addNotificationRef = useRef(addNotification);
    addNotificationRef.current = addNotification;

    // Stable debounced setter — intentionally lives for the component's
    // lifetime via empty deps to avoid re-creating the debounce timer on
    // every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const saveToggleDebounced = useCallback(
        debounce((value: string, mutationSeq: number) => {
            // A newer local mutation supersedes this queued toggle, so only the
            // latest optimistic text may be persisted. The toggle is not lost by
            // this: the superseding write is derived from the optimistic text
            // and therefore carries it, and if that write fails `persistRules`
            // re-queues it through `unsavedToggleRef`.
            if (mutationSeq !== mutationSeqRef.current) {
                return;
            }
            inFlightCountRef.current += 1;
            if (isMountedRef.current) {
                setIsSaving(true);
            }
            messenger.saveUserRules(value).then(async () => {
                // The toggle reached the backend.
                unsavedToggleRef.current = false;
                // Refetch the actual backend state so the UI reflects what was
                // truly persisted. This is critical for rapid-toggle scenarios
                // (T1→T2→T3): only T3's save runs, and if it fails, showing
                // T2's optimistic state (never persisted) would desync the UI
                // from the backend. Refetching guarantees we show the real
                // persisted state.
                if (mutationSeq !== mutationSeqRef.current) {
                    return;
                }
                // The unmount flush persists the toggle after the component
                // is gone; the refetched result would only be discarded, so
                // skip the background round-trip in that case.
                if (!isMountedRef.current) {
                    return;
                }
                // Kept in its own try/catch, like `persistRules` does: the write
                // already succeeded, so a failing refetch must not be reported
                // as a failed save. There is nothing to revert either, because
                // the optimistic state is the one that was just persisted.
                try {
                    const { userRules: refetched } = await messenger.getUserRulesEditorData();
                    if (mutationSeq === mutationSeqRef.current) {
                        expectedRulesTextRef.current = refetched;
                        setUserRules(refetched);
                    }
                } catch (refetchError: unknown) {
                    logger.error('[ext.useUserRulesMutations]: Failed to refetch user rules after toggle save:', refetchError);
                }
            }).catch((error: unknown) => {
                logger.error('[ext.useUserRulesMutations]: Failed to save toggled user rules; refetching backend state:', error);
                // Report the failure the same way the other mutations do — the
                // refetch below silently unchecks the box otherwise. Only the
                // latest toggle reports it, and only the latest one stops being
                // tracked: a superseded save was already replaced by a newer
                // write, which still carries the toggle, so if that write fails
                // the toggle has to be re-queued rather than left unsaved.
                if (mutationSeq === mutationSeqRef.current) {
                    unsavedToggleRef.current = false;
                    notifySaveError(addNotificationRef.current);
                }
                // On failure, refetch the backend state: the previous optimistic
                // snapshot may never have been persisted. Skipped after an
                // unmount flush, where the result would be discarded too.
                if (!isMountedRef.current) {
                    return;
                }
                messenger.getUserRulesEditorData().then(({ userRules: refetched }) => {
                    if (mutationSeq === mutationSeqRef.current) {
                        expectedRulesTextRef.current = refetched;
                        setUserRules(refetched);
                    }
                }).catch((refetchError: unknown) => {
                    logger.error('[ext.useUserRulesMutations]: Failed to refetch user rules after toggle save failure:', refetchError);
                });
            }).finally(() => {
                inFlightCountRef.current -= 1;
                if (isMountedRef.current && inFlightCountRef.current === 0) {
                    setIsSaving(false);
                }
                // Toggling a rule on/off changes the effective active dynamic
                // rules count under MV3, so the limit warning must be
                // recalculated the same way the editor does after every save.
                // `checkLimitations` is a settings-store action, not this
                // component's state, so it intentionally runs even after the
                // unmount flush: that flush is the only place recalculating the
                // warning for a list -> edit switch right after a toggle, and
                // skipping it would leave <DynamicRulesLimitsWarning /> stale.
                // The rejection is handled so a failing limits request cannot
                // surface as an unhandled rejection.
                if (mutationSeq === mutationSeqRef.current) {
                    checkLimitations?.().catch((error: unknown) => {
                        logger.error('[ext.useUserRulesMutations]: Failed to check rule limits after toggle save:', error);
                    });
                }
            });
        }, TOGGLE_SAVE_DEBOUNCE_MS),
        [],
    );

    // Persist a pending toggle on unmount (e.g. List → Edit view switch,
    // opening the fullscreen editor, or an in-app route change) instead of
    // cancelling it, so the last optimistic toggle is not lost. `flush()` is
    // idempotent, so calling it with nothing queued is a no-op.
    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
            saveToggleDebounced.flush();
        };
    }, [saveToggleDebounced]);

    // Best-effort persistence of a pending toggle when the page is hidden or
    // torn down (reload/close). The save is an async background message, so it
    // may not be delivered before the page unloads — this narrows, but does not
    // eliminate, the reload-within-debounce loss window.
    useEffect(() => {
        const onPageHide = () => {
            saveToggleDebounced.flush();
        };
        const onVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                saveToggleDebounced.flush();
            }
        };
        window.addEventListener('pagehide', onPageHide);
        document.addEventListener('visibilitychange', onVisibilityChange);
        return () => {
            window.removeEventListener('pagehide', onPageHide);
            document.removeEventListener('visibilitychange', onVisibilityChange);
        };
    }, [saveToggleDebounced]);

    /**
     * Persists the given rules string to the background and re-syncs local state
     * with the saved result. The write is authoritative: once it succeeds the
     * mutation is reported as successful, so a failing post-write refetch or
     * limits check cannot revert the UI to stale content. On write failure,
     * reverts to the fallback rules and re-queues a toggle that this mutation
     * superseded, so a reverted checkbox is never left unsaved.
     *
     * @param nextRules Rules string to save.
     * @param fallbackRules Rules string to restore if the write fails.
     *
     * @returns Whether the write was saved and whether a newer mutation
     * superseded it before it settled.
     */
    const persistRules = useCallback(async (nextRules: string, fallbackRules: string): Promise<PersistRulesResult> => {
        const seq = mutationSeqRef.current + 1;
        mutationSeqRef.current = seq;
        inFlightCountRef.current += 1;
        if (isMountedRef.current) {
            setIsSaving(true);
        }
        try {
            try {
                await messenger.saveUserRules(nextRules);
                // `nextRules` is derived from the optimistic text, so it carries
                // any toggle that was applied before this mutation.
                unsavedToggleRef.current = false;
            } catch (error) {
                logger.error('[ext.useUserRulesMutations]: Failed to save user rules:', error);
                // Revert on failure, but only if still the latest mutation —
                // otherwise reverting would discard a newer optimistic update.
                if (seq === mutationSeqRef.current) {
                    if (isMountedRef.current) {
                        setUserRules(fallbackRules);
                    }
                    // `fallbackRules` is the pre-mutation text, so it still
                    // contains a toggle whose queued save was dropped when this
                    // mutation superseded it. The write meant to persist that
                    // toggle is the one that just failed, so re-queue it for the
                    // reverted state: leaving it unsaved would keep the checkbox
                    // toggled while a reload loses the toggle. The flag stays set
                    // because the re-queued save can be superseded again by a
                    // later failing write, which then has to re-queue it too.
                    if (unsavedToggleRef.current) {
                        saveToggleDebounced(fallbackRules, seq);
                    }
                    return { saved: false, superseded: false };
                }
                return { saved: false, superseded: true };
            }

            // There is no list state to sync after an unmount (e.g. an undo
            // from the page-level snackbar after switching to the Edit view),
            // so skip the refetch entirely.
            if (isMountedRef.current) {
                try {
                    const { userRules: refetched } = await messenger.getUserRulesEditorData();
                    // Skip the refetch result if a newer mutation superseded
                    // this one; its optimistic state (and its own refetch) is
                    // now authoritative.
                    if (seq === mutationSeqRef.current) {
                        setUserRules(refetched);
                    }
                } catch (error) {
                    logger.error('[ext.useUserRulesMutations]: Failed to refetch user rules after save:', error);
                    // The write succeeded, so keep showing the content that
                    // was just persisted instead of reverting.
                    if (seq === mutationSeqRef.current) {
                        setUserRules(nextRules);
                    }
                }
            }

            // Re-check the MV3 dynamic rules limit after every successful
            // persist, mirroring the editor's save path. Without this,
            // changing the rules from the list view (e.g. via "Delete all")
            // could leave a stale "limit exceeded" warning/notification shown
            // even after the rule count drops back under the limit.
            try {
                await checkLimitations?.();
            } catch (error) {
                logger.error('[ext.useUserRulesMutations]: Failed to check rule limits after save:', error);
            }

            return { saved: true, superseded: seq !== mutationSeqRef.current };
        } finally {
            inFlightCountRef.current -= 1;
            if (isMountedRef.current && inFlightCountRef.current === 0) {
                setIsSaving(false);
            }
        }
    }, [setUserRules, checkLimitations, saveToggleDebounced]);

    /**
     * Restores a previously deleted rule (or comment block) by re-inserting
     * only its lines into the current rules text, at the position derived from
     * the other pending deletes (see {@link PendingDeletedBlock}) so stacked
     * undos keep the original order. Invoked from the "Undo" button in the
     * delete notification.
     *
     * Dismisses the snackbar that triggered this undo so it does not stay
     * visible after the rule is restored.
     *
     * Shows an error notification if the restore fails.
     *
     * @param blockId Id of the deleted block to restore.
     * @param notificationId ID of the undo snackbar to dismiss after restoring.
     */
    const handleUndoDelete = useCallback(async (
        blockId: number,
        notificationId?: string,
    ) => {
        const block = pendingDeletesRef.current.find(
            (pendingBlock) => pendingBlock.id === blockId,
        );
        if (!block) {
            return;
        }

        // The snackbar outlives the list (notifications are page-level), so
        // after switching to the Edit view the captured ref is frozen at the
        // text from before the switch: read the stored rules instead, otherwise
        // the undo would overwrite a rule saved in the Edit view.
        //
        // While the list is still mounted the ref is authoritative: it carries
        // pending optimistic changes (e.g. a debounced toggle) that the backend
        // does not know about yet, and reading the backend would silently drop
        // them from the restored text.
        let currentRules = userRulesRef.current;
        if (!isMountedRef.current) {
            try {
                const { userRules: storedRules } = await messenger.getUserRulesEditorData();
                currentRules = storedRules;
            } catch (error) {
                // Falling back to the frozen list state would overwrite whatever
                // the Edit view persisted meanwhile, so abort and keep the
                // snackbar available for another attempt.
                logger.error('[ext.useUserRulesMutations]: Failed to read the stored user rules before undo; aborting undo:', error);
                notifySaveError(addNotification);
                return;
            }
        }

        // Dismiss the snackbar that triggered this undo only after the stored
        // rules were read, so a failed read can be retried above.
        if (notificationId) {
            removeNotification?.(notificationId);
        }

        // The logical indices are only valid for the text they were taken from.
        // Mark the blocks pending before this external change as stale; the
        // current block then matches its captured neighbours instead.
        markPendingDeletesStaleIfTextChanged(currentRules);
        const restoredRules = block.indicesStale
            ? restoreDeletedBlockWithAnchor(currentRules, block)
            : restorePendingDeletedBlock(currentRules, pendingDeletesRef.current, block);

        // The block becomes visible optimistically, so it must not count as
        // pending while its write is in flight.
        pendingDeletesRef.current = pendingDeletesRef.current.filter(
            (pendingBlock) => pendingBlock !== block,
        );
        expectedRulesTextRef.current = restoredRules;

        // Optimistic update. After an unmount there is no list state left to
        // update, but the write below still has to run. Restoring a created
        // block pins it again, so the tracked prefix has to grow before the
        // row reappears.
        if (isMountedRef.current) {
            setUserRules(restoredRules);
        }
        if (block.removedCreatedLineCount > 0) {
            adjustCreatedRuleCount(block.removedCreatedLineCount);
        }

        // On save failure, revert to the pre-undo state (currentRules) only if
        // this undo still owns the shared state. The snackbar was dismissed
        // before the write, so this undo cannot be retried; keep tracking the
        // block's missing lines for later undos.
        const { saved, superseded } = await persistRules(restoredRules, currentRules);
        if (!saved && !superseded) {
            expectedRulesTextRef.current = currentRules;
            pendingDeletesRef.current.push(block);
            if (block.removedCreatedLineCount > 0) {
                adjustCreatedRuleCount(-block.removedCreatedLineCount);
            }
            notifySaveError(addNotification);
        }
    }, [
        persistRules,
        addNotification,
        removeNotification,
        userRulesRef,
        setUserRules,
        markPendingDeletesStaleIfTextChanged,
        adjustCreatedRuleCount,
    ]);

    /**
     * Optimistically toggles a single rule's disabled state and persists the
     * change. The write is debounced; a pending write is flushed on unmount and
     * when the page is hidden, so a quick reload or a List → Edit switch does
     * not lose the toggle. On save failure the shared save-error notification
     * is shown and the UI is refetched from the backend to reflect the actual
     * persisted state.
     *
     * Reads `userRules` via the ref (not the closure) so this callback keeps a
     * stable identity across mutations — otherwise every toggle/delete would
     * recreate it and force every memoized {@link RuleRow} (incl. WASM
     * highlighting) to re-render. The ref mirrors `userRules` synchronously on
     * each render.
     *
     * @param lineIndex Zero-based index of the raw line within the rules text.
     * @param disabled Whether the rule should be disabled (marker added).
     */
    const handleToggleRuleDisabled = useCallback(
        (lineIndex: number, disabled: boolean) => {
            const prev = userRulesRef.current;
            markPendingDeletesStaleIfTextChanged(prev);
            const next = setRuleDisabled(prev, lineIndex, disabled);
            const mutationSeq = mutationSeqRef.current + 1;
            mutationSeqRef.current = mutationSeq;
            expectedRulesTextRef.current = next;
            setUserRules(next);
            // The toggle is shown optimistically but is not persisted yet, so a
            // failed write has to re-queue it rather than leave it unsaved.
            unsavedToggleRef.current = true;
            saveToggleDebounced(next, mutationSeq);

            // Any checkbox interaction (enable or disable) counts as a
            // checkbox_click event on the user rules screen.
            telemetryStore?.sendCustomEvent(
                TelemetryEventName.CheckboxClick,
                TelemetryScreenName.UserRulesScreen,
            );
        },
        [
            saveToggleDebounced,
            userRulesRef,
            setUserRules,
            telemetryStore,
            markPendingDeletesStaleIfTextChanged,
        ],
    );

    const handleDeleteRequest = useCallback(async (group: RuleLineGroup): Promise<boolean> => {
        const previousRules = userRulesRef.current;
        markPendingDeletesStaleIfTextChanged(previousRules);
        const indices = group.lines.map((line) => line.lineIndex);
        const nextRules = deleteLinesFromRules(previousRules, indices);

        // The created rules are the first raw lines, so only the deleted lines
        // inside that prefix shrink it. Anything below belongs to older rules.
        const removedCreatedLineCount = group.lines.filter(
            (line) => line.lineIndex < createdRuleCountRef.current,
        ).length;

        // Capture the deleted lines with their logical indices and the
        // text-based fallback anchor before the write. The undo button restores
        // only these lines, so each snackbar restores its own rule/block.
        const pendingBlock: PendingDeleteRecord = {
            ...createPendingDeletedBlock(
                previousRules,
                group,
                pendingDeletesRef.current,
            ),
            id: nextPendingDeleteIdRef.current,
            indicesStale: false,
            removedCreatedLineCount,
        };
        nextPendingDeleteIdRef.current += 1;
        pendingDeletesRef.current.push(pendingBlock);

        // Optimistic update.
        expectedRulesTextRef.current = nextRules;
        setUserRules(nextRules);
        if (removedCreatedLineCount > 0) {
            adjustCreatedRuleCount(-removedCreatedLineCount);
        }

        const { saved, superseded } = await persistRules(nextRules, previousRules);
        if (!saved) {
            // A superseded write's text is owned by the newer mutation, so only
            // the latest failure may roll back the bookkeeping and report it.
            if (!superseded) {
                // The real text keeps the block after the revert, so it is no
                // longer pending. Report the failure here so every delete path
                // (the row's trash button and saving an empty inline draft)
                // behaves the same.
                expectedRulesTextRef.current = previousRules;
                pendingDeletesRef.current = pendingDeletesRef.current.filter(
                    (block) => block !== pendingBlock,
                );
                if (removedCreatedLineCount > 0) {
                    adjustCreatedRuleCount(removedCreatedLineCount);
                }
                notifySaveError(addNotification);
            }
            return false;
        }

        const notificationId = addNotification?.({
            type: NotificationType.Success,
            // Use the pending block id so deleting two blocks with identical
            // text still gives each its own Undo path; a text-based key is
            // deduped by the notification store and the second block would be
            // left tracked without a snackbar.
            dedupeKey: `deleted:${pendingBlock.id}`,
            text: (
                <>
                    {translator.getMessage('options_user_rules_deleted_notification')}
                    {/*
                        Clamped to a couple of lines via CSS so deleting a very
                        long rule or a multi-line comment can't blow up the
                        notification to occupy a large part of the screen. The
                        `title` attribute keeps the full text available on hover.
                    */}
                    <span
                        className={styles.deletedRuleWrapper}
                        title={group.lines.map((line) => line.displayText).join('\n')}
                    >
                        {group.lines.map((line) => (
                            <span key={line.lineIndex} className={styles.deletedRuleText}>
                                {line.displayText}
                            </span>
                        ))}
                    </span>
                </>
            ),
            buttons: [{
                title: translator.getMessage('options_user_rules_undo'),
                onClick: () => handleUndoDelete(pendingBlock.id, notificationId ?? undefined),
            }],
        });

        return true;
    }, [
        persistRules,
        addNotification,
        handleUndoDelete,
        userRulesRef,
        setUserRules,
        markPendingDeletesStaleIfTextChanged,
        adjustCreatedRuleCount,
    ]);

    /**
     * Persists an inline edit of a rule or comment block. Replaces the edited
     * line (or rewrites the whole comment block when the draft gained or lost
     * lines) and reuses {@link persistRules} for the optimistic update, refetch
     * and revert-on-failure behavior; a failed save also surfaces the shared
     * save-error notification.
     *
     * An empty draft deletes the row (with the same undo notification as the
     * trash action) unless the stored line was empty as well. A draft that
     * serializes to the stored line — e.g. one that only differs in whitespace
     * — is not persisted at all: no write, refetch or engine update.
     *
     * @param group The edited row's line group.
     * @param draft Current inline editor content.
     *
     * @returns `true` when the draft is fully handled (nothing changed, or the
     * save/delete succeeded), `false` when the save failed and the caller
     * should keep the editor open with the draft.
     */
    const handleInlineSaveRequest = useCallback(async (
        group: RuleLineGroup,
        draft: string,
    ): Promise<boolean> => {
        const line = group.lines[0];
        if (!line) {
            return true;
        }

        const seed = getInlineEditorGroupSeed(group);

        // Saving an empty value deletes the row, matching the trash action
        // (including its undo notification). A bare comment (`!`) opens with an
        // empty seed, so an unchanged empty draft must not delete the line.
        if (draft.trim().length === 0) {
            if (seed.trim().length === 0) {
                return true;
            }
            return handleDeleteRequest(group);
        }

        if (isInlineDraftUnchanged(draft, seed, group.isComment)) {
            return true;
        }

        const previousRules = userRulesRef.current;
        markPendingDeletesStaleIfTextChanged(previousRules);
        // One replacement path for both row kinds: a rule row is a one-line
        // group, so the single-line edit goes through the same helper as a
        // comment block rewrite.
        const newLines = group.isComment
            ? serializeCommentDraft(group, draft)
            : [serializeRuleDraft(line, draft)];
        const nextRules = replaceGroupLinesInRules(previousRules, group, newLines);

        // A created comment block that grows or shrinks changes the number of
        // top lines that belong to the rules created since the query changed.
        // An edit of a created rule keeps the count unchanged.
        //
        // A created comment can merge with an older comment below it into one
        // group, so only its created lines belong to the tracked prefix. For a
        // fully created block the whole length delta applies. For a mixed block
        // the older lines sit below the created ones: if they all survived at
        // the bottom of the new block, the lines above them are created;
        // otherwise keep as many created lines as still fit.
        const createdLinesInGroup = group.lines.filter(
            (groupLine) => groupLine.lineIndex < createdRuleCountRef.current,
        ).length;
        let createdLineDelta = 0;
        if (createdLinesInGroup === group.lines.length) {
            createdLineDelta = newLines.length - group.lines.length;
        } else if (createdLinesInGroup > 0) {
            const olderLines = group.lines.slice(createdLinesInGroup);
            const olderLinesKept = olderLines.length <= newLines.length
                && olderLines.every((olderLine, index) => (
                    newLines[newLines.length - olderLines.length + index] === olderLine.text
                ));
            const keptCreatedLines = olderLinesKept
                ? newLines.length - olderLines.length
                : Math.min(newLines.length, createdLinesInGroup);
            createdLineDelta = keptCreatedLines - createdLinesInGroup;
        }

        // A block that grew or shrank shifts the logical positions of the
        // pending deletes after it. Remember the previous list so a failed save
        // can put the indices back together with the reverted text.
        const previousPendingDeletes = pendingDeletesRef.current;
        if (newLines.length !== group.lines.length) {
            const logicalIndices = group.lines.map((groupLine) => getLogicalLineIndex(
                groupLine.lineIndex,
                pendingDeletesRef.current,
            ));
            const firstLogicalIndex = logicalIndices[0] ?? 0;
            const lastLogicalIndex = logicalIndices[logicalIndices.length - 1] ?? firstLogicalIndex;
            const removedIndices = logicalIndices.slice(newLines.length);
            const extraLineCount = Math.max(newLines.length - group.lines.length, 0);
            const insertionIndex = lastLogicalIndex + 1;

            pendingDeletesRef.current = pendingDeletesRef.current.map((block) => ({
                ...block,
                logicalLineIndices: block.logicalLineIndices.map((lineIndex) => {
                    const shiftedIndex = lineIndex - removedIndices.filter(
                        (removedIndex) => removedIndex < lineIndex,
                    ).length;
                    return extraLineCount > 0 && shiftedIndex >= insertionIndex
                        ? shiftedIndex + extraLineCount
                        : shiftedIndex;
                }),
            }));
        }

        // Optimistic update; persistRules reverts to `previousRules` and logs
        // the error if the save fails.
        expectedRulesTextRef.current = nextRules;
        setUserRules(nextRules);
        if (createdLineDelta !== 0) {
            adjustCreatedRuleCount(createdLineDelta);
        }
        const { saved, superseded } = await persistRules(nextRules, previousRules);
        if (!saved && !superseded) {
            expectedRulesTextRef.current = previousRules;
            pendingDeletesRef.current = previousPendingDeletes;
            if (createdLineDelta !== 0) {
                adjustCreatedRuleCount(-createdLineDelta);
            }
            notifySaveError(addNotification);
        }
        return saved;
    }, [
        addNotification,
        handleDeleteRequest,
        persistRules,
        userRulesRef,
        setUserRules,
        markPendingDeletesStaleIfTextChanged,
        adjustCreatedRuleCount,
    ]);

    /**
     * Persists a newly created rule as the first line of the user rules text.
     * The caller keeps the draft row open until this resolves so a failed save
     * cannot lose the typed rule; a failure is reported here, like every other
     * mutation path.
     *
     * A multi-line draft creates one rule per non-empty line, in order, so
     * pasting several rules into the create row does not glue them into one
     * broken rule.
     *
     * @param draft Current inline editor content.
     *
     * @returns `true` if the save succeeded, `false` otherwise.
     */
    const handleCreateSaveRequest = useCallback(async (draft: string): Promise<boolean> => {
        const newRules = draft
            .split(LINE_TERMINATOR_RE)
            .map((line) => line.trim())
            .filter((line) => line.length > 0);

        const previousRules = userRulesRef.current;
        markPendingDeletesStaleIfTextChanged(previousRules);
        const nextRules = insertLinesIntoRules(
            previousRules,
            newRules.map((text, index) => ({ lineIndex: index, text })),
        );

        // The new rules are prepended at logical 0, so they shift every pending
        // delete down, including one whose snackbar restores a deleted first
        // line: the new rule becomes the first line and the restored line stays
        // below it. Keep the previous list to restore it if the save fails.
        const previousPendingDeletes = pendingDeletesRef.current;
        pendingDeletesRef.current = pendingDeletesRef.current.map((block) => ({
            ...block,
            logicalLineIndices: block.logicalLineIndices.map(
                (lineIndex) => lineIndex + newRules.length,
            ),
        }));

        // Deliberately not optimistic: the create row stays open with its text
        // until the save succeeds, so a failure cannot lose the draft.
        const { saved, superseded } = await persistRules(nextRules, previousRules);
        if (!saved) {
            // A superseded failure must not roll back refs owned by the newer
            // mutation; only the latest failure reverts and reports.
            if (!superseded) {
                expectedRulesTextRef.current = previousRules;
                pendingDeletesRef.current = previousPendingDeletes;
                notifySaveError(addNotification);
            }
        } else if (!superseded) {
            expectedRulesTextRef.current = nextRules;
            // The new rules sit at the top and stay visible while a search is
            // active, even when they do not match it.
            adjustCreatedRuleCount(newRules.length);
        }
        return saved;
    }, [
        addNotification,
        persistRules,
        userRulesRef,
        markPendingDeletesStaleIfTextChanged,
        adjustCreatedRuleCount,
    ]);

    return {
        isSaving,
        mutationSeqRef,
        inFlightCountRef,
        createdRuleCount,
        resetCreatedRuleCount,
        handleToggleRuleDisabled,
        handleDeleteRequest,
        handleInlineSaveRequest,
        handleCreateSaveRequest,
    };
};
