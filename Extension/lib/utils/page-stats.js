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

        save: adguard.utils.concurrent.throttle(function() {
            adguard.localStorage.setItem(pageStatisticProperty, JSON.stringify(this.stats));
        }, adguard.prefs.statsSaveInterval),

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

    return {
        resetStats: resetStats,
        updateTotalBlocked: updateTotalBlocked,
        getTotalBlocked: getTotalBlocked
    };

})(adguard);