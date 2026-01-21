/**
 * Copyright (c) 2015-2025 Adguard Software Ltd.
 *
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
    tabsApi as tsWebExtTabsApi,
    defaultFilteringLog,
    FilteringEventType,
    type ApplyBasicRuleEvent,
} from '../../tswebextension';
import { logger } from '../../../common/logger';
import { messageHandler } from '../../message-handler';
import {
    MessageType,
    type OpenAbuseTabMessage,
    type OpenSiteReportTabMessage,
} from '../../../common/messages';
import { UserAgent } from '../../../common/user-agent';
import { engine } from '../../engine';
import { AntiBannerFiltersId, type AppearanceTheme } from '../../../common/constants';
import {
    toasts,
    FiltersApi,
    TabsApi,
    SettingsApi,
    PagesApi,
    pagesApi,
    AssistantApi,
    type SettingsData,
    type FilterMetadata,
    ContextMenuApi,
    UiApi,
    PageStatsApi,
} from '../../api';
import { ContextMenuAction, contextMenuEvents } from '../../events';
import { ForwardFrom } from '../../../common/forward';
import { SettingOption } from '../../schema';
import {
    Telemetry,
    TelemetryEventName,
    TelemetryScreenName,
} from '../telemetry';

/**
 * Init app data for extension pages.
 */
export type PageInitAppData = {
    userSettings: SettingsData;
    enabledFilters: Record<string, boolean>;
    filtersMetadata: FilterMetadata[];
    requestFilterInfo: {
        rulesCount: number;
    };
    environmentOptions: {
        isMacOs: boolean;
        canBlockWebRTC: boolean;
        isChrome: boolean;
        Prefs: {
            locale: string;
            mobile: boolean;
        };
        appVersion: string;
    };
};

/**
 * Init app data for blocking page.
 */
export type BlockingPageInitAppData = {
    /**
     * Theme of the extension.
     */
    theme: AppearanceTheme;

    /**
     * Filters metadata. Needed for displaying localized filter name.
     */
    filtersMetadata: FilterMetadata[];
};

/**
 * Service for processing extension UI events (navigation, popups, alerts etc.).
 */
export class UiService {
    /**
     * Increment value for request blocking counting and page stats collection.
     */
    private static blockedCountIncrement = 1;

    /**
     * Initializes **sync** UI services and registers listeners.
     *
     * For MV3, handlers should be registered on the top level in sync functions,
     * otherwise they may not work or work incorrectly.
     */
    public static syncInit(): void {
        // TODO add better handling for AdGuard for Firefox
        // Do not init context menu for mobile browsers
        if (browser.contextMenus) {
            ContextMenuApi.init();
        }

        contextMenuEvents.addListener(ContextMenuAction.OpenSettings, UiService.openSettingsPageWithTelemetry);
        contextMenuEvents.addListener(ContextMenuAction.OpenLog, UiService.openFilteringLogPageWithTelemetry);
        contextMenuEvents.addListener(ContextMenuAction.ComplaintWebsite, UiService.openAbusePageForActiveTab);
        contextMenuEvents.addListener(ContextMenuAction.SecurityReport, UiService.openSiteReportPageForActiveTab);
        contextMenuEvents.addListener(ContextMenuAction.BlockSiteAds, UiService.openAssistantWithTelemetry);
    }

    /**
     * Initialize linked **async** services and register listeners.
     */
    public static async init(): Promise<void> {
        await toasts.init();
        await UiApi.init();

        // TODO: consider moving the following to syncInit()
        messageHandler.addListener(MessageType.OpenSettingsTab, PagesApi.openSettingsPage);

        messageHandler.addListener(MessageType.OpenFilteringLog, PagesApi.openFilteringLogPage);

        messageHandler.addListener(MessageType.OpenAbuseTab, UiService.openAbusePage);

        messageHandler.addListener(MessageType.OpenSiteReportTab, UiService.openSiteReportPage);

        messageHandler.addListener(MessageType.OpenThankYouPage, pagesApi.openThankYouPage);
        messageHandler.addListener(MessageType.OpenExtensionStore, pagesApi.openExtensionStorePage);
        messageHandler.addListener(MessageType.OpenComparePage, PagesApi.openComparePage);
        messageHandler.addListener(
            MessageType.OpenChromeExtensionsSettingsPage,
            PagesApi.openChromeExtensionsSettingsPage,
        );
        messageHandler.addListener(MessageType.OpenExtensionDetailsPage, PagesApi.openExtensionDetailsPage);
        messageHandler.addListener(MessageType.OpenFullscreenUserRules, PagesApi.openFullscreenUserRulesPage);
        messageHandler.addListener(
            MessageType.UpdateFullscreenUserRulesTheme,
            PagesApi.updateFullscreenUserRulesPageTheme,
        );
        messageHandler.addListener(
            MessageType.AddFilteringSubscription,
            pagesApi.openSettingsPageWithCustomFilterModal,
        );

        messageHandler.addListener(MessageType.OpenAssistant, AssistantApi.openAssistant);

        messageHandler.addListener(MessageType.OpenRulesLimitsTab, PagesApi.openRulesLimitsPage);

        messageHandler.addListener(MessageType.InitializeFrameScript, UiService.getPageInitAppData);
        messageHandler.addListener(MessageType.InitializeBlockingPageScript, UiService.getBlockingPageInitAppData);
        messageHandler.addListener(MessageType.ScriptletCloseWindow, PagesApi.closePage);

        tsWebExtTabsApi.onCreate.subscribe(UiApi.update);
        tsWebExtTabsApi.onUpdate.subscribe(UiApi.update);
        tsWebExtTabsApi.onActivate.subscribe(UiApi.update);

        defaultFilteringLog.addEventListener(FilteringEventType.ApplyBasicRule, UiService.onBasicRuleApply);
    }

