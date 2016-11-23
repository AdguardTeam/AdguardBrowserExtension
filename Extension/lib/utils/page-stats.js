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

/* global Log */

/**
 * Global stats
 */
adguard.pageStats = (function () {

    'use strict';

    var pageStatisticProperty = "page-statistic";

    /**
     * Getter for total page stats (gets it from local storage)
     *
     * @returns {*}
     * @private
     */
    function getPageStatistic() {
        var stats;
        try {
            var json = adguard.localStorage.getItem(pageStatisticProperty);
            if (json) {
                stats = JSON.parse(json);
            }
        } catch (ex) {
            Log.error('Error retrieve page statistic from storage, cause {0}', ex);
        }
        return stats;
    }

    /**
     * Total count of blocked requests
     *
     * @returns Count of blocked requests
     */
    var getTotalBlocked = function () {
        var stats = getPageStatistic();
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
        var stats = getPageStatistic() || Object.create(null);
        stats.totalBlocked = (stats.totalBlocked || 0) + blocked;
        adguard.localStorage.setItem(pageStatisticProperty, JSON.stringify(stats));
    };

    /**
     * Resets tab stats
     */
    var resetStats = function () {
        adguard.localStorage.setItem(pageStatisticProperty, JSON.stringify(Object.create(null)));
    };

    return {
        resetStats: resetStats,
        updateTotalBlocked: updateTotalBlocked,
        getTotalBlocked: getTotalBlocked
    };

})();