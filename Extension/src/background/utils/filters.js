/**
 * Util class for detect filter type. Includes various filter identifiers
 */
export const filters = (() => {
    const AntiBannerFiltersId = {
        USER_FILTER_ID: 0,
        RUSSIAN_FILTER_ID: 1,
        ENGLISH_FILTER_ID: 2,
        TRACKING_FILTER_ID: 3,
        SOCIAL_FILTER_ID: 4,
        SEARCH_AND_SELF_PROMO_FILTER_ID: 10,
        WHITE_LIST_FILTER_ID: 100,
        EASY_PRIVACY: 118,
        FANBOY_ANNOYANCES: 122,
        FANBOY_SOCIAL: 123,
        FANBOY_ENHANCED: 215,
        MOBILE_ADS_FILTER_ID: 11,
    };

    const FilterUtils = {

        isUserFilterRule(rule) {
            return rule.getFilterListId() === AntiBannerFiltersId.USER_FILTER_ID;
        },

        isWhitelistFilterRule(rule) {
            return rule.getFilterListId() === AntiBannerFiltersId.WHITE_LIST_FILTER_ID;
        },
    };

    // Make accessible only constants without functions. They will be passed to content-page
    FilterUtils.ids = AntiBannerFiltersId;

    // Copy filter ids to api
    // eslint-disable-next-line no-restricted-syntax
    for (const key in AntiBannerFiltersId) {
        if (AntiBannerFiltersId.hasOwnProperty(key)) {
            FilterUtils[key] = AntiBannerFiltersId[key];
        }
    }

    return FilterUtils;
})();
