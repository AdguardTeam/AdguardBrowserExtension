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

/* global Deferred */

/**
 * Sync settings service
 *
 * @type {{syncSettings, setSyncProvider}}
 */
var SyncService = (function () { // jshint ignore:line
    var MANIFEST_PATH = "manifest.json";
    var FILTERS_PATH = "filters.json";

    var syncProvider = null;

    var isProtocolVersionCompatible = function (remoteManifest, localManifest) {
        var canRead = remoteManifest["min-compatible-version"] <= localManifest["min-compatible-version"];
        var canWrite = remoteManifest["protocol-version"] <= localManifest["protocol-version"];

        var sectionsRemoteToLocal = [];
        var sectionsLocalToRemote = [];

        if (canRead) {
            console.log(remoteManifest);
            for (var i = 0; i < remoteManifest.sections.length; i++) {
                var remoteSection = remoteManifest.sections[i];
                for (var j = 0; j < localManifest.sections.length; j++) {
                    var localSection = localManifest.sections[j];
                    if (localSection.name === remoteSection.name) {
                        var sectionName = localSection.name;
                        if (localSection.timestamp === remoteSection.timestamp) {
                            //Do nothing it's synced
                        } else if (localSection.timestamp < remoteSection.timestamp) {
                            sectionsRemoteToLocal.push({
                                name: sectionName,
                                timestamp: remoteSection.timestamp
                            });
                        } else {
                            if (canWrite) {
                                sectionsLocalToRemote.push({
                                    name: sectionName,
                                    timestamp: localSection.timestamp
                                });
                            }
                        }
                    }
                }
            }
        }

        return {
            canRead: canRead,
            canWrite: canWrite,
            sectionsRemoteToLocal: sectionsRemoteToLocal,
            sectionsLocalToRemote: sectionsLocalToRemote
        }
    };

    var processManifest = function (callback) {
        var onManifestLoaded = function (remoteManifest) {
            console.log('Processing remote manifest..');

            if (!remoteManifest) {
                callback();
                return;
            }

            var localManifest = SettingsProvider.loadSettingsManifest();

            var compatibility = isProtocolVersionCompatible(remoteManifest, localManifest);
            console.log(compatibility);
            if (!compatibility.canRead) {
                console.log('Protocol versions are not compatible');
                callback();
                return;
            }

            processSections(localManifest, remoteManifest, compatibility, function (updatedSections) {
                console.log(updatedSections);

                var updatedDate = new Date().getTime();
                if (updatedSections.remoteToLocal.length > 0) {
                    console.log('Saving local manifest..');

                    for (var i = 0; i < localManifest.sections.length; i++) {
                        var section = localManifest.sections[i];
                        for (var j = 0; j < updatedSections.remoteToLocal.length; j++) {
                            if (section.name === updatedSections.remoteToLocal[j].name) {
                                section.timestamp = updatedSections.remoteToLocal[j].timestamp;
                            }
                        }
                    }

                    localManifest.timestamp = updatedDate;
                    SettingsProvider.saveSettingsManifest(localManifest);
                }

                if (compatibility.canWrite) {
                    console.log('Saving remote manifest..');

                    for (var i = 0; i < remoteManifest.sections.length; i++) {
                        var section = remoteManifest.sections[i];
                        for (var j = 0; j < updatedSections.localToRemote.length; j++) {
                            if (section.name === updatedSections.localToRemote[j].name) {
                                section.timestamp = updatedSections.localToRemote[j].timestamp;
                            }
                        }
                    }

                    remoteManifest.timestamp = updatedDate;
                    remoteManifest["app-id"] = localManifest["app-id"];

                    SyncProvider.save(MANIFEST_PATH, remoteManifest, callback);
                } else {
                    callback();
                }
            });
        };

        console.log('Loading remote manifest..');
        SyncProvider.load(MANIFEST_PATH, onManifestLoaded);
    };

    var processSections = function (localManifest, remoteManifest, compatibility, callback) {
        var updatedSections = {
            localToRemote: [],
            remoteToLocal: []
        };

        var dfds = [];

        for (var i = 0; i < compatibility.sectionsLocalToRemote.length; i++) {
            var dfd = new Promise();
            dfds.push(dfd);

            var section = compatibility.sectionsLocalToRemote[i];
            console.log('Updating local to remote: ' + section);

            //TODO: Load section from sectionName
            SettingsProvider.loadFiltersSection(function(localFiltersSection) {
                console.log('Local filters section loaded');

                SyncProvider.save(FILTERS_PATH, localFiltersSection, function () {
                    console.log('Remote filters section updated');

                    updatedSections.localToRemote.push(section);

                    dfd.resolve();
                });
            });
        }

        for (var i = 0; i < compatibility.sectionsRemoteToLocal.length; i++) {
            var dfd = new Promise();
            dfds.push(dfd);

            var section = compatibility.sectionsRemoteToLocal[i];
            console.log('Updating remote to local: ' + section);

            //TODO: Load section from sectionName
            SyncProvider.load(FILTERS_PATH, function (remoteFiltersSection) {
                console.log('Remote filters section loaded');

                SettingsProvider.saveFiltersSection(remoteFiltersSection, function () {
                    console.log('Local filters section updated');

                    updatedSections.remoteToLocal.push(section);

                    dfd.resolve();
                });
            });
        }

        Promise.all(dfds).then(function () {
            callback(updatedSections);
        });
    };


    // API
    var syncSettings = function (callback) {
        console.log('Synchronizing settings..');

        if (syncProvider == null) {
            console.error('Sync provider should be set first');
            callback();
            return;
        }

        processManifest(function () {
            console.log('Synchronizing settings finished');
            callback();
        });
    };

    var setSyncProvider = function (provider) {
        syncProvider = provider;

        console.log('Sync provider has been set');
    };

    // EXPOSE
    return {
        /**
         * Synchronizes settings between current application and sync provider
         */
        syncSettings: syncSettings,
        /**
         * Sets sync provider to current service
         */
        setSyncProvider: setSyncProvider
    };
})();