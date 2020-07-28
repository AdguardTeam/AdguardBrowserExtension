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

    const RECOMMENDED_TAG_ID = 10;

    const PURPOSE_ADS_TAG_ID = 1;
    const PURPOSE_PRIVACY_TAG_ID = 2;
    const PURPOSE_SOCIAL_TAG_ID = 3;
    const PURPOSE_SECURITY_TAG_ID = 4;
    const PURPOSE_ANNOYANCES_TAG_ID = 5;
    const PURPOSE_COOKIES_TAG_ID = 6;
    const PURPOSE_MOBILE_TAG_ID = 19;

    const getTags = function () {
        return adguard.subscriptions.getTags();
    };

    const getFilters = function () {
        return adguard.subscriptions.getFilters()
            .filter(f => f.filterId !== adguard.utils.filters.SEARCH_AND_SELF_PROMO_FILTER_ID);
    };

    const getFiltersByTagId = function (tagId, filters) {
        return filters.filter(f => f.tags.indexOf(tagId) >= 0);
    };

    const getRecommendedFilters = function (filters) {
        return getFiltersByTagId(RECOMMENDED_TAG_ID, filters);
    };

    const isRecommendedFilter = filter => filter.tags.includes(RECOMMENDED_TAG_ID);

    const isMobileFilter = filter => filter.tags.includes(PURPOSE_MOBILE_TAG_ID);

    const getPurposeGroupedFilters = function () {
        const filters = getFilters();
        const adsFilters = getFiltersByTagId(PURPOSE_ADS_TAG_ID, filters);
        const socialFilters = getFiltersByTagId(PURPOSE_SOCIAL_TAG_ID, filters);
        const privacyFilters = getFiltersByTagId(PURPOSE_PRIVACY_TAG_ID, filters);
        const annoyancesFilters = getFiltersByTagId(PURPOSE_ANNOYANCES_TAG_ID, filters);
        const cookiesFilters = getFiltersByTagId(PURPOSE_COOKIES_TAG_ID, filters);
        const securityFilters = getFiltersByTagId(PURPOSE_SECURITY_TAG_ID, filters);

        return {
            ads: adsFilters,
            social: socialFilters,
            privacy: privacyFilters,
            security: securityFilters,
            annoyances: annoyancesFilters,
            cookies: cookiesFilters,
        };
    };

    return {
        getTags,
        getPurposeGroupedFilters,
        isRecommendedFilter,
        isMobileFilter,
        getFiltersByTagId,
        getRecommendedFilters,
    };
})(adguard);
