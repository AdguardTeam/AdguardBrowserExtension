/**
 * @file
 * This file is part of AdGuard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * AdGuard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * AdGuard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with AdGuard Browser Extension. If not, see <http://www.gnu.org/licenses/>.
 */
import browser from 'webextension-polyfill';
import {
    ApplyBasicRuleEvent,
    defaultFilteringLog,
    FilteringEventType,
    tabsApi as tsWebExtTabApi,
} from '@adguard/tswebextension';

import { Log } from '../../../common/log';
import { messageHandler } from '../../message-handler';
import {
    MessageType,
    OpenAbuseTabMessage,
    OpenSiteReportTabMessage,
} from '../../../common/messages';
import { UserAgent } from '../../../common/user-agent';
import { Engine } from '../../engine';
import { AntiBannerFiltersId, NotifierType } from '../../../common/constants';
import { listeners } from '../../notifier';

import {
    toasts,
    FiltersApi,
    TabsApi,
    SettingsApi,
    PagesApi,
    AssistantApi,
    UiApi,
    PageStatsApi,
    SettingsData,
    FilterMetadata,
    ContextMenuApi,
} from '../../api';
import { ContextMenuAction, contextMenuEvents } from '../../events';
import { ForwardFrom } from '../../../common/forward';

/**
 * Init app data for extension pages
 */
export type PageInitAppData = {
    userSettings: SettingsData,
    enabledFilters: Record<string, boolean>,
    filtersMetadata: FilterMetadata[],
    requestFilterInfo: {
        rulesCount: number,
    },
    environmentOptions: {
        isMacOs: boolean,
        canBlockWebRTC: boolean,
        isChrome: boolean,
        Prefs: {
            locale: string,
            mobile: boolean,
        },
        appVersion: string,
    },
    constants: {
        AntiBannerFiltersId: typeof AntiBannerFiltersId,
        EventNotifierType: typeof NotifierType,
    },
};

/**
 * Service for processing extension UI events (navigation, popups, alerts etc.)
 */
export class UiService {
    /**
     * Increment value for request blocking counting and page stats collection
     */
    private static blockedCountIncrement = 1;

    /**
     * Initialize linked services and register listeners
     */
    public static async init(): Promise<void> {
        await toasts.init();
        ContextMenuApi.init();

        messageHandler.addListener(MessageType.OpenSettingsTab, PagesApi.openSettingsPage);
        contextMenuEvents.addListener(ContextMenuAction.OpenSettings, PagesApi.openSettingsPage);

        messageHandler.addListener(MessageType.OpenFilteringLog, PagesApi.openFilteringLogPage);
        contextMenuEvents.addListener(ContextMenuAction.OpenLog, PagesApi.openFilteringLogPage);

        messageHandler.addListener(MessageType.OpenAbuseTab, UiService.openAbusePage);
        contextMenuEvents.addListener(ContextMenuAction.ComplaintWebsite, UiService.openAbusePageForActiveTab);

        messageHandler.addListener(MessageType.OpenSiteReportTab, UiService.openSiteReportPage);
        contextMenuEvents.addListener(ContextMenuAction.SecurityReport, UiService.openSiteReportPageForActiveTab);

        messageHandler.addListener(MessageType.OpenThankyouPage, PagesApi.openThankYouPage);
        messageHandler.addListener(MessageType.OpenExtensionStore, PagesApi.openExtensionStorePage);
        messageHandler.addListener(MessageType.OpenComparePage, PagesApi.openComparePage);
        messageHandler.addListener(MessageType.OpenFullscreenUserRules, PagesApi.openFullscreenUserRulesPage);
        messageHandler.addListener(
            MessageType.AddFilteringSubscription,
            PagesApi.openSettingsPageWithCustomFilterModal,
        );

        messageHandler.addListener(MessageType.OpenAssistant, AssistantApi.openAssistant);
        contextMenuEvents.addListener(ContextMenuAction.BlockSiteAds, AssistantApi.openAssistant);

        messageHandler.addListener(MessageType.InitializeFrameScript, UiService.getPageInitAppData);
        messageHandler.addListener(MessageType.ScriptletCloseWindow, PagesApi.closePage);

        tsWebExtTabApi.onCreate.subscribe(UiApi.update);
        tsWebExtTabApi.onUpdate.subscribe(UiApi.update);
        tsWebExtTabApi.onActivated.subscribe(UiApi.update);

        defaultFilteringLog.addEventListener(FilteringEventType.APPLY_BASIC_RULE, UiService.onBasicRuleApply);
    }

