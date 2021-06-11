/**
 * Cache data for filters, groups and tags
 */
export const metadataCache = (() => {
    let tags = [];
    let groups = [];
    let groupsMap = {};
    let filters = [];
    let filtersMap = {};

    /**
     * Returns cache data
     */
    const getData = () => ({
        tags,
        groups,
        groupsMap,
        filters,
        filtersMap,
    });

    /**
     * Updates cache data
     */
    const setData = (data) => {
        tags = data.tags || tags;
        groups = data.groups || groups;
        groupsMap = data.groupsMap || groupsMap;
        filters = data.filters || filters;
        filtersMap = data.filtersMap || filtersMap;
    };

    /**
     * Gets filter metadata by filter identifier
     */
    const getFilter = (filterId) => filtersMap[filterId];

    /**
     * @returns Array of Filters metadata
     */
    const getFilters = () => filters;

    /**
     * Removes filter metadata by id
     * @param filterId
     */
    const removeFilter = (filterId) => {
        filters = filters.filter((f) => f.filterId !== filterId);
        delete filtersMap[filterId];
    };

    /**
     * Updates filter metadata
     * @param filter
     */
    const updateFilters = (filter) => {
        removeFilter(filter.filterId);
        filters.push(filter);
        filtersMap[filter.filterId] = filter;
    };

    /**
     * @returns Group metadata
     */
    const getGroup = (groupId) => groupsMap[groupId];

    /**
     * @returns Array of Groups metadata
     */
    const getGroups = () => groups;

    /**
     * @returns Array of Groups metadata
     */
    const getGroupsMap = () => groupsMap;

    /**
     * @returns Array of Tags metadata
     */
    const getTags = () => tags;

    return {
        getData,
        setData,
        getFilter,
        getFilters,
        removeFilter,
        updateFilters,
        getGroup,
        getGroups,
        getGroupsMap,
        getTags,
    };
})();
