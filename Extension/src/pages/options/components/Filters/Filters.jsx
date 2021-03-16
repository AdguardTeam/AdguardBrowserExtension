import React, { useContext, useState, useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { observer } from 'mobx-react';
import sortBy from 'lodash/sortBy';
import classNames from 'classnames';

import { Group } from './Group';
import { Filter } from './Filter';
import { EmptyCustom } from './EmptyCustom';
import { Search } from './Search';
import { FiltersUpdate } from './FiltersUpdate';
import { rootStore } from '../../stores/RootStore';
import { reactTranslator } from '../../../../common/translators/reactTranslator';
import { AddCustomModal } from './AddCustomModal';
import { CUSTOM_FILTERS_GROUP_ID } from '../../../../../../tools/constants';
import { SettingsSection } from '../Settings/SettingsSection';
import { Icon } from '../../../common/components/ui/Icon';

const Filters = observer(() => {
    const SEARCH_FILTERS = {
        ALL: 'all',
        ENABLED: 'enabled',
        DISABLED: 'disabled',
    };

    const history = useHistory();

    const useQuery = () => {
        return new URLSearchParams(useLocation().search);
    };

    const query = useQuery();

    const [searchInput, setSearchInput] = useState('');
    const [searchSelect, setSearchSelect] = useState(SEARCH_FILTERS.ALL);
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [urlToSubscribe, setUrlToSubscribe] = useState(decodeURIComponent(query.get('subscribe') || ''));
    const [customFilterTitle, setCustomFilterTitle] = useState(query.get('title'));

    const { settingsStore, uiStore } = useContext(rootStore);

    const {
        categories,
        filters,
        rulesCount,
        lastUpdateTime,
        filtersUpdating,
    } = settingsStore;

    settingsStore.setSelectedGroupId(parseInt(query.get('group'), 10));

    const handleGroupSwitch = async ({ id, data }) => {
        await settingsStore.updateGroupSetting(id, data);
    };

    const groupClickHandler = (groupId) => () => {
        settingsStore.setSelectedGroupId(groupId);
        history.push(`/filters?group=${groupId}`);
    };

    const getEnabledFiltersByGroup = (group) => (
        filters.filter((filter) => filter.groupId === group.groupId && filter.enabled)
    );

    const renderGroups = (groups) => {
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

    const handleFilterSwitch = async ({ id, data }) => {
        await settingsStore.updateFilterSetting(id, data);
    };

    const renderFiler = (filter) => (
        <Filter
            key={filter.filterId}
            filter={filter}
            tags={filter.tagsDetails}
            checkboxHandler={handleFilterSwitch}
            checkboxValue={!!filter.enabled}
        />
    );

    const renderFilters = (filtersList) => {
        return filtersList.map(renderFiler);
    };

    const handleReturnToGroups = () => {
        history.push('/filters');
        settingsStore.setSelectedGroupId(null);
    };

    const searchInputHandler = (e) => {
        const { value } = e.target;
        setSearchInput(value);
    };

    const searchCloseHandler = () => {
        setSearchInput('');
        setSearchSelect(SEARCH_FILTERS.ALL);
    };

    const searchSelectHandler = (e) => {
        const { value } = e.target;
        setSearchSelect(value);
    };

    const renderSearchResult = () => {
        const searchInputString = searchInput.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const searchQuery = new RegExp(searchInputString, 'ig');

        let searchFilters = filters;
        if (Number.isInteger(settingsStore.selectedGroupId)) {
            searchFilters = filters.filter((filter) => (
                filter.groupId === settingsStore.selectedGroupId
            ));
        }

        return searchFilters.map((filter) => {
            let searchMod;
            switch (searchSelect) {
                case SEARCH_FILTERS.ENABLED:
                    searchMod = filter.enabled;
                    break;
                case SEARCH_FILTERS.DISABLED:
                    searchMod = !filter.enabled;
                    break;
                default:
                    searchMod = true;
            }

            if (filter.name.match(searchQuery) && searchMod) {
                return renderFiler(filter);
            }
            return null;
        });
    };

    const updateFiltersHandler = async () => {
        try {
            const updates = await settingsStore.updateFilters();
            const filterNames = updates.map((filter) => filter.name).join(', ');
            let description;
            if (updates.length === 0) {
                description = `${filterNames} ${reactTranslator.getMessage('options_popup_update_not_found')}`;
            } else if (updates.length === 1) {
                description = `${filterNames} ${reactTranslator.getMessage('options_popup_update_filter')}`;
            } else if (updates.length > 1) {
                description = `${filterNames} ${reactTranslator.getMessage('options_popup_update_filters')}`;
            }
            uiStore.addNotification({ description });
        } catch (error) {
            uiStore.addNotification({
                title: reactTranslator.getMessage('options_popup_update_title_error'),
                description: reactTranslator.getMessage('options_popup_update_error'),
            });
        }
    };

    const renderSearch = () => (
        <Search
            searchInputHandler={searchInputHandler}
            searchSelectHandler={searchSelectHandler}
            searchInput={searchInput}
            searchSelect={searchSelect}
            searchCloseHandler={searchCloseHandler}
        />
    );

    const renderFiltersUpdate = () => {
        const buttonClass = filtersUpdating ? 'loading' : 'loaded';
        return (
            <FiltersUpdate
                handler={updateFiltersHandler}
                rulesCount={rulesCount}
                buttonClass={buttonClass}
                lastUpdateDate={lastUpdateTime}
            />
        );
    };

    const openModalHandler = () => {
        setModalIsOpen(true);
    };

    const closeModalHandler = () => {
        setModalIsOpen(false);
    };

    useEffect(() => {
        if (urlToSubscribe) {
            openModalHandler();
        }
    }, [urlToSubscribe]);

    useEffect(() => {
        if (modalIsOpen) {
            setUrlToSubscribe('');
            setCustomFilterTitle('');
        }
    }, [modalIsOpen]);

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

    // search by input data or by enabled/disabled filters
    const isSearching = searchInput || searchSelect !== SEARCH_FILTERS.ALL;

    const renderBackButton = () => (
        <button
            type="button"
            className="button"
            onClick={handleReturnToGroups}
        >
            <Icon id="#arrow-back" classname="icon--back" />
        </button>
    );

    if (Number.isInteger(settingsStore.selectedGroupId)) {
        const groupFilters = filters.filter((filter) => filter.groupId === settingsStore.selectedGroupId);
        const { groupName } = categories.find((group) => group.groupId === settingsStore.selectedGroupId);

        const isCustom = settingsStore.selectedGroupId === CUSTOM_FILTERS_GROUP_ID;
        const isEmpty = groupFilters.length === 0;

        return (
            <SettingsSection
                title={groupName}
                renderBackButton={renderBackButton}
            >
                {isEmpty && isCustom ? <EmptyCustom />
                    : (
                        <>
                            {renderSearch()}
                            {isSearching
                                ? renderSearchResult()
                                : filters && renderFilters(groupFilters)}
                        </>
                    )}
                {isCustom && (
                    <>
                        {renderAddFilterBtn(isEmpty)}
                        <AddCustomModal
                            closeModalHandler={closeModalHandler}
                            modalIsOpen={modalIsOpen}
                            initialUrl={urlToSubscribe}
                            initialTitle={customFilterTitle}
                        />
                    </>
                )}
            </SettingsSection>
        );
    }
    return (
        <SettingsSection
            title={reactTranslator.getMessage('options_antibanner')}
            renderInlineControl={renderFiltersUpdate}
        >
            {renderSearch()}
            {isSearching
                ? renderSearchResult()
                : categories && renderGroups(categories)}
        </SettingsSection>
    );
});

export { Filters };
