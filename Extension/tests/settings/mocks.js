(function (adguard) {
    adguard.filters = {
        getEnabledFilters: () => [
            { filterId: 1 },
            {
                filterId: 100,
                customUrl: 'https://example.org/custom_url',
            },
        ],
        addAndEnableFilters: (filters, cb) => {
            cb(true);
        },
        removeFilter: () => {},
        disableFilters: () => {},
        enableGroup: () => {},
        disableGroup: () => {},
    };

    adguard.app = {
        getLocale: () => 'en-GB',
    };

    adguard.subscriptions = {};

    const groupsMap = {
        1: { groupId: 1, groupName: 'Ad Blocking', displayNumber: 1 },
        2: { groupId: 2, groupName: 'Privacy', displayNumber: 2 },
        3: { groupId: 3, groupName: 'Social Widgets', displayNumber: 3 },
        4: { groupId: 4, groupName: 'Annoyances', displayNumber: 4 },
        5: { groupId: 5, groupName: 'Security', displayNumber: 5 },
        6: { groupId: 6, groupName: 'Other', displayNumber: 6 },
        7: { groupId: 7, groupName: 'Language-specific', displayNumber: 7 },
        0: { groupId: 0, groupName: 'Custom', displayNumber: 99 },
    };

    adguard.subscriptions.getGroups = () => Object.keys(groupsMap)
        .map(key => groupsMap[key]);

    adguard.subscriptions.getGroup = groupId => groupsMap[groupId];

    const filtersMap = {
        1: { filterId: 1, groupId: 1 },
        2: { filterId: 2, groupId: 2 },
        3: { filterId: 3, groupId: 2 },
        4: { filterId: 4, groupId: 3 },
        5: { filterId: 5, groupId: 5 },
        6: { filterId: 100, groupId: 0, customUrl: 'https://example.org/custom_url' },
    };

    adguard.subscriptions.getFilter = filterId => filtersMap[filterId];

    adguard.subscriptions.getCustomFilters = () => Object.values(filtersMap)
        .filter(f => f.customUrl);

    adguard.whitelist = {
        getWhiteListedDomains: () => {},
        getBlockListedDomains: () => {},
        isDefaultMode: () => adguard.settings.isDefaultWhiteListMode(),
        configure: () => {},
    };

    adguard.userrules = {
        getUserRulesText: cb => cb(''),
        updateUserRulesText: () => {},
    };
})(adguard);
