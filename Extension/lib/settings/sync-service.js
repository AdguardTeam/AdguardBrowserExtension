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
var SyncService = (function () { // jshint ignore:line
    var MANIFEST_PATH = "manifest.json";
    var FILTERS_PATH = "filters.json";

    var syncProvider = null;

    var isProtocolVersionCompatible = function (remote, local) {
        return {
            canRead: remote["min-compatible-version"] <= local["min-compatible-version"],
            canWrite: remote["protocol-version"] <= local["protocol-version"]
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

            processSections(localManifest, remoteManifest, compatibility, function (resultManifest) {
                console.log('Saving local manifest..');

                SettingsProvider.saveSettingsManifest(resultManifest);

                if (compatibility.canWrite) {
                    console.log('Saving remote manifest..');
                    SyncProvider.save(MANIFEST_PATH, resultManifest, callback);
                } else {
                    callback();
                }
            });
        };

        console.log('Loading remote manifest..');
        SyncProvider.load(MANIFEST_PATH, onManifestLoaded);
    };

    var processSections = function (localManifest, remoteManifest, compatibility, callback) {
        var onFiltersSectionLoaded = function (remoteFiltersSection) {
            console.log('Remote filters section loaded');

            var onSettingsLoaded = function (localFiltersSection) {
                console.log('Local filters section loaded');

                var resultFiltersSection = mergeFiltersSection(localFiltersSection, remoteFiltersSection);

                SettingsProvider.saveFiltersSection(resultFiltersSection, function () {
                    if (compatibility.canWrite) {
                        SyncProvider.save(FILTERS_PATH, resultFiltersSection, function () {
                            console.log('Remote filters section saved');

                            callback(localManifest);
                        });
                    } else {
                        callback(localManifest);
                    }
                });

                console.log('Local filters section saved');
            };

            SettingsProvider.loadFiltersSection(onSettingsLoaded);
        };

        SyncProvider.load(FILTERS_PATH, onFiltersSectionLoaded);
    };

    var mergeFiltersSection = function (local, remote) {
        console.log('Merging filters sections..');
        console.log('Local:');
        console.log(local);
        console.log('Remote:');
        console.log(remote);

        var result = local;
        //TODO: Implement

        console.log('Merging filters sections..ok');
        return result;
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