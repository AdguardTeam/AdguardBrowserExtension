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

    var isProtocolVersionCompatible = function (manifest, current) {
        return {
            canRead: manifest["min-compatible-version"] <= current["min-compatible-version"],
            canWrite: manifest["protocol-version"] <= current["protocol-version"]
        }
    };

    var processManifest = function (callback) {
        var onManifestLoaded = function (manifest) {
            if (!manifest) {
                callback();
                return;
            }

            console.log('Manifest loaded');

            var current = SettingsProvider.loadSettings();

            var compatibility = isProtocolVersionCompatible(manifest, current);
            if (!compatibility.canRead) {
                console.log('Protocol versions are not compatible');
                callback();
                return;
            }

            processSections(current, manifest, compatibility, function (updated) {
                console.log('Saving updated manifests..');

                SettingsProvider.saveSettings(updated);
                if (compatibility.canWrite) {
                    SyncProvider.save(MANIFEST_PATH, updated, callback);
                } else {
                    callback();
                }
            });
        };

        SyncProvider.get(MANIFEST_PATH, onManifestLoaded);
    };

    var processSections = function (current, manifest, compatibility, callback) {
        var onFiltersSectionLoaded = function (remote) {
            var onSettingsLoaded = function (local) {
                var result = mergeFiltersSection(local, remote);

                SettingsProvider.saveSettingsSection(result, function () {
                    if (compatibility.canWrite) {
                        SyncProvider.save(FILTERS_PATH, result, function () {
                            callback(current);
                        });
                    } else {
                        callback(current);
                    }
                });
            };

            SettingsProvider.loadSettingsSection(onSettingsLoaded);
        };

        SyncProvider.get(FILTERS_PATH, onFiltersSectionLoaded);
    };

    var mergeFiltersSection = function (local, remote) {
        var result = local;
        //TODO: Implement

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