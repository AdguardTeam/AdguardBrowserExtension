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
var self = require('sdk/self');
var platform = require('sdk/system').platform;
var simplePrefs = require('sdk/simple-prefs');
var unload = require('sdk/system/unload');
const {Cc, Ci} = require('chrome');

var locale = (function () {
	return Cc["@mozilla.org/chrome/chrome-registry;1"].getService(Ci.nsIXULChromeRegistry).getSelectedLocale('global');
})();

/**
 * Global preferences for Firefox extension
 */
var Prefs = exports.Prefs = {
	appId: self.id,
	version: self.version,
	locale: locale,
	getLocalFilterPath: function (filterId) {
		var url = "filters/filter_" + filterId + ".txt";
		return self.data.url(url);
	},
	getLocalMobileFilterPath: function (filterId) {
		var url = "filters/filter_mobile_" + filterId + ".txt";
		return self.data.url(url);
	},
	localGroupsMetadataPath: self.data.url('filters/groups.xml'),
	localFiltersMetadataPath: self.data.url('filters/filters.xml'),
	safebrowsingPagePath: 'sb.html',
	platform: "firefox",
	mobile: platform.indexOf('android') > -1,
	getBrowser: function () {
		if (!Prefs.browser) {
			var browser;
			if (Prefs.mobile) {
				browser = "Android";
			} else {
				browser = "Firefox";
			}
			Prefs.browser = browser;
		}
		return Prefs.browser;
	},
	speedupStartup: function () {
		return simplePrefs.prefs['speedup_startup'];
	},
    collapseByContentScript: simplePrefs.prefs['collapse_by_content_script']
};

var onPreferenceChanged = function() {
    Prefs.collapseByContentScript = simplePrefs.prefs['collapse_by_content_script'];
};
simplePrefs.on('collapse_by_content_script', onPreferenceChanged);
unload.when(function() {
    simplePrefs.removeListener('collapse_by_content_script', onPreferenceChanged);
});