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
var setTimeout = require('sdk/timers').setTimeout;
var clearTimeout = require('sdk/timers').clearTimeout;
var ServiceClient = require('utils/service-client').ServiceClient;
var LS = require('utils/local-storage').LS;
var userSettings = require('utils/user-settings').userSettings;
var EventNotifier = require('utils/notifier').EventNotifier;
var EventNotifierTypes = require('utils/common').EventNotifierTypes;
var Log = require('utils/log').Log;

/**
 * This object is used to store and track ad filters usage stats.
 * It is used if user has enabled "Send statistics for ad filters usage" option.
 *
 * @constructor
 */
var FilterRulesHitCount = function () {
	this.hitsCountProperty = 'filters-hit-count';
	this.serviceClient = new ServiceClient();
	this._init();

	this.collectStatsEnabled = userSettings.collectHitsCount();
	EventNotifier.addListener(function (event, setting) {
		if (event == EventNotifierTypes.CHANGE_USER_SETTINGS && setting == userSettings.settings.DISABLE_COLLECT_HITS) {
			this.collectStatsEnabled = userSettings.collectHitsCount();
			//force rebuild css-filter
			this.antiBannerService.getRequestFilter().cssFilter.dirty = true;
		}
	}.bind(this));
};

FilterRulesHitCount.prototype = {

	MAX_PAGE_VIEWS_COUNT: 100,

	setAntiBannerService: function (antiBannerService) {
		this.antiBannerService = antiBannerService;
	},

	addPageView: function () {
		if (!this.collectStatsEnabled) {
			return;
		}
		this.stats.pageViews = (this.stats.pageViews || 0) + 1;
		this._saveHitsCountStats(this.stats);
	},

	addHitCount: function (rule) {
		if (!this.collectStatsEnabled) {
			return;
		}
		var stats = this.stats;
		if (!("rules" in stats)) {
			stats.rules = Object.create(null);
		}
		var rules = stats.rules;
		if (!(rule in rules)) {
			rules[rule] = {count: 0};
		}
		rules[rule].count++;
		this._saveHitsCountStats(stats);
	},

	_init: function () {
		this.stats = this._getHitCountStats();
	},

	_getHitCountStats: function () {
		var json = LS.getItem(this.hitsCountProperty);
		var stats = Object.create(null);
		try {
			if (json) {
				stats = JSON.parse(json);
			}
		} catch (ex) {
			Log.error("Error retrieve hit count statistic, cause {0}", ex);
		}
		return stats;
	},

	_saveHitsCountStats: function (stats) {
		if (this.timeoutId) {
			clearTimeout(this.timeoutId);
		}
		this.timeoutId = setTimeout(function () {
			try {
				LS.setItem(this.hitsCountProperty, JSON.stringify(stats));
			} catch (ex) {
				Log.error("Error save hit count statistic to storage, cause {0}", ex);
			}
			this._sendStats();
		}.bind(this), 2000);
	},

	_sendStats: function () {
		var pageViews = this.stats.pageViews || 0;
		if (pageViews < this.MAX_PAGE_VIEWS_COUNT) {
			return;
		}
		if (!userSettings.collectHitsCount()) {
			return;
		}
		var enabledFilters = [];
		if (this.antiBannerService) {
			enabledFilters = this.antiBannerService.getEnabledAntiBannerFilters();
		}
		this.serviceClient.sendHitStats(JSON.stringify(this.stats), enabledFilters);
		this.stats = Object.create(null);
		LS.removeItem(this.hitsCountProperty);
	}
};

var filterRulesHitCount = exports.filterRulesHitCount = new FilterRulesHitCount();