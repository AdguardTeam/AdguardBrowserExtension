/**
 * Sorts filters by enabled status and displayNumber
 * @param filters
 */
export const sortFilters = (filters) => {
    return [...filters]
        .sort((a, b) => {
            const enabledA = !!a.enabled;
            const enabledB = !!b.enabled;
            if (enabledA === enabledB) {
                if (a.displayNumber && b.displayNumber) {
                    return a.displayNumber - b.displayNumber;
                }
                if (a.displayNumber) {
                    return 1;
                }
                if (b.displayNumber) {
                    return -1;
                }
            }
            return enabledB - enabledA;
        });
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
