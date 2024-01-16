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
import { useHistory, useLocation } from 'react-router-dom';
import { observer } from 'mobx-react';

import classNames from 'classnames';
import { sortBy } from 'lodash-es';

import { rootStore } from '../../stores/RootStore';
import { reactTranslator } from '../../../../common/translators/reactTranslator';
import { SettingsSection } from '../Settings/SettingsSection';
import { Icon } from '../../../common/components/ui/Icon';
import { Setting, SETTINGS_TYPES } from '../Settings/Setting';
import { AntibannerGroupsId } from '../../../../common/constants';

import { AnnoyancesConsent } from './AnnoyancesConsent';
import { Group } from './Group';
import { SearchGroup } from './Search/SearchGroup';
import { Filter } from './Filter';
import { EmptyCustom } from './EmptyCustom';
import { Search } from './Search';
import { FiltersUpdate } from './FiltersUpdate';
import { AddCustomModal } from './AddCustomModal';
import { SEARCH_FILTERS } from './Search/constants';

const QUERY_PARAM_NAMES = {
    GROUP: 'group',
    TITLE: 'title',
    SUBSCRIBE: 'subscribe',
};

const Filters = observer(() => {
    const { settingsStore } = useContext(rootStore);

    const history = useHistory();

    const location = useLocation();
    const query = useMemo(() => new URLSearchParams(location.search), [location.search]);

    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [urlToSubscribe, setUrlToSubscribe] = useState(decodeURIComponent(query.get(QUERY_PARAM_NAMES.SUBSCRIBE) || ''));
    const [customFilterTitle, setCustomFilterTitle] = useState(query.get(QUERY_PARAM_NAMES.TITLE));

    // This state used to remove blinking while filters to render were not selected
    const [groupDetermined, setGroupDetermined] = useState(false);

    const GROUP_DESCRIPTION = {
        [AntibannerGroupsId.CustomFiltersGroupId]: reactTranslator.getMessage('group_description_custom'),
        [AntibannerGroupsId.AdBlockingFiltersGroupId]: reactTranslator.getMessage('group_description_adblocking'),
        [AntibannerGroupsId.PrivacyFiltersGroupId]: reactTranslator.getMessage('group_description_stealth'),
        [AntibannerGroupsId.SocialFiltersGroupId]: reactTranslator.getMessage('group_description_social'),
        [AntibannerGroupsId.AnnoyancesFiltersGroupId]: reactTranslator.getMessage('group_description_annoyances'),
        [AntibannerGroupsId.SecurityFiltersGroupId]: reactTranslator.getMessage('group_description_security'),
        [AntibannerGroupsId.OtherFiltersGroupId]: reactTranslator.getMessage('group_description_miscellaneous'),
        [AntibannerGroupsId.LanguageFiltersGroupId]: reactTranslator.getMessage('group_description_lang'),
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

        await settingsStore.updateGroupSetting(groupId, data);
    };

    const groupClickHandler = (groupId) => () => {
        settingsStore.setSelectedGroupId(groupId);
        history.push(`/filters?group=${groupId}`);
    };

    const getEnabledFiltersByGroup = (group) => (
        filters.filter((filter) => filter.groupId === group.groupId && filter.enabled)
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
        history.push('/filters');
        settingsStore.setSelectedGroupId(null);
        settingsStore.setSearchInput('');
        settingsStore.setSearchSelect(SEARCH_FILTERS.ALL);
        settingsStore.sortFilters();
    };

    const renderFilters = (filtersList) => {
        return filtersList
            .map((filter) => <Filter key={filter.filterId} filter={filter} />);
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
                        filtersToShow={filtersToShow}
                        groupClickHandler={groupClickHandler(group.groupId)}
                        checkboxHandler={handleGroupSwitch}
                        checkboxValue={!!group.enabled}
                    />
                );
            });
        }
        return (
            <div className="filter__empty">
                {reactTranslator.getMessage('options_filters_empty_title')}
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
            history.push(`${history.location.pathname}?${decodeURIComponent(query.toString())}`);
        }
    };

    useEffect(() => {
        if (urlToSubscribe) {
            openModalHandler();
        }
    }, [urlToSubscribe, openModalHandler]);

    const renderAddFilterBtn = (isEmpty) => {
        const buttonClass = classNames('button button--m button--green', {
            'button--empty-custom-filter': isEmpty,
            'button--add-custom-filter': !isEmpty,
        });

        return (
            <button
                type="button"
                onClick={openModalHandler}
                className={buttonClass}
            >
                {reactTranslator.getMessage('options_add_custom_filter')}
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

        // eslint-disable-next-line max-len
        const isCustom = settingsStore.selectedGroupId === AntibannerGroupsId.CustomFiltersGroupId;
        const isEmpty = filtersToRender.length === 0;

        const renderBackButton = () => (
            <>
                <button
                    type="button"
                    className="button setting__back"
                    onClick={handleReturnToGroups}
                >
                    <Icon id="#arrow-back" classname="icon--back" />
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
                        label={reactTranslator.getMessage('options_privacy_title')}
                        value={selectedGroup.enabled}
                        handler={handleGroupSwitch}
                    />
                )}
                renderBackButton={renderBackButton}
            >
                {isEmpty && isCustom && !settingsStore.isSearching
                    ? <EmptyCustom />
                    : (
                        <>
                            <Search />
                            {renderFilters(filtersToRender)}
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
                        onConfirm={settingsStore.handleFilterConsentConfirm}
                        onCancel={settingsStore.handleFilterConsentCancel}
                        shouldShowFilterPolicy={settingsStore.shouldShowFilterPolicy}
                    />
                )}
            </SettingsSection>
        );
    }

    return (
        <SettingsSection
            title={reactTranslator.getMessage('options_filters')}
        >
            <FiltersUpdate />
            <Search />
            {settingsStore.isSearching
                ? renderGroupsOnSearch(filtersToRender)
                : renderGroups(categories)}
            {settingsStore.isAnnoyancesConsentModalOpen && (
                <AnnoyancesConsent
                    isOpen={settingsStore.isAnnoyancesConsentModalOpen}
                    setIsOpen={settingsStore.setIsAnnoyancesConsentModalOpen}
                    onConfirm={settingsStore.handleFilterConsentConfirm}
                    onCancel={settingsStore.handleFilterConsentCancel}
                    shouldShowFilterPolicy={settingsStore.shouldShowFilterPolicy}
                />
            )}
        </SettingsSection>
    );
});

export { Filters };
