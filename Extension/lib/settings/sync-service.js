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
(function (api, adguard) {

    var MANIFEST_PATH = "manifest.json";

    var MIN_COMPATIBLE_VERSION_PROP = "min-compatible-version";
    var PROTOCOL_VERSION_PROP = "protocol-version";

    var CURRENT_PROVIDER_PROP = 'current-sync-provider';

    var syncProvider = null;

    /**
     * Sections revisions
     * TODO: normalize section. Use some hash instead of JSON.stringify
     */
    var sectionsRevisions = (function () {

        var revisions = [];

        var update = function (sectionName, section) {
            revisions[sectionName] = JSON.stringify(section);
        };

        var updateIfEmpty = function (sectionName, section) {
            if (sectionName in revisions) {
                return;
            }
            update(sectionName, section);
        };

        var isUpdated = function (sectionName, section) {
            return revisions[sectionName] !== JSON.stringify(section);
        };

        return {
            update: update,
            updateIfEmpty: updateIfEmpty,
            isUpdated: isUpdated
        };

    })();

    /**
     * Loads remote section
     * @param sectionName
     * @param callback
     */
    function loadRemoteSection(sectionName, callback) {
        syncProvider.load(sectionName, callback);
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
        syncProvider.save(sectionName, section, function (success) {
            if (success) {
                // Saves revision for loaded section
                sectionsRevisions.update(sectionName, section);
            }
            callback(success);
        });
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
     * Finds sync provider by name
     * @param providerName Provider name
     * @returns {*}
     */
    function findProviderByName(providerName) {
        for (var key in api) {
            if (api.hasOwnProperty(key)) {
                var provider = api[key];
                if (provider.name === providerName) {
                    return provider;
                }
            }
        }
        return null;
    }

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
            console.log(compatibility);
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

    var init = function () {
        var providerName = adguard.localStorage.getItem(CURRENT_PROVIDER_PROP);
        if (providerName) {
            setSyncProvider(providerName);
        }
    };

    var setSyncProvider = function (providerName, token) {
        //TODO: check provider is compatible with the current browser
        var providerService = findProviderByName(providerName);
        if (!providerService) {
            return;
        }
        if (syncProvider) {
            removeSyncProvider(syncProvider);
        }
        syncProvider = providerService;
        adguard.console.debug('Sync provider has been set to {0}', providerName);
        adguard.localStorage.setItem(CURRENT_PROVIDER_PROP, providerName);
        if (typeof providerService.init === 'function') {
            providerService.init(token);
        }
    };

    var removeSyncProvider = function (providerName) {
        providerName = providerName || adguard.localStorage.getItem(CURRENT_PROVIDER_PROP);
        if (!providerName) {
            return;
        }
        adguard.localStorage.removeItem(CURRENT_PROVIDER_PROP);
        adguard.console.debug('Sync provider {0} has been unset', providerName.name);
        var providerService = findProviderByName(providerName);
        if (providerService && typeof providerService.shutdown === 'function') {
            providerService.shutdown();
        }
    };

    var syncSettings = function (callback) {

        adguard.console.info('Synchronizing settings..');

        processManifest(function (success) {
            if (success) {
                adguard.console.info('Synchronizing settings finished');
            } else {
                adguard.console.warn('Error synchronizing settings');
            }
            callback(success);
        });
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
         * Sets sync provider to current service
         */
        setSyncProvider: setSyncProvider,
        /**
         * Removes sync provider
         */
        removeSyncProvider: removeSyncProvider,
        /**
         * Synchronizes settings between current application and sync provider
         */
        syncSettings: syncSettings
    };

})(adguard.sync, adguard);