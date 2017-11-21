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
 * Service that manages extension version information and handles
 * extension update. For instance we may need to change storage schema on update.
 */
adguard.applicationUpdateService = (function (adguard) {

    /**
     * File storage adapter
     * @Deprecated Used now only to upgrade from versions older than v2.3.5
     */
    var FileStorage = {

        LINE_BREAK: '\n',
        FILE_PATH: "filters.ini",

        readFromFile: function (path, callback) {

            var successCallback = function (fs, fileEntry) {

                fileEntry.file(function (file) {

                    var reader = new FileReader();
                    reader.onloadend = function () {

                        if (reader.error) {
                            callback(reader.error);
                        } else {
                            var lines = [];
                            if (reader.result) {
                                lines = reader.result.split(/[\r\n]+/);
                            }
                            callback(null, lines);
                        }
                    };

                    reader.onerror = function (e) {
                        callback(e);
                    };

                    reader.readAsText(file);

                }, callback);
            };

            this._getFile(path, true, successCallback, callback);
        },

        _getFile: function (path, create, successCallback, errorCallback) {

            path = path.replace(/^.*[\/\\]/, "");

            var requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
            requestFileSystem(window.PERSISTENT, 1024 * 1024 * 1024, function (fs) {
                fs.root.getFile(path, {create: create}, function (fileEntry) {
                    successCallback(fs, fileEntry);
                }, errorCallback);
            }, errorCallback);
        },

        removeFile: function (path, successCallback, errorCallback) {
            this._getFile(path, false, function (fs, fileEntry) {
                fileEntry.remove(successCallback, errorCallback);
            }, errorCallback);
        }
    };

    /**
     * Helper to execute deferred objects
     *
     * @param methods Methods to execute
     * @returns {Deferred}
     * @private
     */
    function executeMethods(methods) {

        var mainDfd = new adguard.utils.Promise();

        var executeNextMethod = function () {
            if (methods.length === 0) {
                mainDfd.resolve();
            } else {
                var method = methods.shift();
                var dfd = method();
                dfd.then(executeNextMethod);
            }
        };

        executeNextMethod();

        return mainDfd;
    }

    /**
     * Updates filters storage - move from files to the storage API.
     *
     * Version 2.3.5
     * @returns {Promise}
     * @private
     */
    function onUpdateChromiumStorage() {

        adguard.console.info('Call update to version 2.3.5');

        var dfd = new adguard.utils.Promise();

        var filterId = adguard.utils.filters.USER_FILTER_ID;
        var filePath = "filterrules_" + filterId + ".txt";

        FileStorage.readFromFile(filePath, function (e, rules) {
            if (e) {
                adguard.console.error("Error while reading rules from file {0} cause: {1}", filePath, e);
                return;
            }

            var onTransferCompleted = function () {
                adguard.console.info("Rules have been transferred to local storage for filter {0}", filterId);

                FileStorage.removeFile(filePath, function () {
                    adguard.console.info("File removed for filter {0}", filterId);
                }, function () {
                    adguard.console.error("File remove error for filter {0}", filterId);
                });
            };

            if (rules) {
                adguard.console.info('Found rules:' + rules.length);
            }

            adguard.rulesStorage.write(filterId, rules, onTransferCompleted);
        });

        dfd.resolve();
        return dfd;
    }

    /**
     * Migrates from the storage.local to the indexedDB
     * Version > 2.7.3
     */
    function onUpdateFirefoxWebExtRulesStorage() {

        var dfd = new adguard.utils.Promise();

        function writeFilterRules(keys, items) {
            if (keys.length === 0) {
                dfd.resolve();
            } else {
                var key = keys.shift();
                var lines = items[key] || [];
                var linesLength = lines.length;
                adguard.rulesStorageImpl.write(key, lines, function () {
                    adguard.console.info('Adguard filter "{0}" has been migrated. Rules: {1}', key, linesLength);
                    browser.storage.local.remove(key);
                    writeFilterRules(keys, items);
                });
            }
        }

        function migrate() {

            adguard.console.info('Call update to use indexedDB instead of storage.local for Firefox browser');

            browser.storage.local.get(null, function (items) {

                var keys = [];
                for (var key in items) {
                    if (items.hasOwnProperty(key) && key.indexOf('filterrules_') === 0) {
                        keys.push(key);
                    }
                }

                writeFilterRules(keys, items);
            });
        }

        if (adguard.rulesStorageImpl.isIndexedDB) {
            // Switch implementation to indexedDB
            migrate();
        } else {
            // indexedDB initialization failed, doing nothing
            dfd.resolve();
        }

        return dfd;
    }

    /**
     * Edge supports unlimitedStorage since Creators update.
     * Previously, we keep filter rules in localStorage, and now we have to migrate this rules to browser.storage.local
     * See https://github.com/AdguardTeam/AdguardBrowserExtension/issues/566
     */
    function onUpdateEdgeRulesStorage() {

        var dfd = new adguard.utils.Promise();

        var fixProperty = 'edge-storage-local-fix-build' + adguard.utils.browser.EDGE_CREATORS_UPDATE;
        if (adguard.localStorage.getItem(fixProperty)) {
            dfd.resolve();
            return dfd;
        }

        adguard.console.info('Call update to use storage.local for Edge browser');

        var keys = [];
        for (var key in localStorage) {
            if (localStorage.hasOwnProperty(key) && key.indexOf('filterrules_') === 0) {
                keys.push(key);
            }
        }

        function writeFilterRules() {
            if (keys.length === 0) {
                adguard.localStorage.setItem(fixProperty, true);
                dfd.resolve();
            } else {
                var key = keys.shift();
                var lines = [];
                var value = localStorage.getItem(key);
                if (value) {
                    lines = value.split(/[\r\n]+/);
                }
                adguard.rulesStorageImpl.write(key, lines, function () {
                    localStorage.removeItem(key);
                    writeFilterRules();
                });
            }
        }

        writeFilterRules();

        return dfd;
    }

    /**
     * Async returns extension run info
     *
     * @param callback Run info callback with passed object {{isFirstRun: boolean, isUpdate: (boolean|*), currentVersion: (Prefs.version|*), prevVersion: *}}
     */
    var getRunInfo = function (callback) {

        var prevVersion = adguard.utils.browser.getAppVersion();
        var currentVersion = adguard.app.getVersion();
        adguard.utils.browser.setAppVersion(currentVersion);

        var isFirstRun = (currentVersion !== prevVersion && !prevVersion);
        var isUpdate = !!(currentVersion !== prevVersion && prevVersion);

        callback({
            isFirstRun: isFirstRun,
            isUpdate: isUpdate,
            currentVersion: currentVersion,
            prevVersion: prevVersion
        });
    };

    /**
     * Handle extension update
     * @param runInfo   Run info
     * @param callback  Called after update was handled
     */
    var onUpdate = function (runInfo, callback) {

        var methods = [];
        if (adguard.utils.browser.isGreaterVersion("2.3.5", runInfo.prevVersion) && adguard.utils.browser.isChromium() && !adguard.utils.browser.isSafariBrowser()) {
            methods.push(onUpdateChromiumStorage);
        }
        if (adguard.utils.browser.isEdgeBrowser() && !adguard.utils.browser.isEdgeBeforeCreatorsUpdate()) {
            methods.push(onUpdateEdgeRulesStorage);
        }
        if (adguard.utils.browser.isGreaterVersion("2.7.4", runInfo.prevVersion) & adguard.utils.browser.isFirefoxBrowser() && typeof browser !== 'undefined') {
            methods.push(onUpdateFirefoxWebExtRulesStorage);
        }

        var dfd = executeMethods(methods);
        dfd.then(callback);
    };

    return {
        getRunInfo: getRunInfo,
        onUpdate: onUpdate
    };

})(adguard);



