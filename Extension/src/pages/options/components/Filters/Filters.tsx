/**
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
    useContext,
    useState,
    useEffect,
    useMemo,
    useCallback,
} from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { observer } from 'mobx-react';

import classNames from 'classnames';
import { sortBy } from 'lodash-es';

import { translator } from '../../../../common/translators/translator';
import { shouldShowUserScriptsApiWarning } from '../../../../common/user-scripts-api';
import { rootStore } from '../../stores/RootStore';
import { SettingsSection } from '../Settings/SettingsSection';
import { addMinDelayLoader } from '../../../common/components/helpers';
import { Icon } from '../../../common/components/ui/Icon';
import { useVisibilityCheck } from '../../../common/hooks/useVisibilityCheck';
import { Setting, SETTINGS_TYPES } from '../Settings/Setting';
import { AntibannerGroupsId } from '../../../../common/constants';
import { StaticFiltersLimitsWarning, DynamicRulesLimitsWarning } from '../Warnings';
import { OptionsPageSections } from '../../../../common/nav';
import { messenger } from '../../../services/messenger';
import { getStaticWarningMessage } from '../Warnings/messages';
import { NotificationType } from '../../stores/UiStore';
import type { CategoriesGroupData } from '../../../../background/api';

import { AnnoyancesConsent } from './AnnoyancesConsent';
import { Group } from './Group';
import { SearchGroup } from './Search/SearchGroup';
import { Filter } from './Filter';
import { NoFiltersFound, NoFiltersYet } from './NoFilters';
import { Search } from './Search';
import { FiltersUpdate } from './FiltersUpdate';
import { AddCustomModal } from './AddCustomModal';
import { SEARCH_FILTERS } from './Search/constants';
import { UserScriptsApiWarningInsideCustomGroup } from './UserScriptsApiWarningForCustomFilters';
import type { RenderedFilterType } from './types';

/**
 * Parameters for the filter list render function inside the group.
 */
type FilterListRenderParams = {
    /**
     * List of filters to render.
     */
    filtersToRender: RenderedFilterType[];

    /**
     * Whether the group is enabled.
     */
    groupEnabled: boolean;

    /**
     * Whether actions with filters are allowed.
     *
     * Needed for Custom filters group to disable actions if user scripts API is not granted.
     */
    areActionsAllowed: boolean;
};

const QUERY_PARAM_NAMES = {
    GROUP: 'group',
    TITLE: 'title',
    SUBSCRIBE: 'subscribe',
};

