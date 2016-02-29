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
var antiBannerService = new AntiBannerService();

antiBannerService.init({

    runCallback: function (runInfo) {
        if (runInfo.isFirstRun) {
            UI.openFiltersDownloadPage();
        }
    }
});
filterRulesHitCount.setAntiBannerService(antiBannerService);

var framesMap = new FramesMap(antiBannerService, BrowserTabs);
//cleanup stored frames
ext.tabs.onRemoved.addListener(function (tab) {
    framesMap.removeFrame(tab);
});

var adguardApplication = new AdguardApplication(framesMap);

var filteringLog = new FilteringLog(BrowserTabs, framesMap, UI);

var webRequestService = new WebRequestService(framesMap, antiBannerService, filteringLog, adguardApplication);

// Content-Message listener
var contentMessageHandler = new ContentMessageHandler();
contentMessageHandler.init(antiBannerService, webRequestService, framesMap, adguardApplication, filteringLog, UI);
contentMessageHandler.setSendMessageToSender(function (sender, message) {
    sender.tab.sendMessage(message);
});
ext.onMessage.addListener(function (message, sender, sendResponse) {
    var response = contentMessageHandler.handleMessage(message, sender, sendResponse);
    var async = response === true;
    if (!async) {
        sendResponse(response);
    }
    // If async sendResponse will be invoked later
    return async;
});

//record opened tabs
UI.getAllOpenedTabs(function (tabs) {
    for (var i = 0; i < tabs.length; i++) {
        var tab = tabs[i];
        framesMap.recordFrame(tab, 0, tab.url, RequestTypes.DOCUMENT);
        framesMap.checkTabIncognitoMode(tab);
        UI.updateTabIconAndContextMenu(tab);
    }
});
UI.bindEvents();

//locale detect
ext.tabs.onCompleted.addListener(function (tab) {
    antiBannerService.checkTabLanguage(tab.id, tab.url);
});

//init filtering log
filteringLog.synchronizeOpenTabs();
ext.tabs.onCreated.addListener(function (tab) {
    filteringLog.addTab(tab);
    framesMap.checkTabIncognitoMode(tab);
});
ext.tabs.onUpdated.addListener(function (tab) {
    filteringLog.updateTab(tab);
});
ext.tabs.onRemoved.addListener(function (tab) {
    filteringLog.removeTab(tab);
});