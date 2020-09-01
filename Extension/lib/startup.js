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

import { log } from './utils/log';
import { backgroundPage } from '../browser/chrome/lib/api/background-page';
import { rulesStorage, localStorage } from './storage';
import { whitelist } from './filter/whitelist';
import { filteringLog } from './filter/filtering-log';
import { ui } from './ui-service';

/**
 * Extension initialize logic. Called from start.js
 */
export const startup = function () {
    function onLocalStorageLoaded() {
        log.info('Starting adguard... Version: {0}. Id: {1}', adguard.app.getVersion(), adguard.app.getId());

        // Initialize popup button
        backgroundPage.browserAction.setPopup({
            popup: adguard.getURL('pages/popup.html'),
        });

        // Set uninstall page url
        // eslint-disable-next-line max-len
        const uninstallUrl = 'https://adguard.com/forward.html?action=adguard_uninstal_ext&from=background&app=browser_extension';
        backgroundPage.runtime.setUninstallURL(uninstallUrl, () => {
            if (backgroundPage.runtime.lastError) {
                log.error(backgroundPage.runtime.lastError);
                return;
            }
            log.info(`Uninstall url was set to: ${uninstallUrl}`);
        });

        whitelist.init();
        filteringLog.init();
        ui.init();

        /**
         * Start application
         */
        adguard.application.start({
            onInstall(callback) {
                // Process installation
                /**
                 * Show UI installation page
                 */
                adguard.ui.openFiltersDownloadPage();

                // Retrieve filters and install them
                adguard.application.offerFilters((filterIds) => {
                    adguard.application.addAndEnableFilters(filterIds, callback);
                });
            },
        }, () => {
            // Doing nothing
        });
    }

    rulesStorage.init(() => {
        localStorage.init(onLocalStorageLoaded);
    });
};
