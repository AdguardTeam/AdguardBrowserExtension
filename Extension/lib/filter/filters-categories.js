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

    /**
     * Custom filters group identifier
     *
     * @type {number}
     */
    var CUSTOM_FILTERS_GROUP_ID = 0;

    /**
     * @returns {Array.<*>} filters
     */
    var getFilters = function () {
        var result = adguard.subscriptions.getFilters().filter(function (f) {
            return f.filterId != adguard.utils.filters.SEARCH_AND_SELF_PROMO_FILTER_ID;
        });

        var tags = adguard.tags.getTags();

        result.forEach(function (f) {
            f.tagsDetails = [];
            f.tags.forEach(function (tagId) {
                var tagDetails = tags.find(function (tag) {
                    return tag.tagId === tagId;
                });

                if (tagDetails) {
                    if (tagDetails.keyword.startsWith('reference:')) {
                        // Hide 'reference:' tags
                        return;
                    }

                    if (!tagDetails.keyword.startsWith('lang:')) {
                        // Hide prefixes except of 'lang:'
                        tagDetails.keyword = tagDetails.keyword.substring(tagDetails.keyword.indexOf(':') + 1);
                    }

                    f.tagsDetails.push(tagDetails);
                }
            });
        });

        return result;
    };

    /**
     * Selects filters by groupId, separates recommended
     *
     * @param groupId
     * @param filters
     * @returns {{recommendedFilters, otherFilters: *}}
     */
    var selectFiltersByGroupId = function (groupId, filters) {
        var groupFilters  = filters.filter(function (f) {
            return f.groupId === groupId;
        });

        var recommendedFilters = adguard.tags.getRecommendedFilters(groupFilters);
        var otherFilters = adguard.utils.collections.getArraySubtraction(groupFilters, recommendedFilters);

        return {
            recommendedFilters: recommendedFilters,
            otherFilters: otherFilters
        };
    };

    /**
     * Constructs filters metadata for options.html page
     */
    var getFiltersMetadata = function () {
        var groupsMeta = adguard.subscriptions.getGroups();
        var filters = getFilters();

        var categories = [];

        for (var i = 0; i < groupsMeta.length; i++) {
            var category = groupsMeta[i];
            category.filters = selectFiltersByGroupId(category.groupId, filters);
            categories.push(category);
        }

        categories.push({
            groupId: CUSTOM_FILTERS_GROUP_ID,
            groupName: 'Custom',
            displayNumber: 99,
            filters: selectFiltersByGroupId(CUSTOM_FILTERS_GROUP_ID, filters)
        });

        return {
            filters: getFilters(),
            categories: categories
        };
    };

    /**
     * @param groupId
     * @returns {Array} recommended filters by groupId
     */
    var getRecommendedFilterIdsByGroupId = function (groupId) {
        var metadata = getFiltersMetadata();

        for (var i = 0; i < metadata.categories.length; i++) {
            var category = metadata.categories[i];
            if (category.groupId === groupId) {
                var result = [];
                category.filters.recommendedFilters.forEach(function (f) {
                    result.push(f.filterId);
                });

                return result;
            }
        }

        return [];
    };

    /**
     * Adds and enables recommended filters by groupId
     *
     * @param groupId
     */
    var addAndEnableFiltersByGroupId = function (groupId) {
        var idsByTagId = getRecommendedFilterIdsByGroupId(groupId);

        adguard.filters.addAndEnableFilters(idsByTagId);
    };

    /**
     * Disables recommended filters by groupId
     *
     * @param groupId
     */
    var disableAntiBannerFiltersByGroupId = function (groupId) {
        var idsByTagId = getRecommendedFilterIdsByGroupId(groupId);

        adguard.filters.disableFilters(idsByTagId);
    };

    return {
        getFiltersMetadata: getFiltersMetadata,
        addAndEnableFiltersByGroupId: addAndEnableFiltersByGroupId,
        disableAntiBannerFiltersByGroupId: disableAntiBannerFiltersByGroupId
    };
})(adguard);

