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

    var getRecommendedFilters = function (filters) {
        return getFiltersByTagId(RECOMMENDED_TAG_ID, filters);
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
        getPurposeGroupedFilters: getPurposeGroupedFilters,
        getFiltersByTagId: getFiltersByTagId,
        getRecommendedFilters: getRecommendedFilters
    };
})(adguard);

