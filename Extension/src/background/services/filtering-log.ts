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

import {
    TabContext,
    tabsApi as tsWebExtTabsApi,
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
    CspReportBlockedEvent,
    getDomain,
} from '../tswebextension';
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
    TabsApi,
} from '../api';
import { storage } from '../storages';
import { SettingOption } from '../schema';

type GetFilteringLogDataResponse = {
    filtersMetadata: FilterMetadata[],
    settings: SettingsData,
    preserveLogEnabled: boolean,
};

/**
 * FilteringLogService collects all actions that extension doing to web requests
 * to record them and show.
 */
export class FilteringLogService {
    /**
     * Creates handlers for all possible actions.
     */
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

        tsWebExtTabsApi.onCreate.subscribe(FilteringLogService.onTabCreate);
        tsWebExtTabsApi.onUpdate.subscribe(FilteringLogService.onTabUpdate);
        tsWebExtTabsApi.onDelete.subscribe(FilteringLogService.onTabRemove);

        defaultFilteringLog.addEventListener(FilteringEventType.SendRequest, FilteringLogService.onSendRequest);
        defaultFilteringLog.addEventListener(FilteringEventType.TabReload, FilteringLogService.onTabReload);
        defaultFilteringLog.addEventListener(
            FilteringEventType.ReceiveResponse,
            FilteringLogService.onReceiveResponse,
        );
        defaultFilteringLog.addEventListener(
            FilteringEventType.ApplyBasicRule,
            FilteringLogService.onApplyBasicRule,
        );

        defaultFilteringLog.addEventListener(
            FilteringEventType.ApplyCspRule,
            FilteringLogService.onApplyCspRule,
        );

        defaultFilteringLog.addEventListener(
            FilteringEventType.ApplyCosmeticRule,
            FilteringLogService.onApplyCosmeticRule,
        );
        defaultFilteringLog.addEventListener(FilteringEventType.RemoveParam, FilteringLogService.onRemoveParam);
        defaultFilteringLog.addEventListener(FilteringEventType.RemoveHeader, FilteringLogService.onRemoveheader);

        defaultFilteringLog.addEventListener(FilteringEventType.Cookie, FilteringLogService.onCookie);

        defaultFilteringLog.addEventListener(FilteringEventType.JsInject, FilteringLogService.onScriptInjection);

        defaultFilteringLog.addEventListener(FilteringEventType.StealthAction, FilteringLogService.onStealthAction);

        defaultFilteringLog.addEventListener(
            FilteringEventType.CspReportBlocked,
            FilteringLogService.onCspReportBlocked,
        );