    /**
     * Handles {@link OpenAbuseTabMessage} and opens abuse page for passed site url in new tab
     *
     * @param message - incoming {@link OpenAbuseTabMessage}
     * @param message.data - site url and {@link ForwardFrom} token for creating abuse page url params
     */
    private static async openAbusePage({ data }: OpenAbuseTabMessage): Promise<void> {
        const { url, from } = data;

        await PagesApi.openAbusePage(url, from);
    }

    /**
     * Opens abuse page for current active tab url in new tab
     */
    private static async openAbusePageForActiveTab(): Promise<void> {
        const activeTab = await TabsApi.getActive();

        if (activeTab?.url) {
            await PagesApi.openAbusePage(activeTab.url, ForwardFrom.ContextMenu);
        } else {
            Log.warn('Can`t open abuse page for active tab');
        }
    }

    /**
     * Handles {@link OpenSiteReportTabMessage} and opens site report page for passed site url in new tab
     *
     * @param message - incoming {@link OpenSiteReportTabMessage}
     * @param message.data - site url and {@link ForwardFrom} token for creating site report url params
     */
    private static async openSiteReportPage({ data }: OpenSiteReportTabMessage): Promise<void> {
        const { url, from } = data;

        await PagesApi.openSiteReportPage(url, from);
    }

    /**
     * Opens site report page for current active tab url in new tab
     */
    private static async openSiteReportPageForActiveTab(): Promise<void> {
        const activeTab = await TabsApi.getActive();

        if (activeTab?.url) {
            await PagesApi.openSiteReportPage(activeTab.url, ForwardFrom.ContextMenu);
        } else {
            Log.warn('Can`t open site report page for active tab');
        }
    }

    /**
     * Gets {@link PageInitAppData} that uses on extension pages, like thankyou.html
     *
     * @returns init app data
     */
    private static getPageInitAppData(): PageInitAppData {
        const enabledFilters: Record<string, boolean> = {};
        Object.values(AntiBannerFiltersId).forEach((filterId) => {
            const enabled = FiltersApi.isFilterEnabled(Number(filterId));
            if (enabled) {
                enabledFilters[filterId] = true;
            }
        });

        return {
            userSettings: SettingsApi.getData(),
            enabledFilters,
            filtersMetadata: FiltersApi.getFiltersMetadata(),
            requestFilterInfo: {
                rulesCount: Engine.api.getRulesCount(),
            },
            environmentOptions: {
                isMacOs: UserAgent.isMacOs,
                /**
                 * Browsers api doesn't allow to get optional permissions
                 * via chrome.permissions.getAll and we can't check privacy
                 * availability via `browser.privacy !== undefined` till permission
                 * isn't enabled by the user
                 *
                 * That's why use edge browser detection
                 * Privacy methods are not working at all in the Edge
                 */
                canBlockWebRTC: !UserAgent.isEdge,
                isChrome: UserAgent.isChrome,
                Prefs: {
                    locale: browser.i18n.getUILanguage(),
                    mobile: UserAgent.isAndroid,
                },
                appVersion: browser.runtime.getManifest().version,
            },
            constants: {
                AntiBannerFiltersId,
                EventNotifierType: listeners.events,
            },
        };
    }

    /**
     * Handles {@link ApplyBasicRuleEvent} and update blocking request stats and counter
     *
     * @param event - {@link ApplyBasicRuleEvent}
     * @param event.data - event data
     */
    private static async onBasicRuleApply({ data }: ApplyBasicRuleEvent): Promise<void> {
        const { rule, tabId } = data;

        // If rule is not blocking, ignore it
        if (rule.isAllowlist()) {
            return;
        }

        await PageStatsApi.updateStats(rule.getFilterListId(), UiService.blockedCountIncrement);
        PageStatsApi.incrementTotalBlocked(UiService.blockedCountIncrement);

        const tabContext = tsWebExtTabApi.getTabContext(tabId);

        // If tab context is not found, do not update request blocking counter and icon badge for tab
        if (!tabContext) {
            return;
        }

        await UiApi.update(tabContext);
    }
}
