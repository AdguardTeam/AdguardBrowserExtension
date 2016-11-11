/* global Services */
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

(function () {

    Log.info('Adguard addon: Starting... Browser: {0}. Platform: {1}. Version: {2}. Id: {3}',
        adguard.runtime.getVersion(), adguard.runtime.getPlatform(),
        adguard.extension.getVersion(), adguard.extension.getId()
    );

    WebRequestImpl.init();
    ElemHide.init();
    InterceptHandler.init();

    // Initialize content-message handler
    contentMessageHandler.setSendMessageToSender(function (worker, message) {
        contentScripts.sendMessageToWorker(worker, message);
    });
    contentScripts.init();

    // Initialize overlay toolbar button
    UI.init();

    var antiBannerCallback = function (runInfo) {
        if (runInfo.isFirstRun) {
            // Show filters download page on first run of addon
            UI.openFiltersDownloadPage();
        }
    };
    antiBannerService.init({
        runCallback: antiBannerCallback
    });

    // Language detect on tab ready event
    adguard.tabs.onUpdated.addListener(function (tab) {
        if (tab.status === 'complete') {
            antiBannerService.checkTabLanguage(tab.tabId, tab.url);
        }
    });

    // Initialize filtering log
    filteringLog.synchronizeOpenTabs();
    adguard.tabs.onCreated.addListener(function (tab) {
        filteringLog.addTab(tab);
    });
    adguard.tabs.onRemoved.addListener(function (tab) {
        filteringLog.removeTab(tab);
    });
    adguard.tabs.onUpdated.addListener(function (tab) {
        filteringLog.updateTab(tab);
    });

})();

