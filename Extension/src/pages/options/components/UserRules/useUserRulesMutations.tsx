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
    type RuleLineGroup,
    deleteLinesFromRules,
    insertLinesIntoRules,
    setRuleDisabled,
} from './rule-parser';

import styles from './UserRulesList.module.pcss';

/**
 * Debounce delay in milliseconds for persisting a rule enable/disable toggle
 * to the background storage.
 */
const TOGGLE_SAVE_DEBOUNCE_MS = 300;

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
     * Updates the shared "rules export available" flag (consumed by the header
     * menu) after every mutation that changes whether rules are present.
     */
    setUserRulesExportAvailableState: (state: boolean) => void;

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
     * Optimistically toggles a single rule's disabled state and persists the
     * change. On save failure the UI is refetched from the backend to reflect
     * the actual persisted state and the error is logged.
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
     *
     * @param group The rule line group to delete.
     */
    handleDeleteRequest: (group: RuleLineGroup) => Promise<void>;
};

/**
 * Encapsulates the optimistic mutation logic for the user rules list:
 * toggling, deleting and undoing deletes of rules, plus the concurrency
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
    setUserRulesExportAvailableState,
    addNotification,
    removeNotification,
    checkLimitations,
    telemetryStore,
}: UseUserRulesMutationsProps): UseUserRulesMutationsResult => {
    const [isSaving, setIsSaving] = useState(false);

    // Monotonic counter identifying the latest mutation. Each persistRules call
    // captures its own sequence number; a save/refetch round-trip only applies
    // its result if no newer mutation has started meanwhile. This prevents an
    // in-flight refetch from clobbering a more recent optimistic update (e.g.
    // rapid successive deletes).
    const mutationSeqRef = useRef(0);
    // Number of persistRules calls currently in flight. isSaving stays true
    // until the last one settles, keeping row buttons disabled throughout.
    const inFlightCountRef = useRef(0);

    // Stable debounced setter — intentionally lives for the component's
    // lifetime via empty deps to avoid re-creating the debounce timer on
    // every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const saveToggleDebounced = useCallback(
        debounce((value: string, _revertTo: string, mutationSeq: number) => {
            // A newer local mutation supersedes this queued toggle, so only the
            // latest optimistic text may be persisted or rolled back.
            if (mutationSeq !== mutationSeqRef.current) {
                return;
            }
            inFlightCountRef.current += 1;
            setIsSaving(true);
            messenger.saveUserRules(value).then(async () => {
                // Refetch the actual backend state so the UI reflects what was
                // truly persisted. This is critical for rapid-toggle scenarios
                // (T1→T2→T3): only T3's save runs, and if it fails, reverting
                // to `revertTo` (= T2's optimistic state, never persisted)
                // would desync the UI from the backend. Refetching guarantees
                // we show the real persisted state.
                if (mutationSeq !== mutationSeqRef.current) {
                    return;
                }
                const { userRules: refetched } = await messenger.getUserRulesEditorData();
                if (mutationSeq === mutationSeqRef.current) {
                    setUserRules(refetched);
                    setUserRulesExportAvailableState(refetched.trim().length > 0);
                }
            }).catch((error: unknown) => {
                logger.error(
                    '[ext.useUserRulesMutations]: Failed to save toggled user rules; refetching backend state:',
                    error,
                );
                // On failure, refetch the backend state instead of reverting to
                // `revertTo`, which may be an un-persisted optimistic snapshot.
                messenger.getUserRulesEditorData().then(({ userRules: refetched }) => {
                    if (mutationSeq === mutationSeqRef.current) {
                        setUserRules(refetched);
                        setUserRulesExportAvailableState(refetched.trim().length > 0);
                    }
                }).catch((refetchError: unknown) => {
                    logger.error(
                        '[ext.useUserRulesMutations]: Failed to refetch user rules after toggle save failure:',
                        refetchError,
                    );
                });
            }).finally(() => {
                inFlightCountRef.current -= 1;
                if (inFlightCountRef.current === 0) {
                    setIsSaving(false);
                }
                // Toggling a rule on/off changes the effective active dynamic
                // rules count under MV3, so the limit warning must be
                // recalculated the same way the editor does after every save.
                if (mutationSeq === mutationSeqRef.current) {
                    checkLimitations?.();
                }
            });
        }, TOGGLE_SAVE_DEBOUNCE_MS),
        [],
    );

    useEffect(() => {
        return () => {
            saveToggleDebounced.cancel();
        };
    }, [saveToggleDebounced]);

    /**
     * Persists the given rules string to the background and re-syncs local state
     * with the saved result. On failure, reverts to the fallback rules.
     *
     * @param nextRules Rules string to save.
     * @param fallbackRules Rules string to restore if saving fails.
     *
     * @returns `true` if the save succeeded, `false` otherwise.
     */
    const persistRules = useCallback(async (nextRules: string, fallbackRules: string): Promise<boolean> => {
        const seq = mutationSeqRef.current + 1;
        mutationSeqRef.current = seq;
        inFlightCountRef.current += 1;
        setIsSaving(true);
        try {
            await messenger.saveUserRules(nextRules);
            const { userRules: refetched } = await messenger.getUserRulesEditorData();
            // Skip the refetch result if a newer mutation superseded this one;
            // its optimistic state (and its own refetch) is now authoritative.
            if (seq === mutationSeqRef.current) {
                setUserRules(refetched);
            }
            // Re-check the MV3 dynamic rules limit after every successful
            // persist (delete/undo), mirroring the editor's save path. Without
            // this, deleting rules from the list view (e.g. via "Delete all")
            // could leave a stale "limit exceeded" warning/notification shown
            // even after the rule count drops back under the limit.
            await checkLimitations?.();
            return true;
        } catch (error) {
            logger.error('[ext.useUserRulesMutations]: Failed to save user rules:', error);
            // Revert on failure, but only if still the latest mutation — otherwise
            // reverting would discard a newer optimistic update.
            if (seq === mutationSeqRef.current) {
                setUserRules(fallbackRules);
            }
            return false;
        } finally {
            inFlightCountRef.current -= 1;
            if (inFlightCountRef.current === 0) {
                setIsSaving(false);
            }
        }
    }, [setUserRules, checkLimitations]);

    /**
     * Restores a previously deleted rule (or comment block) by re-inserting
     * only its lines into the current rules text. Invoked from the "Undo"
     * button in the delete notification.
     *
     * Dismisses the snackbar that triggered this undo so it does not stay
     * visible after the rule is restored.
     *
     * Shows an error notification if the restore fails.
     *
     * @param deletedLines The deleted lines with their original indices and
     * raw text, to re-insert into the current rules.
     * @param notificationId ID of the undo snackbar to dismiss after restoring.
     */
    const handleUndoDelete = useCallback(async (
        deletedLines: { lineIndex: number; text: string }[],
        notificationId?: string,
    ) => {
        // Dismiss the snackbar that triggered this undo.
        if (notificationId) {
            removeNotification?.(notificationId);
        }

        // Read the current rules via the ref (not the closure) so the undo
        // operates on the actual latest state, not a stale snapshot captured
        // when the delete notification was created.
        const currentRules = userRulesRef.current;
        const restoredRules = insertLinesIntoRules(currentRules, deletedLines);

        // Optimistic update.
        setUserRules(restoredRules);
        setUserRulesExportAvailableState(restoredRules.trim().length > 0);

        // On save failure, revert to the pre-undo state (currentRules).
        const restored = await persistRules(restoredRules, currentRules);
        if (!restored) {
            addNotification?.({
                type: NotificationType.Error,
                text: translator.getMessage('options_editor_save_error'),
            });
        }
    }, [
        persistRules,
        addNotification,
        removeNotification,
        userRulesRef,
        setUserRules,
        setUserRulesExportAvailableState,
    ]);

    /**
     * Optimistically toggles a single rule's disabled state and persists the
     * change. On save failure the UI is refetched from the backend to reflect
     * the actual persisted state and the error is logged.
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
            const next = setRuleDisabled(prev, lineIndex, disabled);
            const mutationSeq = mutationSeqRef.current + 1;
            mutationSeqRef.current = mutationSeq;
            setUserRules(next);
            setUserRulesExportAvailableState(next.trim().length > 0);
            saveToggleDebounced(next, prev, mutationSeq);

            // Any checkbox interaction (enable or disable) counts as a
            // checkbox_click event on the user rules screen.
            telemetryStore?.sendCustomEvent(
                TelemetryEventName.CheckboxClick,
                TelemetryScreenName.UserRulesScreen,
            );
        },
        [
            saveToggleDebounced,
            setUserRulesExportAvailableState,
            userRulesRef,
            setUserRules,
            telemetryStore,
        ],
    );

    const handleDeleteRequest = useCallback(async (group: RuleLineGroup) => {
        const previousRules = userRulesRef.current;
        const indices = group.lines.map((line) => line.lineIndex);
        const nextRules = deleteLinesFromRules(previousRules, indices);

        // Optimistic update.
        setUserRules(nextRules);

        const saved = await persistRules(nextRules, previousRules);
        if (!saved) {
            return;
        }

        // Capture the deleted lines with their original indices and raw text.
        // The undo button re-inserts only these lines into the current rules
        // text, so each undo restores only the rule shown in its own snackbar.
        const deletedLines = group.lines.map((line) => ({
            lineIndex: line.lineIndex,
            text: line.text,
        }));

        const notificationId = addNotification?.({
            type: NotificationType.Success,
            // Stable key so identical rapid deletes don't stack duplicate
            // snackbars — the JSX `text` below can't be compared by reference.
            dedupeKey: `deleted:${group.lines.map((line) => line.trimmedText).join('\n')}`,
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
                onClick: () => handleUndoDelete(deletedLines, notificationId ?? undefined),
            }],
        });
    }, [persistRules, addNotification, handleUndoDelete, userRulesRef, setUserRules]);

    return {
        isSaving,
        mutationSeqRef,
        inFlightCountRef,
        handleToggleRuleDisabled,
        handleDeleteRequest,
    };
};
