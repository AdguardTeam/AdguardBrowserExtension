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

/* global RequestTypes, antiBannerService, framesMap */

(function () {

    Log.info('Starting adguard... Version: {0}. Id: {1}', adguard.app.getVersion(), adguard.app.getId());

    // Initialize popup button
    adguard.browserAction.setPopup({
        popup: adguard.getURL('pages/popup.html')
    });

    // Record opened tabs
    adguard.tabs.forEach(function (tab) {
        framesMap.recordFrame(tab, 0, tab.url, RequestTypes.DOCUMENT);
        adguard.ui.updateTabIconAndContextMenu(tab);
    });

    // Initialize filtering log

    // Initialize antibanner service
    antiBannerService.init({

        runCallback: function (runInfo) {
            if (runInfo.isFirstRun) {
                adguard.ui.openFiltersDownloadPage();
            }
        }
    });

})();

