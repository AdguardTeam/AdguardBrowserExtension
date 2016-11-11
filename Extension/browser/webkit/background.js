/* global RequestTypes */
/* global UI */
/* global AdguardApplication */
/* global BrowserTabs */
/* global FilteringLog */
/* global WebRequestService */
/* global ContentMessageHandler */
/* global ext */
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
antiBannerService.init({

    runCallback: function (runInfo) {
        if (runInfo.isFirstRun) {
            UI.openFiltersDownloadPage();
        }
    }
});

// Content-Message listener
contentMessageHandler.setSendMessageToSender(function (sender, message) {
    adguard.tabs.sendMessage(sender.tab.tabId, message);
});
adguard.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    var response = contentMessageHandler.handleMessage(message, sender, sendResponse);
    var async = response === true;
    if (!async) {
        sendResponse(response);
    }
    // If async sendResponse will be invoked later
    return async;
});

//record opened tabs
adguard.tabs.forEach(function (tab) {
    framesMap.recordFrame(tab, 0, tab.url, RequestTypes.DOCUMENT);
    UI.updateTabIconAndContextMenu(tab);
});
UI.bindEvents();

//locale detect
adguard.tabs.onUpdated.addListener(function (tab) {
    if (tab.status === 'complete') {
        antiBannerService.checkTabLanguage(tab.tabId, tab.url);
    }
});

//init filtering log
filteringLog.synchronizeOpenTabs();
adguard.tabs.onCreated.addListener(function (tab) {
    filteringLog.addTab(tab);
});
adguard.tabs.onUpdated.addListener(function (tab) {
    filteringLog.updateTab(tab);
});
adguard.tabs.onRemoved.addListener(function (tab) {
    filteringLog.removeTab(tab);
});