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
 * Initializing required libraries for this file.
 * require method is overridden in Chrome extension (port/require.js).
 */
var LS = require('../../lib/utils/local-storage').LS;
var Log = require('../../lib/utils/log').Log;

/**
 * Global stats
 */
var PageStatistic = exports.PageStatistic = function () {

	var pageStatisticProperty = "page-statistic";

	/**
	 * Total count of blocked requests
	 *
	 * @returns Count of blocked requests
	 */
	this.getTotalBlocked = function () {
		return this._getPageStatistic().totalBlocked || 0;
	};

	/**
	 * Updates total count of blocked requests
	 *
	 * @param blocked Count of blocked requests
	 */
	this.updateTotalBlocked = function (blocked) {
		var stats = this._getPageStatistic();
		stats.totalBlocked = (stats.totalBlocked || 0) + blocked;
		LS.setItem(pageStatisticProperty, JSON.stringify(stats));
	};

	/**
	 * Resets tab stats
	 */
	this.resetStats = function () {
		LS.setItem(pageStatisticProperty, JSON.stringify(Object.create(null)));
	};

	/**
	 * Getter for total page stats (gets it from local storage)
	 *
	 * @returns {*}
	 * @private
	 */
	this._getPageStatistic = function () {
		var json = LS.getItem(pageStatisticProperty);
		var stats = Object.create(null);
		try {
			if (json) {
				stats = JSON.parse(json);
			}
		} catch (ex) {
			Log.error('Error retrieve page statistic from storage, cause {0}', ex);
		}
		return stats;
	}
};