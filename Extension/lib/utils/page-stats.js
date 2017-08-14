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
        OTHERS: 0,
        ADS: 1,
        TRACKERS: 2,
        SOCIAL: 3,

        /**
         * Returns blocked type by filter id
         *
         * @param filterId
         * @returns {number}
         */
        getBlockedTypeByFilterId: function (filterId) {
            return blockedTypesFilters[filterId] ? blockedTypesFilters[filterId] : blockedTypes.OTHERS;
        }
    };

    /**
     * Blocked types to filters relation dictionary
     * TODO: Fill it with correct filter ids
     */
    var blockedTypesFilters = {};
    blockedTypesFilters[adguard.utils.filters.RUSSIAN_FILTER_ID] = blockedTypes.ADS;
    blockedTypesFilters[adguard.utils.filters.ENGLISH_FILTER_ID] = blockedTypes.ADS;
    blockedTypesFilters[adguard.utils.filters.SOCIAL_FILTER_ID] = blockedTypes.SOCIAL;
    blockedTypesFilters[adguard.utils.filters.TRACKING_FILTER_ID] = blockedTypes.TRACKERS;

    var createStatsData = function (now, type, blocked) {
        var result = Object.create(null);

        result.hours = [createStatsDataItem(type, blocked)];
        result.days = [createStatsDataItem(type, blocked)];
        result.months = [createStatsDataItem(type, blocked)];
        result.updated = now.getTime();

        return result;
    };

    var createStatsDataItem = function (type, blocked) {
        var result = new Object(null);
        result[type] = blocked;
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
            result.hours.push(createStatsDataItem(type, blocked));
            if (result.hours.length > MAX_HOURS_HISTORY) {
                result.hours.shift();
            }
        }

        if (adguard.utils.dates.isSameDay(now, currentDate) && result.days.length > 0) {
            result.days[result.days.length - 1] = updateStatsDataItem(type, blocked, result.days[result.days.length - 1]);
        } else {
            result.days.push(createStatsDataItem(type, blocked));
            if (result.days.length > MAX_DAYS_HISTORY) {
                result.days.shift();
            }
        }

        if (adguard.utils.dates.isSameMonth(now, currentDate) && result.months.length > 0) {
            result.months[result.months.length - 1] = updateStatsDataItem(type, blocked, result.months[result.months.length - 1]);
        } else {
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
     */
    var updateStats = function (filterId, blocked) {
        var now = new Date();
        var type = blockedTypes.getBlockedTypeByFilterId(filterId);

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
        if (!stats) {
            return null;
        }

        return {
            today: stats.data.hours,
            lastWeek: stats.data.days.slice(-7),
            lastMonth: stats.data.days,
            lastYear: stats.data.months.slice(-12),
            overall: stats.data.months
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