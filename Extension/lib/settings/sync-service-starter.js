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

(function (syncApi, adguard) {

    var syncRequiredEvents = [
        adguard.listeners.SYNC_LOCAL_REQUIRED, // Local data was changed
        adguard.listeners.SYNC_REMOTE_REQUIRED // Remote data was changed
    ];

    var timeoutId = null;
    var pending = false;
    var running = false;

    /**
     * Checks at least one section was updated since the last sync
     * @param callback
     */
    function isSectionsUpdated(callback) {

        var dfds = [];
        var updated = false;

        var localManifest = syncApi.settingsProvider.loadLocalManifest();
        localManifest.sections.forEach(function (section) {
            var dfd = new adguard.utils.Promise();
            syncApi.sections.loadLocalSection(section.name, function (data) {
                if (syncApi.sections.isSectionUpdated(section.name, data)) {
                    updated = true;
                }
                dfd.resolve();
            });
        });

        adguard.utils.Promise.all(dfds).then(function () {
            callback(updated);
        });
    }

    function sync(event, callback) {

        if (event === adguard.listeners.SYNC_LOCAL_REQUIRED) {
            isSectionsUpdated(function (updated) {
                if (updated) {
                    var localManifest = syncApi.settingsProvider.loadLocalManifest();
                    syncApi.settingsProvider.syncLocalManifest(localManifest, Date.now());
                }
                syncApi.syncService.syncSettings(callback);
            });
        } else {
            syncApi.syncService.syncSettings(callback);
        }
    }

    function onSyncFinished() {
        running = false;
        if (pending) {
            syncListener(adguard.listeners.SYNC_LOCAL_REQUIRED);
            pending = false;
        }
    }

    var syncListener = function (event, options) {

        if (options && options.syncSuppress) {
            return;
        }

        if (running) {
            pending = true;
            return;
        }

        if (timeoutId) {
            clearTimeout(timeoutId);
        }

        timeoutId = setTimeout(function () {
            running = true;
            sync(event, onSyncFinished);
        }, 5000);
    };

    function initialize() {
        adguard.listeners.addSpecifiedListener(syncRequiredEvents, syncListener);
        syncApi.syncService.init();
    }

    adguard.listeners.addSpecifiedListener([adguard.listeners.APPLICATION_INITIALIZED], function () {
        // Sync local state
        isSectionsUpdated(initialize);
    });

})(adguard.sync, adguard);
