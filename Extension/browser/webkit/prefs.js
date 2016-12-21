/* global safari */
/* global ext */
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

/* global exports */
/**
 * Extension global preferences.
 * (!) Firefox has it's own implementation
 */
var Prefs = exports.Prefs = {

	version: ext.app.getVersion(),
	locale: ext.app.getLocale(),
	getLocalFilterPath: function (filterId) {
		var url = "filters/filter_" + filterId + ".txt";
		return ext.getURL(url);
	},
	getLocalMobileFilterPath: function (filterId) {
		var url = "filters/filter_mobile_" + filterId + ".txt";
		return ext.getURL(url);
	},
	localFiltersMetadataPath: ext.getURL('filters/filters.json'),
	localFiltersMetadataI18nPath: ext.getURL('filters/filters_i18n.json'),
	safebrowsingPagePath: ext.getURL("pages/sb.html"),
	platform: (typeof safari == 'undefined' ? "chromium" : "webkit"),
	getBrowser: function () {
		if (!Prefs.browser) {
			var browser;
			var userAgent = navigator.userAgent;
			if (userAgent.toLowerCase().indexOf("yabrowser") >= 0) {
				browser = "YaBrowser";
			} else if (userAgent.toLowerCase().indexOf("edge") >= 0) {
				browser = "Edge";
			} else if (userAgent.toLowerCase().indexOf("opera") >= 0 || userAgent.toLowerCase().indexOf("opr") >= 0) {
				browser = "Opera";
			} else if (userAgent.indexOf("Safari") >= 0 && userAgent.indexOf('Chrome') < 0) {
				browser = "Safari";
			} else {
				browser = "Chrome";
			}
			Prefs.browser = browser;

			if (browser == "Safari") {
				var parseSafariVersion = function() {
					var i = userAgent.indexOf("Version/");
					if (i < 0) {
                        return null;
                    }

					return parseInt(userAgent.substring(i + 8));
				};

				Prefs.safariVersion = parseSafariVersion();
			} else if (browser == "Chrome") {
				var parseChromeVersion = function() {
					var i = userAgent.indexOf("Chrome/");
					if (i < 0) {
						return null;
					}

					return parseInt(userAgent.substring(i + 7));
				};

				Prefs.chromeVersion = parseChromeVersion();
			}
		}
		return Prefs.browser;
	},
	hitPrefix: (function() {
		var appId = ext.app.getId();
		var scheme = ext.app.getUrlScheme();
		return scheme + '://' + appId;
	})(),
    /**
     * Makes sense in case of FF add-on only
     */
	speedupStartup: function () {
		return false;
	},

	/**
	 * If user enables `Send ad filters usage stats` option (which is disabled by default) in Adguard settings, it starts collecting & sending stats on used ad filtering rules.
	 * We use these stats to get rid of redundant filtering rules and provide "optimized" filters. Details: https://adguard.com/en/filter-rules-statistics.html
	 */
	collectHitsCountEnabled: (typeof safari == 'undefined')
};