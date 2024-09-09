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
import { rootStore } from '../../stores/RootStore';
import { SettingsSection } from '../Settings/SettingsSection';
import { addMinDelayLoader } from '../../../common/components/helpers';
import { Icon } from '../../../common/components/ui/Icon';
import { Setting, SETTINGS_TYPES } from '../Settings/Setting';
import { AntibannerGroupsId } from '../../../../common/constants';
import { StaticFiltersLimitsWarning, DynamicRulesLimitsWarning } from '../Warnings';
import { OptionsPageSections } from '../../../../common/nav';
import { messenger } from '../../../services/messenger';
import { RuleLimitsLink } from '../RulesLimits/RuleLimitsLink';
import { getStaticWarningMessage } from '../Warnings/messages';

import { AnnoyancesConsent } from './AnnoyancesConsent';
import { Group } from './Group';
import { SearchGroup } from './Search/SearchGroup';
import { Filter } from './Filter';
import { EmptyCustom } from './EmptyCustom';
import { Search } from './Search';
import { FiltersUpdate } from './FiltersUpdate';
import { AddCustomModal } from './AddCustomModal';
import { SEARCH_FILTERS } from './Search/constants';
import { FiltersInfoMv3 } from './FiltersInfoMv3';

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
    const [urlToSubscribe, setUrlToSubscribe] = useState(decodeURIComponent(query.get(QUERY_PARAM_NAMES.SUBSCRIBE) || ''));
    const [customFilterTitle, setCustomFilterTitle] = useState(query.get(QUERY_PARAM_NAMES.TITLE));

    // This state used to remove blinking while filters to render were not selected
    const [groupDetermined, setGroupDetermined] = useState(false);

    const GROUP_DESCRIPTION = {
        [AntibannerGroupsId.CustomFiltersGroupId]: translator.getMessage('group_description_custom'),
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
                        uiStore.addMv3Notification({
                            description: staticFiltersLimitsWarning,
                            extra: {
                                link: translator.getMessage('options_rule_limits'),
                            },
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

    const handleGroupSwitch = async ({ id, data }) => {
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

    const groupClickHandler = (groupId) => () => {
        settingsStore.setSelectedGroupId(groupId);
        navigate(`/filters?group=${groupId}`);
    };

    const getEnabledFiltersByGroup = (group) => (
        filters.filter((filter) => filter.groupId === group.groupId && filter.enabled)
    );

    const handleFilterConsentConfirmWrapper = addMinDelayLoader(
        uiStore.setShowLoader,
        settingsStore.handleFilterConsentConfirm,
    );

    const renderGroups = (groups) => {
        // TODO: use 'displayNumber' as a const
        // or add sorting by it to a separate helper as it is used in several places
        const sortedGroups = sortBy(groups, 'displayNumber');
        return sortedGroups.map((group) => {
            const enabledFilters = getEnabledFiltersByGroup(group);
            return (
                <Group
                    key={group.groupId}
                    groupName={group.groupName}
                    groupId={group.groupId}
                    enabledFilters={enabledFilters}
                    groupClickHandler={groupClickHandler(group.groupId)}
                    checkboxHandler={handleGroupSwitch}
                    checkboxValue={!!group.enabled}
                />
            );
        });
    };

    const handleReturnToGroups = () => {
        navigate(`/${OptionsPageSections.filters}`);
        settingsStore.setSelectedGroupId(null);
        settingsStore.setSearchInput('');
        settingsStore.setSearchSelect(SEARCH_FILTERS.ALL);
        settingsStore.sortFilters();
    };

    const renderFilters = (filtersList, groupEnabled) => {
        return filtersList
            .map((filter) => <Filter key={filter.filterId} filter={filter} groupEnabled={groupEnabled} />);
    };

    const renderGroupsOnSearch = (matchedFilters) => {
        // collect search data as object where
        // key is group id and value is searched filters
        const searchData = matchedFilters
            .reduce((acc, filter) => {
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
        if (groupsToRender.length) {
            return groupsToRender.map((group) => {
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
            });
        }
        return (
            <div className="filter__empty">
                {translator.getMessage('options_filters_empty_title')}
            </div>
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

    const renderAddFilterBtn = (isEmpty) => {
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

        const isCustom = settingsStore.selectedGroupId === AntibannerGroupsId.CustomFiltersGroupId;
        const isEmpty = filtersToRender.length === 0;

        const renderBackButton = () => (
            <>
                <button
                    type="button"
                    aria-label="Back"
                    className="button setting__back"
                    onClick={handleReturnToGroups}
                >
                    <Icon id="#arrow-left" classname="icon--24" />
                </button>
                <div className="title__inner">
                    <button
                        type="button"
                        onClick={handleReturnToGroups}
                        className="title title--back-btn"
                    >
                        {selectedGroup.groupName}
                    </button>
                    <div className="title__desc title__desc--back">{GROUP_DESCRIPTION[selectedGroup.groupId]}</div>
                </div>
            </>
        );

        return (
            <SettingsSection
                title={selectedGroup.groupName}
                description={GROUP_DESCRIPTION[selectedGroup.groupId]}
                inlineControl={(
                    <Setting
                        id={selectedGroup.groupId}
                        type={SETTINGS_TYPES.CHECKBOX}
                        label={translator.getMessage('options_privacy_title')}
                        value={selectedGroup.enabled}
                        handler={handleGroupSwitch}
                        optimistic={!__IS_MV3__}
                    />
                )}
                renderBackButton={renderBackButton}
            >
                {
                    isCustom && (
                        <div className="settings__group__links">
                            <RuleLimitsLink />
                        </div>
                    )
                }
                {
                    isCustom
                        ? <DynamicRulesLimitsWarning />
                        : <StaticFiltersLimitsWarning />
                }
                {isEmpty && isCustom && !settingsStore.isSearching
                    ? <EmptyCustom />
                    : (
                        <>
                            <Search />
                            {renderFilters(filtersToRender, selectedGroup.enabled)}
                        </>
                    )}
                {isCustom && (
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
            <StaticFiltersLimitsWarning useWrapper />
            <DynamicRulesLimitsWarning useWrapper />
            {__IS_MV3__ ? (
                <FiltersInfoMv3 />
            ) : (
                <FiltersUpdate />
            )}
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
