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

/* global FileUtils */

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
     * Earlier filters rules were saved to filters.ini.
     * Now filters rules save to filter_1.txt, filter_2.txt, ...
     * @private
     */
    function onUpdateToSaveFilterRulesToDifferentFiles() {

        adguard.console.info('Call update to version 1.0.1.0');

        var updateDfd = new adguard.utils.Promise();

        adguard.rulesStorage.read(function (filters) {

            var adguardFilters = Object.create(null);

            var processNextFilter = function () {
                if (filters.length === 0) {
                    //update adguard-filters in local storage for next update iteration
                    adguard.localStorage.setItem('adguard-filters', JSON.stringify(adguardFilters));

                    //cleanup old file
                    var removeCallback = function () {
                        // Ignore
                    };
                    adguard.rulesStorageImpl.remove(FileStorage.FILE_PATH, removeCallback, removeCallback);
                    updateDfd.resolve();
                } else {
                    var filter = filters.shift();
                    adguardFilters[filter.filterId] = {
                        version: filter.version,
                        lastCheckTime: filter.lastCheckTime,
                        lastUpdateTime: filter.lastUpdateTime,
                        disabled: filter.disabled
                    };
                    var dfd = new adguard.utils.Promise();
                    var rulesText = adguard.utils.collections.getRulesText(filter.filterRules);
                    adguard.rulesStorage.write(filter.filterId, rulesText, dfd.resolve);
                    dfd.then(processNextFilter);
                }
            };

            processNextFilter();
        });

        return updateDfd;
    }

    /**
     * Update to version with filter subscriptions
     *
     * version 1.0.3.0
     * @private
     */
    function onUpdateToMultiplySubscriptions() {

        adguard.console.info('Call update to version 1.0.3.0');

        if (adguard.localStorage.hasItem('adguard-filters')) {
            saveInstalledFiltersOnUpdate();
            saveFiltersVersionInfoOnUpdate();
            adguard.localStorage.removeItem('adguard-filters');
        }

        var dfd = new adguard.utils.Promise();
        dfd.resolve();
        return dfd;
    }

    /**
     * Update to version without ip-resolve
     *
     * version 2.0.0
     * @private
     */
    function onUpdateRemoveIpResolver() {

        adguard.console.info('Call update to version 1.0.3.0');

        adguard.localStorage.removeItem('ip-cache');

        var dfd = new adguard.utils.Promise();
        dfd.resolve();
        return dfd;
    }

    /**
     * Update whitelist service
     *
     * Version 2.0.9
     * @private
     */
    function onUpdateWhiteListService() {

        adguard.console.info('Call update to version 2.0.9');

        var dfd = new adguard.utils.Promise();

        var filterId = adguard.utils.filters.WHITE_LIST_FILTER_ID;

        adguard.rulesStorage.read(filterId, function (rulesText) {

            var whiteListDomains = [];

            if (!rulesText) {
                dfd.resolve();
                return;
            }

            for (var i = 0; i < rulesText.length; i++) {
                if (/^@@\/\/([^\/]+)\^\$document$/.test(rulesText[i])) {
                    var domain = RegExp.$1;
                    if (whiteListDomains.indexOf(domain) < 0) {
                        whiteListDomains.push(domain);
                    }
                }
            }

            adguard.localStorage.setItem('white-list-domains', JSON.stringify(whiteListDomains));

            dfd.resolve();
        });

        return dfd;
    }

    /**
     * Update rule hit stats
     *
     * Version 2.0.10
     * @private
     */
    function onUpdateRuleHitStats() {

        adguard.hitStats.cleanup();

        var dfd = new adguard.utils.Promise();
        dfd.resolve();
        return dfd;
    }

    /**
     * Update Firefox storage by moving to prefs
     *
     * Version 2.1.2
     * @returns {Promise}
     * @private
     */
    function onUpdateFirefoxStorage() {

        adguard.console.info('Call update to version 2.1.2');

        var dfd = new adguard.utils.Promise();

        readFirefoxSdkLocalStorage(function (storage) {
            if (storage) {
                for (var key in storage) {
                    if (storage.hasOwnProperty(key)) {
                        if (key === 'app-version') { // Skip app-version property. It has already set.
                            continue;
                        }
                        adguard.localStorage.setItem(key, storage[key]);
                    }
                }
            }
            try {
                var storeFile = getSdkLocalStorageFile();
                if (storeFile.exists()) {
                    storeFile.remove(0);
                }
            } catch (ex) {
                adguard.console.error('Adguard addon: Cannot remove sdk simple-storage store.json file: {0}', ex);
            }
            dfd.resolve();
        });

        return dfd;
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
     * Mark 'adguard-filters' as installed and loaded on extension version update
     * @private
     */
    function saveInstalledFiltersOnUpdate() {

        var adguardFilters = JSON.parse(adguard.localStorage.getItem('adguard-filters')) || Object.create(null);

        for (var filterId in adguardFilters) { // jshint ignore:line
            var filterInfo = adguardFilters[filterId];
            if (filterId == adguard.utils.filters.USER_FILTER_ID || filterId == adguard.utils.filters.WHITE_LIST_FILTER_ID) {
                continue;
            }
            var filter = {
                filterId: filterId,
                loaded: true
            };
            if (!filterInfo.disabled) {
                filter.installed = true;
                filter.enabled = true;
            }
            if (filterId == adguard.utils.filters.SEARCH_AND_SELF_PROMO_FILTER_ID) {
                filter.installed = true;
            }
            adguard.filtersState.updateFilterState(filter);
        }
    }

    /**
     * Update 'adguard-filters' version and last check and update time
     * @private
     */
    function saveFiltersVersionInfoOnUpdate() {

        var adguardFilters = JSON.parse(adguard.localStorage.getItem('adguard-filters')) || Object.create(null);

        for (var filterId in adguardFilters) { // jshint ignore:line
            var filterInfo = adguardFilters[filterId];
            var filter = {
                filterId: filterId,
                version: filterInfo.version,
                lastCheckTime: filterInfo.lastCheckTime,
                lastUpdateTime: filterInfo.lastUpdateTime
            };
            adguard.filtersState.updateFilterVersion(filter);
        }
    }

    /**
     * Firefox sdk simple-storage settings are saved into file: [ProfD]/jetpack/[extension_id]/simple-storage
     * See lib/sdk/simple-storage.js:248 for details
     * @returns {*}
     */
    /**
     The filename of the store, based on the profile dir and extension ID.
     get filename() {
     let storeFile = Cc["@mozilla.org/file/directory_service;1"].
     getService(Ci.nsIProperties).
     get("ProfD", Ci.nsIFile);
     storeFile.append(JETPACK_DIR_BASENAME);
     storeFile.append(jpSelf.id);
     storeFile.append("simple-storage");
     file.mkpath(storeFile.path);
     storeFile.append("store.json");
     return storeFile.path;
     }
     */
    function getSdkLocalStorageFile() {
        return FileUtils.getFile('ProfD', ['jetpack', adguard.app.getId(), 'simple-storage', 'store.json']);
    }

    /**
     * Reads file where sdk simple-storage values were saved
     * @param callback Callback with passed json object (object may be null)
     */
    function readFirefoxSdkLocalStorage(callback) {

        var storeFile = getSdkLocalStorageFile();
        if (!storeFile.exists() || storeFile.fileSize === 0) {
            callback();
            return;
        }

        adguard.fileStorageImpl.readAsync(storeFile, function (error, data) {
            var storage = null;
            if (error) {
                adguard.console.error('Error read firefox sdk local storage: {0}', error);
            } else {
                try {
                    storage = JSON.parse(data);
                } catch (ex) {
                    adguard.console.error('Error read firefox sdk local storage: {0}', ex);
                }
            }
            callback(storage);
        });
    }

    /**
     * Async loads previous version of installed application
     * @param callback Callback with passed version (version may be null)
     */
    function loadApplicationPreviousVersion(callback) {

        var prevVersion = adguard.utils.browser.getAppVersion();
        if (prevVersion || !adguard.utils.browser.isFirefoxBrowser()) {
            callback(prevVersion);
            return;
        }

        // In version 2.1.2 we migrated to prefs instead of sdk simple-storage. Let's try to retrieve version from simple-storage file.
        readFirefoxSdkLocalStorage(function (storage) {
            var prevVersionInStorage = null;
            if (storage) {
                prevVersionInStorage = storage['app-version'];
            }
            callback(prevVersionInStorage);
        });
    }

    /**
     * Async returns extension run info
     *
     * @param callback Run info callback with passed object {{isFirstRun: boolean, isUpdate: (boolean|*), currentVersion: (Prefs.version|*), prevVersion: *}}
     */
    var getRunInfo = function (callback) {

        loadApplicationPreviousVersion(function (prevVersion) {

            var currentVersion = adguard.app.getVersion();
            adguard.utils.browser.setAppVersion(currentVersion);

            var isFirstRun = !!(currentVersion !== prevVersion && !prevVersion);
            var isUpdate = !!(currentVersion !== prevVersion && prevVersion);

            callback({
                isFirstRun: isFirstRun,
                isUpdate: isUpdate,
                currentVersion: currentVersion,
                prevVersion: prevVersion
            });
        });
    };

    /**
     * Handle extension update
     * @param runInfo   Run info
     * @param callback  Called after update was handled
     */
    var onUpdate = function (runInfo, callback) {

        var methods = [];
        if (adguard.utils.browser.isGreaterVersion("1.0.1.0", runInfo.prevVersion)) {
            methods.push(onUpdateToSaveFilterRulesToDifferentFiles);
        }
        if (adguard.utils.browser.isGreaterVersion("1.0.3.0", runInfo.prevVersion)) {
            methods.push(onUpdateToMultiplySubscriptions);
        }
        if (adguard.utils.browser.isGreaterVersion("2.0.0", runInfo.prevVersion)) {
            methods.push(onUpdateRemoveIpResolver);
        }
        if (adguard.utils.browser.isGreaterVersion("2.0.9", runInfo.prevVersion)) {
            methods.push(onUpdateWhiteListService);
        }
        if (adguard.utils.browser.isGreaterVersion("2.0.10", runInfo.prevVersion)) {
            methods.push(onUpdateRuleHitStats);
        }
        if (adguard.utils.browser.isGreaterVersion("2.1.2", runInfo.prevVersion) && adguard.utils.browser.isFirefoxBrowser()) {
            methods.push(onUpdateFirefoxStorage);
        }
        if (adguard.utils.browser.isGreaterVersion("2.3.5", runInfo.prevVersion) && adguard.utils.browser.isChromium() && !adguard.utils.browser.isSafariBrowser()) {
            methods.push(onUpdateChromiumStorage);
        }

        var dfd = executeMethods(methods);
        dfd.then(callback);
    };

    return {
        getRunInfo: getRunInfo,
        onUpdate: onUpdate
    };

})(adguard);



