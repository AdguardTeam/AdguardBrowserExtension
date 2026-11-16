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
    type FC,
    useContext,
    useMemo,
    useRef,
    useCallback,
    useEffect,
    useLayoutEffect,
    useState,
} from 'react';

import {
    defaultRangeExtractor,
    type Range,
    useWindowVirtualizer,
} from '@tanstack/react-virtual';
import { useMachine } from '@xstate/react';
import { debounce } from 'lodash-es';

import { translator } from '../../../../common/translators/translator';
import { Icon } from '../../../common/components/ui/Icon';
import { CloseIcon } from '../../../common/components/ui/CloseIcon';
import { EditorLeaveModal } from '../../../common/components/Editor';
import { REACT_MODAL_OVERLAY_CLASS } from '../../../common/constants';
import { messenger } from '../../../services/messenger';
import { logger } from '../../../../common/logger';
import { UserAgent } from '../../../../common/user-agent';
import { type NotificationParams, NotificationType } from '../../../common/types';
import { NotifierType } from '../../../../common/constants';
import { fetchDataWithRetry } from '../../stores/SettingsStore/SettingsStore-common';
import { TelemetryEventName, TelemetryScreenName } from '../../../../common/telemetry';
import { NoSearchMatch } from '../common/NoSearchMatch';
import { userRulesEditorStore } from '../../../common/components/UserRulesEditor/UserRulesEditorStore';
import { type TelemetryStore } from '../../../common/telemetry';
import { usePreventUnload } from '../../../common/hooks/usePreventUnload';
import { useFindShortcut } from '../../../common/hooks/useFindShortcut';

import {
    type RuleLineGroup,
    filterGroups,
    getInlineEditorGroupSeed,
    groupLines,
    isInlineDraftUnchanged,
    parseRuleLines,
} from './rule-parser';
import {
    InlineEditingEvent,
    InlineEditingState,
    inlineEditingMachine,
} from './inline-editing-machine';
import {
    ESTIMATED_ROW_HEIGHT_PX,
    ICON_HEIGHT_PX,
    LINE_HEIGHT_PX,
    ROW_PADDING_PX,
} from './rule-row-constants';
import { CreateRuleRow } from './CreateRuleRow';
import { RuleRow } from './RuleRow';
import {
    isCommentBlockAboveVirtualizationThreshold,
    shouldAdjustScrollPositionOnItemSizeChange,
} from './comment-block-virtualization';
import { InlineActionSource } from './inline-action-source';
import { HighlighterStatus, useRuleHighlighter } from './rule-highlighter';
import { useRestoreFocusOnClose } from './use-restore-focus-on-close';
import { useUserRulesMutations } from './useUserRulesMutations';

import styles from './UserRulesList.module.pcss';

/**
 * Debounce delay in milliseconds for search input before applying the filter.
 */
const SEARCH_DEBOUNCE_MS = 150;

/**
 * Dedupe key of the initial load error notification, so retrying repeatedly
 * does not stack identical snackbars.
 */
const LOAD_ERROR_DEDUPE_KEY = 'user-rules-load-error';

/**
 * Class of the view-mode toggle in the user rules header. The click blocker
 * lets this one control through while an inline editor is open, so the list can
 * ask for confirmation before the view switch unmounts it.
 */
export const USER_RULES_VIEW_MODE_TOGGLE_CLASS = 'user-rules__switch-editor';

/**
 * User rules list with a functional search box and "Create rule" button. Rules
 * are parsed into groups and rendered as a virtualized list; an empty rules set
 * shows a placeholder. Every row — including multi-line comment blocks — is
 * edited inline.
 *
 * @param props Component props.
 * @param props.filterOff Whether user rules are turned off. Only the look changes (dimmed rule text and gray
 * checkboxes): search, toggling, creating, editing and deleting rules work exactly as when they are on.
 * @param props.addNotification Callback used to show a snackbar notification (e.g. after deleting a rule).
 * @param props.removeNotification Callback used to remove a notification (e.g. after undoing a mutation).
 * @param props.telemetryStore Telemetry store used to record user rules interactions.
 * @param props.checkLimitations Callback used to re-check the MV3 dynamic rules limit after a successful persist
 * so the limit warning banner does not get stuck in a stale state.
 * @param props.onUnsavedDraftChange Called with the current dirty state of the inline editor, so the owner can
 * guard its own view switch: switching to the Edit view unmounts the list and discards the draft without a route
 * change, so neither `beforeunload` nor the route blocker fires.
 */
