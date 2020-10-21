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


import * as TSUrlFilter from '@adguard/tsurlfilter';
import { settingsProvider } from './settings/settings-provider';
import { backgroundPage } from './extension-api/background-page';
import { settings } from './settings/user-settings';
import { listeners } from './notifier';
import { userrules } from './filter/userrules';
import { notifications } from './utils/notifications';
import { localStorage } from './storage';
import { tabsApi } from './tabs/tabs-api';
import { uiService } from './ui-service';
import { browserUtils } from './utils/browser-utils';
import { frames } from './tabs/frames';
import { safebrowsing } from './filter/services/safebrowsing';
import { utils } from './utils/common';
import { RequestTypes } from './utils/request-types';
import { application } from './application';
import { categories } from './filter/filters/filters-categories';
import { webRequestService } from './filter/request-blocking';
import { filteringLog } from './filter/filtering-log';
import { pageStats } from './filter/page-stats';
import { backend } from './filter/filters/service-client';
import { subscriptions } from './filter/filters/subscription';
import { filteringApi } from './filter/filtering-api';
import { stealthService } from './filter/services/stealth-service';
import { prefs } from './prefs';
import { whitelist } from './filter/whitelist';
import { documentFilterService } from './filter/services/document-filter';
import { antiBannerService } from './filter/antibanner';

/**
 *  Initialize Content => BackgroundPage messaging
 */
