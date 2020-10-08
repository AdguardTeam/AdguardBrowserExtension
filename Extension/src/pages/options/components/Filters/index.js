import React, { Component } from 'react';
import sortBy from 'lodash/sortBy';
import Group from './Group';
import Checkbox from '../Settings/Checkbox';
import Filter from './Filter';
import EmptyCustom from './EmptyCustom/EmptyCustom';
import Search from './Search/Search';
import messenger from '../../../services/messenger';
import FiltersUpdate from './FiltersUpdate/FiltersUpdate';
import { log } from '../../../../background/utils/log';

// TODO convert to functional component
class Filters extends Component {
    // eslint-disable-next-line react/state-in-constructor
    state = {
        searchInput: '',
        searchSelect: 'all',
        filtersData: {},
        showFiltersByGroup: false,
        filtersInfo: {},
        filtersUpdating: false,
    };

    async componentDidMount() {
        let filtersData;
        let filtersInfo;
        try {
            filtersData = await messenger.getFiltersData();
            filtersInfo = await messenger.getFiltersInfo();
        } catch (e) {
            log.error(e);
        }
        if (filtersData) {
            this.setState((state) => ({
                ...state, ...filtersData, ...filtersInfo,
            }));
        }
    }

    handleGroupSwitch = async ({ id, data }) => {
        const { groups } = this.state;

        try {
            await messenger.updateGroupStatus(id, data);
        } catch (e) {
            log.error(e);
        }

        const group = groups[id];
        this.setState((state) => ({
            ...state,
            groups: {
                ...groups,
                [id]: {
                    ...group,
                    enabled: data,
                },
            },
        }));
    };

    groupClickHandler = (groupId) => (e) => {
        if (!e.target.closest('.checkbox')) {
            this.setState({ showFiltersByGroup: groupId });
        }
    };

    getEnabledFiltersByGroup = (group) => {
        const { filters } = this.state;
        return group.filters.map((filterId) => {
            const { enabled, name } = filters[filterId];
            return enabled && name;
        })
            .filter((name) => !!name);
    };

    renderGroups = (groups) => {
        const sortedGroups = sortBy(Object.values(groups), 'order');
        return sortedGroups.map((group) => {
            const enabledFilters = this.getEnabledFiltersByGroup(group);
            return (
                <Group
                    key={group.id}
                    // eslint-disable-next-line react/jsx-props-no-spreading
                    {...group}
                    enabledFilters={enabledFilters}
                    groupClickHandler={this.groupClickHandler(group.id)}
                >
                    <Checkbox
                        id={group.id}
                        value={group.enabled}
                        handler={this.handleGroupSwitch}
                    />
                </Group>
            );
        });
    };

    handleFilterSwitch = async ({ id, data }) => {
        const { filters } = this.state;

        try {
            await messenger.updateFilterStatus(id, data);
        } catch (e) {
            log.error(e);
        }

        const filter = filters[id];
        this.setState((state) => ({
            ...state,
            filters: {
                ...filters,
                [id]: {
                    ...filter,
                    enabled: data,
                },
            },
        }));
    };

    renderFilters = (filters) => Object.values(filters)
        .sort((filterA, filterB) => filterA.id - filterB.id)
        .map((filter) => {
            const tags = filter.tags
                .map((tagId) => this.state.tags[tagId])
                .filter((entity) => entity);
            return (
                <Filter key={filter.id} filter={filter} tags={tags}>
                    <Checkbox
                        id={filter.id}
                        value={filter.enabled}
                        handler={this.handleFilterSwitch}
                    />
                </Filter>
            );
        });

    handleReturnToGroups = () => {
        this.setState({ showFiltersByGroup: false });
    };

    // TODO add validation
    searchInputHandler = (e) => {
        const { value } = e.target;
        this.setState({ searchInput: value });
    };

    searchCloseHandler = () => {
        this.setState({
            searchInput: '',
            searchSelect: 'all',
        });
    };

    searchSelectHandler = (e) => {
        const { value } = e.target;
        this.setState({ searchSelect: value });
    };

    renderSearchResult = (filters = this.state.filters) => {
        const { searchInput, searchSelect } = this.state;
        const filtersValues = Object.values(filters);
        const searchQuery = new RegExp(searchInput, 'ig');

        return filtersValues.map((filter) => {
            const tags = filter.tags
                .map((tagId) => this.state.tags[tagId])
                .filter((entity) => entity);
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
                    <Filter key={filter.id} filter={filter} tags={tags}>
                        <Checkbox
                            id={filter.id}
                            value={filter.enabled}
                            handler={this.handleFilterSwitch}
                        />
                    </Filter>
                );
            }
            return null;
        });
    };

    updateFiltersHandler = async () => {
        this.setState({ filtersUpdating: true });
        try {
            await messenger.updateFilters();
        } catch (e) {
            log.error(e);
            this.setState({ filtersUpdating: false });
            return;
        }
        let filtersInfo;
        try {
            filtersInfo = await messenger.getFiltersInfo();
        } catch (e) {
            log.error(e);
        }
        this.setState({
            ...filtersInfo,
            filtersUpdating: false,
        });
    };

    renderSearch() {
        const { searchSelect, searchInput } = this.state;
        return (
            <Search
                searchInputHandler={this.searchInputHandler}
                searchSelectHandler={this.searchSelectHandler}
                searchInput={searchInput}
                searchSelect={searchSelect}
                searchCloseHandler={this.searchCloseHandler}
            />
        );
    }

    renderFiltersUpdate = () => {
        const { rulesCount, lastUpdateDate, filtersUpdating } = this.state;
        const buttonClass = filtersUpdating ? 'loading' : 'loaded';
        return (
            <FiltersUpdate
                handler={this.updateFiltersHandler}
                rulesCount={rulesCount}
                buttonClass={buttonClass}
                lastUpdateDate={lastUpdateDate}
            />
        );
    };

    render() {
        const {
            groups,
            showFiltersByGroup,
            searchInput,
        } = this.state;

        if (showFiltersByGroup !== false) {
            const { filters } = this.state;
            const group = groups[showFiltersByGroup];
            const groupFilters = group.filters.map((filterId) => filters[filterId]);

            if (group.id === 0 && groupFilters.length === 0) {
                return (
                    <>
                        <div className="title-btn">
                            <button
                                type="button"
                                className="button button--back"
                                onClick={this.handleReturnToGroups}
                            />
                            <h2 className="title title--back-btn">{group.name}</h2>
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
                            onClick={this.handleReturnToGroups}
                        />
                        <h2 className="title title--back-btn">{group.name}</h2>
                    </div>
                    {this.renderSearch()}
                    {
                        !searchInput
                            ? filters && this.renderFilters(groupFilters)
                            : this.renderSearchResult(groupFilters)
                    }
                </>
            );
        }
        return (
            <>
                <div className="title-btn">
                    {this.renderFiltersUpdate()}
                    <h2 className="title title--filters-up">Filters</h2>
                </div>
                {this.renderSearch()}
                {
                    !searchInput
                        ? groups && this.renderGroups(groups)
                        : this.renderSearchResult()
                }
            </>
        );
    }
}

export default Filters;
