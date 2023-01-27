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
    TabContext,
    tabsApi,
    defaultFilteringLog,
    FilteringEventType,
    SendRequestEvent,
    ReceiveResponseEvent,
    TabReloadEvent,
    RemoveParamEvent,
    RemoveHeaderEvent,
    ApplyCosmeticRuleEvent,
    ApplyBasicRuleEvent,
    ApplyCspRuleEvent,
    CookieEvent,
    JsInjectEvent,
    ReplaceRuleApplyEvent,
    StealthActionEvent,
} from '@adguard/tswebextension';

import { messageHandler } from '../message-handler';
import {
    ClearEventsByTabIdMessage,
    GetFilteringInfoByTabIdMessage,
    MessageType,
    PageRefreshMessage,
    SetFilteringLogWindowStateMessage,
    SetPreserveLogStateMessage,
} from '../../common/messages';
import { UserAgent } from '../../common/user-agent';
import { FILTERING_LOG_WINDOW_STATE } from '../../common/constants';

import {
    FiltersApi,
    FilterMetadata,
    FilteringLogApi,
    filteringLogApi,
    SettingsApi,
    SettingsData,
    FilteringLogTabInfo,
    HitStatsApi,
} from '../api';

import { storage } from '../storages';
import { SettingOption } from '../schema';

export type GetFilteringLogDataResponse = {
    filtersMetadata: FilterMetadata[],
    settings: SettingsData,
    preserveLogEnabled: boolean,
};

export class FilteringLogService {
    public static init(): void {
        messageHandler.addListener(MessageType.GetFilteringLogData, FilteringLogService.onGetFilteringLogData);
        messageHandler.addListener(MessageType.SynchronizeOpenTabs, FilteringLogService.onSyncOpenTabs);
        messageHandler.addListener(
            MessageType.GetFilteringInfoByTabId,
            FilteringLogService.onGetFilteringLogInfoById,
        );
        messageHandler.addListener(MessageType.OnOpenFilteringLogPage, filteringLogApi.onOpenFilteringLogPage);
        messageHandler.addListener(MessageType.OnCloseFilteringLogPage, filteringLogApi.onCloseFilteringLogPage);
        messageHandler.addListener(MessageType.ClearEventsByTabId, FilteringLogService.onClearEventsByTabId);
        messageHandler.addListener(MessageType.RefreshPage, FilteringLogService.onRefreshPage);
        messageHandler.addListener(MessageType.SetPreserveLogState, FilteringLogService.onSetPreserveLogState);
        messageHandler.addListener(
            MessageType.SetFilteringLogWindowState,
            FilteringLogService.onSetFilteringLogWindowState,
        );

        tabsApi.onCreate.subscribe(FilteringLogService.onTabCreate);
        tabsApi.onUpdate.subscribe(FilteringLogService.onTabUpdate);
        tabsApi.onDelete.subscribe(FilteringLogService.onTabRemove);

        defaultFilteringLog.addEventListener(FilteringEventType.SEND_REQUEST, FilteringLogService.onSendRequest);
        defaultFilteringLog.addEventListener(FilteringEventType.TAB_RELOAD, FilteringLogService.onTabReload);
        defaultFilteringLog.addEventListener(
            FilteringEventType.RECEIVE_RESPONSE,
            FilteringLogService.onReceiveResponse,
        );
        defaultFilteringLog.addEventListener(
            FilteringEventType.APPLY_BASIC_RULE,
            FilteringLogService.onApplyBasicRule,
        );

        defaultFilteringLog.addEventListener(
            FilteringEventType.APPLY_CSP_RULE,
            FilteringLogService.onApplyCspRule,
        );

        defaultFilteringLog.addEventListener(
            FilteringEventType.APPLY_COSMETIC_RULE,
            FilteringLogService.onApplyCosmeticRule,
        );
        defaultFilteringLog.addEventListener(FilteringEventType.REMOVE_PARAM, FilteringLogService.onRemoveParam);
        defaultFilteringLog.addEventListener(FilteringEventType.REMOVE_HEADER, FilteringLogService.onRemoveheader);

        defaultFilteringLog.addEventListener(FilteringEventType.COOKIE, FilteringLogService.onCookie);

        defaultFilteringLog.addEventListener(FilteringEventType.JS_INJECT, FilteringLogService.onScriptInjection);

        defaultFilteringLog.addEventListener(FilteringEventType.STEALTH_ACTION, FilteringLogService.onStealthAction);

        if (UserAgent.isFirefox) {
            defaultFilteringLog.addEventListener(
                FilteringEventType.REPLACE_RULE_APPLY,
                FilteringLogService.onReplaceRuleApply,
            );
        }
    }

    private static onSendRequest({ data }: SendRequestEvent): void {
        const { tabId, ...eventData } = data;

        filteringLogApi.addEventData(tabId, eventData);
    }

    private static onTabReload(event: TabReloadEvent): void {
        const { tabId } = event.data;
        filteringLogApi.clearEventsByTabId(tabId);
    }

    private static onApplyBasicRule({ data }: ApplyBasicRuleEvent): void {
        const {
            tabId,
            eventId,
            rule,
        } = data;

        filteringLogApi.updateEventData(tabId, eventId, {
            requestRule: FilteringLogApi.createNetworkRuleEventData(rule),
        });

        if (!SettingsApi.getSetting(SettingOption.DisableCollectHits)) {
            HitStatsApi.addRuleHit(rule.getText(), rule.getFilterListId());
        }
    }

