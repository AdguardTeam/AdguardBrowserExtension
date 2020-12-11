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
import { subscriptions } from './filter/filters/subscription';
import { filteringApi } from './filter/filtering-api';
import { stealthService } from './filter/services/stealth-service';
import { prefs } from './prefs';
import { allowlist } from './filter/allowlist';
import { documentFilterService } from './filter/services/document-filter';
import { antiBannerService } from './filter/antibanner';
import { MESSAGE_TYPES } from '../common/constants';

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
                    type: MESSAGE_TYPES.NOTIFY_LISTENERS,
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
            case MESSAGE_TYPES.GET_OPTIONS_DATA: {
                return processGetOptionsData();
            }
            case MESSAGE_TYPES.UN_ALLOWLIST_FRAME: {
                const { frameInfo } = data;
                userrules.unAllowlistFrame(frameInfo);
                break;
            }
            case MESSAGE_TYPES.CREATE_EVENT_LISTENER: {
                const { events } = data;
                return processAddEventListener(events, sender);
            }
            case MESSAGE_TYPES.REMOVE_LISTENER: {
                const { listenerId } = data;
                listeners.removeListener(listenerId);
                delete eventListeners[listenerId];
                break;
            }
            case MESSAGE_TYPES.INITIALIZE_FRAME_SCRIPT:
                return processInitializeFrameScriptRequest();
            case MESSAGE_TYPES.CHANGE_USER_SETTING:
                settings.setProperty(message.key, message.value);
                break;
            case MESSAGE_TYPES.CHECK_REQUEST_FILTER_READY:
                return { ready: filteringApi.isReady() };
            case MESSAGE_TYPES.ADD_AND_ENABLE_FILTER: {
                const { filterId } = data;
                return application.addAndEnableFilters([filterId]);
            }
            case MESSAGE_TYPES.DISABLE_ANTIBANNER_FILTER: {
                const { filterId, remove } = data;
                if (remove) {
                    application.uninstallFilters([filterId]);
                } else {
                    application.disableFilters([filterId]);
                }
                break;
            }
            case MESSAGE_TYPES.REMOVE_ANTIBANNER_FILTER: {
                const { filterId } = data;
                application.removeFilter(filterId);
                break;
            }
            case MESSAGE_TYPES.ENABLE_FILTERS_GROUP: {
                const { groupId } = data;
                await categories.enableFiltersGroup(groupId);
                break;
            }
            case MESSAGE_TYPES.DISABLE_FILTERS_GROUP: {
                const { groupId } = data;
                categories.disableFiltersGroup(groupId);
                break;
            }
            case MESSAGE_TYPES.GET_ALLOWLIST_DOMAINS: {
                const allowlistDomains = allowlist.getAllowlistDomains();
                const appVersion = backgroundPage.app.getVersion();
                return {
                    content: allowlistDomains.join('\r\n'),
                    appVersion,
                };
            }
            case MESSAGE_TYPES.SAVE_ALLOWLIST_DOMAINS: {
                const { value } = data;
                const domains = value.split(/[\r\n]+/)
                    .map(string => string.trim())
                    .filter(string => string.length > 0);
                allowlist.updateAllowlistDomains(domains);
                break;
            }
            case MESSAGE_TYPES.GET_USER_RULES: {
                const content = await userrules.getUserRulesText();
                const appVersion = backgroundPage.app.getVersion();
                return { content, appVersion };
            }
            case MESSAGE_TYPES.SAVE_USER_RULES: {
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
            case MESSAGE_TYPES.ADD_USER_RULE: {
                const { ruleText } = data;
                userrules.addRules([ruleText]);
                break;
            }
            case MESSAGE_TYPES.REMOVE_USER_RULE: {
                const { ruleText } = data;
                userrules.removeRule(ruleText);
            }
                break;
            case MESSAGE_TYPES.CHECK_ANTIBANNER_FILTERS_UPDATE: {
                const { filters } = data;
                return uiService.checkFiltersUpdates(filters);
            }
            case MESSAGE_TYPES.LOAD_CUSTOM_FILTER_INFO:
                try {
                    const { url, title } = data;
                    return application.loadCustomFilterInfo(url, { title });
                } catch (e) {
                    return {};
                }
            case MESSAGE_TYPES.SUBSCRIBE_TO_CUSTOM_FILTER: {
                const { customUrl, name, trusted } = data.filter;
                try {
                    const filter = await application.loadCustomFilter(customUrl, { title: name, trusted });
                    await application.addAndEnableFilters([filter.filterId]);
                    return filter;
                } catch (e) {
                    // do nothing
                }
                break;
            }
            case MESSAGE_TYPES.OPEN_THANKYOU_PAGE:
                uiService.openThankYouPage();
                break;
            case MESSAGE_TYPES.OPEN_EXTENSION_STORE:
                uiService.openExtensionStore();
                break;
            case MESSAGE_TYPES.OPEN_FILTERING_LOG:
                uiService.openFilteringLog(message.tabId);
                break;
            case MESSAGE_TYPES.OPEN_SAFEBROWSING_TRUSTED: {
                safebrowsing.addToSafebrowsingTrusted(message.url);
                const tab = await tabsApi.getActive();
                if (tab) {
                    tabsApi.reload(tab.tabId, message.url);
                }
                break;
            }
            case MESSAGE_TYPES.OPEN_TAB: {
                const { url, options } = data;
                return uiService.openTab(url, options);
            }
            case MESSAGE_TYPES.RESET_BLOCKED_ADS_COUNT:
                frames.resetBlockedAdsCount();
                break;
            case MESSAGE_TYPES.GET_SELECTORS_AND_SCRIPTS: {
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
            case MESSAGE_TYPES.CHECK_PAGE_SCRIPT_WRAPPER_REQUEST: {
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
            case MESSAGE_TYPES.PROCESS_SHOULD_COLLAPSE: {
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
            case MESSAGE_TYPES.PROCESS_SHOULD_COLLAPSE_MANY: {
                const requests = webRequestService.processShouldCollapseMany(
                    sender.tab,
                    message.documentUrl,
                    message.requests,
                );
                return { requests };
            }
            case MESSAGE_TYPES.ON_OPEN_FILTERING_LOG_PAGE:
                filteringLog.onOpenFilteringLogPage();
                break;
            case MESSAGE_TYPES.ON_CLOSE_FILTERING_LOG_PAGE:
                filteringLog.onCloseFilteringLogPage();
                break;
            case MESSAGE_TYPES.CLEAR_EVENTS_BY_TAB_ID:
                filteringLog.clearEventsByTabId(data.tabId);
                break;
            case MESSAGE_TYPES.REFRESH_PAGE:
                if (!data.preserveLogEnabled) {
                    filteringLog.clearEventsByTabId(data.tabId);
                }
                await tabsApi.reload(data.tabId);
                break;
            case MESSAGE_TYPES.GET_TAB_FRAME_INFO_BY_ID: {
                if (data.tabId) {
                    const frameInfo = frames.getFrameInfo({ tabId: data.tabId });
                    return { frameInfo };
                }

                const tab = await tabsApi.getActive();
                if (tab) {
                    const frameInfo = frames.getFrameInfo(tab);
                    return { frameInfo };
                }

                break;
            }
            case MESSAGE_TYPES.GET_FILTERING_INFO_BY_TAB_ID: {
                const { tabId } = data;
                return filteringLog.getFilteringInfoByTabId(tabId);
            }
            case MESSAGE_TYPES.SYNCHRONIZE_OPEN_TABS: {
                return filteringLog.synchronizeOpenTabs();
            }
            case MESSAGE_TYPES.ADD_FILTERING_SUBSCRIPTION: {
                const { url, title } = message;
                await uiService.openCustomFiltersModal(url, title);
                break;
            }
            // Popup methods
            case MESSAGE_TYPES.ADD_ALLOWLIST_DOMAIN_POPUP: {
                const tab = await tabsApi.getActive();
                if (tab) {
                    uiService.allowlistTab(tab);
                }
                break;
            }
            case MESSAGE_TYPES.REMOVE_ALLOWLIST_DOMAIN: {
                const tab = await tabsApi.getActive();
                if (tab) {
                    uiService.unAllowlistTab(tab);
                }
                break;
            }
            case MESSAGE_TYPES.CHANGE_APPLICATION_FILTERING_DISABLED: {
                const { state } = data;
                uiService.changeApplicationFilteringDisabled(state);
                break;
            }
            case MESSAGE_TYPES.OPEN_SITE_REPORT_TAB: {
                if (data) {
                    const { url } = data;
                    uiService.openSiteReportTab(url);
                } else {
                    uiService.openSiteReportTab(message.url);
                }
                break;
            }
            case MESSAGE_TYPES.OPEN_ABUSE_TAB:
                if (data) {
                    const { url } = data;
                    uiService.openAbuseTab(url);
                } else {
                    uiService.openAbuseTab(message.url);
                }
                break;
            case MESSAGE_TYPES.OPEN_SETTINGS_TAB:
                uiService.openSettingsTab();
                break;
            case MESSAGE_TYPES.OPEN_ASSISTANT:
                uiService.openAssistant();
                break;
            case MESSAGE_TYPES.GET_TAB_INFO_FOR_POPUP: {
                const tab = await tabsApi.getActive(data.tabId);
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
            case MESSAGE_TYPES.SET_NOTIFICATION_VIEWED:
                notifications.setNotificationViewed(message.withDelay);
                break;
            case MESSAGE_TYPES.GET_STATISTICS_DATA:
                // There can't be data till localstorage is initialized
                if (!localStorage.isInitialized()) {
                    return {};
                }
                return {
                    stats: pageStats.getStatisticsData(),
                };
            case MESSAGE_TYPES.SAVE_CSS_HITS_STATS:
                processSaveCssHitStats(sender.tab, message.stats);
                break;
            case MESSAGE_TYPES.LOAD_SETTINGS_JSON: {
                const appVersion = backgroundPage.app.getVersion();
                const json = await settingsProvider.loadSettingsBackup();
                return {
                    content: json,
                    appVersion,
                };
            }
            case MESSAGE_TYPES.APPLY_SETTINGS_JSON:
                settingsProvider.applySettingsBackup(message.json);
                break;
            case MESSAGE_TYPES.ADD_URL_TO_TRUSTED:
                await documentFilterService.addToTrusted(message.url);
                break;
            default:
                // Unhandled message
                throw new Error(`There is no such message type ${message.type}`);
        }

        return Promise.resolve();
    };

    // Add event listener from content-script messages
    backgroundPage.runtime.onMessage.addListener(handleMessage);
};

export const messageHandler = {
    init,
};
