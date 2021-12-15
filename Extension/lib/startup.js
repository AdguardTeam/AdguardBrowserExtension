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

/* global adguard */

/**
 * Extension initialize logic. Called from start.js
 */
adguard.initialize = async function () {
    async function onLocalStorageLoaded() {
        adguard.console.info('Starting adguard... Version: {0}. Id: {1}', adguard.app.getVersion(), adguard.app.getId());

        // Initialize popup button
        adguard.browserAction.setPopup({
            popup: adguard.getURL('pages/popup.html'),
        });

        // Set uninstall page url
        const uninstallUrl = 'https://adguard.com/forward.html?action=adguard_uninstal_ext&from=background&app=browser_extension';
        adguard.runtime.setUninstallURL(uninstallUrl, () => {
            if (adguard.runtime.lastError) {
                adguard.console.error(adguard.runtime.lastError);
                return;
            }
            adguard.console.info(`Uninstall url was set to: ${uninstallUrl}`);
        });

        adguard.whitelist.init();
        adguard.filteringLog.init();
        await adguard.ui.init();

        /**
         * Start application
         */
        adguard.filters.start({
            onInstall(callback) {
                // Process installation
                /**
                 * Show UI installation page
                 */
                adguard.ui.openFiltersDownloadPage();

                // Retrieve filters and install them
                adguard.filters.offerFilters((filterIds) => {
                    adguard.filters.addAndEnableFilters(filterIds, callback);
                });
            },
        }, () => {
            // Doing nothing
        });
    }

    adguard.rulesStorage.init(() => {
        adguard.localStorage.init(onLocalStorageLoaded);
    });
};
