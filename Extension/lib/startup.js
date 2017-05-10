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
 * Extension initialize logic. Called from start.js
 */
adguard.initialize = function () {

    function onLocalStorageLoaded() {

        adguard.console.info('Starting adguard... Version: {0}. Id: {1}', adguard.app.getVersion(), adguard.app.getId());

        // Initialize popup button
        adguard.browserAction.setPopup({
            popup: adguard.getURL('pages/popup.html')
        });

        /**
         * Start application
         */
        adguard.filters.start({

            onInstall: function (callback) {

                // Process installation

                /**
                 * Show UI installation page
                 */
                adguard.ui.openFiltersDownloadPage();

                /**
                 * Tracking extension install or update according to http://adguard.com/en/privacy.html#browsers
                 * We do this with a single purpose: to know the number of unique installations of our extension.
                 * This information is stored for 24 hours and then it is deleted.
                 *
                 * The only thing which is not deleted is the aggregated info: installs count and active users count.
                 */
                adguard.backend.trackInstall();

                // Retrieve filters and install them
                adguard.filters.offerFilters(function (filterIds) {
                    adguard.filters.addAndEnableFilters(filterIds, callback);
                });
            }
        }, function () {
            // Doing nothing
        });
    }

    adguard.localStorage.init(onLocalStorageLoaded);

};