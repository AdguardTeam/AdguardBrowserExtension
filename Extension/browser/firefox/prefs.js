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
 * Global preferences for Firefox extension
 */
adguard.prefs = (function (adguard) {

    //noinspection UnnecessaryLocalVariableJS
    var Prefs = {

        platform: "firefox",

        get mobile() {
            return adguard.lazyGet(this, 'mobile', function () {
                return adguard.runtime.getPlatform().indexOf('android') > -1;
            });
        },

        get browser() {
            return adguard.lazyGet(this, 'browser', function () {
                var browser;
                if (this.mobile) {
                    browser = "Android";
                } else {
                    browser = "Firefox";
                }
                return browser;
            });
        },

        speedupStartup: function () {
            return adguard.SimplePrefs.get('speedup_startup');
        },

        get useGlobalStyleSheet() {
            return adguard.SimplePrefs.get('use_global_style_sheet');
        },

        get ICONS() {
            return adguard.lazyGet(this, 'ICONS', function () {
                return {
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
                };
            });
        }
    };

    return Prefs;

})(adguard);
