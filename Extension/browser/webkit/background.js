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

var adguardApplication = new AdguardApplication(framesMap, {
    i18nGetMessage: ext.i18n.getMessage.bind(ext.i18n)
});

var filteringLog = new FilteringLog(BrowserTabs, framesMap, UI);

var webRequestService = new WebRequestService(framesMap, antiBannerService, filteringLog, adguardApplication);

ext.onMessage.addListener(function (message, sender, callback) {

    switch (message.type) {
        case "get-selectors-and-scripts":
            var cssAndScripts = webRequestService.processGetSelectorsAndScripts(sender.tab, message.documentUrl);
            callback(cssAndScripts || {});
            break;
        case "process-should-collapse":
            var collapse = webRequestService.processShouldCollapse(sender.tab, message.elementUrl, message.documentUrl, message.requestType);
            callback({
                collapse: collapse,
                requestId: message.requestId
            });
            break;
        case "process-should-collapse-many":
            var requests = webRequestService.processShouldCollapseMany(sender.tab, message.documentUrl, message.requests);
            callback({
                requests: requests
            });
            break;
        case "load-assistant-iframe":
            processLoadAssistant(sender.tab, callback);
            return true;
        case "add-user-rule":
            if (framesMap.isTabAdguardDetected(sender.tab)) {
                adguardApplication.addRuleToApp(message.ruleText, function () {
                });
            } else {
                antiBannerService.addUserFilterRule(message.ruleText);
            }
            callback({});
            break;
        default :
            callback({});
            break;
    }
});

function processLoadAssistant(tab, callback) {

    if (!tab) {
        callback({});
    }

    var cssLink = "lib/content-script/assistant/css/assistant.css";

    var ids = [
        'assistant_select_element',
        'assistant_select_element_ext',
        'assistant_select_element_cancel',
        'assistant_block_element',
        'assistant_block_element_explain',
        'assistant_slider_explain',
        'assistant_slider_min',
        'assistant_slider_max',
        'assistant_extended_settings',
        'assistant_rule_parameters',
        'assistant_apply_rule_to_all_sites',
        'assistant_block_by_reference',
        'assistant_block_similar',
        'assistant_block',
        'assistant_another_element',
        'assistant_preview',
        'assistant_preview_end',
        'assistant_preview_start'
    ];

    var getLocalization = function (ids) {
        var result = {};
        for (var id in ids) {
            var current = ids[id];
            result[current] = ext.i18n.getMessage(current);
        }
        return result;
    };

    callback({
        localization: getLocalization(ids),
        cssLink: [ext.getURL(cssLink)]
    });
}

//record opened tabs
UI.getAllOpenedTabs(function (tabs) {
    for (var i = 0; i < tabs.length; i++) {
        var tab = tabs[i];
        framesMap.recordFrame(tab, 0, tab.url, "DOCUMENT");
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
});
ext.tabs.onUpdated.addListener(function (tab) {
    filteringLog.updateTab(tab);
});
ext.tabs.onRemoved.addListener(function (tab) {
    filteringLog.removeTab(tab);
});