/**
 * This file is part of Adguard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * Adguard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Adguard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Adguard Browser Extension.  If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * Filter tags service
 */
adguard.tags = (function (adguard) {

    'use strict';

    var RECOMMENDED_TAG_ID = 10;
    var PURPOSE_ADS_TAG_ID = 1;
    var PURPOSE_PRIVACY_TAG_ID = 2;
    var PURPOSE_SOCIAL_TAG_ID = 3;
    var PURPOSE_SECURITY_TAG_ID = 4;
    var PURPOSE_ANNOYANCES_TAG_ID = 5;
    var PURPOSE_COOKIES_TAG_ID = 6;

    var getFilters = function () {
        return adguard.subscriptions.getFilters().filter(function (f) {
            return f.filterId != adguard.utils.filters.SEARCH_AND_SELF_PROMO_FILTER_ID;
        });
    };

    var getFiltersByTagId = function (tagId, filters) {
        return filters.filter(function (f) {
            return f.tags.indexOf(tagId) >= 0;
        });
    };

    var getArraySubtraction = function (a, b) {
        return a.filter(function (i) {
            return b.indexOf(i) < 0;
        });
    };

    var selectTagFilters = function (tagId, filters) {
        var filtersByTag = getFiltersByTagId(tagId, filters);
        filtersByTag.sort(function (a, b) {
            return a.displayNumber - b.displayNumber;
        });

        var recommendedFilters = getFiltersByTagId(RECOMMENDED_TAG_ID, filtersByTag);
        var otherFilters = getArraySubtraction(filtersByTag, recommendedFilters);

        return {
            recommendedFilters: recommendedFilters,
            otherFilters: otherFilters
        };
    };

    /**
     * Creates special category for language-specific filters
     *
     * @param filters
     */
    var selectLangSpecificFilters = function (tags, filters) {
        var selected = [];

        for (var i = 0; i < tags.length; i++) {
            var tag = tags[i];
            if (tag.keyword.indexOf('lang:') !== 0) {
                continue;
            }

            selected = selected.concat(getFiltersByTagId(tag.tagId, filters));
        }

        selected.sort(function (a, b) {
            return a.displayNumber - b.displayNumber;
        });

        var recommendedFilters = getFiltersByTagId(RECOMMENDED_TAG_ID, selected);
        var otherFilters = getArraySubtraction(selected, recommendedFilters);

        return {
            recommendedFilters: recommendedFilters,
            otherFilters: otherFilters
        };
    };

    /**
     * Constructs filters metadata for options.html page
     */
    var getFiltersMetadata = function () {

        var tags = adguard.subscriptions.getTags();
        var filters = getFilters();

        var langSpecificFilters = selectLangSpecificFilters(tags, filters);
        filters = getArraySubtraction(filters, langSpecificFilters.recommendedFilters);
        filters = getArraySubtraction(filters, langSpecificFilters.otherFilters);

        /**
         * TODO: This is temporary and should be changed to proper groups selecting
         */
        var filterCategories = [
            {
                // Language specific
                categoryId: 1,
                filters: langSpecificFilters,
                keyword: 'Language-specific'
            },
            {
                categoryId: 2,
                tagId: PURPOSE_ADS_TAG_ID,
                keyword: 'Ad Blocking'
            },
            {
                categoryId: 3,
                tagId: PURPOSE_PRIVACY_TAG_ID,
                keyword: 'Privacy'
            },
            {
                categoryId: 4,
                tagId: PURPOSE_SOCIAL_TAG_ID,
                keyword: 'Social Widgets'
            },
            {
                categoryId: 5,
                tagId: PURPOSE_ANNOYANCES_TAG_ID,
                keyword: 'Annoyances'
            },
            {
                categoryId: 6,
                tagId: 0,
                keyword: "Custom Filters"
            }
        ];

        for (var i = 0; i < filterCategories.length; i++) {
            var category = filterCategories[i];
            if (typeof category.tagId !== 'undefined') {
                category.filters = selectTagFilters(category.tagId, filters);
                filters = getArraySubtraction(filters, category.filters.recommendedFilters);
                filters = getArraySubtraction(filters, category.filters.otherFilters);
            }
        }

        return {
            filters: getFilters(),
            categories: filterCategories
        };
    };

    var getRecommendedFilterIdsByCategoryId = function (categoryId) {
        var metadata = getFiltersMetadata();

        for (var i = 0; i < metadata.categories.length; i++) {
            var category = metadata.categories[i];
            if (category.categoryId === categoryId) {
                var result = [];
                category.filters.recommendedFilters.forEach(function (f) {
                    result.push(f.filterId);
                });

                return result;
            }
        }

        return [];
    };

    var addAndEnableFiltersByCategoryId = function (categoryId) {
        var idsByTagId = getRecommendedFilterIdsByCategoryId(categoryId);

        adguard.filters.addAndEnableFilters(idsByTagId);
    };

    var disableAntiBannerFiltersByCategoryId = function (categoryId) {
        var idsByTagId = getRecommendedFilterIdsByCategoryId(categoryId);

        adguard.filters.disableFilters(idsByTagId);
    };

    var getPurposeGroupedFilters = function () {
        var filters = getFilters();
        var adsFilters = getFiltersByTagId(PURPOSE_ADS_TAG_ID, filters);
        var socialFilters = getFiltersByTagId(PURPOSE_SOCIAL_TAG_ID, filters);
        var privacyFilters = getFiltersByTagId(PURPOSE_PRIVACY_TAG_ID, filters);
        var annoyancesFilters = getFiltersByTagId(PURPOSE_ANNOYANCES_TAG_ID, filters);
        var cookiesFilters = getFiltersByTagId(PURPOSE_COOKIES_TAG_ID, filters);
        var securityFilters = getFiltersByTagId(PURPOSE_SECURITY_TAG_ID, filters);

        return {
            ads: adsFilters,
            social: socialFilters,
            privacy: privacyFilters,
            security: securityFilters,
            annoyances: annoyancesFilters,
            cookies: cookiesFilters
        };
    };

    return {
        getFiltersMetadata: getFiltersMetadata,
        addAndEnableFiltersByCategoryId: addAndEnableFiltersByCategoryId,
        disableAntiBannerFiltersByCategoryId: disableAntiBannerFiltersByCategoryId,
        getPurposeGroupedFilters: getPurposeGroupedFilters
    };
})(adguard);

