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

/* global Log */

/**
 * Sync settings provider
 *
 * @type {{load, save, isAuthenticated}}
 */
var DropboxSyncProvider = (function () { // jshint ignore:line

    //TODO: Change to real
    var CLIENT_ID = 'nu18d3bocnpkvg5';

    var accessToken;
    var dbx;

    // API
    var load = function (filePath, callback) {
        //TODO: Check auth

        dbx.filesDownload({path: '/' + filePath})
            .then(function (response) {
                var fileReader = new FileReader();
                fileReader.onload = function () {
                    callback(JSON.parse(this.result));
                };
                fileReader.onerror = function () {
                    Log.error('Error reading file');
                    callback(false);
                };

                fileReader.readAsText(response.fileBlob);
            })
            .catch(function (error) {
                Log.error(error);
                callback(false);

                //TODO: Handle auth error
            });
    };

    var save = function (filePath, data, callback) {
        //TODO: Check auth

        dbx.filesUpload({path: '/' + filePath, mode: "overwrite", contents: JSON.stringify(data)})
            .then(function () {
                callback(true);
            })
            .catch(function (error) {
                Log.error(error);
                callback(false);

                //TODO: Handle auth error
            });
    };

    var getAuthenticationUrl = function (callbackUrl) {
        var dbx = new Dropbox({clientId: CLIENT_ID});
        return dbx.getAuthenticationUrl(callbackUrl);
    };

    var setAccessToken = function (token) {
        accessToken = token;
        dbx = new Dropbox({accessToken: accessToken});
    };

    // EXPOSE
    return {
        /**
         * Loads data from provider
         */
        load: load,
        /**
         * Saves data to provider
         */
        save: save,
        /**
         * Returns dropbox auth url
         */
        getAuthenticationUrl: getAuthenticationUrl,
        /**
         * Sets access token
         */
        setAccessToken: setAccessToken
    };
})();