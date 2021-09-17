/**
 * This file is part of Adguard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * Adguard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Adguard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Adguard Browser Extension. If not, see <http://www.gnu.org/licenses/>.
 */

import { log } from '../common/log';
import { backgroundPage } from './extension-api/background-page';
import { rulesStorage, localStorage } from './storage';
import { allowlist } from './filter/allowlist';
import { filteringLog } from './filter/filtering-log';
import { uiService } from './ui-service';
import { application } from './application';
import { browser } from './extension-api/browser';
import { stealthService } from './filter/services/stealth-service';
import { ANTIBANNER_GROUPS_ID } from '../common/constants';

/**
 * Extension initialize logic. Called from start.js
 */
export const startup = async function () {
    async function onLocalStorageLoaded() {
        log.info(
            'Starting adguard... Version: {0}. Id: {1}',
            backgroundPage.app.getVersion(),
            backgroundPage.app.getId(),
        );

        // Initialize popup button
        backgroundPage.browserAction.setPopup({
            popup: backgroundPage.getURL('pages/popup.html'),
        });

        // Set uninstall page url
        // eslint-disable-next-line max-len
        const uninstallUrl = 'https://adguard.com/forward.html?action=adguard_uninstal_ext&from=background&app=browser_extension';
        try {
            await browser.runtime.setUninstallURL(uninstallUrl);
        } catch (e) {
            log.error(e);
        }

        allowlist.init();
        filteringLog.init();
        uiService.init();
        stealthService.init();

        /**
         * Start application
         */
        application.start({
            async onInstall() {
                // Process installation
                /**
                 * Show UI installation page
                 */
                uiService.openFiltersDownloadPage();

                // Retrieve filters and install them
                const filterIds = application.offerFilters();
                await application.addAndEnableFilters(filterIds);
                // enable language-specific group by default
                await application.enableGroup(ANTIBANNER_GROUPS_ID.LANGUAGE_FILTERS_GROUP_ID);
            },
        });
    }

    await rulesStorage.init();
    await localStorage.init();
    onLocalStorageLoaded();
};