        if (UserAgent.isFirefox) {
            defaultFilteringLog.addEventListener(
                FilteringEventType.ReplaceRuleApply,
                FilteringLogService.onReplaceRuleApply,
            );
        }
    }

    /**
     * Records the initiation of a request.
     *
     * @param sendRequestEvent Event with type {@link SendRequestEvent}.
     * @param sendRequestEvent.data Contains data about the request and the tab
     * from which the request was initiated.
     */
    private static onSendRequest({ data }: SendRequestEvent): void {
        const { tabId, ...eventData } = data;

        // FIXME later
        // @ts-ignore
        filteringLogApi.addEventData(tabId, eventData);
    }

    /**
     * Records tab reload.
     *
     * @param event Event with type {@link TabReloadEvent} contains id
     * of the reloaded tab.
     */
    private static onTabReload(event: TabReloadEvent): void {
        const { tabId } = event.data;
        filteringLogApi.clearEventsByTabId(tabId);
    }

    /**
     * Records the application of a blocking rule, redirecting rule
     * or blocking of an open new tab.
     *
     * @param ruleEvent Item of {@link ApplyBasicRuleEvent}.
     * @param ruleEvent.data Data for this event: tabId, eventId and applied rule.
     */
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

    /**
     * Records the application of the cosmetic rule.
     *
     * @param ruleEvent Item of {@link ApplyCosmeticRuleEvent}.
     * @param ruleEvent.data Data for this event.
     */
    private static onApplyCosmeticRule({ data }: ApplyCosmeticRuleEvent): void {
        const {
            tabId,
            ...eventData
        } = data;

        // TODO: Check that logging will be correct, because the rule now is not passed since AG-31744.
        filteringLogApi.addEventData(tabId, eventData);

        // FIXME: Remove commented code before merge to master.
        // if (!SettingsApi.getSetting(SettingOption.DisableCollectHits)) {
        //     HitStatsApi.addRuleHit(rule.getText(), rule.getFilterListId());
        // }
    }

    /**
     * Records the application of the rule with $csp modifier.
     *
     * @param ruleEvent Item of {@link ApplyCspRuleEvent}.
     * @param ruleEvent.data Data for this event.
     */
    private static onApplyCspRule({ data }: ApplyCspRuleEvent): void {
        const {
            tabId,
            rule,
            ...eventData
        } = data;

        // FIXME later
        // @ts-ignore
        filteringLogApi.addEventData(tabId, {
            ...eventData,
            requestDomain: getDomain(eventData.requestUrl),
            requestRule: FilteringLogApi.createNetworkRuleEventData(rule),
        });

        if (!SettingsApi.getSetting(SettingOption.DisableCollectHits)) {
            HitStatsApi.addRuleHit(rule.getText(), rule.getFilterListId());
        }
    }

    /**
     * Records the application of the rule with $removeparam modifier.
     *
     * @param ruleEvent Item of {@link RemoveParamEvent}.
     * @param ruleEvent.data Data for this event.
     */
    private static onRemoveParam({ data }: RemoveParamEvent): void {
        const {
            tabId,
            rule,
            ...eventData
        } = data;

        filteringLogApi.addEventData(tabId, {
            ...eventData,
            requestDomain: getDomain(eventData.requestUrl),
            requestRule: FilteringLogApi.createNetworkRuleEventData(rule),
        });

        if (!SettingsApi.getSetting(SettingOption.DisableCollectHits)) {
            HitStatsApi.addRuleHit(rule.getText(), rule.getFilterListId());
        }
    }

    /**
     * Records the application of the rule with $removeheader modifier.
     *
     * @param ruleEvent Item of {@link RemoveHeaderEvent}.
     * @param ruleEvent.data Data for this event.
     */
    private static onRemoveheader({ data }: RemoveHeaderEvent): void {
        const { tabId, rule, ...eventData } = data;

        filteringLogApi.addEventData(tabId, {
            ...eventData,
            requestDomain: getDomain(eventData.requestUrl),
            requestRule: FilteringLogApi.createNetworkRuleEventData(rule),
        });

        if (!SettingsApi.getSetting(SettingOption.DisableCollectHits)) {
            HitStatsApi.addRuleHit(rule.getText(), rule.getFilterListId());
        }
    }

    /**
     * Records receiving of web request.
     *
     * @param responseEvent Item of {@link ReceiveResponseEvent}.
     * @param responseEvent.data Data for this event: eventId, tabId
     * and status code.
     */
    private static onReceiveResponse({ data }: ReceiveResponseEvent): void {
        const { eventId, tabId, statusCode } = data;

        filteringLogApi.updateEventData(tabId, eventId, { statusCode });
    }

    /**
     * Records cookie event on cookie filtering in onBeforeSendHeaders and
     * onHeadersReceived, but only if there is no cookie event registered.
     *
     * @param event Event with type {@link CookieEvent}.
     */
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

    /**
     * Records injection of script.
     *
     * @param event Event with type {@link JsInjectEvent}.
     * @param event.data Destructed data from {@link JsInjectEvent}.
     */
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

    /**
     * Records the application of the rule with $replace modifier.
     *
     * @param event Event with type {@link ReplaceRuleApplyEvent}.
     * @param event.data Destructed data from {@link ReplaceRuleApplyEvent}.
     */
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

    /**
     * Records the application of an action from Stealth Mode.
     *
     * @param event Event with type {@link ReplaceRuleApplyEvent}.
     * @param event.data Destructed data from {@link ReplaceRuleApplyEvent}:
     * tab id, event id and stealthActions - last one is the bit-mask
     * of applied {@link StealthActions} from tswebextension.
     */
    private static onStealthAction({ data }: StealthActionEvent): void {
        const { tabId, eventId, stealthActions } = data;

        filteringLogApi.updateEventData(tabId, eventId, { stealthActions });
    }

    /**
     * Records the blocked csp report.
     *
     * @param event Event with type {@link CspReportBlocked}.
     * @param event.data Destructed data from {@link CspReportBlocked}:
     * tab id, event id and cspReportBlocked - last one is a boolean flag.
     */
    private static onCspReportBlocked({ data }: CspReportBlockedEvent): void {
        const { tabId, eventId, cspReportBlocked } = data;

        filteringLogApi.updateEventData(tabId, eventId, {
            cspReportBlocked,
        });
    }

    /**
     * Creates tab info.
     *
     * @param tabContext Item of {@link TabContext}.
     */
    private static onTabCreate(tabContext: TabContext): void {
        const { info, isSyntheticTab } = tabContext;

        filteringLogApi.createTabInfo(info, isSyntheticTab);
    }

    /**
     * Updates tab info.
     *
     * @param tabContext Item of {@link TabContext}.
     */
    private static onTabUpdate(tabContext: TabContext): void {
        const { info } = tabContext;

        filteringLogApi.updateTabInfo(info);
    }

    /**
     * Deletes a tab.
     *
     * @param tabContext Item of {@link TabContext}.
     */
    private static onTabRemove(tabContext: TabContext): void {
        const { info: { id } } = tabContext;

        if (id) {
            filteringLogApi.removeTabInfo(id);
        }
    }

    /**
     * Clears all messages for the specified tab.
     *
     * @param message Message with type {@link ClearEventsByTabIdMessage}.
     * @param message.data Destructed data from {@link ClearEventsByTabIdMessage}:
     * tab id and flag indicates that of ignoring preserve log (clear on the refresh).
     */
    private static onClearEventsByTabId({ data }: ClearEventsByTabIdMessage): void {
        const { tabId, ignorePreserveLog } = data;
        filteringLogApi.clearEventsByTabId(tabId, ignorePreserveLog);
    }

    /**
     * Enable or disable preserve log.
     *
     * @param message Message with type {@link SetPreserveLogStateMessage}.
     * @param message.data State for preserver log: enable or disable.
     */
    private static onSetPreserveLogState({ data }: SetPreserveLogStateMessage): void {
        const { state } = data;
        filteringLogApi.setPreserveLogState(state);
    }

    /**
     * Refreshes tab with specified id.
     *
     * @param message Message with type {@link PageRefreshMessage}.
     * @param message.data Tab id from {@link PageRefreshMessage}.
     */
    private static async onRefreshPage({ data }: PageRefreshMessage): Promise<void> {
        const { tabId } = data;
        await TabsApi.reload(tabId);
    }

    /**
     * Returns {@link FilteringLogTabInfo} for specified tab id.
     *
     * @param message Message with type {@link GetFilteringInfoByTabIdMessage}.
     * @param message.data Tab id from {@link GetFilteringInfoByTabIdMessage}.
     *
     * @returns Item with type {@link FilteringLogTabInfo} for specified tab id
     * or undefined.
     */
    private static onGetFilteringLogInfoById(
        { data }: GetFilteringInfoByTabIdMessage,
    ): FilteringLogTabInfo | undefined {
        const { tabId } = data;

        return filteringLogApi.getFilteringInfoByTabId(tabId);
    }

    /**
     * Calls {@link filteringLogApi} for synchronize list of the opened tabs.
     */
    private static async onSyncOpenTabs(): Promise<FilteringLogTabInfo[]> {
        return filteringLogApi.synchronizeOpenTabs();
    }

    /**
     * Returns current settings of filtering log.
     *
     * @returns The {@link GetFilteringLogDataResponse} object, which contains
     * filter log parameters: metadata, settings, and save log state.
     */
    private static onGetFilteringLogData(): GetFilteringLogDataResponse {
        return {
            filtersMetadata: FiltersApi.getFiltersMetadata(),
            settings: SettingsApi.getData(),
            preserveLogEnabled: filteringLogApi.isPreserveLogEnabled(),
        };
    }

    /**
     * Saves the parameters of the filtering log window: position, size, etc.
     *
     * @param message Message of type {@link SetFilteringLogWindowStateMessage}.
     * @param message.data Parameters of the filter log window {@link Windows#CreateCreateDataType}.
     */
    private static async onSetFilteringLogWindowState(
        { data }: SetFilteringLogWindowStateMessage,
    ): Promise<void> {
        const { windowState } = data;

        await storage.set(FILTERING_LOG_WINDOW_STATE, JSON.stringify(windowState));
    }
}
