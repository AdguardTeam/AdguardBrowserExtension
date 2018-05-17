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
 * Filter categories service
 */
adguard.categories = (function (adguard) {

    'use strict';

    var PURPOSE_ADS_TAG_ID = 1;
    var PURPOSE_PRIVACY_TAG_ID = 2;
    var PURPOSE_SOCIAL_TAG_ID = 3;
    var PURPOSE_SECURITY_TAG_ID = 4;
    var PURPOSE_ANNOYANCES_TAG_ID = 5;

    var getFilters = function () {
        return adguard.subscriptions.getFilters().filter(function (f) {
            return f.filterId != adguard.utils.filters.SEARCH_AND_SELF_PROMO_FILTER_ID;
        });
    };

    var getArraySubtraction = function (a, b) {
        return a.filter(function (i) {
            return b.indexOf(i) < 0;
        });
    };

    var selectTagFilters = function (tagId, filters) {
        var filtersByTag = adguard.tags.getFiltersByTagId(tagId, filters);
        filtersByTag.sort(function (a, b) {
            return a.displayNumber - b.displayNumber;
        });

        var recommendedFilters = adguard.tags.getRecommendedFilters(filtersByTag);
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
    var selectLangSpecificFilters = function (filters) {
        var tags = adguard.subscriptions.getTags();

        var selected = [];

        for (var i = 0; i < tags.length; i++) {
            var tag = tags[i];
            if (tag.keyword.indexOf('lang:') !== 0) {
                continue;
            }

            selected = selected.concat(adguard.tags.getFiltersByTagId(tag.tagId, filters));
        }

        selected.sort(function (a, b) {
            return a.displayNumber - b.displayNumber;
        });

        var recommendedFilters = adguard.tags.getRecommendedFilters(selected);
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
        var filters = getFilters();

        var langSpecificFilters = selectLangSpecificFilters(filters);
        filters = getArraySubtraction(filters, langSpecificFilters.recommendedFilters);
        filters = getArraySubtraction(filters, langSpecificFilters.otherFilters);

        /**
         * TODO: This is temporary and should be changed to proper groups selecting
         */
        var groups = [
            {
                "categoryId": 1,
                "groupName": "Ad Blocking",
                "displayNumber": 1,
                "tagId": PURPOSE_ADS_TAG_ID
            },
            {
                "categoryId": 2,
                "groupName": "Privacy",
                "displayNumber": 2,
                "tagId": PURPOSE_PRIVACY_TAG_ID
            },
            {
                "categoryId": 3,
                "groupName": "Social Widgets",
                "displayNumber": 3,
                "tagId": PURPOSE_SOCIAL_TAG_ID
            },
            {
                "categoryId": 4,
                "groupName": "Annoyances",
                "displayNumber": 4,
                "tagId": PURPOSE_ANNOYANCES_TAG_ID
            },
            {
                "categoryId": 5,
                "groupName": "Security",
                "displayNumber": 5,
                "tagId": PURPOSE_SECURITY_TAG_ID
            },
            {
                "categoryId": 6,
                "groupName": "Other",
                "displayNumber": 6,
                "tagId": 0
            },
            {
                "categoryId": 7,
                "groupName": "Language-specific",
                "displayNumber": 7,
                "filters": langSpecificFilters
            }
        ];

        for (var i = 0; i < groups.length; i++) {
            var category = groups[i];
            if (typeof category.tagId !== 'undefined') {
                category.filters = selectTagFilters(category.tagId, filters);
                filters = getArraySubtraction(filters, category.filters.recommendedFilters);
                filters = getArraySubtraction(filters, category.filters.otherFilters);
            }
        }

        groups.sort(function (a, b) {
            return a.displayNumber - b.displayNumber;
        });

        return {
            filters: getFilters(),
            categories: groups
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

    return {
        getFiltersMetadata: getFiltersMetadata,
        addAndEnableFiltersByCategoryId: addAndEnableFiltersByCategoryId,
        disableAntiBannerFiltersByCategoryId: disableAntiBannerFiltersByCategoryId
    };
})(adguard);

