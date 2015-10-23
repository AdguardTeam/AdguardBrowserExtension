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

var ext = (function () {

    /**
     * Load a module from Adguard core
     * @param module
     */
    function loadAdguardModule(module) {

        if (!Components || !Components.utils) {
            return;
        }

        Components.utils.import("resource://gre/modules/Services.jsm");
        var result = Object.create(Object.prototype);
        result.wrappedJSObject = result;
        Services.obs.notifyObservers(result, "adguard-load-module", module);
        return result.exports;
    }

    window.i18n = loadAdguardModule('i18n');

    return {

        backgroundPage: {

            getWindow: function () {

                if (!ext.backgroundPage.windowModules) {

                    ext.backgroundPage.windowModules = {

                        antiBannerService: loadAdguardModule('antiBannerService'),
                        framesMap: loadAdguardModule('framesMap'),
                        filteringLog: loadAdguardModule('filteringLog'),
                        UI: loadAdguardModule('UI'),
                        Prefs: loadAdguardModule('Prefs'),
                        Utils: loadAdguardModule('Utils'),
                        AntiBannerFiltersId: loadAdguardModule('AntiBannerFiltersId'),
                        i18n: loadAdguardModule('i18n')
                    };
                }

                return ext.backgroundPage.windowModules;
            }
        },

        closePopup: function () {
            ext.backgroundPage.getWindow().UI.closePopup();
        },

        resizePopup: function (width, height) {
            ext.backgroundPage.getWindow().UI.resizePopup(width, height);
        },

        windows: {

            getLastFocused: function (callback) {
                var win = {
                    getActiveTab: function (callback) {
                        var tabs = loadAdguardModule('tabs');
                        if (!tabs) {
                            return;
                        }
                        callback(tabs.activeTab);
                    }
                };
                callback(win);
            }
        }
    }

})();