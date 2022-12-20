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
} from '../../api';
import { ContextMenuAction, contextMenuEvents } from '../../events';
import { ForwardFrom } from '../../../common/forward';

export type InitializeFrameScriptResponse = {
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

export class UiService {
    public static async init(): Promise<void> {
        await toasts.init();

        messageHandler.addListener(MessageType.OpenTab, TabsApi.openTab);

        messageHandler.addListener(MessageType.OpenSettingsTab, PagesApi.openSettingsPage);
        contextMenuEvents.addListener(ContextMenuAction.OpenSettings, PagesApi.openSettingsPage);

        messageHandler.addListener(MessageType.OpenFilteringLog, PagesApi.openFilteringLogPage);
        contextMenuEvents.addListener(ContextMenuAction.OpenLog, PagesApi.openFilteringLogPage);

        messageHandler.addListener(MessageType.OpenAbuseTab, UiService.openAbusePage);
        contextMenuEvents.addListener(ContextMenuAction.ComplaintWebsite, UiService.openAbusePageFromPContextMenu);

        messageHandler.addListener(MessageType.OpenSiteReportTab, UiService.openSiteReportPage);
        contextMenuEvents.addListener(ContextMenuAction.SecurityReport, UiService.openSiteReportPageFromContextMenu);

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

        messageHandler.addListener(MessageType.InitializeFrameScript, UiService.initializeFrameScript);

        tsWebExtTabApi.onUpdate.subscribe(UiApi.update);
        tsWebExtTabApi.onActivated.subscribe(UiApi.update);

        defaultFilteringLog.addEventListener(FilteringEventType.APPLY_BASIC_RULE, UiService.onBasicRuleApply);
    }

    private static async openAbusePage({ data }: OpenAbuseTabMessage): Promise<void> {
        const { url, from } = data;

        await PagesApi.openAbusePage(url, from);
    }

    private static async openAbusePageFromPContextMenu(): Promise<void> {
        const activeTab = await TabsApi.getActive();

        if (activeTab?.url) {
            await PagesApi.openAbusePage(activeTab.url, ForwardFrom.ContextMenu);
        } else {
            Log.warn('Can`t open abuse page for active tab');
        }
    }

    private static async openSiteReportPage({ data }: OpenSiteReportTabMessage): Promise<void> {
        const { url, from } = data;

        await PagesApi.openSiteReportPage(url, from);
    }

    private static async openSiteReportPageFromContextMenu(): Promise<void> {
        const activeTab = await TabsApi.getActive();

        if (activeTab?.url) {
            await PagesApi.openSiteReportPage(activeTab.url, ForwardFrom.ContextMenu);
        } else {
            Log.warn('Can`t open site report page for active tab');
        }
    }

    private static initializeFrameScript(): InitializeFrameScriptResponse {
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

    private static async onBasicRuleApply({ data }: ApplyBasicRuleEvent): Promise<void> {
        const { rule, tabId } = data;

        const blockedCountIncrement = 1;

        await PageStatsApi.updateStats(rule.getFilterListId(), blockedCountIncrement);
        PageStatsApi.incrementTotalBlocked(blockedCountIncrement);

        const tabContext = tsWebExtTabApi.getTabContext(tabId);

        if (!tabContext) {
            return;
        }

        await UiApi.update(tabContext);
    }
}
