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
 * Sync settings
 *
 * @type {{update, load}}
 */
var Sync = (function () { // jshint ignore:line

    var readFile = function (url, callback) {
        var rawFile = new XMLHttpRequest();
        rawFile.overrideMimeType("application/json");
        rawFile.open("GET", url, true);
        rawFile.onreadystatechange = function() {
            if (rawFile.readyState === 4 && rawFile.status == "200") {
                callback(JSON.parse(rawFile.responseText));
            }
        };

        rawFile.send(null);
    };

    var saveFile = function (url, settings) {
        //TODO: Implement
    };

    var processUpdate = function (current, updated) {
        //TODO: Implement
    };

    var update = function (settings, url) {
        var current = readFile(url);
        var result = processUpdate(current, settings);
        saveFile(url, result);
    };

    var load  = function (url, callback) {
        readFile(url, callback);
    };

    // EXPOSE
    return {
        update: update,
        load: load
    };
})();