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
 * Sync settings service
 *
 * @type {{syncSettings, setSyncProvider}}
 */
var SettingsProvider = (function () { // jshint ignore:line

    var PROTOCOL_VERSION = "1.0";
    var APP_ID = "adguard-browser-extension";

    var loadSettings = function () {
        //TODO: Load current set of settings

        var manifest = {
            "timestamp": new Date().getTime(),
            "protocol-version": PROTOCOL_VERSION,
            "min-compatible-version": PROTOCOL_VERSION,
            "app-id": APP_ID,
            "sections": [
                {
                    "name": "filters.json",
                    "timestamp": new Date().getTime()
                }
            ]
        };

        return manifest;
    };

    var loadSettingsSection = function (section) {
        //TODO: Implement
    };

    var saveSettings = function (manifest) {
        //TODO: Implement
    };

    // EXPOSE
    return {
        loadSettings: loadSettings,
        loadSettingsSection: loadSettingsSection,
        saveSettings: saveSettings
    };
})();