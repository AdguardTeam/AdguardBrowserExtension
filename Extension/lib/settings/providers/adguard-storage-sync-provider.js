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

    var client = (function () {

        function makeRequest(url, options) {

            return new Promise(function (resolve, reject) {

                var xhr = new XMLHttpRequest();

                var params = options.params || {};
                var headers = options.headers || {};
                var requestProps = options.requestProps || {};
                var body = options.body;

                var query = [];
                Object.keys(params).forEach(function (key) {
                    query.push(key + '=' + encodeURIComponent(params[key]));
                });
                xhr.open('POST', url + '?' + query.join('&'), true);

                xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
                Object.keys(headers).forEach(function (key) {
                    xhr.setRequestHeader(key, headers[key]);
                });
                Object.keys(requestProps).forEach(function (key) {
                    xhr[key] = requestProps[key];
                });

                xhr.onload = function () {
                    var status = xhr.status;
                    if (status === 200) {
                        if (xhr.responseType === 'blob') {
                            var fileReader = new FileReader();
                            fileReader.onload = function () {
                                try {
                                    resolve(JSON.parse(this.result));
                                } catch (ex) {
                                    reject({error: ex});
                                }
                            };
                            fileReader.onerror = function (error) {
                                reject({error: error});
                            };
                            fileReader.readAsText(xhr.response);
                        } else {
                            resolve(xhr.responseText);
                        }
                    } else {
                        reject({status: status, error: new Error(xhr.statusText)});
                    }
                };

                xhr.onerror = function () {
                    reject({status: xhr.status, error: new Error(xhr.statusText)});
                };

                xhr.send(body);
            });
        }

        var filesDownload = function (name) {
            return makeRequest('http://localhost:8180/files/download', {
                params: {name: name},
                requestProps: {responseType: 'blob'}
            });
        };

        var filesUpload = function (name, contents) {
            return makeRequest('http://localhost:8180/files/upload', {
                headers: {'Content-Type': 'application/octet-stream'},
                params: {name: name},
                body: contents
            });
        };

        return {
            filesDownload: filesDownload,
            filesUpload: filesUpload
        };

    })();

    var accessToken = '123123123';

    var load = function (name, callback) {

        client.filesDownload(name)
            .then(function (response) {
                callback(response);
            })
            .catch(function (error) {
                if (error.status === 404) {
                    callback(null);
                } else {
                    console.error(error);
                    callback(false);
                }
            });
    };

    var save = function (name, data, callback) {
        var contents = JSON.stringify(data);
        client.filesUpload(name, contents)
            .then(function () {
                callback(true);
            })
            .catch(function (error) {
                console.error(error);
            });
    };

    // EXPOSE
    api.adguardSyncProvider = {
        load: load,
        save: save
    };

})(adguard.sync, adguard);