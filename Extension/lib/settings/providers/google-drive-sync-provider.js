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

/* global chrome */

/**
 * Google Drive sync provider
 */
(function (api, adguard) {

    'use strict';

    //TODO: handle authorization errors (token expiration)

    var noOpFunc = function () {
    };

    var accessToken;
    var fileNameToIdMap = {};

    function makeRequest(method, url, callback, data, headers) {

        data = data || null;
        headers = headers || {};

        var xhr = new XMLHttpRequest();
        xhr.open(method, url, true);

        // Include common headers (auth and version) and add rest.
        xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
        if (headers) {
            for (var key in headers) {
                if (headers.hasOwnProperty(key)) {
                    xhr.setRequestHeader(key, headers[key]);
                }
            }
        }

        xhr.onload = function (e) {
            callback(xhr);
        };

        xhr.onerror = function (e) {
            console.log(this, this.status, this.response, this.getAllResponseHeaders());
        };
        xhr.send(data ? data : null);
    }

    // https://developers.google.com/drive/v3/web/about-auth
    function auth(interactive, callback) {
        try {
            chrome.identity.getAuthToken({interactive: interactive}, function (token) {
                if (token) {
                    accessToken = token;
                }
                callback();
            });
        } catch (e) {
            console.log(e);
        }
    }

    function removeCachedAuthToken(callback) {
        if (accessToken) {
            var token = accessToken;
            accessToken = null;
            // Remove token from the token cache.
            chrome.identity.removeCachedAuthToken({
                token: token
            }, callback);
        } else {
            callback();
        }
    }

    function revokeAuthToken(callback) {
        if (accessToken) {
            // Make a request to revoke token
            var xhr = new XMLHttpRequest();
            xhr.open('GET', 'https://accounts.google.com/o/oauth2/revoke?token=' + accessToken);
            xhr.send();
            removeCachedAuthToken(callback);
        }
    }

    /**
     * Uploads file to Google Drive Storage. We create file in app data folder
     *
     * https://developers.google.com/drive/v3/reference/files/create
     * https://developers.google.com/drive/v3/reference/files/update
     *
     * @param fileId File identifier (maybe empty)
     * @param name File name
     * @param data File data
     * @param callback Called on finish
     */
    function uploadFileToAppFolder(fileId, name, data, callback) {

        var boundary = '-------314159265358979323846';
        var delimiter = "\r\n--" + boundary + "\r\n";
        var endDelimiter = "\r\n--" + boundary + "--";

        var url = 'https://www.googleapis.com/upload/drive/v3/files';
        var method = 'POST';
        if (fileId) {
            // Updates file
            url += '/' + fileId;
            method = 'PATCH';
        }
        url += '?uploadType=multipart';

        var metadata = {};
        if (!fileId) {
            // Setup metadata
            metadata = {
                name: name,
                parents: ['appDataFolder']
            };
        }

        var headers = {
            'Content-Type': 'multipart/related; boundary=' + boundary
        };

        var requestBody = delimiter +
            'Content-Type: application/json\r\n\r\n' +
            JSON.stringify(metadata) +
            delimiter +
            'Content-Type: application/json\r\n' +
            '\r\n' +
            JSON.stringify(data) +
            endDelimiter;

        makeRequest(method, url, function (request) {
            var response = parseJson(request.responseText);
            if (!response || response.error) {
                adguard.console.error('Error execute request {0}, response {1}', url, request.responseText);
                callback(false);
                return;
            }
            callback(response);
        }, requestBody, headers);
    }

    function parseJson(responseText) {
        try {
            return JSON.parse(responseText);
        } catch (ex) {
            return null;
        }
    }

    function getOrLoadFileIdByName(name, callback) {

        var fileId = fileNameToIdMap[name];
        if (fileId) {
            callback(fileId);
            return;
        }

        // Search files
        searchFileIdByNameInAppFolder(name, function (fileId) {
            if (fileId === false) {
                // Error
                callback(false);
                return;
            }
            if (fileId) {
                callback(fileId);
            } else {
                callback(null);
            }
        });
    }

    /**
     * Loads file content by identifier
     *
     * https://developers.google.com/drive/v3/reference/files/get
     *
     * @param fileId File identifier
     * @param callback
     */
    function loadFileContentById(fileId, callback) {

        var url = 'https://www.googleapis.com/drive/v3/files/' + fileId + '?alt=media';
        makeRequest('GET', url, function (request) {
            var response = parseJson(request.responseText);
            if (!response || response.error) {
                adguard.console.error('Error execute request {0}, response {1}', url, request.responseText);
                callback(false);
                return;
            }
            callback(response);
        });
    }

    /**
     * Searches file identifier by name.
     * So, what we do: we fetch all files in app data folder to map file names to its identifiers, then try to find a file with the given name.
     *
     * https://developers.google.com/drive/v3/reference/files/list
     *
     * @param name File name
     * @param callback Callback
     */
    function searchFileIdByNameInAppFolder(name, callback) {

        var query = 'spaces=appDataFolder';
        var url = 'https://www.googleapis.com/drive/v3/files?' + query;

        makeRequest('GET', url, function (request) {
            var response = parseJson(request.responseText);
            if (!response || response.error || !response.files) {
                adguard.console.error('Error execute request {0}, response {1}', url, request.responseText);
                callback(false);
                return;
            }
            var fileId = null;
            var files = response.files;
            for (var i = 0; i < files.length; i++) {
                var file = files[i];
                fileNameToIdMap[file.name] = file.id;
                if (file.name === name) {
                    fileId = file.id;
                }
            }
            callback(fileId);
        });
    }

    /**
     * Loads file content by name
     * @param name File name
     * @param callback
     */
    var load = function (name, callback) {

        getOrLoadFileIdByName(name, function (fileId) {
            if (fileId === false) {
                callback(false);
                return;
            }
            if (fileId) {
                loadFileContentById(fileId, callback);
            } else {
                callback(null);
            }
        });
    };

    /**
     * Saves file
     * @param name File name
     * @param data File data
     * @param callback
     */
    var save = function (name, data, callback) {

        getOrLoadFileIdByName(name, function (fileId) {
            if (fileId === false) {
                callback(false);
                return;
            }
            uploadFileToAppFolder(fileId, name, data, function (file) {
                if (file === false) {
                    callback(false);
                    return;
                }
                fileNameToIdMap[name] = file.id;
                callback(file);
            });
        });
    };

    var isAuthorized = function () {
        return !!accessToken;
    };

    var authorize = function (callback) {
        callback = callback || noOpFunc;
        if (isAuthorized()) {
            callback();
            return;
        }
        auth(true, callback);
    };

    var logout = function (callback) {
        removeCachedAuthToken(callback || noOpFunc);
    };

    api.googleDriveSyncProvider = {
        load: load,
        save: save,
        isAuthorized: isAuthorized,
        authorize: authorize,
        logout: logout
    };

})(adguard.sync, adguard);