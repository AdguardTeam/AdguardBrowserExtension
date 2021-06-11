import sortBy from 'lodash/sortBy';

/**
 * Sorts filters by enabled status and displayNumber
 * @param filters
 */
export const sortFilters = (filters) => {
    const sorted = [...filters]
        .sort((a, b) => {
            // sort by enabled
            const enabledA = !!a.enabled;
            const enabledB = !!b.enabled;
            if (enabledA !== enabledB) {
                return enabledB - enabledA;
            }

            // sort by groupId
            if (a.groupId !== b.groupId) {
                return a.groupId - b.groupId;
            }

            // sort by display number
            if (a.displayNumber && b.displayNumber) {
                return a.displayNumber - b.displayNumber;
            }

            if (a.displayNumber) {
                return 1;
            }

            if (b.displayNumber) {
                return -1;
            }

            return 0;
        });

    return sorted;
};

/**
 * Updates filters state without changing order
 * @param currentFilters
 * @param newFilters
 */
export const updateFilters = (currentFilters, newFilters) => {
    const updatedFilters = [...currentFilters];

    newFilters.forEach((newFilter) => {
        const currentFilterIdx = currentFilters.findIndex((currentFilter) => {
            return currentFilter.filterId === newFilter.filterId;
        });

        if (currentFilterIdx < 0) {
            updatedFilters.push(newFilter);
        } else {
            updatedFilters[currentFilterIdx] = newFilter;
        }
    });

    return updatedFilters;
};

/**
 * Updates groups state without changing order
 * @param currentGroups
 * @param newGroups
 */
export const updateGroups = (currentGroups, newGroups) => {
    const updatedGroups = [...currentGroups];

    newGroups.forEach((newGroup) => {
        const currentGroupIdx = currentGroups.findIndex((currentGroup) => {
            return currentGroup.groupId === newGroup.groupId;
        });

        if (currentGroupIdx < 0) {
            updatedGroups.push(newGroup);
        } else {
            updatedGroups[currentGroupIdx] = newGroup;
        }
    });

    return updatedGroups;
};

export const sortGroupsOnSearch = (groups) => {
    const sortedGroups = sortBy(groups, 'displayNumber')
        .sort((a, b) => {
            // enabled first
            if (a.enabled && !b.enabled) {
                return -1;
            }
            if (!a.enabled && b.enabled) {
                return 1;
            }
            return 0;
        });
    return sortedGroups;
};
