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

/* global Cc, Ci, unload */

(function (global) {

    'use strict';

    global.styleService = (function () {

        var styleService = Cc['@mozilla.org/content/style-sheet-service;1'].getService(Ci.nsIStyleSheetService);
        var ioService = Cc['@mozilla.org/network/io-service;1'].getService(Ci.nsIIOService);

        function makeURI(url) {
            return ioService.newURI(url, null, null);
        }

        var loadUserSheet = function loadUserSheet(url) {
            var uri = makeURI(url);
            styleService.loadAndRegisterSheet(uri, styleService.USER_SHEET);
            unload.when(unloadUserSheet.bind(null, url));
        };

        var unloadUserSheet = function unloadUserSheet(url) {
            var uri = makeURI(url);
            styleService.unregisterSheet(uri, styleService.USER_SHEET);
        };

        var loadUserSheetByUri = function loadUserSheetByUri(uri) {
            styleService.loadAndRegisterSheet(uri, styleService.USER_SHEET);
            unload.when(unloadUserSheetByUri.bind(null, uri));
        };

        var sheetRegistered = function (uri) {
            return styleService.sheetRegistered(uri, styleService.USER_SHEET);
        };

        var unloadUserSheetByUri = function unloadUserSheetByUri(uri) {
            styleService.unregisterSheet(uri, styleService.USER_SHEET);
        };

        return {
            loadUserSheet: loadUserSheet,
            unloadUserSheet: unloadUserSheet,
            loadUserSheetByUri: loadUserSheetByUri,
            sheetRegistered: sheetRegistered,
            unloadUserSheetByUri: unloadUserSheetByUri
        };

    })();

})(window);

