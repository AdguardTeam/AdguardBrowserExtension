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
 * Extension global preferences.
 */
adguard.prefs = (function (adguard) {
    var Prefs = {

        get mobile() {
            return adguard.lazyGet(Prefs, 'mobile', () => navigator.userAgent.indexOf('Android') >= 0);
        },

        get platform() {
            return adguard.lazyGet(Prefs, 'platform', () => (window.browser ? 'firefox' : 'chromium'));
        },

        get browser() {
            return adguard.lazyGet(Prefs, 'browser', () => {
                let browser;
                let { userAgent } = navigator;
                userAgent = userAgent.toLowerCase();
                if (userAgent.indexOf('yabrowser') >= 0) {
                    browser = 'YaBrowser';
                } else if (userAgent.indexOf('edge') >= 0) {
                    browser = 'Edge';
                } else if (userAgent.indexOf('edg') >= 0) {
                    browser = 'EdgeChromium';
                } else if (userAgent.indexOf('opera') >= 0
                    || userAgent.indexOf('opr') >= 0) {
                    browser = 'Opera';
                } else if (userAgent.indexOf('firefox') >= 0) {
                    browser = 'Firefox';
                } else {
                    browser = 'Chrome';
                }
                return browser;
            });
        },

        get chromeVersion() {
            return adguard.lazyGet(Prefs, 'chromeVersion', () => {
                const match = /\sChrome\/(\d+)\./.exec(navigator.userAgent);
                return match === null ? null : parseInt(match[1]);
            });
        },

        get firefoxVersion() {
            return adguard.lazyGet(Prefs, 'firefoxVersion', () => {
                const match = /\sFirefox\/(\d+)\./.exec(navigator.userAgent);
                return match === null ? null : Number.parseInt(match[1], 10);
            });
        },

        /**
         * https://msdn.microsoft.com/ru-ru/library/hh869301(v=vs.85).aspx
         * @returns {*}
         */
        get edgeVersion() {
            return adguard.lazyGet(Prefs, 'edgeVersion', function () {
                if (this.browser === 'Edge') {
                    const { userAgent } = navigator;
                    const i = userAgent.indexOf('Edge/');
                    if (i < 0) {
                        return {
                            rev: 0,
                            build: 0,
                        };
                    }
                    const version = userAgent.substring(i + 'Edge/'.length);
                    const parts = version.split('.');
                    return {
                        rev: parseInt(parts[0]),
                        build: parseInt(parts[1]),
                    };
                }
            });
        },

        /**
         * Makes sense in case of FF add-on only
         */
        speedupStartup() {
            return false;
        },

        get ICONS() {
            return adguard.lazyGet(Prefs, 'ICONS', () => ({
                ICON_GREEN: {
                    '19': adguard.getURL('icons/green-19.png'),
                    '38': adguard.getURL('icons/green-38.png'),
                },
                ICON_GRAY: {
                    '19': adguard.getURL('icons/gray-19.png'),
                    '38': adguard.getURL('icons/gray-38.png'),
                },
            }));
        },

        // interval 60 seconds in Firefox is set so big due to excessive IO operations on every storage save
        // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/1006
        get statsSaveInterval() {
            return this.browser === 'Firefox' ? 1000 * 60 : 1000;
        },
    };

    /**
     * Collect browser specific features here
     */
    Prefs.features = (function () {
        // Get the global extension object (browser for FF, chrome for Chromium)
        const browser = window.browser || window.chrome;

        const responseContentFilteringSupported = (typeof browser !== 'undefined'
            && typeof browser.webRequest !== 'undefined'
            && typeof browser.webRequest.filterResponseData !== 'undefined');

        const canUseInsertCSSAndExecuteScript = (
            // Blink engine based browsers
            (Prefs.browser === 'Chrome' || Prefs.browser === 'Opera' || Prefs.browser === 'YaBrowser' || Prefs.browser === 'EdgeChromium')
            // Support for tabs.insertCSS and tabs.executeScript on chrome
            // requires chrome version above or equal to 39, as per documentation: https://developers.chrome.com/extensions/tabs
            // But due to a bug, it requires version >= 50
            // https://bugs.chromium.org/p/chromium/issues/detail?id=63979
            && Prefs.chromeVersion >= 50
        ) || (
            Prefs.browser === 'Firefox' && (
                typeof browser !== 'undefined'
                && typeof browser.tabs !== 'undefined'
                && typeof browser.tabs.insertCSS !== 'undefined'
            )
        );
        // Edge browser does not support `runAt` in options of tabs.insertCSS
        // and tabs.executeScript

        return {
            responseContentFilteringSupported,
            canUseInsertCSSAndExecuteScript,
            hasBackgroundTab: typeof browser !== 'undefined', // Background requests have sense only in case of webext
        };
    })();

    return Prefs;
})(adguard);
