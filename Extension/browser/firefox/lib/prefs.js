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
    appId: adguard.app.getId(),
    version: adguard.app.getVersion(),
    locale: adguard.app.getLocale(),
    getLocalFilterPath: function (filterId) {
        var url = "filters/filter_" + filterId + ".txt";
        return adguard.getURL(url);
    },
    getLocalMobileFilterPath: function (filterId) {
        var url = "filters/filter_mobile_" + filterId + ".txt";
        return adguard.getURL(url);
    },
    localFiltersMetadataPath: adguard.getURL('filters/filters.json'),
    localFiltersMetadataI18nPath: adguard.getURL('filters/filters_i18n.json'),
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
    useGlobalStyleSheet: SimplePrefs.get('use_global_style_sheet'),

    ICONS: {
        ICON_BLUE: {
            '16': adguard.getURL('skin/firefox-blue-16.png'),
            '32': adguard.getURL('skin/firefox-blue-32.png')
        },
        ICON_GREEN: {
            '16': adguard.getURL('skin/firefox-16.png'),
            '32': adguard.getURL('skin/firefox-32.png')
        },
        ICON_GRAY: {
            '16': adguard.getURL('skin/firefox-gray-16.png'),
            '32': adguard.getURL('skin/firefox-gray-32.png')
        }
    }
};

var onPreferenceChanged = function (prefName) {
    Prefs.useGlobalStyleSheet = SimplePrefs.get('use_global_style_sheet');
    EventNotifier.notifyListeners(EventNotifierTypes.CHANGE_PREFS, prefName);
};
SimplePrefs.addListener('use_global_style_sheet', onPreferenceChanged);
unload.when(function () {
    SimplePrefs.removeListener('use_global_style_sheet', onPreferenceChanged);
});