export const UserRulesList: FC<{
    filterOff?: boolean;
    addNotification?: (params: NotificationParams) => string | null;
    telemetryStore?: TelemetryStore;
    removeNotification?: (id: string) => void;
    checkLimitations?: () => Promise<void>;
    onUnsavedDraftChange?: (hasUnsavedDraft: boolean) => void;
}> = ({
    filterOff = false,
    addNotification,
    removeNotification,
    checkLimitations,
    telemetryStore,
    onUnsavedDraftChange,
}) => {
    const [userRules, setUserRules] = useState('');
    const [isUserRulesLoaded, setIsUserRulesLoaded] = useState(false);
    // Incremented by the load-error notification's retry button to rerun the
    // initial fetch.
    const [loadAttempt, setLoadAttempt] = useState(0);
    // Id of the visible load-error notification, so a successful retry can
    // dismiss it.
    const loadErrorNotificationIdRef = useRef<string | null>(null);
    // Whether the create row's own save is in flight. Kept separate from the
    // hook's `isSaving` (which covers every mutation) so the create editor is
    // only locked while its own save is pending: locking it during an unrelated
    // save would open the row read-only and swallow its initial focus.
    const [isCreateSaving, setIsCreateSaving] = useState(false);
    // Whether the edited row's own save is in flight. Kept separate from the
    // hook's `isSaving` for the same reason as `isCreateSaving`: the inline
    // editor is only locked while its own save is pending, and the draft stays
    // visible until the save succeeds.
    const [isInlineSaving, setIsInlineSaving] = useState(false);
    // Mirrors `isInlineSaving` for the save/cancel callbacks. They are passed
    // to every memoized `RuleRow`, so taking the state as a dependency would
    // change their identity — and re-render every visible row twice — on every
    // save start and end. The ref is set synchronously, so the re-entry guard
    // still sees the in-flight save within the same tick.
    const isInlineSavingRef = useRef(false);
    // Ensures the user_rules_empty pageview fires only once per mount.
    const hasSentEmptyPageView = useRef(false);
    const { setUserRulesExportAvailableState } = useContext(userRulesEditorStore);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const { renderer: highlightHtml, status: highlighterStatus } = useRuleHighlighter();

    // Always mirrors the latest userRules. Used by deferred callbacks (e.g. the
    // notification's Undo onClick) that would otherwise capture a stale value
    // through their closure. Passed to useUserRulesMutations so the mutation
    // handlers read the latest rules text without a state dependency.
    const userRulesRef = useRef(userRules);
    userRulesRef.current = userRules;

    const {
        isSaving,
        mutationSeqRef,
        inFlightCountRef,
        createdRuleCount,
        resetCreatedRuleCount,
        handleToggleRuleDisabled,
        handleDeleteRequest,
        handleInlineSaveRequest,
        handleCreateSaveRequest,
    } = useUserRulesMutations({
        userRulesRef,
        setUserRules,
        addNotification,
        removeNotification,
        checkLimitations,
        telemetryStore,
    });

    const [inlineEditingSnapshot, sendInlineEditing] = useMachine(inlineEditingMachine);
    const isInlineEditing = inlineEditingSnapshot.matches(InlineEditingState.Editing);
    const isCreating = inlineEditingSnapshot.matches(InlineEditingState.Creating);
    // Any inline editor (an edited row or the create row) owns the row and
    // blocks outside interactions until save/cancel.
    const isInlineEditorOpen = isInlineEditing || isCreating;
    // The machine resets its context on every exit to View and keeps
    // `lineIndex` null while creating, so these can be read directly.
    const inlineEditingLineIndex = inlineEditingSnapshot.context.lineIndex;
    // The machine keeps the draft so the row can be re-seeded after a rebase,
    // and so the create row keeps the typed text across re-renders.
    const inlineEditingDraft = inlineEditingSnapshot.context.draft;
    // Extracted so the reconciliation effect does not depend on the whole
    // snapshot (which changes on every keystroke): these are stable while
    // typing and only change when editing starts or ends.
    const inlineEditingStoredValue = inlineEditingSnapshot.context.storedValue;
    const inlineEditingIsComment = inlineEditingSnapshot.context.storedIsComment;

    // Only real unsaved work warns: an edited draft that differs from the
    // stored text, or a non-empty create-row draft. Opening an editor without
    // changing anything — including drafts that differ only in whitespace,
    // which saving trims away — must not ask for confirmation, matching the
    // Edit view and Allowlist behavior.
    //
    // A create save in flight is still unsaved work: the rule has not been
    // persisted yet and cancelling is ignored in that state, so the draft must
    // stay protected until the save settles. The edit row and the Edit view
    // (`usePreventUnload(hasUnsavedChanges || isSaving, …)`) behave the same
    // way.
    let hasUnsavedInlineDraft = false;
    if (isInlineEditing) {
        // A draft that would be trimmed back to the stored text on save is not
        // unsaved work, matching the save path's unchanged-draft check.
        hasUnsavedInlineDraft = !isInlineDraftUnchanged(
            inlineEditingDraft,
            inlineEditingStoredValue,
            inlineEditingIsComment,
        );
    } else if (isCreating) {
        // A create save only starts for a non-empty draft and the editor is
        // read-only while it is in flight, so the draft itself is the whole
        // condition — it stays non-empty until the row closes.
        hasUnsavedInlineDraft = inlineEditingDraft.trim().length > 0;
    }

    // Report the dirty state to the owner so it can guard its own view switch.
    useEffect(() => {
        onUnsavedDraftChange?.(hasUnsavedInlineDraft);
    }, [hasUnsavedInlineDraft, onUnsavedDraftChange]);

    // The list is unmounted after the owner switched to the Edit view (and on
    // any route change), so the flag must not outlive it.
    useEffect(() => () => onUnsavedDraftChange?.(false), [onUnsavedDraftChange]);

    // While an inline editor holds an unsaved draft, warn before the page
    // unloads: reloading or closing the settings page would silently lose it.
    // The list and the Edit view are mutually exclusive views, so this never
    // overlaps with the editor-mode warning.
    //
    // The same draft must also survive in-app route changes: Back/Forward
    // between settings sections is an in-page hash route change, so
    // `beforeunload` never fires. The route-blocker mode of `EditorLeaveModal`
    // (rendered below) shows the same "Leave without saving?" confirmation the
    // Edit view and Allowlist use. It is mounted only while something would be
    // lost, so navigating with an empty or unchanged draft is not interrupted.
    const inlineEditingLeaveTitle = translator.getMessage('options_editor_leave_title');
    const inlineEditingLeaveSubtitle = translator.getMessage('options_userfilter_leave_subtitle');
    usePreventUnload(hasUnsavedInlineDraft, `${inlineEditingLeaveTitle} ${inlineEditingLeaveSubtitle}`);

    // Mirrors the latest inline editing context. The save handler reads the
    // draft from here so its identity does not depend on the snapshot, which
    // changes on every keystroke and would break the memoized rows.
    const inlineEditingContextRef = useRef(inlineEditingSnapshot.context);
    inlineEditingContextRef.current = inlineEditingSnapshot.context;

    // Stable debounced setter — intentionally lives for the component's
    // lifetime via empty deps to avoid re-creating the debounce timer on
    // every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const setSearchTermDebounced = useCallback(
        debounce((value: string) => {
            setDebouncedSearchTerm(value);
        }, SEARCH_DEBOUNCE_MS),
        [],
    );

    useEffect(() => {
        return () => setSearchTermDebounced.cancel();
    }, [setSearchTermDebounced]);

    useEffect(() => {
        let cancelled = false;

        const fetchUserRules = async () => {
            // The options page can open before the background service worker is
            // ready; retry instead of leaving the list empty and the Create
            // button disabled for the whole session.
            const data = await fetchDataWithRetry(
                messenger.getUserRulesEditorData.bind(messenger),
            );
            if (cancelled) {
                return;
            }

            if (!data) {
                loadErrorNotificationIdRef.current = addNotification?.({
                    type: NotificationType.Error,
                    dedupeKey: LOAD_ERROR_DEDUPE_KEY,
                    text: translator.getMessage('options_user_rules_load_error'),
                    buttons: [{
                        title: translator.getMessage('options_popup_try_again_button'),
                        onClick: () => setLoadAttempt((attempt) => attempt + 1),
                    }],
                }) ?? loadErrorNotificationIdRef.current;
                return;
            }

            setUserRules(data.userRules);
            setIsUserRulesLoaded(true);
            if (loadErrorNotificationIdRef.current) {
                removeNotification?.(loadErrorNotificationIdRef.current);
                loadErrorNotificationIdRef.current = null;
            }
        };

        fetchUserRules();

        return () => {
            cancelled = true;
        };
    }, [addNotification, loadAttempt, removeNotification]);

    // Keep the header menu's export/delete-all availability in sync with the
    // rules the list actually renders. Deriving it from the state covers every
    // path — optimistic updates, the revert after a failed write and refetches —
    // instead of a hand-written update in each mutation handler, one of which
    // missed the revert and left Export enabled on an empty list.
    useEffect(() => {
        setUserRulesExportAvailableState(userRules.trim().length > 0);
    }, [userRules, setUserRulesExportAvailableState]);

    // Send a separate pageview when the user rules list is loaded and empty
    // Fires only once per mount.
    useEffect(() => {
        if (isUserRulesLoaded && userRules.trim().length === 0 && !hasSentEmptyPageView.current) {
            hasSentEmptyPageView.current = true;
            telemetryStore?.sendPageViewEvent(TelemetryScreenName.UserRulesEmpty);
        }
    }, [isUserRulesLoaded, userRules, telemetryStore]);

    // Keep the list in sync with the background user filter so it refreshes
    // after imports/deletes performed from the header UserRulesMenu.
    useEffect(() => {
        let cancelled = false;

        const removeListenerRef: { current?: () => void } = {};

        const refetch = async () => {
            // Skip event-driven refetches while a local save is in flight.
            // The save's own refetch will apply the correct state, and this
            // event-driven refetch might read a stale backend state (e.g.
            // before a second rapid delete has been persisted), which would
            // briefly restore deleted rules and cause undo to operate on
            // incorrect data.
            if (inFlightCountRef.current > 0) {
                return;
            }
            try {
                // Capture the mutation sequence before the async fetch. A
                // UserFilterUpdated event can fire from our own local save; if a
                // newer toggle/delete supersedes it while this refetch is in
                // flight, applying the stale result here would briefly revert
                // the optimistic update — visible as UI flicker.
                const seq = mutationSeqRef.current;
                const { userRules: rules } = await messenger.getUserRulesEditorData();
                if (!cancelled && seq === mutationSeqRef.current) {
                    // A replacement from outside the list (Delete all/Import,
                    // a save in another tab) does not go through the create
                    // path, so the tracked created prefix no longer describes
                    // the replacement text.
                    if (rules !== userRulesRef.current) {
                        resetCreatedRuleCount();
                    }
                    setUserRules(rules);
                    setIsUserRulesLoaded(true);
                }
            } catch (error) {
                if (!cancelled) {
                    logger.error('[ext.UserRulesList]: Failed to refresh user rules:', error);
                }
            }
        };

        (async () => {
            const cleanup = await messenger.createEventListener(
                [NotifierType.UserFilterUpdated],
                refetch,
            );
            if (!cancelled) {
                removeListenerRef.current = cleanup;
            } else {
                cleanup();
            }
        })();

        return () => {
            cancelled = true;
            removeListenerRef.current?.();
        };
    }, [mutationSeqRef, inFlightCountRef, resetCreatedRuleCount]);
    const lines = useMemo(() => parseRuleLines(userRules), [userRules]);
    const groups = useMemo(() => groupLines(lines), [lines]);
    // Rows shown for the current search. Besides the matches, two kinds of rows
    // stay visible:
    // - The row being edited, even when the search excludes it. A pending
    //   search can settle while a row is being edited; unmounting the editor
    //   would leave the editing state active with its click blockers on,
    //   making save, cancel and clear-search unreachable.
    // - The rules added by a create (see `createdRuleCount`). They are prepended
    //   to the rules text, so they are the first raw lines: only those are
    //   considered, otherwise an older rule with the same text would stay
    //   visible as well.
    const ruleGroups = useMemo(() => {
        const editedLineIndex = isInlineEditing ? inlineEditingLineIndex : null;
        return filterGroups(groups, debouncedSearchTerm, (group) => (
            group.lineIndex === editedLineIndex || group.lineIndex < createdRuleCount
        ));
    }, [groups, debouncedSearchTerm, isInlineEditing, inlineEditingLineIndex, createdRuleCount]);

    // Keep the edited row aligned with the parsed groups: mutations (optimistic
    // delete/undo) and refetches can shift the edited block to a new index or
    // remove it entirely. Without this, the positional editing flag would point
    // at a different row.
    //
    // Editing follows the tracked block to its new index; when the block is
    // gone or its content changed (e.g. a comment merged with another block),
    // editing is cancelled.
    //
    // Skipped while the edited row's own save is in flight: the optimistic
    // update temporarily replaces the tracked block's content, which would look
    // like a foreign change. The save either closes editing on success or
    // reverts the rules, after which this effect re-runs with the restored
    // groups.
    //
    // Runs before paint so a row sitting at a stale index never mounts the
    // inline editor (and steals focus) for a frame.
    useLayoutEffect(() => {
        if (!isInlineEditing || inlineEditingLineIndex === null || isInlineSaving) {
            return;
        }

        const isTrackedGroup = (group: RuleLineGroup) => (
            group.isComment === inlineEditingIsComment
            && getInlineEditorGroupSeed(group) === inlineEditingStoredValue
        );
        // A group's `lineIndex` is the index of its first line, which is the
        // index captured when editing started.
        const trackedGroup = groups.find((group) => group.lineIndex === inlineEditingLineIndex);

        // Fast path: the tracked block is still at the same raw index and its
        // content still matches the text captured when editing started.
        if (trackedGroup && isTrackedGroup(trackedGroup)) {
            return;
        }

        // Prefer the occurrence closest to the previous index so duplicated
        // blocks do not move editing to an unrelated row.
        const rebasedGroup = groups.reduce<RuleLineGroup | null>((closest, group) => {
            if (!isTrackedGroup(group)) {
                return closest;
            }
            if (
                closest === null
                || Math.abs(group.lineIndex - inlineEditingLineIndex)
                    < Math.abs(closest.lineIndex - inlineEditingLineIndex)
            ) {
                return group;
            }
            return closest;
        }, null);

        if (rebasedGroup === null) {
            sendInlineEditing({ type: InlineEditingEvent.Cancel });
            return;
        }

        sendInlineEditing({ type: InlineEditingEvent.Rebase, lineIndex: rebasedGroup.lineIndex });
    }, [
        groups,
        isInlineEditing,
        inlineEditingLineIndex,
        inlineEditingStoredValue,
        inlineEditingIsComment,
        isInlineSaving,
        sendInlineEditing,
    ]);

    // DOM node of the create row. It is the click-blocking boundary while the
    // create editor is open.
    const createRowRef = useRef<HTMLDivElement | null>(null);

    // Keep the create row in view when it opens: it is rendered above the
    // virtualized rules, outside the virtualizer, so scrolling to it is not
    // handled by the virtualizer.
    useLayoutEffect(() => {
        if (isCreating) {
            createRowRef.current?.scrollIntoView({ block: 'nearest' });
        }
    }, [isCreating]);

    // DOM node of the row currently being edited. Pointer interactions inside
    // it stay enabled; everything outside it is ignored while editing.
    const editingRowRef = useRef<HTMLDivElement | null>(null);

    // While an inline editor (an edited row or the create row) is open, pointer
    // interactions outside it must be ignored: they must not save or cancel the
    // draft, move editing to another row, open the create row, or activate the
    // search field, checkboxes and menus. The view-mode toggle is the
    // exception: it goes through so the owner can show the leave-without-saving
    // confirmation instead of silently swallowing the click. Capture-phase
    // listeners on the document run before React's root handlers, so stopping
    // propagation keeps the underlying controls untouched; preventing the
    // default keeps focus (and the caret) in the editor and suppresses
    // activation behavior.
    useEffect(() => {
        if (!isInlineEditorOpen) {
            return;
        }

        const isInsideInlineEditor = (target: EventTarget | null) => {
            // While editing, the boundary is the edited row; while creating it
            // is the create row (`editingRowRef` stays null then). The
            // virtualizer's range extractor keeps the edited row mounted, so
            // this is only null for a frame during mount/unmount; passing
            // through then avoids leaving the page inert with no editor to
            // save or cancel.
            const row = editingRowRef.current ?? createRowRef.current;
            if (row === null) {
                return true;
            }
            if (!(target instanceof Node)) {
                return false;
            }
            // The leave-without-saving confirmation (route blocker) is rendered
            // in a react-modal portal, i.e. outside the edited row, and its
            // overlay covers the whole viewport. Its buttons must stay
            // clickable, so anything inside the modal overlay passes through.
            if (
                target instanceof Element
                && target.closest(`.${REACT_MODAL_OVERLAY_CLASS}`) !== null
            ) {
                return true;
            }
            // The view-mode toggle must reach its own guard, which shows the
            // leave-without-saving confirmation when a draft is open.
            if (
                target instanceof Element
                && target.closest(`.${USER_RULES_VIEW_MODE_TOGGLE_CLASS}`) !== null
            ) {
                return true;
            }
            return row.contains(target);
        };

        const handleMouseDown = (event: MouseEvent) => {
            if (isInsideInlineEditor(event.target)) {
                return;
            }
            // Keep focus (and the caret) in the editor.
            event.preventDefault();
            event.stopPropagation();
        };

        const handleClick = (event: MouseEvent) => {
            if (isInsideInlineEditor(event.target)) {
                return;
            }
            // Prevent activation behavior (buttons, checkboxes, menus).
            event.preventDefault();
            event.stopPropagation();
        };

        const handleFocusIn = (event: FocusEvent) => {
            if (isInsideInlineEditor(event.target)) {
                return;
            }
            // Tab can move focus out of the row even though pointer events are
            // blocked. Bring it back to the editor so the search input cannot
            // re-filter the list or clear itself with Escape mid-edit.
            const row = editingRowRef.current ?? createRowRef.current;
            row?.querySelector<HTMLElement>('.cm-content')?.focus();
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (isInsideInlineEditor(event.target)) {
                return;
            }
            // Leave modified shortcuts to the browser/editor (the editor keymap
            // already disables find inside the inline editor). Focus is briefly
            // outside the editor before `focusin` restores it, or when the
            // editor has no focusable content, so swallow plain keys that could
            // type into the search or activate an outside control.
            if (event.metaKey || event.ctrlKey || event.altKey) {
                return;
            }
            event.preventDefault();
            event.stopPropagation();
        };

        document.addEventListener('mousedown', handleMouseDown, true);
        document.addEventListener('click', handleClick, true);
        document.addEventListener('focusin', handleFocusIn, true);
        document.addEventListener('keydown', handleKeyDown, true);

        return () => {
            document.removeEventListener('mousedown', handleMouseDown, true);
            document.removeEventListener('click', handleClick, true);
            document.removeEventListener('focusin', handleFocusIn, true);
            document.removeEventListener('keydown', handleKeyDown, true);
        };
    }, [isInlineEditorOpen]);

    const createButtonRef = useRef<HTMLButtonElement | null>(null);

    // Leaving create mode unmounts the editor; the hook returns focus to the
    // Create rule button so keyboard users keep their place. The restore is
    // deferred while a save is in flight, and retried once it clears.
    useRestoreFocusOnClose(isCreating, isSaving, createButtonRef);

    const listRef = useRef<HTMLDivElement | null>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // The list is virtualized, so the browser's find (Ctrl+F / Cmd+F) would
    // only see the rendered rows. The shortcut moves to the list's own search,
    // which covers every rule. While an inline editor is open the shortcut is
    // left alone: the editor swallows it, and the search must not take the
    // focus away from the draft.
    useFindShortcut({
        enabled: !isInlineEditorOpen,
        onFind: () => {
            searchInputRef.current?.focus();
            searchInputRef.current?.select();
        },
    });

    // The options page scrolls at the document level (body.options), so the
    // list container is never a bounded scroll viewport. A window virtualizer
    // is therefore required: an element virtualizer would treat the full-height
    // container as its viewport and mount every row, freezing the page on large
    // rule sets (tens of thousands of rules).
    const [, bumpListVersion] = useState(0);
    const setListRef = useCallback((node: HTMLDivElement | null) => {
        listRef.current = node;
        // Force one re-render whenever the list element (re)mounts: the render
        // that mounted it happened before the ref was attached, so scrollMargin
        // below was computed as 0 on that render.
        if (node) {
            bumpListVersion((version) => version + 1);
        }
    }, []);

    // Document-relative top offset of the list, recomputed on every render so
    // layout changes above the list (e.g. warnings appearing) keep row offsets
    // accurate.
    const scrollMargin = listRef.current
        ? listRef.current.getBoundingClientRect().top + window.scrollY
        : 0;

    // Keep the row being edited mounted even when it scrolls out of the
    // virtualizer window. The row is the click-blocking boundary, so unmounting
    // it would let outside clicks (other rows' actions, Import/Delete all, the
    // view switch) act while a draft is open; it also keeps the editor and its
    // focus alive while the user scrolls away.
    const rangeExtractor = useCallback((range: Range) => {
        const indices = defaultRangeExtractor(range);
        if (inlineEditingLineIndex === null) {
            return indices;
        }

        const editedGroupIndex = ruleGroups.findIndex(
            (group) => group.lineIndex === inlineEditingLineIndex,
        );
        if (editedGroupIndex === -1 || indices.includes(editedGroupIndex)) {
            return indices;
        }

        return [...indices, editedGroupIndex].sort((a, b) => a - b);
    }, [inlineEditingLineIndex, ruleGroups]);

    const virtualizer = useWindowVirtualizer({
        count: ruleGroups.length,
        scrollMargin,
        rangeExtractor,
        getItemKey: useCallback(
            (index: number) => ruleGroups[index]?.lineIndex ?? index,
            [ruleGroups],
        ),
        estimateSize: useCallback(
            (index: number) => {
                const group = ruleGroups[index];
                if (!group) {
                    return ESTIMATED_ROW_HEIGHT_PX;
                }
                if (group.isComment) {
                    // Comment: icon (24px) + lineCount * lineHeight (20px each) + padding (16px)
                    // The icon sits alongside the first line; total height is driven
                    // by the text block height, capped at icon height.
                    const commentTextHeight = Math.max(
                        group.lines.length * LINE_HEIGHT_PX,
                        ICON_HEIGHT_PX,
                    );
                    return commentTextHeight + ROW_PADDING_PX;
                }
                return ESTIMATED_ROW_HEIGHT_PX;
            },
            [ruleGroups],
        ),
    });

    // True while the outer virtualizer measures a row whose element has just
    // mounted, as opposed to a mounted row whose content changed.
    const isMeasuringMountedRowRef = useRef(false);

    // The nested comment-block virtualizer compensates the scroll for every
    // line of a virtualized block that changes its height. Without this
    // override the outer virtualizer also compensates the whole block row,
    // which scrolls the page twice and makes the content jump. The outer list
    // only owns the block shrinking back to its estimate when the row mounts
    // again. The hook is an instance field in virtual-core 3.13, not an option.
    virtualizer.shouldAdjustScrollPositionOnItemSizeChange = (item, delta, instance) => {
        // `scrollAdjustments` is private in virtual-core, but reading it keeps
        // the fallback for ordinary rows identical to the library's default.
        const { scrollAdjustments } = instance as unknown as { scrollAdjustments: number };

        return shouldAdjustScrollPositionOnItemSizeChange(
            item,
            delta,
            instance.scrollOffset ?? 0,
            scrollAdjustments,
            ruleGroups,
            isMeasuringMountedRowRef.current,
        );
    };

    // Row ref: the virtualizer measures a row synchronously when its element
    // mounts, and through a ResizeObserver afterwards. The flag tells the two
    // apart for the predicate above. The callback is stable, so React calls
    // it only when a row mounts or unmounts.
    const measureRowElement = useCallback((node: HTMLDivElement | null) => {
        isMeasuringMountedRowRef.current = true;
        try {
            virtualizer.measureElement(node);
        } finally {
            isMeasuringMountedRowRef.current = false;
        }
    }, [virtualizer]);

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = event.target;
        setSearchTerm(value);
        setSearchTermDebounced(value);
        // A new query shows only its own matches again.
        resetCreatedRuleCount();
    };

    const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Escape') {
            handleClearSearch();
        }
    };

    const handleClearSearch = () => {
        setSearchTerm('');
        setSearchTermDebounced.cancel();
        setDebouncedSearchTerm('');
        resetCreatedRuleCount();
        searchInputRef.current?.focus();
    };

    /**
     * Sends an inline editing telemetry event, but only for pointer clicks: the
     * editor hotkeys (Enter / Ctrl(Cmd)+S / Escape) and a keyboard activation of
     * the row's action buttons must not be counted.
     *
     * @param eventName The custom event to send.
     * @param source How the action was triggered.
     */
    const sendInlineActionEvent = useCallback((
        eventName: TelemetryEventName,
        source: InlineActionSource,
    ) => {
        if (source === InlineActionSource.Click) {
            telemetryStore?.sendCustomEvent(eventName, TelemetryScreenName.UserRulesScreen);
        }
    }, [telemetryStore]);

    const handleEditRequest = useCallback((group: RuleLineGroup) => {
        // Edit is inert while any inline editor is open, mirroring
        // `handleCreateRequest`. The click blocker normally prevents this; the
        // guard covers the moment during the row's own save when the editor is
        // unmounted, where starting another edit would silently replace the
        // active draft.
        if (isInlineEditorOpen) {
            return;
        }

        telemetryStore?.sendCustomEvent(
            TelemetryEventName.UserRuleEditClick,
            TelemetryScreenName.UserRulesScreen,
        );

        // The displayed text is stable across `!off` toggles (the marker is
        // stripped either way), so it keeps tracking the line even when the
        // checkbox rewrites the raw text while editing. Comment blocks track
        // the whole block so a merge into a different block is detected.
        const seed = getInlineEditorGroupSeed(group);

        sendInlineEditing({
            type: InlineEditingEvent.Edit,
            lineIndex: group.lineIndex,
            storedValue: seed,
            // The kind is tracked too, so a same-text line of the other kind
            // cannot take over the editing state.
            storedIsComment: group.isComment,
            draft: seed,
        });
    }, [isInlineEditorOpen, sendInlineEditing, telemetryStore]);

    const handleInlineDraftChange = useCallback((value: string) => {
        sendInlineEditing({ type: InlineEditingEvent.DraftChange, value });
    }, [sendInlineEditing]);

    const handleInlineSave = useCallback(async (group: RuleLineGroup, source: InlineActionSource) => {
        // A save is already in flight: ignore re-entry so a second Enter/✓
        // cannot persist the same draft twice.
        if (isInlineSavingRef.current) {
            return;
        }

        // Only a pointer activation counts; the editor hotkeys must not emit
        // the click event.
        sendInlineActionEvent(TelemetryEventName.UserRuleInlineSaveClick, source);

        // Read the draft before the save: leaving editing mode resets the
        // machine context.
        const { draft } = inlineEditingContextRef.current;
        isInlineSavingRef.current = true;
        setIsInlineSaving(true);
        try {
            const saved = await handleInlineSaveRequest(group, draft);
            if (!saved) {
                // Keep the row open with the draft so a failed save does not
                // lose it; the mutation hook shows the error notification.
                return;
            }
            sendInlineEditing({ type: InlineEditingEvent.Save });
        } finally {
            isInlineSavingRef.current = false;
            setIsInlineSaving(false);
        }
    }, [
        handleInlineSaveRequest,
        sendInlineActionEvent,
        sendInlineEditing,
    ]);

    const handleInlineCancel = useCallback((source: InlineActionSource) => {
        // Ignore cancel while this row's own save is in flight: the edit is
        // already being persisted, so closing the editor would hide its
        // outcome. Cancelling is unaffected by other mutations.
        if (isInlineSavingRef.current) {
            return;
        }

        sendInlineActionEvent(TelemetryEventName.UserRuleInlineCancelClick, source);

        sendInlineEditing({ type: InlineEditingEvent.Cancel });
    }, [sendInlineActionEvent, sendInlineEditing]);

    const handleCreateRequest = useCallback(() => {
        // Create is inert while any inline editor is open. The click blocker
        // normally prevents this; the guard covers the moment during the row's
        // own save when the editor is unmounted, so the active draft is neither
        // saved nor cancelled.
        // It is also inert until the rules are loaded: saving before the first
        // fetch resolves would replace the whole filter with a single line.
        if (isInlineEditorOpen || !isUserRulesLoaded) {
            return;
        }

        telemetryStore?.sendCustomEvent(
            TelemetryEventName.CreateRuleClick,
            TelemetryScreenName.UserRulesScreen,
        );

        // An active search is kept: the create row is rendered above the
        // results, outside the filtered list, and the created rules stay
        // visible after the save (see `createdRuleCount`), so creating works
        // the same with and without a search.
        sendInlineEditing({ type: InlineEditingEvent.Create });
    }, [isInlineEditorOpen, isUserRulesLoaded, sendInlineEditing, telemetryStore]);

    const handleCreateSave = useCallback(async (source: InlineActionSource) => {
        // A save is already in flight: ignore re-entry so a second Enter/✓
        // cannot prepend the same rule again once the refetch has landed. Only
        // this row's own save matters — `persistRules` orders concurrent
        // writes, so an unrelated toggle or delete must not block it.
        if (isCreateSaving) {
            return;
        }

        // Only a pointer click on the checkmark counts, including the empty
        // draft case below; the Enter / Ctrl(Cmd)+S hotkeys must not emit it.
        sendInlineActionEvent(TelemetryEventName.UserRuleInlineSaveClick, source);

        // Read the draft before any state transition resets the machine.
        const { draft } = inlineEditingContextRef.current;

        // Saving an empty or whitespace-only draft just closes the row: no
        // rule is created and no delete/undo notification is shown.
        if (draft.trim().length === 0) {
            sendInlineEditing({ type: InlineEditingEvent.Cancel });
            return;
        }

        setIsCreateSaving(true);
        try {
            const saved = await handleCreateSaveRequest(draft);
            // A failed save keeps the create row open with the typed text so
            // the draft is not lost; the mutation hook shows the error
            // notification.
            if (saved) {
                // The mutation hook grows `createdRuleCount`, so the new rules
                // stay visible even if they do not match an active search,
                // together with the rules of earlier creates.
                sendInlineEditing({ type: InlineEditingEvent.Save });
            }
        } finally {
            setIsCreateSaving(false);
        }
    }, [
        handleCreateSaveRequest,
        isCreateSaving,
        sendInlineActionEvent,
        sendInlineEditing,
    ]);

    const handleCreateCancel = useCallback((source: InlineActionSource) => {
        // Ignore cancel while the save is in flight: the rule is already being
        // persisted, so closing the row would hide that it is being created.
        if (isCreateSaving) {
            return;
        }

        sendInlineActionEvent(TelemetryEventName.UserRuleInlineCancelClick, source);

        sendInlineEditing({ type: InlineEditingEvent.Cancel });
    }, [isCreateSaving, sendInlineActionEvent, sendInlineEditing]);

    const renderBody = () => {
        if (ruleGroups.length === 0) {
            // An empty result next to a non-empty unfiltered list can only come
            // from the search, so no search term needs to be checked here:
            // comparing the live term would disagree with the debounced list
            // for the length of the debounce delay.
            if (groups.length > 0) {
                return (
                    <NoSearchMatch
                        message={translator.getMessage('options_user_rules_no_match')}
                    />
                );
            }

            return (
                <div className={styles.placeholder}>
                    <Icon
                        id="#no-rules-yet"
                        className="icon--48 icon--gray-default"
                        aria-hidden="true"
                    />
                    <div>{translator.getMessage('options_user_rules_empty_placeholder')}</div>
                </div>
            );
        }

        const virtualItems = virtualizer.getVirtualItems();

        return (
            <div
                ref={setListRef}
                className={styles.listArea}
            >
                <div
                    className={styles.virtualList}
                    // Total size is computed by the virtualizer at runtime.
                    style={{ height: `${virtualizer.getTotalSize()}px` }}
                >
                    {virtualItems.map((virtualItem) => {
                        const group = ruleGroups[virtualItem.index];
                        if (!group) {
                            return null;
                        }
                        const isEditingRow = inlineEditingLineIndex === group.lineIndex;
                        // Only virtualized comment blocks need the row's
                        // document-space top; passing it (and its changing
                        // value) to every row would defeat their memoization.
                        const rowDocumentTop = isCommentBlockAboveVirtualizationThreshold(group)
                            ? virtualItem.start
                            : undefined;
                        return (
                            <div
                                // React key mirrors the virtualizer's content key so a
                                // given rule keeps the same DOM node across mutations
                                key={String(virtualItem.key)}
                                data-index={virtualItem.index}
                                ref={measureRowElement}
                                className={styles.virtualRow}
                                // Item offsets are document-relative for a window
                                // virtualizer, so subtract the list's own offset.
                                style={{ transform: `translateY(${virtualItem.start - scrollMargin}px)` }}
                            >
                                <RuleRow
                                    group={group}
                                    searchTerm={debouncedSearchTerm}
                                    highlightHtml={highlightHtml ?? undefined}
                                    editing={isEditingRow}
                                    rowRef={isEditingRow ? editingRowRef : undefined}
                                    rowDocumentTop={rowDocumentTop}
                                    inlineDraft={isEditingRow ? inlineEditingDraft : undefined}
                                    onEdit={handleEditRequest}
                                    onDelete={handleDeleteRequest}
                                    onInlineDraftChange={handleInlineDraftChange}
                                    onInlineSave={handleInlineSave}
                                    onInlineCancel={handleInlineCancel}
                                    filterOff={filterOff}
                                    saving={isSaving}
                                    // Only the edited row's editor is locked
                                    // while its save is in flight; passing it to
                                    // every row would defeat the memoization.
                                    inlineSaving={isEditingRow && isInlineSaving}
                                    onToggle={handleToggleRuleDisabled}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className={styles.container}>
            {highlighterStatus === HighlighterStatus.Loading
                && ruleGroups.length > 0
                && searchTerm.trim().length === 0 && (
                <div className={styles.highlightLoading} role="status">
                    {translator.getMessage('options_user_rules_highlight_loading')}
                </div>
            )}
            <div className={styles.toolbar}>
                <div className={styles.searchWrapper}>
                    <input
                        ref={searchInputRef}
                        type="text"
                        className={styles.search}
                        placeholder={translator.getMessage('options_user_rules_search_placeholder')}
                        aria-label={translator.getMessage('options_user_rules_search_placeholder')}
                        aria-keyshortcuts={UserAgent.isMacOs ? 'Meta+F' : 'Control+F'}
                        value={searchTerm}
                        onClick={() => {
                            telemetryStore?.sendCustomEvent(
                                TelemetryEventName.UserRulesSearchClick,
                                TelemetryScreenName.UserRulesScreen,
                            );
                        }}
                        onChange={handleSearchChange}
                        onKeyDown={handleSearchKeyDown}
                    />
                    {searchTerm && (
                        <button
                            type="button"
                            className={styles.clearButton}
                            onClick={handleClearSearch}
                            aria-label={translator.getMessage('options_user_rules_clear_search')}
                            aria-keyshortcuts="Escape"
                        >
                            <CloseIcon className={styles.clearIcon} />
                        </button>
                    )}
                </div>
            </div>
            <button
                ref={createButtonRef}
                type="button"
                className={styles.createRule}
                onClick={handleCreateRequest}
                disabled={!isUserRulesLoaded}
            >
                <Icon
                    id="#plus"
                    className={styles.createRuleIcon}
                    aria-hidden="true"
                />
                {translator.getMessage('options_user_rules_create_rule')}
            </button>
            {isCreating && (
                <CreateRuleRow
                    draft={inlineEditingDraft}
                    rowRef={createRowRef}
                    filterOff={filterOff}
                    inlineSaving={isCreateSaving}
                    onDraftChange={handleInlineDraftChange}
                    onSave={handleCreateSave}
                    onCancel={handleCreateCancel}
                />
            )}
            {renderBody()}
            {hasUnsavedInlineDraft && (
                <EditorLeaveModal
                    title={inlineEditingLeaveTitle}
                    subtitle={inlineEditingLeaveSubtitle}
                />
            )}
        </div>
    );
};
