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

    'use strict';

    //TODO[SYNC]: Change to real
    var DROPBOX_CLIENT_ID = 'bubtujvx7p81yjo';
    var DROPBOX_PROVIDER_NAME = 'DROPBOX';

    var dropbox;

    /**
     * Dropbox client
     */
    var DropboxClient = (function () {

        function makeRequest(url, params, token) {

            return new Promise(function (resolve, reject) {

                var xhr = new XMLHttpRequest();
                xhr.open('POST', url, true);
                if (token) {
                    xhr.setRequestHeader('Authorization', 'Bearer ' + token);
                }
                xhr.setRequestHeader('Content-Type', 'application/json');

                xhr.onload = function () {
                    var status = xhr.status;
                    if (status === 200) {
                        resolve(JSON.parse(xhr.responseText));
                    } else {
                        reject({status: status, error: new Error(xhr.statusText)});
                    }
                };

                xhr.onerror = function () {
                    reject({status: xhr.status, error: new Error(xhr.statusText)});
                };

                xhr.send(JSON.stringify(params));
            });
        }

        /**
         * https://www.dropbox.com/developers/documentation/http/documentation#files-list_folder
         * @returns {*}
         */
        var listFolder = function () {
            return makeRequest('https://api.dropboxapi.com/2/files/list_folder', {
                path: '',
                include_deleted: true
            }, api.oauthService.getToken(DROPBOX_PROVIDER_NAME));
        };

        /**
         * https://www.dropbox.com/developers/documentation/http/documentation#files-list_folder-longpoll
         */
        var listFolderLongPoll = function (cursor) {
            return makeRequest('https://notify.dropboxapi.com/2/files/list_folder/longpoll', {
                cursor: cursor
            });
        };

        return {
            listFolder: listFolder,
            listFolderLongPoll: listFolderLongPoll
        };

    })();

    /**
     * Keeps local folder structure
     */
    var dropboxFolderState = {
        cursor: null,
        forceSync: true,
        files: {},
        longPollTimeoutId: 0,
        longPollingEnabled: false
    };

    function readBlobFromResponse(response) {
        return new Promise(function (resolve, reject) {
            var fileReader = new FileReader();
            fileReader.onload = function () {
                try {
                    resolve(this.result);
                } catch (ex) {
                    reject(ex);
                }
            };
            fileReader.onerror = function (event) {
                reject(event.target.error);
            };
            fileReader.readAsText(response.fileBlob);
        });
    }

    function isInvalidToken(error) {
        return error && (error.status === 400 || error.status === 401);
    }

    function clearAccessToken() {
        dropboxFolderState.forceSync = true;
        adguard.listeners.notifyListeners(adguard.listeners.SYNC_BAD_OR_EXPIRED_TOKEN, DROPBOX_PROVIDER_NAME);
    }

    /**
     * https://blogs.dropbox.com/developers/2013/12/efficiently-enumerating-dropbox-with-delta/
     * @returns {Promise.<T>}
     */
    function syncListFiles() {

        if (!dropboxFolderState.forceSync) {
            return Promise.resolve();
        }
        dropboxFolderState.forceSync = false;

        return DropboxClient.listFolder()
            .then(function (result) {
                // Updates cursor
                dropboxFolderState.cursor = result.cursor;
                var updated = false;
                var entries = result.entries;
                for (var i = 0; i < entries.length; i++) {
                    var metadata = entries[i];
                    var tag = metadata['.tag'];
                    if (tag === 'folder') {
                        // Skip directories
                        continue;
                    }
                    var name = metadata.name;
                    var prevMetadata = dropboxFolderState.files[name];
                    if (tag === 'deleted') {
                        delete dropboxFolderState.files[name];
                    } else {
                        dropboxFolderState.files[name] = metadata;
                    }
                    if (prevMetadata && metadata) {
                        if (prevMetadata.rev !== metadata.rev) {
                            updated = true;
                        }
                    } else {
                        updated = true;
                    }
                }
                if (updated) {
                    adguard.listeners.notifyListeners(adguard.listeners.SYNC_REQUIRED);
                }
            });
    }

    function callListFolderLongPollTimeout(timeoutMs) {
        dropboxFolderState.longPollTimeoutId = setTimeout(callListFolderLongPoll, timeoutMs);
    }

    function callListFolderLongPoll() {

        if (!dropboxFolderState.longPollingEnabled) {
            adguard.console.info('{0} long polling is disabled', DROPBOX_PROVIDER_NAME);
            return;
        }

        syncListFiles()
            .then(function () {
                return DropboxClient.listFolderLongPoll(dropboxFolderState.cursor);
            })
            .then(function (result) {
                if (result.reset || result.changes) {
                    dropboxFolderState.forceSync = true;
                }
                if (result.backoff) {
                    callListFolderLongPollTimeout(result.backoff * 1000);
                } else {
                    callListFolderLongPollTimeout(0);
                }
            })
            .catch(function (error) {
                adguard.console.error('Dropbox sync error {0}', error);
                if (isInvalidToken(error)) {
                    clearAccessToken();
                    return;
                }
                // Retry after 5 minutes
                callListFolderLongPollTimeout(5 * 60 * 1000);
            });
    }

    /**
     * We have to check that file exists before trying to download it, because filesDownload throws error when there is no file to download
     * https://github.com/dropbox/dropbox-sdk-js/issues/84
     *
     * @param name File name
     */
    function isFileExists(name) {
        return syncListFiles()
            .then(function () {
                return name in dropboxFolderState.files;
            });
    }

    /**
     * Downloads file from Dropbox storage
     * http://dropbox.github.io/dropbox-sdk-js/Dropbox.html#filesDownload__anchor
     *
     * @param name File name
     * @param callback
     */
    var load = function (name, callback) {

        isFileExists(name)
            .then(function (exists) {
                if (exists) {
                    return dropbox
                        .filesDownload({path: '/' + name})
                        .then(readBlobFromResponse)
                        .then(JSON.parse);
                } else {
                    return Promise.resolve(null);
                }
            })
            .then(callback)
            .catch(function (error) {
                if (isInvalidToken(error)) {
                    clearAccessToken();
                }
                adguard.console.error('Dropbox sync error {0} {1}', name, error);
                callback(false);
            });
    };

    /**
     * Uploads file to Dropbox storage
     * @param name File name
     * @param data File data
     * @param callback
     */
    var save = function (name, data, callback) {

        var contents = JSON.stringify(data);
        dropbox.filesUpload({path: '/' + name, mode: "overwrite", contents: contents})
            .then(function (metadata) {
                dropboxFolderState.files[name] = metadata;
                callback(true);
            })
            .catch(function (error) {
                adguard.console.error('Dropbox sync error {0} {1}', name, error);
                if (isInvalidToken(error)) {
                    clearAccessToken();
                }
                callback(false);
            });
    };

    var init = function () {
        adguard.console.info('Initialize {0} sync provider', DROPBOX_PROVIDER_NAME);
        dropbox = new Dropbox.Dropbox({accessToken: api.oauthService.getToken(DROPBOX_PROVIDER_NAME)});
        dropboxFolderState.longPollingEnabled = true;
        callListFolderLongPoll();
    };

    var shutdown = function () {
        adguard.console.info('Shutdown {0} sync provider', DROPBOX_PROVIDER_NAME);
        dropboxFolderState.forceSync = true;
        dropboxFolderState.longPollingEnabled = false;
        if (dropboxFolderState.longPollTimeoutId) {
            clearTimeout(dropboxFolderState.longPollTimeoutId);
        }
    };

    var getAuthUrl = function (redirectUri, csrfState) {
        dropbox = new Dropbox.Dropbox({clientId: DROPBOX_CLIENT_ID});
        return dropbox.getAuthenticationUrl(redirectUri, csrfState);
    };

    var revokeToken = function (token) {
        dropbox = new Dropbox.Dropbox({accessToken: token});
        dropbox.authTokenRevoke();
    };

    // EXPOSE
    api.syncProviders.register(DROPBOX_PROVIDER_NAME, {
        isOAuthSupported: true,
        title: adguard.i18n.getMessage("sync_provider_dropbox"),
        // Storage api
        load: load,
        save: save,
        init: init,
        shutdown: shutdown,
        // Auth api
        getAuthUrl: getAuthUrl,
        revokeToken: revokeToken
    });

})(adguard.sync, adguard);
