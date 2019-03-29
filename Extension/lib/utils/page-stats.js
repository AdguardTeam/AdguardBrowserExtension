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
 * Global stats
 */
adguard.pageStats = (function (adguard) {
    'use strict';

    const MAX_HOURS_HISTORY = 24;
    const MAX_DAYS_HISTORY = 30;
    const MAX_MONTHS_HISTORY = 3;

    const TOTAL_GROUP = {
        groupId: 'total',
        groupName: adguard.i18n ? adguard.i18n.getMessage('popup_statistics_total') : 'Total',
    };

    const pageStatisticProperty = 'page-statistic';

    const pageStatsHolder = {
        /**
         * Getter for total page stats (gets it from local storage)
         *
         * @returns {*}
         * @private
         */
        get stats() {
            return adguard.lazyGet(pageStatsHolder, 'stats', () => {
                let stats;
                try {
                    const json = adguard.localStorage.getItem(pageStatisticProperty);
                    if (json) {
                        stats = JSON.parse(json);
                    }
                } catch (ex) {
                    adguard.console.error('Error retrieve page statistic from storage, cause {0}', ex);
                }
                return stats || Object.create(null);
            });
        },

        save: adguard.utils.concurrent.throttle(function () {
            adguard.localStorage.setItem(pageStatisticProperty, JSON.stringify(this.stats));
        }, adguard.prefs.statsSaveInterval),

        clear: function () {
            adguard.localStorage.removeItem(pageStatisticProperty);
            adguard.lazyGetClear(pageStatsHolder, 'stats');
        },
    };

    /**
     * Total count of blocked requests
     *
     * @returns {Number} Count of blocked requests
     */
    const getTotalBlocked = function () {
        const stats = pageStatsHolder.stats;
        if (!stats) {
            return 0;
        }
        return stats.totalBlocked || 0;
    };

    /**
     * Updates total count of blocked requests
     *
     * @param blocked Count of blocked requests
     */
    const updateTotalBlocked = function (blocked) {
        const stats = pageStatsHolder.stats;
        stats.totalBlocked = (stats.totalBlocked || 0) + blocked;
        pageStatsHolder.save();
    };

    /**
     * Resets tab stats
     */
    const resetStats = function () {
        pageStatsHolder.clear();
    };

    /**
     * Object used to cache bindings between filters and groups
     * @type {{filterId: {groupId: Number, groupName: String, displayNumber: Number}}}
     */
    const blockedGroupsFilters = {};

    // TODO check why not all filter stats appear here, for example cosmetic filters

    /**
     * Returns blocked group by filter id
     *
     * @param {number} filterId
     * @returns
     */
    const getBlockedGroupByFilterId = function (filterId) {
        let blockedGroup = blockedGroupsFilters[filterId];

        if (blockedGroup !== undefined) {
            return blockedGroup;
        }

        const filter = adguard.subscriptions.getFilter(filterId);
        if (!filter) {
            return undefined;
        }

        const group = adguard.subscriptions.getGroup(filter.groupId);
        if (!group) {
            return undefined;
        }

        const { groupId, groupName, displayNumber } = group;
        blockedGroup = { groupId, groupName, displayNumber };
        blockedGroupsFilters[filter.filterId] = blockedGroup;

        return blockedGroup;
    };

    const createStatsDataItem = function (type, blocked) {
        const result = new Object(null);
        if (type) {
            result[type] = blocked;
        }
        result[TOTAL_GROUP.groupId] = blocked;
        return result;
    };

    /**
     * Blocked types to filters relation dictionary
     */
    const createStatsData = function (now, type, blocked) {
        const result = Object.create(null);
        result.hours = [];
        result.days = [];
        result.months = [];

        for (let i = 1; i < MAX_HOURS_HISTORY; i += 1) {
            result.hours.push(createStatsDataItem(null, 0));
        }
        result.hours.push(createStatsDataItem(type, blocked));

        for (let j = 1; j < MAX_DAYS_HISTORY; j += 1) {
            result.days.push(createStatsDataItem(null, 0));
        }
        result.days.push(createStatsDataItem(type, blocked));

        for (let k = 1; k < MAX_MONTHS_HISTORY; k += 1) {
            result.months.push(createStatsDataItem(null, 0));
        }
        result.months.push(createStatsDataItem(type, blocked));

        result.updated = now.getTime();

        return result;
    };

    var updateStatsDataItem = function (type, blocked, current) {
        current[type] = (current[type] || 0) + blocked;
        current[TOTAL_GROUP.groupId] = (current[TOTAL_GROUP.groupId] || 0) + blocked;

        return current;
    };

    var updateStatsData = function (now, type, blocked, current) {
        const currentDate = new Date(current.updated);

        const result = current;

        if (adguard.utils.dates.isSameHour(now, currentDate) && result.hours.length > 0) {
            result.hours[result.hours.length - 1] = updateStatsDataItem(type, blocked, result.hours[result.hours.length - 1]);
        } else {
            let diffHours = adguard.utils.dates.getDifferenceInHours(now, currentDate);

            while (diffHours >= 2) {
                result.hours.push(createStatsDataItem(null, 0));
                diffHours -= 1;
            }

            result.hours.push(createStatsDataItem(type, blocked));
            if (result.hours.length > MAX_HOURS_HISTORY) {
                result.hours = result.hours.slice(-MAX_HOURS_HISTORY);
            }
        }

        if (adguard.utils.dates.isSameDay(now, currentDate) && result.days.length > 0) {
            result.days[result.days.length - 1] = updateStatsDataItem(type, blocked, result.days[result.days.length - 1]);
        } else {
            let diffDays = adguard.utils.dates.getDifferenceInDays(now, currentDate);

            while (diffDays >= 2) {
                result.days.push(createStatsDataItem(null, 0));
                diffDays -= 1;
            }

            result.days.push(createStatsDataItem(type, blocked));
            if (result.days.length > MAX_DAYS_HISTORY) {
                result.days = result.days.slice(-MAX_DAYS_HISTORY);
            }
        }

        if (adguard.utils.dates.isSameMonth(now, currentDate) && result.months.length > 0) {
            result.months[result.months.length - 1] = updateStatsDataItem(type, blocked, result.months[result.months.length - 1]);
        } else {
            let diffMonths = adguard.utils.dates.getDifferenceInMonths(now, currentDate);
            while (diffMonths >= 2) {
                result.months.push(createStatsDataItem(null, 0));
                diffMonths -= 1;
            }

            result.months.push(createStatsDataItem(type, blocked));
        }

        result.updated = now.getTime();
        return result;
    };

    /**
     * Updates stats data
     *
     * For every hour/day/month we have an object:
     * {
     *      blockedType: count,
     *      ..,
     *
     *      total: count
     * }
     *
     * We store last 24 hours, 30 days and all past months stats
     *
     * var data = {
     *              hours: [],
     *              days: [],
     *              months: [],
     *              updated: Date };
     *
     * @param filterId
     * @param blocked count
     * @param now date
     */
    const updateStats = function (filterId, blocked, now) {
        const blockedGroup = getBlockedGroupByFilterId(filterId);

        if (blockedGroup === undefined) {
            return;
        }

        const { groupId } = blockedGroup;
        const stats = pageStatsHolder.stats;

        let updated;

        if (!stats.data) {
            updated = createStatsData(now, groupId, blocked);
        } else {
            updated = updateStatsData(now, groupId, blocked, stats.data);
        }

        pageStatsHolder.stats.data = updated;
        pageStatsHolder.save();
    };

    const getBlockedGroups = () => {
        const groups = adguard.subscriptions.getGroups()
            .map(group => {
                return {
                    groupId: group.groupId,
                    groupName: group.groupName,
                    displayNumber: group.displayNumber,
                };
            });

        return [TOTAL_GROUP, ...groups.sort((prevGroup, nextGroup) => {
            return prevGroup.displayNumber - nextGroup.displayNumber;
        })];
    };

    /**
     * Returns statistics data object
     * @param {Date} [date] - used in the tests to provide time of stats object creation
     */
    const getStatisticsData = (date = new Date()) => {
        let stats = pageStatsHolder.stats;
        if (!stats) {
            stats = {};
        }

        if (!stats.data) {
            stats.data = createStatsData(date, null, 0);
            pageStatsHolder.stats.data = stats.data;
            pageStatsHolder.save();
        }

        return {
            today: stats.data.hours,
            lastWeek: stats.data.days.slice(-7),
            lastMonth: stats.data.days,
            lastYear: stats.data.months.slice(-12),
            overall: stats.data.months,
            blockedGroups: getBlockedGroups(),
        };
    };

    return {
        resetStats: resetStats,
        updateTotalBlocked: updateTotalBlocked,
        updateStats: updateStats,
        getTotalBlocked: getTotalBlocked,
        getStatisticsData: getStatisticsData,
    };
})(adguard);