const Filters = observer(() => {
    const { settingsStore, uiStore } = useContext(rootStore);

    const navigate = useNavigate();

    const location = useLocation();
    const query = useMemo(() => new URLSearchParams(location.search), [location.search]);

    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [urlToSubscribe, setUrlToSubscribe] = useState(decodeURIComponent(
        query.get(QUERY_PARAM_NAMES.SUBSCRIBE) || '',
    ));
    const [customFilterTitle, setCustomFilterTitle] = useState(query.get(QUERY_PARAM_NAMES.TITLE));

    // This state used to remove blinking while filters to render were not selected
    const [groupDetermined, setGroupDetermined] = useState(false);

    const GROUP_DESCRIPTION = {
        [AntibannerGroupsId.CustomFiltersGroupId]: translator.getMessage('options_antibanner_custom_group_description'),
        [AntibannerGroupsId.AdBlockingFiltersGroupId]: translator.getMessage('group_description_adblocking'),
        [AntibannerGroupsId.PrivacyFiltersGroupId]: translator.getMessage('group_description_stealth'),
        [AntibannerGroupsId.SocialFiltersGroupId]: translator.getMessage('group_description_social'),
        [AntibannerGroupsId.AnnoyancesFiltersGroupId]: translator.getMessage('group_description_annoyances'),
        [AntibannerGroupsId.SecurityFiltersGroupId]: translator.getMessage('group_description_security'),
        [AntibannerGroupsId.OtherFiltersGroupId]: translator.getMessage('group_description_miscellaneous'),
        [AntibannerGroupsId.LanguageFiltersGroupId]: translator.getMessage('group_description_lang'),
    };

    const {
        categories,
        filters,
        filtersToRender,
    }: {
        categories: CategoriesGroupData[];
        filters: RenderedFilterType[];
        filtersToRender: RenderedFilterType[];
    } = settingsStore;

    useEffect(() => {
        settingsStore.setSelectedGroupId(query.get(QUERY_PARAM_NAMES.GROUP));
        setGroupDetermined(true);
        settingsStore.setSearchInput('');
        settingsStore.setSearchSelect(SEARCH_FILTERS.ALL);
    }, [location.search, query, settingsStore]);

    const updateGroupSettingsWithLoader = addMinDelayLoader(
        uiStore.setShowLoader,
        async (groupId, enabled) => {
            // Custom filters is part of dynamic rules, we first enable
            // them and then check if they exceed the limit.
            if (groupId === AntibannerGroupsId.CustomFiltersGroupId) {
                await settingsStore.updateGroupSetting(groupId, enabled);

                if (__IS_MV3__) {
                    await settingsStore.checkLimitations();
                }

                return;
            }

            // For static filters we first check if they exceed the limit,
            // because we know rules count for static filter and then enable them.
            if (enabled) {
                const result = await messenger.canEnableStaticGroup(groupId);
                if (!result.ok && result.data) {
                    const staticFiltersLimitsWarning = getStaticWarningMessage(result.data);

                    if (staticFiltersLimitsWarning) {
                        uiStore.addNotification({
                            description: staticFiltersLimitsWarning,
                            extra: {
                                link: translator.getMessage('options_rule_limits'),
                            },
                            type: NotificationType.ERROR,
                        });
                    }

                    // We don't enable the group if it exceeds the limit.
                    // [revert-checkbox] is used to revert the checkbox state.
                    throw new Error('Group will exceed the limit. [revert-checkbox]');
                }
            }

            await settingsStore.updateGroupSetting(groupId, enabled);

            if (__IS_MV3__) {
                await settingsStore.checkLimitations();
            }
        },
    );

    const updateGroupSettings = __IS_MV3__
        ? updateGroupSettingsWithLoader
        : settingsStore.updateGroupSetting;

    const handleGroupSwitch = async ({ id, data }: { id: string; data: boolean }) => {
        const groupId = Number.parseInt(id, 10);

        // get user consent about recommended filters for the first time user enables annoyances filter group. AG-29161
        if (
            groupId === AntibannerGroupsId.AnnoyancesFiltersGroupId
            && !settingsStore.isGroupTouched(groupId)
            // on group enable
            && data
        ) {
            settingsStore.setFiltersToGetConsentFor(settingsStore.recommendedAnnoyancesFilters);
            settingsStore.updateGroupStateUI(AntibannerGroupsId.AnnoyancesFiltersGroupId, true);
            settingsStore.setIsAnnoyancesConsentModalOpen(true);
            return;
        }

        await updateGroupSettings(groupId, data);
    };

    const groupClickHandler = (groupId: AntibannerGroupsId) => () => {
        settingsStore.setSelectedGroupId(groupId);
        navigate(`/filters?group=${groupId}`);
    };

    /**
     * Returns filter details for the group.
     *
     * @param group Group data.
     *
     * @returns `null` if group is turned off
     * or string with filter details if group is turned on:
     * - if some filters enabled — `Enabled: <x> of <y>`;
     * - if no filters enabled — `No filters enabled`.
     */
    const getFilterDetailsForGroup = (group: CategoriesGroupData): string | null => {
        if (!group.enabled) {
            return null;
        }

        const totalFiltersInGroup = filters.filter((filter) => filter.groupId === group.groupId);
        const enabledFiltersInGroup = totalFiltersInGroup.filter((filter) => filter.enabled);

        if (enabledFiltersInGroup.length === 0) {
            return translator.getMessage('options_filters_no_enabled');
        }

        return translator.getMessage('options_filters_enabled_per_group', {
            current: enabledFiltersInGroup.length,
            total: totalFiltersInGroup.length,
        });
    };

    const handleFilterConsentConfirmWrapper = addMinDelayLoader(
        uiStore.setShowLoader,
        settingsStore.handleFilterConsentConfirm,
    );

    const renderGroups = (groups: CategoriesGroupData[]) => {
        // TODO: use 'displayNumber' as a const
        // or add sorting by it to a separate helper as it is used in several places
        const sortedGroups = sortBy(groups, 'displayNumber');

        return (
            <ul className="group-list">
                {sortedGroups.map((group) => {
                    return (
                        <Group
                            key={group.groupId}
                            groupName={group.groupName}
                            groupDescription={group.groupDescription}
                            groupId={group.groupId}
                            filterDetails={getFilterDetailsForGroup(group)}
                            groupClickHandler={groupClickHandler(group.groupId)}
                            checkboxHandler={handleGroupSwitch}
                            checkboxValue={!!group.enabled}
                        />
                    );
                })}
            </ul>
        );
    };

    const handleReturnToGroups = () => {
        navigate(`/${OptionsPageSections.filters}`);
        settingsStore.setSelectedGroupId(null);
        settingsStore.setSearchInput('');
        settingsStore.setSearchSelect(SEARCH_FILTERS.ALL);
        settingsStore.sortFilters();
    };

    const renderFilters = ({
        filtersToRender,
        groupEnabled,
        areActionsAllowed,
    }: FilterListRenderParams) => {
        if (filtersToRender.length === 0) {
            return null;
        }

        const groupListClassName = classNames(
            'group-list',
            {
                'group-list--disabled': !areActionsAllowed,
            },
        );

        return (
            <ul className={groupListClassName}>
                {filtersToRender.map((filter) => (
                    <Filter
                        key={filter.filterId}
                        filter={filter}
                        groupEnabled={groupEnabled}
                    />
                ))}
            </ul>
        );
    };

    const renderGroupsOnSearch = (matchedFilters: RenderedFilterType[]) => {
        // collect search data as object where
        // key is group id and value is searched filters
        const searchData = matchedFilters
            .reduce((acc: { [key: number]: RenderedFilterType[] }, filter) => {
                const { groupId } = filter;
                if (typeof acc[groupId] === 'undefined') {
                    acc[groupId] = [filter];
                } else {
                    acc[groupId].push(filter);
                }
                return acc;
            }, {});
        const affectedGroupsIds = Object.keys(searchData).map((id) => Number(id));
        const groupsToRender = categories
            .filter((group) => affectedGroupsIds.includes(group.groupId));

        if (!groupsToRender.length) {
            return (
                <NoFiltersFound />
            );
        }

        return (
            <ul className="search-group-list">
                {groupsToRender.map((group) => {
                    const filtersToShow = searchData[group.groupId];
                    return (
                        <SearchGroup
                            key={group.groupId}
                            groupName={group.groupName}
                            groupId={group.groupId}
                            groupEnabled={!!group.enabled}
                            filtersToShow={filtersToShow}
                            groupClickHandler={groupClickHandler(group.groupId)}
                            checkboxHandler={handleGroupSwitch}
                        />
                    );
                })}
            </ul>
        );
    };

    const openModalHandler = useCallback(() => {
        setModalIsOpen(true);
    }, [setModalIsOpen]);

    const closeModalHandler = () => {
        setModalIsOpen(false);
        setUrlToSubscribe('');
        setCustomFilterTitle('');

        // clear querystring params
        if (query.has(QUERY_PARAM_NAMES.TITLE) || query.has(QUERY_PARAM_NAMES.SUBSCRIBE)) {
            query.delete(QUERY_PARAM_NAMES.TITLE);
            query.delete(QUERY_PARAM_NAMES.SUBSCRIBE);
            navigate(`${location.pathname}?${decodeURIComponent(query.toString())}`);
        }
    };

    useEffect(() => {
        if (urlToSubscribe) {
            openModalHandler();
        }
    }, [urlToSubscribe, openModalHandler]);

    const showUserScriptsApiWarning = useVisibilityCheck(shouldShowUserScriptsApiWarning);

    /**
     * Renders a button for adding a custom filter.
     *
     * @param isEmpty If true, the button will be styled for an empty custom filter group.
     *
     * @returns The rendered button or null if the user scripts API warning is visible.
     */
    const renderAddFilterBtn = (isEmpty: boolean) => {
        /**
         * Custom filters CANNOT be added by users by default. To have this feature enabled,
         * user must explicitly grant User scripts API permission.
         *
         * To fully comply with Chrome Web Store policies regarding remote code execution,
         * we implement a strict security-focused approach for Scriptlet and JavaScript rules execution.
         *
         * 1. Default - regular users that did not grant User scripts API permission explicitly:
         *    - We collect and pre-build script rules from the filters and statically bundle
         *      them into the extension - STEP 1. See 'updateLocalResourcesForChromiumMv3' in our build tools.
         *      IMPORTANT: all scripts and their arguments are local and bundled within the extension.
         *    - These pre-verified local scripts are passed to the engine - STEP 2.
         *    - At runtime before the execution, we check if each script rule is included
         *      in our local scripts list (STEP 3).
         *    - Only pre-verified local scripts are executed via chrome.scripting API (STEP 4.1 and 4.2).
         *      All other scripts are discarded.
         *    - Custom filters are NOT allowed for regular users to prevent any possibility
         *      of remote code execution, regardless of rule interpretation.
         *
         * 2. For advanced users that explicitly granted User scripts API permission -
         *    via enabling the Developer mode or Allow user scripts in the extension details:
         *    - Custom filters are allowed and may contain Scriptlet and JS rules
         *      that can be executed using the browser's built-in userScripts API (STEP 4.3),
         *      which provides a secure sandbox.
         *    - This execution bypasses the local script verification process but remains
         *      isolated and secure through Chrome's native sandboxing.
         *    - This mode requires explicit user activation and is intended for advanced users only.
         *
         * IMPORTANT:
         * Custom filters are ONLY supported when User scripts API permission is explicitly enabled.
         * This strict policy prevents Chrome Web Store rejection due to potential remote script execution.
         * When custom filters are allowed, they may contain:
         * 1. Network rules – converted to DNR rules and applied via dynamic rules.
         * 2. Cosmetic rules – interpreted directly in the extension code.
         * 3. Scriptlet and JS rules – executed via the browser's userScripts API (userScripts.execute)
         *    with Chrome's native sandboxing providing security isolation.
         *
         * For regular users without User scripts API permission (default case):
         * - Only pre-bundled filters with statically verified scripts are supported.
         * - Downloading custom filters or any rules from remote sources is blocked entirely
         *   to ensure compliance with the store policies.
         *
         * This implementation ensures perfect compliance with Chrome Web Store policies
         * by preventing any possibility of remote code execution for regular users.
         *
         * It is possible to follow all places using this logic by searching JS_RULES_EXECUTION.
         */
        if (showUserScriptsApiWarning) {
            return null;
        }

        const buttonClass = classNames('button button--l button--green-bg', {
            'button--empty-custom-filter': isEmpty,
            'button--add-custom-filter': !isEmpty,
        });

        return (
            <button
                type="button"
                onClick={openModalHandler}
                className={buttonClass}
            >
                {translator.getMessage('options_add_custom_filter')}
            </button>
        );
    };

    if (!groupDetermined) {
        return null;
    }

    if (Number.isInteger(settingsStore.selectedGroupId)) {
        const selectedGroup = categories.find((group) => {
            return group.groupId === settingsStore.selectedGroupId;
        });

        if (!selectedGroup) {
            throw new Error(`Group id ${settingsStore.selectedGroupId} is incorrect`);
        }

        const isCustom = settingsStore.selectedGroupId === AntibannerGroupsId.CustomFiltersGroupId;
        const isEmpty = filtersToRender.length === 0;
        const description = GROUP_DESCRIPTION[selectedGroup.groupId as AntibannerGroupsId];
        const titleId = `filter-title-${selectedGroup.groupId}`;

        const renderBackButton = () => (
            // Order should remain the same to keep the focus order
            // Filter checkbox -> Filter description -> Back button
            <>
                <div className="title__inner">
                    <button
                        type="button"
                        onClick={handleReturnToGroups}
                        className="title title--back-btn"
                        // This button must be hidden for keyboard navigation and Screen Readers,
                        // because we already have a back button below, main reason for this button is to
                        // provide larger area of click for mouse users.
                        tabIndex={-1}
                        aria-hidden="true"
                    >
                        <span id={titleId}>{selectedGroup.groupName}</span>
                    </button>
                    {description && <div className="title__desc title__desc--back">{description}</div>}
                </div>
                <button
                    role="link"
                    type="button"
                    aria-label={translator.getMessage('options_filters_back_button')}
                    className="button setting__back"
                    onClick={handleReturnToGroups}
                >
                    <Icon
                        id="#arrow-left"
                        classname="icon--24"
                        aria-hidden="true"
                    />
                </button>
            </>
        );

        const renderEmptyFiltersMessage = () => {
            if (!isEmpty) {
                return null;
            }

            if (settingsStore.isSearching) {
                return <NoFiltersFound />;
            }

            if (isCustom) {
                return <NoFiltersYet />;
            }

            return null;
        };

        return (
            <SettingsSection
                title={selectedGroup.groupName}
                description={description}
                inlineControl={(
                    <Setting
                        id={selectedGroup.groupId}
                        type={SETTINGS_TYPES.CHECKBOX}
                        label={translator.getMessage('options_privacy_title')}
                        labelId={titleId}
                        value={selectedGroup.enabled}
                        handler={handleGroupSwitch}
                        optimistic={!__IS_MV3__}
                    />
                )}
                renderBackButton={renderBackButton}
                mode={isCustom ? 'custom' : undefined}
            >
                {
                    isCustom
                        ? (
                            <>
                                <DynamicRulesLimitsWarning />
                                <UserScriptsApiWarningInsideCustomGroup />
                            </>
                        )
                        : <StaticFiltersLimitsWarning />
                }
                <Search />
                {renderFilters({
                    filtersToRender,
                    groupEnabled: selectedGroup.enabled,
                    areActionsAllowed: !isCustom,
                })}
                {renderEmptyFiltersMessage()}
                {isCustom && !settingsStore.isSearching && (
                    <>
                        {renderAddFilterBtn(isEmpty && !settingsStore.isSearching)}
                        <AddCustomModal
                            closeModalHandler={closeModalHandler}
                            modalIsOpen={modalIsOpen}
                            initialUrl={urlToSubscribe}
                            initialTitle={customFilterTitle}
                        />
                    </>
                )}
                {settingsStore.isAnnoyancesConsentModalOpen && (
                    <AnnoyancesConsent
                        isOpen={settingsStore.isAnnoyancesConsentModalOpen}
                        setIsOpen={settingsStore.setIsAnnoyancesConsentModalOpen}
                        onConfirm={handleFilterConsentConfirmWrapper}
                        onCancel={settingsStore.handleFilterConsentCancel}
                        shouldShowFilterPolicy={settingsStore.shouldShowFilterPolicy}
                    />
                )}
            </SettingsSection>
        );
    }

    return (
        <SettingsSection
            title={translator.getMessage('options_filters')}
        >
            <StaticFiltersLimitsWarning />
            <DynamicRulesLimitsWarning />
            {!__IS_MV3__ && <FiltersUpdate />}
            <Search />
            {settingsStore.isSearching
                ? renderGroupsOnSearch(filtersToRender)
                : renderGroups(categories)}
            {settingsStore.isAnnoyancesConsentModalOpen && (
                <AnnoyancesConsent
                    isOpen={settingsStore.isAnnoyancesConsentModalOpen}
                    setIsOpen={settingsStore.setIsAnnoyancesConsentModalOpen}
                    onConfirm={handleFilterConsentConfirmWrapper}
                    onCancel={settingsStore.handleFilterConsentCancel}
                    shouldShowFilterPolicy={settingsStore.shouldShowFilterPolicy}
                />
            )}
        </SettingsSection>
    );
});

export { Filters };
