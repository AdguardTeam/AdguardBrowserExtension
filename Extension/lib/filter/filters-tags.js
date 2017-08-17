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

    var createFilterCategory = function (tag, filters) {
        var filtersByTag = getFiltersByTagId(tag.tagId, filters);

        var recommendedFilters = filtersByTag.filter(function (f) {
            return f.tags.indexOf(RECOMMENDED_TAG_ID) >= 0;
        });
        recommendedFilters.sort(function (a, b) {
            return a.displayNumber - b.displayNumber;
        });

        var otherFilters = filtersByTag.filter(function (f) {
            return f.tags.indexOf(RECOMMENDED_TAG_ID) < 0;
        });
        otherFilters.sort(function (a, b) {
            return a.displayNumber - b.displayNumber;
        });

        return {
            tag: tag,
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

        var categories = [];

        for (var i = 0; i < tags.length; i++) {

            var tag = tags[i];
            if (tag.keyword.indexOf('purpose:') < 0) {
                continue;
            }

            categories.push(createFilterCategory(tag, filters));
        }

        categories.push(createFilterCategory({tagId: 0, keyword: "Custom Filters"}, filters));

        return {
            filters: filters,
            categories: categories
        };
    };

    var getRecommendedFilterIdsByTagId = function (tagId) {
        var filters = getFilters();
        var filtersByTagId = getFiltersByTagId(tagId, filters);

        var filterIds = [];
        for (var i = 0; i < filtersByTagId.length; i++) {
            var f = filtersByTagId[i];
            if (f.tags.indexOf(RECOMMENDED_TAG_ID) >= 0) {
                filterIds.push(f.filterId);
            }
        }

        return filterIds;
    };

    var addAndEnableFiltersByTagId = function (tagId) {
        var idsByTagId = getRecommendedFilterIdsByTagId(tagId);

        adguard.filters.addAndEnableFilters(idsByTagId);
    };

    var disableAntiBannerFiltersByTagId = function (tagId) {
        var idsByTagId = getRecommendedFilterIdsByTagId(tagId);

        adguard.filters.disableFilters(idsByTagId);
    };

    return {
        getFiltersMetadata: getFiltersMetadata,
        addAndEnableFiltersByTagId: addAndEnableFiltersByTagId,
        disableAntiBannerFiltersByTagId: disableAntiBannerFiltersByTagId
    };
})(adguard);

