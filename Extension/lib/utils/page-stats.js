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

    var pageStatisticProperty = "page-statistic";

    var pageStatsHolder = {
        /**
         * Getter for total page stats (gets it from local storage)
         *
         * @returns {*}
         * @private
         */
        get stats() {
            return adguard.lazyGet(pageStatsHolder, 'stats', function () {
                var stats;
                try {
                    var json = adguard.localStorage.getItem(pageStatisticProperty);
                    if (json) {
                        stats = JSON.parse(json);
                    }
                } catch (ex) {
                    adguard.console.error('Error retrieve page statistic from storage, cause {0}', ex);
                }
                return stats || Object.create(null);
            });
        },

        save: function () {
            if (this.saveTimeoutId) {
                clearTimeout(this.saveTimeoutId);
            }
            this.saveTimeoutId = setTimeout(function () {
                adguard.localStorage.setItem(pageStatisticProperty, JSON.stringify(this.stats));
            }.bind(this), 1000);
        },

        clear: function () {
            adguard.localStorage.removeItem(pageStatisticProperty);
            adguard.lazyGetClear(pageStatsHolder, 'stats');
        }
    };

    /**
     * Total count of blocked requests
     *
     * @returns Count of blocked requests
     */
    var getTotalBlocked = function () {
        var stats = pageStatsHolder.stats;
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
    var updateTotalBlocked = function (blocked) {
        var stats = pageStatsHolder.stats;
        stats.totalBlocked = (stats.totalBlocked || 0) + blocked;
        pageStatsHolder.save();
    };

    /**
     * Resets tab stats
     */
    var resetStats = function () {
        pageStatsHolder.clear();
    };

    /**
     * Blocked requests types
     */
    var blockedTypes = {
        // jshint ignore:start
        ADS: 1 << 1,
        TRACKERS: 1 << 2,
        SOCIAL: 1 << 3,
        ANNOYANCES: 1 << 4,
        SECURITY: 1 << 5,
        COOKIES: 1 << 6,
        OTHERS: 1 << 0
        // jshint ignore:end
    };

    /**
     * Returns blocked types by filter id
     *
     * @param filterId
     * @returns
     */
    var getBlockedTypeByFilterId = function (filterId) {
        if (!blockedTypesFilters) {
            blockedTypesFilters = fillBlockedTypes();
        }

        return blockedTypesFilters[filterId] ? blockedTypesFilters[filterId] : blockedTypes.OTHERS;
    };

    var fillBlockedTypes = function () {
        var map = {};

        var grouped = adguard.tags.getPurposeGroupedFilters();
        if (!grouped) {
            return null;
        }

        function fillMap(group, blockedType) {
            var k = 0;
            while (k < group.length) {
                var current = map[group[k].filterId];
                map[group[k].filterId] = current ? (current |= blockedType) : blockedType;
                k++;
            }
        }

        fillMap(grouped.ads, blockedTypes.ADS);
        fillMap(grouped.social, blockedTypes.SOCIAL);
        fillMap(grouped.privacy, blockedTypes.TRACKERS);
        fillMap(grouped.annoyances, blockedTypes.ANNOYANCES);
        fillMap(grouped.security, blockedTypes.SECURITY);
        fillMap(grouped.cookies, blockedTypes.COOKIES);

        return map;
    };

    /**
     * Blocked types to filters relation dictionary
     */
    var blockedTypesFilters = null;

    var createStatsData = function (now, type, blocked) {
        var result = Object.create(null);
        result.hours = [];
        result.days = [];
        result.months = [];

        for (var i = 1; i < MAX_HOURS_HISTORY; i++) {
            result.hours.push(createStatsDataItem(null, 0));
        }
        result.hours.push(createStatsDataItem(type, blocked));

        for (var j = 1; j < MAX_DAYS_HISTORY; j++) {
            result.days.push(createStatsDataItem(null, 0));
        }
        result.days.push(createStatsDataItem(type, blocked));

        for (var k = 1; k < 3; k++) {
            result.months.push(createStatsDataItem(null, 0));
        }
        result.months.push(createStatsDataItem(type, blocked));

        result.updated = now.getTime();

        return result;
    };

    var createStatsDataItem = function (type, blocked) {
        var result = new Object(null);
        if (type) {
            result[type] = blocked;
        }
        result.total = blocked;
        return result;
    };

    var updateStatsDataItem = function (type, blocked, current) {
        current[type] = (current[type] || 0) + blocked;
        current.total = (current.total || 0) + blocked;

        return current;
    };

    var MAX_HOURS_HISTORY = 24;
    var MAX_DAYS_HISTORY = 30;

    var updateStatsData = function (now, type, blocked, current) {
        var currentDate = new Date(current.updated);

        var result = current;

        if (adguard.utils.dates.isSameHour(now, currentDate) && result.hours.length > 0) {
            result.hours[result.hours.length - 1] = updateStatsDataItem(type, blocked, result.hours[result.hours.length - 1]);
        } else {
            var diffHours = adguard.utils.dates.getDifferenceInHours(now, currentDate);
            while (diffHours > 1) {
                result.hours.push(createStatsDataItem(null, 0));
                diffHours--;
            }

            result.hours.push(createStatsDataItem(type, blocked));
            if (result.hours.length > MAX_HOURS_HISTORY) {
                result.hours = result.hours.slice(-MAX_HOURS_HISTORY);
            }
        }

        if (adguard.utils.dates.isSameDay(now, currentDate) && result.days.length > 0) {
            result.days[result.days.length - 1] = updateStatsDataItem(type, blocked, result.days[result.days.length - 1]);
        } else {
            var diffDays = adguard.utils.dates.getDifferenceInDays(now, currentDate);
            while (diffDays > 1) {
                result.days.push(createStatsDataItem(null, 0));
                diffDays--;
            }

            result.days.push(createStatsDataItem(type, blocked));
            if (result.days.length > MAX_DAYS_HISTORY) {
                result.days = result.days.slice(-MAX_DAYS_HISTORY);
            }
        }

        if (adguard.utils.dates.isSameMonth(now, currentDate) && result.months.length > 0) {
            result.months[result.months.length - 1] = updateStatsDataItem(type, blocked, result.months[result.months.length - 1]);
        } else {
            var diffMonths = adguard.utils.dates.getDifferenceInMonths(now, currentDate);
            while (diffMonths > 1) {
                result.months.push(createStatsDataItem(null, 0));
                diffMonths--;
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
    var updateStats = function (filterId, blocked, now) {
        var type = getBlockedTypeByFilterId(filterId);

        var stats = pageStatsHolder.stats;

        var updated;
        if (!stats.data) {
            updated = createStatsData(now, type, blocked);
        } else {
            updated = updateStatsData(now, type, blocked, stats.data);
        }

        pageStatsHolder.stats.data = updated;
        pageStatsHolder.save();
    };

    /**
     * Returns statistics data object
     */
    var getStatisticsData = function () {
        var stats = pageStatsHolder.stats;
        if (!stats || !stats.data) {
            return null;
        }

        return {
            today: stats.data.hours,
            lastWeek: stats.data.days.slice(-7),
            lastMonth: stats.data.days,
            lastYear: stats.data.months.slice(-12),
            overall: stats.data.months,
            blockedTypes: blockedTypes
        };
    };

    return {
        resetStats: resetStats,
        updateTotalBlocked: updateTotalBlocked,
        updateStats: updateStats,
        getTotalBlocked: getTotalBlocked,
        getStatisticsData: getStatisticsData
    };

})(adguard);