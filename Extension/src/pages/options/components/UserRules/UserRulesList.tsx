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
    useState,
} from 'react';

import classNames from 'classnames';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import { debounce } from 'lodash-es';

import { translator } from '../../../../common/translators/translator';
import { Icon } from '../../../common/components/ui/Icon';
import { CloseIcon } from '../../../common/components/ui/CloseIcon';
import { messenger } from '../../../services/messenger';
import { logger } from '../../../../common/logger';
import { type NotificationParams } from '../../../common/types';
import { NotifierType } from '../../../../common/constants';
import { TelemetryEventName, TelemetryScreenName } from '../../../../common/telemetry';
import { NoSearchMatch } from '../common/NoSearchMatch';
import { userRulesEditorStore } from '../../../common/components/UserRulesEditor/UserRulesEditorStore';
import { type TelemetryStore } from '../../../common/telemetry';

import {
    type RuleLineGroup,
    filterGroups,
    groupLines,
    parseRuleLines,
} from './rule-parser';
import {
    ESTIMATED_ROW_HEIGHT_PX,
    ICON_HEIGHT_PX,
    LINE_HEIGHT_PX,
    ROW_PADDING_PX,
} from './rule-row-constants';
import { RuleRow } from './RuleRow';
import { HighlighterStatus, useRuleHighlighter } from './rule-highlighter';
import { useUserRulesMutations } from './useUserRulesMutations';

import styles from './UserRulesList.module.pcss';

/**
 * Debounce delay in milliseconds for search input before applying the filter.
 */
const SEARCH_DEBOUNCE_MS = 150;

/**
 * Read-only user rules list with a functional search box and "Create
 * rule" button. Rules are parsed into groups and rendered as a virtualized
 * list; an empty rules set shows a placeholder.
 *
 * @param props Component props.
 * @param props.disabled Whether the list is disabled (grayed out) when user rules are toggled off.
 * @param props.onCreateRule Callback invoked when the "Create rule" button is clicked.
 * @param props.onEditRule Callback invoked with a 0-based line index when a rule's Edit button is clicked.
 * @param props.addNotification Callback used to show a snackbar notification (e.g. after deleting a rule).
 * @param props.removeNotification Callback used to remove a notification (e.g. after undoing a mutation).
 * @param props.telemetryStore Telemetry store used to record user rules interactions.
 * @param props.checkLimitations Callback used to re-check the MV3 dynamic rules limit after a mutation
 * (toggle, delete, undo) so the limit warning banner does not get stuck in a stale state.
 */
export const UserRulesList: FC<{
    disabled?: boolean;
    onCreateRule?: () => void;
    onEditRule?: (lineIndex: number) => void;
    addNotification?: (params: NotificationParams) => string | null;
    telemetryStore?: TelemetryStore;
    removeNotification?: (id: string) => void;
    checkLimitations?: () => Promise<void>;
}> = ({
    disabled = false,
    onCreateRule,
    onEditRule,
    addNotification,
    removeNotification,
    checkLimitations,
    telemetryStore,
}) => {
    const [userRules, setUserRules] = useState('');
    const [isUserRulesLoaded, setIsUserRulesLoaded] = useState(false);
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
        handleToggleRuleDisabled,
        handleDeleteRequest,
    } = useUserRulesMutations({
        userRulesRef,
        setUserRules,
        setUserRulesExportAvailableState,
        addNotification,
        removeNotification,
        checkLimitations,
        telemetryStore,
    });

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
        const fetchUserRules = async () => {
            try {
                const { userRules: rules } = await messenger.getUserRulesEditorData();
                setUserRules(rules);
                setUserRulesExportAvailableState(rules.trim().length > 0);
                setIsUserRulesLoaded(true);
            } catch (error) {
                logger.error('[ext.UserRulesList]: Failed to fetch user rules data:', error);
            }
        };

        fetchUserRules();
        // One-shot signal on mount to skip the background fetch.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
                    setUserRules(rules);
                    setUserRulesExportAvailableState(rules.trim().length > 0);
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
    }, [setUserRulesExportAvailableState, mutationSeqRef, inFlightCountRef]);
    const lines = useMemo(() => parseRuleLines(userRules), [userRules]);
    const groups = useMemo(() => groupLines(lines), [lines]);
    const ruleGroups = useMemo(
        () => filterGroups(groups, debouncedSearchTerm),
        [groups, debouncedSearchTerm],
    );

    const listRef = useRef<HTMLDivElement | null>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

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

    const virtualizer = useWindowVirtualizer({
        count: ruleGroups.length,
        scrollMargin,
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

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = event.target;
        setSearchTerm(value);
        setSearchTermDebounced(value);
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
        searchInputRef.current?.focus();
    };

    const handleEditRequest = useCallback((group: RuleLineGroup) => {
        onEditRule?.(group.lineIndex);
    }, [onEditRule]);

    const renderBody = () => {
        if (ruleGroups.length === 0) {
            // Only show "no match" when the unfiltered list had rules that
            // were filtered out; otherwise there were never any rules.
            if (groups.length > 0 && searchTerm.trim()) {
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
                        return (
                            <div
                                // React key mirrors the virtualizer's content key so a
                                // given rule keeps the same DOM node across mutations
                                key={String(virtualItem.key)}
                                data-index={virtualItem.index}
                                ref={virtualizer.measureElement}
                                className={styles.virtualRow}
                                // Item offsets are document-relative for a window
                                // virtualizer, so subtract the list's own offset.
                                style={{ transform: `translateY(${virtualItem.start - scrollMargin}px)` }}
                            >
                                <RuleRow
                                    group={group}
                                    searchTerm={debouncedSearchTerm}
                                    highlightHtml={highlightHtml ?? undefined}
                                    onEdit={handleEditRequest}
                                    onDelete={handleDeleteRequest}
                                    disabled={disabled || isSaving}
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
        <div className={classNames(styles.container, disabled && styles.disabled)}>
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
                type="button"
                className={styles.createRule}
                onClick={onCreateRule}
                disabled={disabled}
            >
                <Icon
                    id="#plus"
                    className={styles.createRuleIcon}
                    aria-hidden="true"
                />
                {translator.getMessage('options_user_rules_create_rule')}
            </button>
            {renderBody()}
        </div>
    );
};
