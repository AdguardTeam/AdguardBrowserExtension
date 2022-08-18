/**
 * This file is part of Adguard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * Adguard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Adguard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Adguard Browser Extension. If not, see <http://www.gnu.org/licenses/>.
 */

import { browser } from './extension-api/browser';
import { lazyGet } from './utils/lazy';
import {
    isAndroid,
    isFirefox,
    isOpera,
    isYaBrowser,
    isEdge,
    isEdgeChromium,
    chromeVersion,
    firefoxVersion,
} from '../common/user-agent-utils';
/**
 * Extension global preferences.
 */
export const prefs = (() => {
    const Prefs = {

        get mobile() {
            return lazyGet(Prefs, 'mobile', () => isAndroid);
        },

        get platform() {
            return lazyGet(Prefs, 'platform', () => (window.browser ? 'firefox' : 'chromium'));
        },

        get browser() {
            return lazyGet(Prefs, 'browser', () => {
                let browser;
                if (isYaBrowser) {
                    browser = 'YaBrowser';
                } else if (isEdge) {
                    browser = 'Edge';
                } else if (isEdgeChromium) {
                    browser = 'EdgeChromium';
                } else if (isOpera) {
                    browser = 'Opera';
                } else if (isFirefox) {
                    browser = 'Firefox';
                } else {
                    browser = 'Chrome';
                }
                return browser;
            });
        },

        get chromeVersion() {
            return lazyGet(Prefs, 'chromeVersion', () => chromeVersion);
        },

        get firefoxVersion() {
            return lazyGet(Prefs, 'firefoxVersion', () => firefoxVersion);
        },

        /**
         * https://msdn.microsoft.com/ru-ru/library/hh869301(v=vs.85).aspx
         * @returns {*}
         */
        get edgeVersion() {
            return lazyGet(Prefs, 'edgeVersion', function () {
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
                        rev: Number.parseInt(parts[0], 10),
                        build: Number.parseInt(parts[1], 10),
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
            return lazyGet(Prefs, 'ICONS', () => ({
                ICON_GREEN: {
                    '19': browser.runtime.getURL('assets/icons/green-19.png'),
                    '38': browser.runtime.getURL('assets/icons/green-38.png'),
                },
                ICON_GRAY: {
                    '19': browser.runtime.getURL('assets/icons/gray-19.png'),
                    '38': browser.runtime.getURL('assets/icons/gray-38.png'),
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

        const canUseInsertCSSAndExecuteScript = typeof browser.tabs?.insertCSS !== 'undefined'
            && typeof browser.tabs?.executeScript !== 'undefined';

        return {
            responseContentFilteringSupported,
            canUseInsertCSSAndExecuteScript,
            hasBackgroundTab: typeof browser !== 'undefined', // Background requests have sense only in case of webext
        };
    })();

    return Prefs;
})();