    private static onApplyCosmeticRule({ data }: ApplyCosmeticRuleEvent): void {
        const {
            tabId,
            rule,
            ...eventData
        } = data;

        filteringLogApi.addEventData(tabId, {
            ...eventData,
            requestRule: FilteringLogApi.createCosmeticRuleEventData(rule),
        });

        if (!SettingsApi.getSetting(SettingOption.DisableCollectHits)) {
            HitStatsApi.addRuleHit(rule.getText(), rule.getFilterListId());
        }
    }

    private static onApplyCspRule({ data }: ApplyCspRuleEvent): void {
        const {
            tabId,
            rule,
            ...eventData
        } = data;

        filteringLogApi.addEventData(tabId, {
            ...eventData,
            requestRule: FilteringLogApi.createNetworkRuleEventData(rule),
        });

        if (!SettingsApi.getSetting(SettingOption.DisableCollectHits)) {
            HitStatsApi.addRuleHit(rule.getText(), rule.getFilterListId());
        }
    }

    private static onRemoveParam({ data }: RemoveParamEvent): void {
        const {
            tabId,
            rule,
        } = data;

        filteringLogApi.addEventData(tabId, data);

        if (!SettingsApi.getSetting(SettingOption.DisableCollectHits)) {
            HitStatsApi.addRuleHit(rule.getText(), rule.getFilterListId());
        }
    }

    private static onRemoveheader({ data }: RemoveHeaderEvent): void {
        const { tabId, rule, ...eventData } = data;

        filteringLogApi.addEventData(tabId, {
            ...eventData,
            requestRule: FilteringLogApi.createNetworkRuleEventData(rule),
        });

        if (!SettingsApi.getSetting(SettingOption.DisableCollectHits)) {
            HitStatsApi.addRuleHit(rule.getText(), rule.getFilterListId());
        }
    }

    private static onReceiveResponse({ data }: ReceiveResponseEvent): void {
        const { eventId, tabId, statusCode } = data;

        filteringLogApi.updateEventData(tabId, eventId, { statusCode });
    }

    private static onCookie(event: CookieEvent): void {
        if (filteringLogApi.isExistingCookieEvent(event)) {
            return;
        }

        const { tabId, rule, ...eventData } = event.data;

        filteringLogApi.addEventData(tabId, {
            ...eventData,
            requestRule: FilteringLogApi.createNetworkRuleEventData(rule),
        });

        if (!SettingsApi.getSetting(SettingOption.DisableCollectHits)) {
            HitStatsApi.addRuleHit(rule.getText(), rule.getFilterListId());
        }
    }

    private static onScriptInjection({ data }: JsInjectEvent): void {
        const { tabId, rule, ...eventData } = data;

        filteringLogApi.addEventData(tabId, {
            ...eventData,
            requestRule: FilteringLogApi.createCosmeticRuleEventData(rule),
        });

        if (!SettingsApi.getSetting(SettingOption.DisableCollectHits)) {
            HitStatsApi.addRuleHit(rule.getText(), rule.getFilterListId());
        }
    }

    private static onReplaceRuleApply({ data }: ReplaceRuleApplyEvent): void {
        const { tabId, rules, eventId } = data;

        filteringLogApi.updateEventData(tabId, eventId, {
            replaceRules: rules.map(rule => FilteringLogApi.createNetworkRuleEventData(rule)),
        });

        if (!SettingsApi.getSetting(SettingOption.DisableCollectHits)) {
            rules.forEach(rule => {
                HitStatsApi.addRuleHit(rule.getText(), rule.getFilterListId());
            });
        }
    }

    private static onStealthAction({ data }: StealthActionEvent): void {
        const { tabId, eventId, stealthActions } = data;

        filteringLogApi.updateEventData(tabId, eventId, { stealthActions });
    }

    private static onTabCreate(tabContext: TabContext): void {
        const { info, isSyntheticTab } = tabContext;

        filteringLogApi.createTabInfo(info, isSyntheticTab);
    }

    private static onTabUpdate(tabContext: TabContext): void {
        const { info } = tabContext;

        filteringLogApi.updateTabInfo(info);
    }

    private static onTabRemove(tabContext: TabContext): void {
        const { info: { id } } = tabContext;

        if (id) {
            filteringLogApi.removeTabInfo(id);
        }
    }

    private static onClearEventsByTabId({ data }: ClearEventsByTabIdMessage): void {
        const { tabId, ignorePreserveLog } = data;
        filteringLogApi.clearEventsByTabId(tabId, ignorePreserveLog);
    }

    private static onSetPreserveLogState({ data }: SetPreserveLogStateMessage): void {
        const { state } = data;
        filteringLogApi.setPreserveLogState(state);
    }

    private static async onRefreshPage({ data }: PageRefreshMessage): Promise<void> {
        const { tabId } = data;
        await browser.tabs.reload(tabId);
    }

    private static onGetFilteringLogInfoById({
        data,
    }: GetFilteringInfoByTabIdMessage): FilteringLogTabInfo | undefined {
        const { tabId } = data;

        return filteringLogApi.getFilteringInfoByTabId(tabId);
    }

    private static async onSyncOpenTabs(): Promise<FilteringLogTabInfo[]> {
        return filteringLogApi.synchronizeOpenTabs();
    }

    private static onGetFilteringLogData(): GetFilteringLogDataResponse {
        return {
            filtersMetadata: FiltersApi.getFiltersMetadata(),
            settings: SettingsApi.getData(),
            preserveLogEnabled: filteringLogApi.isPreserveLogEnabled(),
        };
    }

    private static async onSetFilteringLogWindowState({ data }: SetFilteringLogWindowStateMessage): Promise<void> {
        const { windowState } = data;

        await storage.set(FILTERING_LOG_WINDOW_STATE, JSON.stringify(windowState));
    }
}
