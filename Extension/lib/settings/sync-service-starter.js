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

var syncRequiredEvents = [
    adguard.listeners.FILTER_ENABLE_DISABLE,
    adguard.listeners.UPDATE_WHITELIST_FILTER_RULES,
    adguard.listeners.UPDATE_USER_FILTER_RULES];

adguard.listeners.addSpecifiedListener(syncRequiredEvents, adguard.utils.concurrent.debounce(function () {

    //TODO: check if sync provider is correctly initialized (e.g. Dropbox is required in authorization)

    // Override current sync time
    var localManifest = adguard.sync.settingsProvider.loadLocalManifest();
    adguard.sync.settingsProvider.syncLocalManifest(localManifest, Date.now());

    adguard.sync.syncService.syncSettings(function () {

    });

}, 5000));