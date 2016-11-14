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

/* global Cc, Ci */

/**
 * Global preferences for Firefox extension
 */
var Prefs = {
	appId: adguard.extension.getId(),
	version: adguard.extension.getVersion(),
	locale: Cc["@mozilla.org/chrome/chrome-registry;1"].getService(Ci.nsIXULChromeRegistry).getSelectedLocale('global'),
	getLocalFilterPath: function (filterId) {
		var url = "content/filters/filter_" + filterId + ".txt";
		return adguard.extension.url(url);
	},
	getLocalMobileFilterPath: function (filterId) {
		var url = "content/filters/filter_mobile_" + filterId + ".txt";
		return adguard.extension.url(url);
	},
	localFiltersMetadataPath: adguard.extension.url('content/filters/filters.json'),
	localFiltersMetadataI18nPath: adguard.extension.url('content/filters/filters_i18n.json'),
	safebrowsingPagePath: 'sb.html',
	platform: "firefox",
	mobile: adguard.runtime.getPlatform().indexOf('android') > -1,
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
		return SimplePrefs.get('speedup_startup');
	},
	collapseByContentScript: SimplePrefs.get('collapse_by_content_script'),
	useGlobalStyleSheet: SimplePrefs.get('use_global_style_sheet')
};

var onPreferenceChanged = function (prefName) {
	Prefs.collapseByContentScript = SimplePrefs.get('collapse_by_content_script');
	Prefs.useGlobalStyleSheet = SimplePrefs.get('use_global_style_sheet');
	EventNotifier.notifyListeners(EventNotifierTypes.CHANGE_PREFS, prefName);
};
SimplePrefs.addListener('collapse_by_content_script', onPreferenceChanged);
SimplePrefs.addListener('use_global_style_sheet', onPreferenceChanged);
unload.when(function () {
	SimplePrefs.removeListener('collapse_by_content_script', onPreferenceChanged);
	SimplePrefs.removeListener('use_global_style_sheet', onPreferenceChanged);
});