    /**
     * Handles {@link OpenAbuseTabMessage} and opens abuse page for passed site url in new tab.
     *
     * @param message Incoming {@link OpenAbuseTabMessage}.
     * @param message.data Site url and {@link ForwardFrom} token for creating abuse page url params.
     */
    private static async openAbusePage({ data }: OpenAbuseTabMessage): Promise<void> {
        const { url, from } = data;

        await pagesApi.openAbusePage(url, from);
    }

    /**
     * Opens abuse page for current active tab url in new tab.
     */
    private static async openAbusePageForActiveTab(): Promise<void> {
        await Telemetry.sendCustomEvent(
            TelemetryScreenName.MainPage,
            TelemetryEventName.TapReportIssueClick,
        );

        const activeTab = await TabsApi.getActive();

        if (activeTab?.url) {
            await pagesApi.openAbusePage(activeTab.url, ForwardFrom.ContextMenu);
        } else {
            logger.warn('[ext.UiService.openAbusePageForActiveTab]: cannot open abuse page for active tab, active tab is undefined');
        }
    }

    /**
     * Opens filtering log page with telemetry for context menu action.
     */
    private static async openFilteringLogPageWithTelemetry(): Promise<void> {
        await Telemetry.sendCustomEvent(
            TelemetryScreenName.MainPage,
            TelemetryEventName.TapFilteringLogClick,
        );

        await PagesApi.openFilteringLogPage();
    }

    /**
     * Opens settings page with telemetry for context menu action.
     */
    private static async openSettingsPageWithTelemetry(): Promise<void> {
        await Telemetry.sendCustomEvent(
            TelemetryScreenName.MainPage,
            TelemetryEventName.TapGeneralSettingsClick,
        );

        await PagesApi.openSettingsPage();
    }

    /**
     * Opens assistant with telemetry for context menu action.
     */
    private static async openAssistantWithTelemetry(): Promise<void> {
        await Telemetry.sendCustomEvent(
            TelemetryScreenName.MainPage,
            TelemetryEventName.MenuBlockAdsManuallyClick,
        );

        await AssistantApi.openAssistant();
    }

    /**
     * Handles {@link OpenSiteReportTabMessage} and opens site report page for passed site url in new tab.
     *
     * @param message Incoming {@link OpenSiteReportTabMessage}.
     * @param message.data Site url and {@link ForwardFrom} token for creating site report url params.
     */
    private static async openSiteReportPage({ data }: OpenSiteReportTabMessage): Promise<void> {
        const { url, from } = data;

        await PagesApi.openSiteReportPage(url, from);
    }

    /**
     * Opens site report page for current active tab url in new tab.
     */
    private static async openSiteReportPageForActiveTab(): Promise<void> {
        await Telemetry.sendCustomEvent(
            TelemetryScreenName.MainPage,
            TelemetryEventName.TapCheckWebsiteSecurityClick,
        );

        const activeTab = await TabsApi.getActive();

        if (activeTab?.url) {
            await PagesApi.openSiteReportPage(activeTab.url, ForwardFrom.ContextMenu);
        } else {
            logger.warn('[ext.UiService.openSiteReportPageForActiveTab]: cannot open site report page for active tab, active tab is undefined');
        }
    }

    /**
     * Returns {@link PageInitAppData} that uses on extension pages, like thankyou.html.
     *
     * @returns Init app data.
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
                rulesCount: engine.api.getRulesCount(),
            },
            environmentOptions: {
                isMacOs: UserAgent.isMacOs,
                /**
                 * Browsers api doesn't allow to get optional permissions
                 * via chrome.permissions.getAll and we can't check privacy
                 * availability via `browser.privacy !== undefined` till permission
                 * isn't enabled by the user.
                 *
                 * That's why use edge browser detection
                 * Privacy methods are not working at all in the Edge.
                 */
                canBlockWebRTC: !UserAgent.isEdge,
                isChrome: UserAgent.isChrome,
                Prefs: {
                    locale: browser.i18n.getUILanguage(),
                    mobile: UserAgent.isAndroid,
                },
                appVersion: browser.runtime.getManifest().version,
            },
        };
    }

    /**
     * Returns {@link BlockingPageInitAppData} that is used on blocking pages:
     * - blocked by rules;
     * - blocked by Safebrowsing.
     *
     * @returns Blocking page init app data.
     */
    private static getBlockingPageInitAppData(): BlockingPageInitAppData {
        return {
            theme: SettingsApi.getSetting(SettingOption.AppearanceTheme) as AppearanceTheme,
            filtersMetadata: FiltersApi.getFiltersMetadata(),
        };
    }

    /**
     * Handles {@link ApplyBasicRuleEvent} and update blocking request stats and counter.
     *
     * @param event Handled {@link ApplyBasicRuleEvent}.
     * @param event.data Event data.
     */
    private static async onBasicRuleApply({ data }: ApplyBasicRuleEvent): Promise<void> {
        const {
            isAllowlist,
            tabId,
            companyCategoryName,
        } = data;

        // If rule is not blocking, ignore it
        if (isAllowlist) {
            return;
        }

        if (companyCategoryName) {
            await PageStatsApi.updateStats(companyCategoryName, UiService.blockedCountIncrement);
            PageStatsApi.incrementTotalBlocked(UiService.blockedCountIncrement);
        }

        const tabContext = tsWebExtTabsApi.getTabContext(tabId);

        // If tab context is not found, do not update request blocking counter and icon badge for tab
        if (!tabContext) {
            return;
        }

        await UiApi.update(tabContext);
    }
}