const init = () => {
    /**
     * Contains event listeners from content pages
     */
    const eventListeners = Object.create(null);

    /**
     * Adds event listener from content page
     * @param events
     * @param sender
     */
    function processAddEventListener(events, sender) {
        const listenerId = listeners.addSpecifiedListener(events, (...args) => {
            const sender = eventListeners[listenerId];
            if (sender) {
                tabsApi.sendMessage(sender.tab.tabId, {
                    type: 'notifyListeners',
                    data: args,
                });
            }
        });
        eventListeners[listenerId] = sender;
        return { listenerId };
    }

    /**
     * Constructs objects that uses on extension pages, like: options.html, thankyou.html etc
     */
    function processInitializeFrameScriptRequest() {
        const enabledFilters = Object.create(null);

        const AntiBannerFiltersId = utils.filters.ids;

        for (const key in AntiBannerFiltersId) {
            if (AntiBannerFiltersId.hasOwnProperty(key)) {
                const filterId = AntiBannerFiltersId[key];
                const enabled = application.isFilterEnabled(filterId);
                if (enabled) {
                    enabledFilters[filterId] = true;
                }
            }
        }

        return {
            userSettings: settings.getAllSettings(),
            enabledFilters,
            filtersMetadata: subscriptions.getFilters(),
            requestFilterInfo: filteringApi.getRequestFilterInfo(),
            environmentOptions: {
                isMacOs: browserUtils.isMacOs(),
                canBlockWebRTC: stealthService.canBlockWebRTC(),
                isChrome: browserUtils.isChromeBrowser(),
                Prefs: {
                    locale: backgroundPage.app.getLocale(),
                    mobile: prefs.mobile || false,
                },
                appVersion: backgroundPage.app.getVersion(),
            },
            constants: {
                AntiBannerFiltersId: utils.filters.ids,
                EventNotifierTypes: listeners.events,
            },
        };
    }

    /**
     * Saves css hits from content-script.
     * Message includes stats field. [{filterId: 1, ruleText: 'rule1'}, {filterId: 2, ruleText: 'rule2'}...]
     * @param tab
     * @param stats
     */
    function processSaveCssHitStats(tab, stats) {
        if (!webRequestService.isCollectingCosmeticRulesHits(tab)) {
            return;
        }
        const frameUrl = frames.getMainFrameUrl(tab);
        for (let i = 0; i < stats.length; i += 1) {
            const stat = stats[i];
            const rule = new TSUrlFilter.CosmeticRule(stat.ruleText, stat.filterId);
            webRequestService.recordRuleHit(tab, rule, frameUrl);
            filteringLog.addCosmeticEvent(tab, stat.element, tab.url, RequestTypes.DOCUMENT, rule);
        }
    }

    const processGetOptionsData = () => {
        return {
            settings: settings.getAllSettings(),
            appVersion: backgroundPage.app.getVersion(),
            filtersMetadata: categories.getFiltersMetadata(),
            filtersInfo: antiBannerService.getRequestFilterInfo(),
            constants: {
                AntiBannerFiltersId: utils.filters.ids,
            },
        };
    };

    /**
     * Main function for processing messages from content-scripts
     *
     * @param message
     * @param sender
     * @returns {*}
     */
    const handleMessage = async (message, sender) => {
        const { data, type } = message;

        switch (type) {
            case 'getOptionsData': {
                const result = await processGetOptionsData();
                return result;
            }
            case 'unWhiteListFrame':
                userrules.unWhiteListFrame(message.frameInfo);
                break;
            case 'createEventListener': {
                const { events } = data;
                return processAddEventListener(events, sender);
            }
            case 'removeListener': {
                const { listenerId } = message;
                listeners.removeListener(listenerId);
                delete eventListeners[listenerId];
                break;
            }
            case 'initializeFrameScript':
                return processInitializeFrameScriptRequest();
            case 'changeUserSetting':
                settings.setProperty(message.key, message.value);
                break;
            case 'checkRequestFilterReady':
                return { ready: filteringApi.isReady() };
            case 'addAndEnableFilter': {
                const { filterId } = data;
                await application.addAndEnableFilters([filterId]);
                break;
            }
            case 'disableAntiBannerFilter': {
                const { filterId, remove } = data;
                if (remove) {
                    application.uninstallFilters([filterId]);
                } else {
                    application.disableFilters([filterId]);
                }
                break;
            }
            case 'removeAntiBannerFilter': {
                const { filterId } = data;
                application.removeFilter(filterId);
                break;
            }
            case 'enableFiltersGroup': {
                const { groupId } = data;
                await categories.enableFiltersGroup(groupId);
                break;
            }
            case 'disableFiltersGroup': {
                const { groupId } = data;
                categories.disableFiltersGroup(groupId);
                break;
            }
            case 'changeDefaultWhiteListMode':
                whitelist.changeDefaultWhiteListMode(message.enabled);
                break;
            case 'getWhiteListDomains': {
                const whiteListDomains = whitelist.getWhiteListDomains();
                const appVersion = backgroundPage.app.getVersion();
                return {
                    content: whiteListDomains.join('\r\n'),
                    appVersion,
                };
            }
            case 'saveWhiteListDomains': {
                const domains = message.content.split(/[\r\n]+/)
                    .map(string => string.trim())
                    .filter(string => string.length > 0);
                whitelist.updateWhiteListDomains(domains);
                break;
            }
            case 'getUserRules': {
                const content = await userrules.getUserRulesText();
                const appVersion = backgroundPage.app.getVersion();
                return { content, appVersion };
            }
            case 'saveUserRules': {
                const { value } = data;
                userrules.updateUserRulesText(value);
                // We are waiting until request filter is updated
                return new Promise((resolve) => {
                    const listenerId = listeners.addListener((event) => {
                        if (event === listeners.REQUEST_FILTER_UPDATED) {
                            listeners.removeListener(listenerId);
                            resolve();
                        }
                    });
                });
            }
            case 'addUserRule':
                userrules.addRules([message.ruleText]);
                break;
            case 'removeUserRule':
                userrules.removeRule(message.ruleText);
                break;
            case 'checkAntiBannerFiltersUpdate': {
                const { filters } = data;
                return uiService.checkFiltersUpdates(filters);
            }
            case 'loadCustomFilterInfo':
                try {
                    const { url, title } = data;
                    const res = await application.loadCustomFilterInfo(url, { title });
                    return res;
                } catch (e) {
                    return {};
                }
            case 'subscribeToCustomFilter': {
                const { customUrl, name: title, trusted } = data.filter;
                try {
                    const filter = await application.loadCustomFilter(customUrl, { title, trusted });
                    await application.addAndEnableFilters([filter.filterId]);
                    return filter;
                } catch (e) {
                    // do nothing
                }
                break;
            }
            case 'getFiltersMetadata':
                return categories.getFiltersMetadata();
            case 'setFiltersUpdatePeriod':
                settings.setFiltersUpdatePeriod(message.updatePeriod);
                break;
            case 'openThankYouPage':
                uiService.openThankYouPage();
                break;
            case 'openExtensionStore':
                uiService.openExtensionStore();
                break;
            case 'openFilteringLog':
                uiService.openFilteringLog(message.tabId);
                break;
            case 'openExportRulesTab':
                uiService.openExportRulesTab(message.hash);
                break;
            case 'openSafebrowsingTrusted': {
                safebrowsing.addToSafebrowsingTrusted(message.url);
                const tab = await tabsApi.getActive();
                if (tab) {
                    tabsApi.reload(tab.tabId, message.url);
                }
                break;
            }
            case 'openTab':
                uiService.openTab(message.url, message.options);
                break;
            case 'resetBlockedAdsCount':
                frames.resetBlockedAdsCount();
                break;
            case 'getSelectorsAndScripts': {
                let urlForSelectors;
                // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/1498
                // when document url for iframe is about:blank then we use tab url
                if (!utils.url.isHttpOrWsRequest(message.documentUrl) && sender.frameId !== 0) {
                    urlForSelectors = sender.tab.url;
                } else {
                    urlForSelectors = message.documentUrl;
                }
                return webRequestService.processGetSelectorsAndScripts(sender.tab, urlForSelectors) || {};
            }
            case 'checkPageScriptWrapperRequest': {
                const block = webRequestService.checkPageScriptWrapperRequest(
                    sender.tab,
                    message.elementUrl,
                    message.documentUrl,
                    message.requestType,
                );
                return {
                    block,
                    requestId: message.requestId,
                };
            }
            case 'processShouldCollapse': {
                const collapse = webRequestService.processShouldCollapse(
                    sender.tab,
                    message.elementUrl,
                    message.documentUrl,
                    message.requestType,
                );
                return {
                    collapse,
                    requestId: message.requestId,
                };
            }
            case 'processShouldCollapseMany': {
                const requests = webRequestService.processShouldCollapseMany(
                    sender.tab,
                    message.documentUrl,
                    message.requests,
                );
                return { requests };
            }
            case 'onOpenFilteringLogPage':
                filteringLog.onOpenFilteringLogPage();
                break;
            case 'onCloseFilteringLogPage':
                filteringLog.onCloseFilteringLogPage();
                break;
            case 'reloadTabById':
                if (!message.preserveLogEnabled) {
                    filteringLog.clearEventsByTabId(message.tabId);
                }
                tabsApi.reload(message.tabId);
                break;
            case 'clearEventsByTabId':
                filteringLog.clearEventsByTabId(message.tabId);
                break;
            case 'getTabFrameInfoById': {
                if (message.tabId) {
                    const frameInfo = frames.getFrameInfo({ tabId: message.tabId });
                    return { frameInfo };
                }

                const tab = await tabsApi.getActive();
                if (tab) {
                    const frameInfo = frames.getFrameInfo(tab);
                    return { frameInfo };
                }

                break;
            }
            case 'getFilteringInfoByTabId': {
                const filteringInfo = filteringLog.getFilteringInfoByTabId(message.tabId);
                return { filteringInfo };
            }
            case 'synchronizeOpenTabs': {
                const tabs = await filteringLog.synchronizeOpenTabs();
                return { tabs };
            }
            case 'addFilterSubscription': {
                const { url, title } = message;
                const hashOptions = {
                    action: 'add_filter_subscription',
                    title,
                    url,
                };
                uiService.openSettingsTab('antibanner0', hashOptions);
                break;
            }
            case 'showAlertMessagePopup':
                uiService.showAlertMessagePopup(message.title, message.text);
                break;
            // Popup methods
            case 'addWhiteListDomainPopup': {
                const tab = await tabsApi.getActive();
                if (tab) {
                    uiService.whiteListTab(tab);
                }
                break;
            }
            case 'removeWhiteListDomainPopup': {
                const tab = await tabsApi.getActive();
                if (tab) {
                    uiService.unWhiteListTab(tab);
                }
                break;
            }
            case 'changeApplicationFilteringDisabled':
                uiService.changeApplicationFilteringDisabled(message.disabled);
                break;
            case 'openSiteReportTab':
                uiService.openSiteReportTab(message.url);
                break;
            case 'openAbuseTab':
                uiService.openAbuseTab(message.url);
                break;
            case 'openSettingsTab':
                uiService.openSettingsTab();
                break;
            case 'openAssistant':
                uiService.openAssistant();
                break;
            case 'getTabInfoForPopup': {
                const tab = await tabsApi.getActive();
                if (tab) {
                    const frameInfo = frames.getFrameInfo(tab);
                    return {
                        frameInfo,
                        options: {
                            showStatsSupported: true,
                            isFirefoxBrowser: browserUtils.isFirefoxBrowser(),
                            showInfoAboutFullVersion: settings.isShowInfoAboutAdguardFullVersion(),
                            isMacOs: browserUtils.isMacOs(),
                            isEdgeBrowser: browserUtils.isEdgeBrowser()
                                || browserUtils.isEdgeChromiumBrowser(),
                            notification: notifications.getCurrentNotification(),
                            isDisableShowAdguardPromoInfo: settings.isDisableShowAdguardPromoInfo(),
                        },
                    };
                }
                break;
            }
            case 'setNotificationViewed':
                notifications.setNotificationViewed(message.withDelay);
                break;
            case 'getStatisticsData':
                // There can't be data till localstorage is initialized
                if (!localStorage.isInitialized()) {
                    return {};
                }
                return {
                    stats: pageStats.getStatisticsData(),
                };
            case 'resizePanelPopup':
                backgroundPage.browserAction.resize(message.width, message.height);
                break;
            case 'closePanelPopup':
                backgroundPage.browserAction.close();
                break;
            case 'sendFeedback':
                backend.sendUrlReport(message.url, message.topic, message.comment);
                break;
            case 'saveCssHitStats':
                processSaveCssHitStats(sender.tab, message.stats);
                break;
            case 'loadSettingsJson': {
                const appVersion = backgroundPage.app.getVersion();
                const json = await settingsProvider.loadSettingsBackup();
                return {
                    content: json,
                    appVersion,
                };
            }
            case 'applySettingsJson':
                settingsProvider.applySettingsBackup(message.json);
                break;
            case 'disableGetPremiumNotification':
                settings.disableShowAdguardPromoInfo();
                break;
            case 'addUrlToTrusted':
                await documentFilterService.addToTrusted(message.url);
                break;
            case 'isLocalStorageInitialized':
                return { isLocalStorageInitialized: localStorage.isInitialized() };
            default:
                // Unhandled message
                throw new Error(`There is no such message type ${message.type}`);
        }

        return Promise.resolve();
    };

    // Add event listener from content-script messages
    backgroundPage.runtime.onMessage.addListener(handleMessage);
};

export const contentMessageHandler = {
    init,
};
