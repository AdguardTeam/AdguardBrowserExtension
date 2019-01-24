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
(function (api, adguard, global) {

    var MANIFEST_PATH = "manifest.json";

    var MIN_COMPATIBLE_VERSION_PROP = "min-compatible-version";
    var PROTOCOL_VERSION_PROP = "protocol-version";

    var SYNC_CURRENT_PROVIDER_PROP = 'sync-current-sync-provider';
    var SYNC_LAST_SYNC_TIME_PROP = 'sync-last-sync-time';
    var SYNC_STATUS_ENABLED_PROP = 'sync-status-enabled';
    var SYNC_DEVICE_NAME_PROP = 'sync-device-name';
    var SYNC_GENERAL_DISABLED_PROP = 'sync-general-disabled';
    var SYNC_FILTERS_DISABLED_PROP = 'sync-filters-disabled';
    var SYNC_EXTENSION_SPECIFIC_DISABLED_PROP = 'sync-extension-specific-disabled';

    var lastSyncTimesQueue = [];
    var INF_LOOPS_CHECK_SIZE = 10;
    var INF_LOOPS_CHECK_TIME = 30 * 60 * 1000; // 1/2 hour

    var syncInProgress = false;
    var syncProvider = null;
    var lastSyncTimes = null;
    var syncEnabled = false;
    var syncOptions = {
        syncGeneral: true,
        syncFilters: true,
        syncExtensionSpecific: true
    };

    /**
     * Sections revisions
     */
    var sectionsRevisions = (function () {

        var revisions = {};

        var getSectionHash = function (section) {
            return global.SHA256.hash(JSON.stringify(section));
        };

        var update = function (sectionName, section) {
            revisions[sectionName] = getSectionHash(section);
        };

        var updateIfEmpty = function (sectionName, section) {
            if (sectionName in revisions) {
                return;
            }
            update(sectionName, section);
        };

        var isUpdated = function (sectionName, section) {
            return revisions[sectionName] !== getSectionHash(section);
        };

        return {
            update: update,
            updateIfEmpty: updateIfEmpty,
            isUpdated: isUpdated
        };

    })();

    function onSyncStatusUpdated() {
        adguard.listeners.notifyListeners(adguard.listeners.SYNC_STATUS_UPDATED, {
            status: getSyncStatus()
        });
    }

    /**
     * Loads remote section
     * @param sectionName
     * @param callback
     */
    function loadRemoteSection(sectionName, callback) {
        if (syncProvider) {
            syncProvider.load(sectionName, callback);
        } else {
            callback(false);
        }
    }

    /**
     * Loads local section
     * @param sectionName
     * @param callback
     */
    var loadLocalSection = function (sectionName, callback) {
        api.settingsProvider.loadSection(sectionName, function (section) {
            if (section === false) {
                callback(false);
                return;
            }
            if (section) {
                // If section is loaded first time, updates it revision.
                sectionsRevisions.updateIfEmpty(sectionName, section);
            }
            callback(section);
        });
    };

    /**
     * Saves remote section
     * @param sectionName
     * @param section
     * @param callback
     */
    function saveRemoteSection(sectionName, section, callback) {
        if (syncProvider) {
            syncProvider.save(sectionName, section, function (success) {
                if (success) {
                    // Saves revision for loaded section
                    sectionsRevisions.update(sectionName, section);
                }
                callback(success);
            });
        } else {
            callback(false);
        }

    }

    /**
     * Saves and apply local section
     * @param sectionName
     * @param section
     * @param callback
     */
    var saveLocalSection = function (sectionName, section, callback) {
        api.settingsProvider.applySection(sectionName, section, function (success) {
            if (success) {
                // Section was applied. Updates revision.
                sectionsRevisions.update(sectionName, section);
            }
            callback(success);
        });
    };

    /**
     * Checks section was updated after the last sync
     * @param sectionName
     * @param section
     */
    var isSectionUpdated = function (sectionName, section) {
        return sectionsRevisions.isUpdated(sectionName, section);
    };

    /**
     * Constructs the special object containing information about manifests protocols compatibility and then sorts data sections
     * into arrays by directions we should sync the data.
     *
     * @param remoteManifest
     * @param localManifest
     * @returns {{canRead: boolean, canWrite: boolean, sectionsRemoteToLocal: Array, sectionsLocalToRemote: Array}}
     */
    function findCompatibility(remoteManifest, localManifest) {

        var canRead = remoteManifest[MIN_COMPATIBLE_VERSION_PROP] <= localManifest[MIN_COMPATIBLE_VERSION_PROP];
        var canWrite = remoteManifest[PROTOCOL_VERSION_PROP] <= localManifest[PROTOCOL_VERSION_PROP];

        if (!canRead) {
            return {canRead: false};
        }

        var i;
        var merge = {};

        var localSection, remoteSection, sectionName;

        for (i = 0; i < localManifest.sections.length; i++) {
            localSection = localManifest.sections[i];
            sectionName = localSection.name;
            merge[sectionName] = {
                timestamp: localSection.timestamp,
                local: true
            };
        }

        for (i = 0; i < remoteManifest.sections.length; i++) {

            remoteSection = remoteManifest.sections[i];
            sectionName = remoteSection.name;

            localSection = merge[sectionName];

            if (localSection && localSection.timestamp === remoteSection.timestamp) {
                // Doing nothing. It's synced
                delete merge[sectionName];
                continue;
            }

            if (!localSection || localSection.timestamp < remoteSection.timestamp) {
                // Local section doesn't exist or it's outdated
                merge[sectionName] = {
                    timestamp: remoteSection.timestamp,
                    local: false
                };
            }

            // Remote section doesn't exist or it's outdated. In this case we use local section, that is already in merge object
        }

        var sectionsRemoteToLocal = [];
        var sectionsLocalToRemote = [];

        for (sectionName in merge) {
            if (!merge.hasOwnProperty(sectionName)) {
                continue;
            }

            if (!isSectionSyncEnabled(sectionName)) {
                adguard.console.info('Section {0} sync is disabled by user settings', sectionName);
                continue;
            }

            var section = merge[sectionName];
            if (section.local) {
                if (canWrite) {
                    sectionsLocalToRemote.push({
                        name: sectionName,
                        timestamp: section.timestamp
                    });
                }
            } else {
                sectionsRemoteToLocal.push({
                    name: sectionName,
                    timestamp: section.timestamp
                });
            }
        }

        return {
            canRead: canRead,
            canWrite: canWrite,
            sectionsRemoteToLocal: sectionsRemoteToLocal,
            sectionsLocalToRemote: sectionsLocalToRemote
        };
    }

    /**
     * Checks if section synchronization is enabled with user sync options
     * @param sectionName
     */
    function isSectionSyncEnabled(sectionName) {
        switch (sectionName) {
            case 'filters.json':
                return syncOptions.syncFilters;
            case 'general-settings.json':
                return syncOptions.syncGeneral;
            case 'extension-specific-settings.json':
                return syncOptions.syncExtensionSpecific;
        }

        // Default
        return true;
    }

    /**
     * Validates remote manifest
     * @param manifest
     * @returns {*}
     */
    function validateManifest(manifest) {
        return manifest[MIN_COMPATIBLE_VERSION_PROP] && manifest[PROTOCOL_VERSION_PROP];
    }

    function updateManifestSections(manifest, sections) {
        for (var i = 0; i < sections.length; i++) {
            var section = sections[i];
            var found = false;
            for (var j = 0; j < manifest.sections.length; j++) {
                var manifestSection = manifest.sections[j];
                if (manifestSection.name === section.name) {
                    // Section found, update timestmap
                    manifestSection.timestamp = section.timestamp;
                    found = true;
                }
            }
            if (!found) {
                manifest.sections.push({
                    name: section.name,
                    timestamp: section.timestamp
                });
            }
        }
    }

    /**
     * So how does it work:
     * At first we load manifests for remote and local and then are trying to find can we merge the datasets comparing
     * protocol versions. Then comparing the timestamps for sections we find the newer data and pick it in some collections
     * corresponding to the direction: remote-to-local or local-to-remote.
     *
     * After that we load selected data sections and process the compatibility result by processSections method,
     * simply saving the newer sections to remote or local storage.
     *
     * As the end we updated manifests with processSections result, setting up the sections timestamps.
     *
     * @param callback
     */
    function processManifest(callback) {

        var onManifestLoaded = function (remoteManifest) {

            adguard.console.info('Processing remote manifest..');

            if (remoteManifest === false) {
                // Unable to fetch remote manifest
                adguard.console.warn('Error loading remote manifest');
                callback(false);
                return;
            }

            var localManifest = api.settingsProvider.loadLocalManifest();

            if (!remoteManifest) {

                adguard.console.info('Remote manifest does not exist');
                remoteManifest = api.settingsProvider.getEmptyLocalManifest();

                if (!localManifest.timestamp) {
                    // Force sync manifest
                    api.settingsProvider.syncLocalManifest(localManifest, Date.now());
                }
            }

            if (!validateManifest(remoteManifest)) {
                adguard.console.warn('Remote manifest is not valid');
                callback(false);
                return;
            }

            var compatibility = findCompatibility(remoteManifest, localManifest);
            if (!compatibility.canRead) {
                adguard.console.warn('Protocol versions are not compatible');
                callback(false);
                return;
            }

            processSections(compatibility.sectionsLocalToRemote, compatibility.sectionsRemoteToLocal, function (success, updatedSections) {

                if (!success) {
                    callback(false);
                    return;
                }

                adguard.console.info('Sections updated local-to-remote: {0}, remote-to-local: {1}', updatedSections.localToRemote.length, updatedSections.remoteToLocal.length);

                // Mark manifests as synchronized
                var syncTime = Math.max(localManifest.timestamp, remoteManifest.timestamp);

                // Setup sync time for updated local sections
                if (updatedSections.remoteToLocal.length > 0) {
                    adguard.console.debug('Saving local manifest..');
                    localManifest.timestamp = syncTime;
                    updateManifestSections(localManifest, updatedSections.remoteToLocal);
                    api.settingsProvider.syncLocalManifest(localManifest);
                }

                if (compatibility.canWrite && updatedSections.localToRemote.length > 0) {

                    // Sets that the browser extension has applied the last changes
                    remoteManifest["app-id"] = localManifest["app-id"];

                    // Setup sync time for updated remote sections
                    adguard.console.debug('Saving remote manifest..');
                    remoteManifest.timestamp = syncTime;
                    updateManifestSections(remoteManifest, updatedSections.localToRemote);

                    saveRemoteSection(MANIFEST_PATH, remoteManifest, callback);

                } else {
                    callback(true);
                }
            });
        };

        adguard.console.debug('Loading remote manifest..');
        loadRemoteSection(MANIFEST_PATH, onManifestLoaded);
    }

    /**
     * Processes sections synchronization.
     * Return object with updates sections info.
     *
     * @param sectionsLocalToRemote Array of local sections that should be push to remote
     * @param sectionsRemoteToLocal Array of remote sections that should be applied to local
     * @param callback Finish callback
     */
    function processSections(sectionsLocalToRemote, sectionsRemoteToLocal, callback) {

        var updatedSections = {
            localToRemote: [],
            remoteToLocal: []
        };

        var pushLocalToRemoteSection = function (section) {
            updatedSections.localToRemote.push(section);
        };

        var pushRemoteToLocalSection = function (section) {
            updatedSections.remoteToLocal.push(section);
        };

        var dfds = [];
        var dfd;

        for (var i = 0; i < sectionsLocalToRemote.length; i++) {
            dfd = updateLocalToRemoteSection(sectionsLocalToRemote[i], pushLocalToRemoteSection);
            dfds.push(dfd);
        }

        for (var j = 0; j < sectionsRemoteToLocal.length; j++) {
            dfd = updateRemoteToLocalSection(sectionsRemoteToLocal[j], pushRemoteToLocalSection);
            dfds.push(dfd);
        }

        adguard.utils.Promise.all(dfds).then(function () {
            adguard.console.info('Sections updated successfully');
            callback(true, updatedSections);
        }, function () {
            adguard.console.error('Sections update failed');
            callback(false, updatedSections);
        });
    }

    /**
     * Constructs section for application and saves it to sync provider
     * @param section Section to construct and save
     * @param callback Constructed section callback
     */
    function updateLocalToRemoteSection(section, callback) {

        var sectionName = section.name;
        adguard.console.info('Updating local to remote: {0}', section.name);

        var dfd = new adguard.utils.Promise();

        // If section isn't supported just skip it
        if (!api.settingsProvider.isSectionSupported(sectionName)) {
            callback(section);
            dfd.resolve();
            return dfd;
        }

        /**
         * Saves section to sync provider
         * @param localSection Section object
         */
        var onSectionLoaded = function (localSection) {

            if (!localSection) {
                adguard.console.error('Local {0} section loading failed', sectionName);
                dfd.reject();
                return;
            }

            adguard.console.debug('Local {0} section loaded', sectionName);

            saveRemoteSection(sectionName, localSection, function (success) {
                if (success) {
                    adguard.console.info('Remote {0} section updated', sectionName);
                    callback(section);
                    dfd.resolve();
                } else {
                    adguard.console.error('Remote {0} section update failed', sectionName);
                    dfd.reject();
                }
            });
        };

        // Constructs section object from application settings
        loadLocalSection(sectionName, onSectionLoaded);

        return dfd;
    }

    /**
     * Loads section from sync provider and applies it to application
     * @param section Section to load and apply
     * @param callback Applied section callback
     * @returns {*}
     */
    function updateRemoteToLocalSection(section, callback) {

        var sectionName = section.name;
        adguard.console.info('Updating remote to local: {0}', sectionName);

        var dfd = adguard.utils.Promise();

        // If section isn't supported just skip it
        if (!api.settingsProvider.isSectionSupported(sectionName)) {
            callback(section);
            dfd.resolve();
            return dfd;
        }

        /**
         * Applies remote section to application
         * @param remoteSection Section object
         */
        var onSectionLoaded = function (remoteSection) {

            if (!remoteSection) {
                adguard.console.error('Remote {0} section loading failed', sectionName);
                dfd.reject();
                return;
            }

            adguard.console.debug('Remote {0} section loaded', sectionName);

            saveLocalSection(sectionName, remoteSection, function (success) {
                if (success) {
                    adguard.console.info('Local {0} section applied', sectionName);
                    callback(section);
                    dfd.resolve();
                } else {
                    adguard.console.error('Local {0} section apply failed', sectionName);
                    dfd.reject();
                }
            });
        };

        // Load section from sync provider
        loadRemoteSection(sectionName, onSectionLoaded);

        return dfd;
    }

    function getLastSyncTimes() {
        if (lastSyncTimes === null) {
            var times = adguard.localStorage.getItem(SYNC_LAST_SYNC_TIME_PROP);
            lastSyncTimes = times ? JSON.parse(times) : Object.create(null);
        }
        return lastSyncTimes;
    }

    function setLastSyncTime(dateTime, providerName) {
        var times = getLastSyncTimes();
        times[providerName] = dateTime;

        adguard.localStorage.setItem(SYNC_LAST_SYNC_TIME_PROP, JSON.stringify(times));
    }

    /**
     * This is a simple check if there were too many sync fires INF_LOOPS_CHECK_SIZE in specified INF_LOOPS_CHECK_TIME time.
     * As a hard protection of infinitive sync fires, we shut it down.
     */
    function checkInfiniteLooping() {
        var now = Date.now();
        lastSyncTimesQueue.push(now);
        if (lastSyncTimesQueue.length > INF_LOOPS_CHECK_SIZE) {
            var first = lastSyncTimesQueue.shift();
            if (now - first < INF_LOOPS_CHECK_TIME) {
                toggleSyncStatus(false);
                adguard.console.warn('Sync is disabled under suspicion of infinite loop.');
                lastSyncTimesQueue = [];
                return true;
            }
        }
        return false;
    }

    var toggleSyncStatus = function (enabled) {

        if (enabled === undefined) {
            syncEnabled = !syncEnabled;
        } else {
            syncEnabled = enabled;
        }

        adguard.localStorage.setItem(SYNC_STATUS_ENABLED_PROP, syncEnabled);

        if (syncEnabled) {
            init();
        } else {
            shutdown();
        }
    };

    var setSyncOptions = function (options) {
        adguard.localStorage.setItem(SYNC_GENERAL_DISABLED_PROP, !options.syncGeneral);
        adguard.localStorage.setItem(SYNC_FILTERS_DISABLED_PROP, !options.syncFilters);
        adguard.localStorage.setItem(SYNC_EXTENSION_SPECIFIC_DISABLED_PROP, !options.syncExtensionSpecific);

        syncOptions = options;
    };

    var init = function () {

        syncEnabled = String(adguard.localStorage.getItem(SYNC_STATUS_ENABLED_PROP)) === 'true';

        syncOptions.syncGeneral = String(adguard.localStorage.getItem(SYNC_GENERAL_DISABLED_PROP)) !== 'true';
        syncOptions.syncFilters = String(adguard.localStorage.getItem(SYNC_FILTERS_DISABLED_PROP)) !== 'true';
        syncOptions.syncExtensionSpecific = String(adguard.localStorage.getItem(SYNC_EXTENSION_SPECIFIC_DISABLED_PROP)) !== 'true';

        var providerName = adguard.localStorage.getItem(SYNC_CURRENT_PROVIDER_PROP);
        if (providerName) {
            setSyncProvider(providerName);
        }
    };

    var shutdown = function () {
        if (syncProvider) {
            syncProvider.shutdown();
            syncProvider = null;
        }
        onSyncStatusUpdated();
    };

    /**
     * Sets sync provider to current service
     */
    var setSyncProvider = function (providerName) {

        var provider = api.syncProviders.getProvider(providerName);
        if (!provider) {
            return;
        }

        if (syncProvider) {
            syncProvider.shutdown();
        }

        adguard.console.info('Sync provider has been set to {0}', providerName);
        adguard.localStorage.setItem(SYNC_CURRENT_PROVIDER_PROP, providerName);

        if (api.oauthService.isAuthorized(providerName) && syncEnabled) {
            syncProvider = provider;
            provider.init();
        }

        onSyncStatusUpdated();
    };

    /**
     * Synchronizes settings between current application and sync provider
     */
    var syncSettings = function (callback) {

        function onFinished(success) {
            syncInProgress = false;
            if (typeof callback === 'function') {
                callback(success);
            }
            onSyncStatusUpdated();
        }

        adguard.console.info('Synchronizing settings..');

        if (syncInProgress) {
            adguard.console.info('Sync is already in progress...');
            onFinished(false);
            return;
        }
        syncInProgress = true;

        onSyncStatusUpdated();

        if (!syncEnabled) {
            adguard.console.warn('Sync is disabled');
            onFinished(false);
            return;
        }

        if (!syncProvider) {
            adguard.console.warn('Sync provider is not defined');
            onFinished(false);
            return;
        }

        var providerName = syncProvider.name;

        if (!api.oauthService.isAuthorized(providerName)) {
            adguard.console.warn('Sync provider is not authorized');
            onFinished(false);
            return;
        }

        if (checkInfiniteLooping()) {
            onFinished(false);
            return;
        }

        processManifest(function (success) {

            if (success) {
                setLastSyncTime(Date.now(), providerName);
                adguard.console.info('Synchronizing settings finished');
            } else {
                adguard.console.warn('Error synchronizing settings');
            }

            onFinished(success);
        });
    };

    var getSyncStatus = function () {

        var providers = api.syncProviders.getProvidersInfo();
        var currentProvider = null;

        var providerName = adguard.localStorage.getItem(SYNC_CURRENT_PROVIDER_PROP);
        if (providerName) {
            currentProvider = providers.filter(function (p) {
                return p.name === providerName;
            })[0];
        }

        // Populate provides with additional info
        for (var i = 0; i < providers.length; i++) {
            var provider = providers[i];
            provider.lastSyncTime = getLastSyncTimes()[provider.name];
            if (provider.name === 'ADGUARD_SYNC') {
                provider.deviceName = getDeviceName();
            }
        }

        return {
            enabled: syncEnabled,
            providers: providers,
            currentProvider: currentProvider,
            syncInProgress: syncInProgress,
            syncOptions: syncOptions
        };
    };

    var getDeviceName = function () {
        var deviceName = adguard.localStorage.getItem(SYNC_DEVICE_NAME_PROP);
        if (!deviceName) {
            deviceName = adguard.utils.browser.getClientId() +
                ' (' + adguard.prefs.browser + ' ' + window.navigator.platform + ')';
        }

        return deviceName;
    };

    var changeDeviceName = function (deviceName) {
        adguard.localStorage.setItem(SYNC_DEVICE_NAME_PROP, deviceName);
    };

    api.sections = {
        loadLocalSection: loadLocalSection,
        isSectionUpdated: isSectionUpdated
    };

    api.syncService = {
        /**
         * Initializes sync service
         */
        init: init,
        /**
         * Shutdown sync service
         */
        shutdown: shutdown,
        /**
         * Sets sync provider to current service
         */
        setSyncProvider: setSyncProvider,
        /**
         * Synchronizes settings between current application and sync provider
         */
        syncSettings: syncSettings,
        /**
         * Returns sync status
         */
        getSyncStatus: getSyncStatus,
        /**
         * Enables/disables sync
         */
        toggleSyncStatus: toggleSyncStatus,
        /**
         * Sets sync options
         */
        setSyncOptions: setSyncOptions,
        /**
         * Changes device name
         */
        changeDeviceName: changeDeviceName
    };

})(adguard.sync, adguard, window);
