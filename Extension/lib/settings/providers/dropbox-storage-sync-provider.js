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

/* global Dropbox, Promise */

/**
 * Dropbox sync settings provider
 * Documentation: http://dropbox.github.io/dropbox-sdk-js/Dropbox.html
 */
(function (api, adguard) { // jshint ignore:line

    //TODO: Change to real
    var CLIENT_ID = 'bubtujvx7p81yjo';
    var TOKEN_STORAGE_PROP = 'dropbox-auth-token';

    var dropbox;
    var accessToken = null;

    /**
     * We have to keep list of files that exists in Dropbox folder due to Dropbox API bug (https://github.com/dropbox/dropbox-sdk-js/issues/84)
     */
    var listFilesInFolder = [];

    function isInvalidToken(error) {
        return error && (error.status === 400 || error.status === 401);
    }

    function getAccessToken() {
        if (accessToken === null) {
            accessToken = adguard.localStorage.getItem(TOKEN_STORAGE_PROP);
            dropbox = new Dropbox({accessToken: accessToken});
        }
        return accessToken;
    }

    function clearAccessToken() {
        accessToken = null;
        adguard.localStorage.removeItem(TOKEN_STORAGE_PROP);
    }

    /**
     * Invokes error callback: invokeErrorCallback(callback, message, ... args)
     * @param callback
     */
    function invokeCallbackWithError(callback) {
        adguard.console.error.apply(this, Array.prototype.slice.call(arguments, 1));
        callback(false);
    }

    /**
     * Marks files as exists
     * @param files Array of files
     */
    function markFilesExists(files) {
        for (var i = 0; i < files.length; i++) {
            var file = files[i];
            if (listFilesInFolder.indexOf(file.name) < 0) {
                listFilesInFolder.push(file.name);
            }
        }
    }

    /**
     * Fetch list files in Dropbox folder
     * http://dropbox.github.io/dropbox-sdk-js/Dropbox.html#filesListFolder__anchor
     */
    function listFiles() {
        return new Promise(function (resolve, reject) {
            dropbox.filesListFolder({path: ''})
                .then(function (response) {
                    resolve(response.entries);
                }).catch(reject);
        });
    }

    /**
     * We have to check that file exists before trying to download it, because filesDownload throws error when there is no file to download
     * https://github.com/dropbox/dropbox-sdk-js/issues/84
     *
     * @param name File name
     */
    function isFileExists(name) {

        return new Promise(function (resolve, reject) {

            if (listFilesInFolder.indexOf(name) >= 0) {
                resolve(true);
                return;
            }

            // Retrieves files from Dropbox
            listFiles().then(function (files) {
                listFilesInFolder = [];
                markFilesExists(files);
                resolve(listFilesInFolder.indexOf(name) >= 0);
            }).catch(reject);
        });
    }

    /**
     * Download existing file from Dropbox storage
     * http://dropbox.github.io/dropbox-sdk-js/Dropbox.html#filesDownload__anchor
     *
     * @param name File name
     * @param callback
     */
    function downloadFile(name, callback) {
        dropbox.filesDownload({path: '/' + name})
            .then(function (response) {
                var fileReader = new FileReader();
                fileReader.onload = function () {
                    var content = this.result;
                    try {
                        var file = JSON.parse(content);
                        callback(file);
                    } catch (ex) {
                        invokeCallbackWithError(callback, 'Error reading file {0} content {1}', name, content);
                    }
                };
                fileReader.onerror = function () {
                    invokeCallbackWithError(callback, 'Error reading file {0} content', name);
                };
                fileReader.readAsText(response.fileBlob);
            })
            .catch(function (error) {
                if (isInvalidToken(error)) {
                    clearAccessToken();
                }
                invokeCallbackWithError(callback, 'Error while downloading file {0} from Dropbox, {1}', name, JSON.stringify(error || {}));
            });
    }

    /**
     * Downloads file from Dropbox storage
     * @param name File name
     * @param callback
     */
    var load = function (name, callback) {

        if (!isAuthorized()) {
            callback(false);
            return;
        }

        isFileExists(name)
            .then(function (exists) {
                if (exists) {
                    downloadFile(name, callback);
                } else {
                    callback(null);
                }
            })
            .catch(function (error) {
                if (isInvalidToken(error)) {
                    clearAccessToken();
                }
                invokeCallbackWithError(callback, 'Error while downloading file {0} from Dropbox, {1}', name, JSON.stringify(error || {}));
            });
    };

    /**
     * Uploads file to Dropbox storage
     * @param name File name
     * @param data File data
     * @param callback
     */
    var save = function (name, data, callback) {

        if (!isAuthorized()) {
            callback(false);
            return;
        }

        var contents = JSON.stringify(data);
        dropbox.filesUpload({path: '/' + name, mode: "overwrite", contents: contents})
            .then(function () {
                // File was successfully uploaded
                markFilesExists([{name: name}]);
                callback(true);
            })
            .catch(function (error) {
                if (isInvalidToken(error)) {
                    clearAccessToken();
                }
                invokeCallbackWithError(callback, 'Error while uploading file {0} to Dropbox, {1}', name, JSON.stringify(error || {}));
            });
    };

    var isAuthorized = function () {
        if (!getAccessToken()) {
            adguard.console.warn("Unauthorized! Please set access token first.");
            return false;
        }
        return true;
    };

    /**
     * Sets access token and saves it to local storage
     * @param token Token
     */
    var setAccessToken = function (token) {
        if (token) {
            accessToken = token;
            adguard.localStorage.setItem(TOKEN_STORAGE_PROP, token);
            dropbox = new Dropbox({accessToken: getAccessToken()});
        }
    };

    /**
     * Returns dropbox auth url
     * @param callbackUrl Callback URL
     */
    var getAuthenticationUrl = function (callbackUrl) {
        var dbx = new Dropbox({clientId: CLIENT_ID});
        return dbx.getAuthenticationUrl(callbackUrl);
    };

    /**
     * Revokes Dropbox token
     *
     * http://dropbox.github.io/dropbox-sdk-js/Dropbox.html#authTokenRevoke__anchor
     */
    var logout = function (callback) {
        if (getAccessToken()) {
            dropbox.authTokenRevoke().then(callback).catch(callback);
            clearAccessToken();
        }
    };

    // EXPOSE
    api.dropboxSyncProvider = {
        // Storage api
        load: load,
        save: save,
        // Auth api
        getAuthenticationUrl: getAuthenticationUrl,
        setAccessToken: setAccessToken,
        isAuthorized: isAuthorized,
        logout: logout
    };

})(adguard.sync, adguard);