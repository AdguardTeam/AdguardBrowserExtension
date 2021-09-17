/**
 * This file is part of Adguard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * Adguard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Adguard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Adguard Browser Extension. If not, see <http://www.gnu.org/licenses/>.
 */

import { subscriptions } from './subscription';
import { application } from '../../application';
import { tags } from './filters-tags';
import { prefs } from '../../prefs';

/**
 * Filter categories service
 */
export const categories = (() => {
    /**
     * @returns {Array.<*>} filters
     */
    const getFilters = function () {
        const result = subscriptions.getFilters().filter((f) => {
            return !f.removed;
        });

        const filterTags = tags.getTags();

        result.forEach((f) => {
            f.tagsDetails = [];
            f.tags.forEach((tagId) => {
                const tagDetails = filterTags.find((tag) => {
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
     * Selects filters by groupId
     *
     * @param groupId
     * @param filters
     * @returns {Array.<SubscriptionFilter>}
     */
    const selectFiltersByGroupId = function (groupId, filters) {
        return filters.filter(filter => filter.groupId === groupId);
    };

    /**
     * Constructs filters metadata for options.html page
     */
    const getFiltersMetadata = function () {
        const groupsMeta = subscriptions.getGroups();
        const filters = getFilters();

        const categories = [];

        for (let i = 0; i < groupsMeta.length; i += 1) {
            const category = groupsMeta[i];
            category.filters = selectFiltersByGroupId(category.groupId, filters);
            categories.push(category);
        }

        return {
            filters,
            categories,
        };
    };

    /**
     * If filter has mobile tag we check if platform is mobile, in other cases we do not check
     * @param filter
     * @returns {boolean}
     */
    const doesFilterMatchPlatform = (filter) => {
        if (tags.isMobileFilter(filter)) {
            return !!prefs.mobile;
        }
        return true;
    };

    /**
     * Returns recommended filters, which meet next requirements
     * 1. filter has recommended tag
     * 2. if filter has language tag, tag should match with user locale
     * 3. filter should correspond to platform mobile or desktop
     * @param groupId
     * @returns {Array} recommended filters by groupId
     */
    const getRecommendedFilterIdsByGroupId = function (groupId) {
        const metadata = getFiltersMetadata();
        const result = [];
        const langSuitableFilters = subscriptions.getLangSuitableFilters();
        for (let i = 0; i < metadata.categories.length; i += 1) {
            const category = metadata.categories[i];
            if (category.groupId === groupId) {
                category.filters.forEach(filter => {
                    if (tags.isRecommendedFilter(filter) && doesFilterMatchPlatform(filter)) {
                        // get ids intersection to enable recommended filters matching the lang tag
                        // only if filter has language
                        if (filter.languages && filter.languages.length > 0) {
                            if (langSuitableFilters.includes(filter.filterId)) {
                                result.push(filter.filterId);
                            }
                        } else {
                            result.push(filter.filterId);
                        }
                    }
                });
                return result;
            }
        }
        return result;
    };

    /**
     * If group doesn't have enabled property we consider that group is enabled for the first time
     * On first group enable we add and enable recommended filters by groupId
     * On the next calls we just enable group
     * @param {number} groupId
     */
    const enableFiltersGroup = async function (groupId) {
        const group = subscriptions.getGroup(groupId);
        if (group && typeof group.enabled === 'undefined') {
            const recommendedFiltersIds = getRecommendedFilterIdsByGroupId(groupId);
            await application.addAndEnableFilters(recommendedFiltersIds);
        }
        application.enableGroup(groupId);
    };

    /**
     * Disables group
     * @param {number} groupId
     */
    const disableFiltersGroup = function (groupId) {
        application.disableGroup(groupId);
    };

    return {
        getFiltersMetadata,
        enableFiltersGroup,
        disableFiltersGroup,
    };
})();
