import React, { useContext, useState } from 'react';
import { observer } from 'mobx-react';
import sortBy from 'lodash/sortBy';
import Group from './Group';
import Checkbox from '../Settings/Checkbox';
import Filter from './Filter';
import EmptyCustom from './EmptyCustom/EmptyCustom';
import Search from './Search/Search';
import FiltersUpdate from './FiltersUpdate/FiltersUpdate';
import rootStore from '../../stores';
import i18n from '../../../services/i18n';

const Filters = observer(() => {
    const [showFiltersByGroup, setShowFiltersByGroup] = useState(false);
    const [searchInput, setSearchInput] = useState('');
    const [searchSelect, setSearchSelect] = useState('all');

    const { settingsStore, uiStore } = useContext(rootStore);

    const {
        categories,
        filters,
        rulesCount,
        lastUpdateTime,
        filtersUpdating,
    } = settingsStore;

    const handleGroupSwitch = async ({ id, data }) => {
        await settingsStore.updateGroupSetting(id, data);
    };

    const groupClickHandler = (groupId) => (e) => {
        if (!e.target.closest('.checkbox')) {
            setShowFiltersByGroup(groupId);
        }
    };

    const getEnabledFiltersByGroup = (group) => {
        return filters.filter((filter) => filter.groupId === group.groupId && filter.enabled);
    };

    const renderGroups = (groups) => {
        const sortedGroups = sortBy(groups, 'displayNumber');
        return sortedGroups.map((group) => {
            const enabledFilters = getEnabledFiltersByGroup(group);
            return (
                <Group
                    key={group.groupId}
                    // eslint-disable-next-line react/jsx-props-no-spreading
                    {...group}
                    enabledFilters={enabledFilters}
                    groupClickHandler={groupClickHandler(group.groupId)}
                >
                    <Checkbox
                        id={group.groupId}
                        handler={handleGroupSwitch}
                        value={!!(group.enabled)}
                    />
                </Group>
            );
        });
    };

    const handleFilterSwitch = async ({ id, data }) => {
        await settingsStore.updateFilterSetting(id, data);
    };

    const renderFilters = (filtersList) => filtersList.map((filter) => {
        return (
            <Filter
                key={filter.filterId}
                filter={filter}
                tags={filter.tagsDetails}
            >
                <Checkbox
                    id={filter.filterId}
                    value={filter.enabled}
                    handler={handleFilterSwitch}
                />
            </Filter>
        );
    });

    const handleReturnToGroups = () => {
        setShowFiltersByGroup(false);
    };

    // TODO add validation
    const searchInputHandler = (e) => {
        const { value } = e.target;
        setSearchInput(value);
    };

    const searchCloseHandler = () => {
        setSearchInput('');
        setSearchSelect('all');
    };

    const searchSelectHandler = (e) => {
        const { value } = e.target;
        setSearchSelect(value);
    };

    const renderSearchResult = () => {
        const searchQuery = new RegExp(searchInput, 'ig');
        const searchFilters = showFiltersByGroup
            ? filters.filter((filter) => filter.groupId === showFiltersByGroup)
            : filters;

        return searchFilters.map((filter) => {
            let searchMod;
            switch (searchSelect) {
            case 'enabled':
                searchMod = filter.enabled;
                break;
            case 'disabled':
                searchMod = !filter.enabled;
                break;
            default:
                searchMod = true;
            }

            if (filter.name.match(searchQuery) && searchMod) {
                return (
                    <Filter
                        key={filter.filterId}
                        filter={filter}
                        tags={filter.tagsDetails}
                    >
                        <Checkbox
                            id={filter.filterId}
                            value={filter.enabled}
                            handler={handleFilterSwitch}
                        />
                    </Filter>
                );
            }
            return null;
        });
    };

    const updateFiltersHandler = async () => {
        const updates = await settingsStore.updateFilters();
        uiStore.addNotification({ description: updates });
    };

    const renderSearch = () => {
        return (
            <Search
                searchInputHandler={searchInputHandler}
                searchSelectHandler={searchSelectHandler}
                searchInput={searchInput}
                searchSelect={searchSelect}
                searchCloseHandler={searchCloseHandler}
            />
        );
    };

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

    if (showFiltersByGroup !== false) {
        const groupFilters = filters.filter((filter) => filter.groupId === showFiltersByGroup);
        const groupName = categories.filter(group => group.groupId === showFiltersByGroup)[0].groupName;
        if (showFiltersByGroup === 0 && groupFilters.length === 0) {
            return (
                <>
                    <div className="title-btn">
                        <button
                            type="button"
                            className="button button--back"
                            onClick={handleReturnToGroups}
                        />
                        <h2 className="title title--back-btn">{groupName}</h2>
                    </div>
                    <EmptyCustom />
                </>
            );
        }
        return (
            <>
                <div className="title-btn">
                    <button
                        type="button"
                        className="button button--back"
                        onClick={handleReturnToGroups}
                    />
                    <h2 className="title title--back-btn">{groupName}</h2>
                </div>
                {renderSearch()}
                {
                    searchInput
                        ? renderSearchResult()
                        : filters && renderFilters(groupFilters)
                }
            </>
        );
    }
    return (
        <>
            <div className="title-btn">
                {renderFiltersUpdate()}
                <h2 className="title title--filters-up">{i18n.translate('options_antibanner')}</h2>
            </div>
            {renderSearch()}
            {
                searchInput
                    ? renderSearchResult()
                    : categories && renderGroups(categories)
            }
        </>
    );
});

export default Filters;
