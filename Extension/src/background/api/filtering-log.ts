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
import { type Tabs } from 'webextension-polyfill';

import {
    BACKGROUND_TAB_ID,
    type ContentType,
    type CookieEvent,
    isExtensionUrl,
    type StealthActionEvent,
    getDomain,
    type DeclarativeRuleInfo,
} from 'tswebextension';

import { logger } from '../../common/logger';
import { translator } from '../../common/translators/translator';
import { notifier } from '../notifier';
import { engine } from '../engine';
import { settingsStorage } from '../storages/settings';
import { SettingOption } from '../schema/settings/enum';
import { TabsApi } from '../../common/api/extension/tabs';
import { NotifierType } from '../../common/constants';
import { ruleTextService, type RuleText } from '../services/rule-text';

export type FilteringEventRuleData = {
    filterId: number;
    ruleIndex: number;
    isImportant?: boolean;
    documentLevelRule?: boolean;
    isStealthModeRule?: boolean;
    allowlistRule?: boolean;
    allowlistStealthRule?: boolean;
    cspRule?: boolean;
    permissionsRule?: boolean;
    modifierValue?: string;
    cookieRule?: boolean;
    contentRule?: boolean;
    cssRule?: boolean;
    scriptRule?: boolean;
} & Partial<RuleText>;

/**
 * This is raw filtering log event type which we added or update when received
 * some filtering log event type from tswebextension.
 */
export type FilteringLogEvent = {
    eventId: string;
    requestUrl?: string;
    requestDomain?: string;
    frameUrl?: string;
    frameDomain?: string;
    requestType?: ContentType;
    timestamp?: number;
    requestThirdParty?: boolean;
    method?: string;
    statusCode?: number;
    requestRule?: FilteringEventRuleData;
    removeParam?: boolean;
    removeHeader?: boolean;
    headerName?: string;
    element?: string;
    script?: boolean;
    cookieName?: string;
    cookieValue?: string;
    isModifyingCookieRule?: boolean;
    cspReportBlocked?: boolean;
    replaceRules?: FilteringEventRuleData[];
    stealthAllowlistRules?: FilteringEventRuleData[];
    stealthActions?: StealthActionEvent['data']['stealthActions'];
    declarativeRuleInfo?: DeclarativeRuleInfo;
};

/**
 * This is {@link FilteringLogEvent} type extended with added rules source texts.
 */
export type UIFilteringLogEvent = FilteringLogEvent
    & RuleText
    & { filterName?: string | null };

/**
 * Filtering log tab info.
 */
export type FilteringLogTabInfo = {
    /**
     * Tab id.
     */
    tabId: number;

    /**
     * Tab title.
     */
    title: string;

    /**
     * Indicates if this tab is an extension page (e.g. Options, filtering log).
     */
    isExtensionTab: boolean;

    /**
     * Filtering events.
     */
    filteringEvents: FilteringLogEvent[];

    /**
     * Domain of the tab.
     */
    domain: string | null;
};

/**
 * The filtering log collects all available information about requests
 * and the rules applied to them.
 */
export class FilteringLogApi {
    private static readonly REQUESTS_SIZE_PER_TAB = 1000;

    private openedFilteringLogsPages = 0;

    private tabsInfoMap = new Map<number, FilteringLogTabInfo>([
        [BACKGROUND_TAB_ID, {
            tabId: BACKGROUND_TAB_ID,
            title: translator.getMessage('background_tab_title'),
            isExtensionTab: false,
            filteringEvents: [],
            domain: null,
        }],
    ]);

    /**
     * Checks if filtering log page is opened.
     *
     * @returns True, if filtering log page is opened, else false.
     */
    public isOpen(): boolean {
        return this.openedFilteringLogsPages > 0;
    }

    /**
     * Checks if preserve log is enabled.
     *
     * @returns True, if preserve log is enabled, else false.
     */
    public static isPreserveLogEnabled(): boolean {
        return settingsStorage.get(SettingOption.PreserveLogEnabled);
    }

    /**
     * Sets preserve log state.
     *
     * @param enabled Is preserve log enabled.
     */
    public static setPreserveLogState(enabled: boolean): void {
        settingsStorage.set(SettingOption.PreserveLogEnabled, enabled);
    }

    /**
     * We collect filtering events if opened at least one page of log.
     */
    public onOpenFilteringLogPage(): void {
        this.openedFilteringLogsPages += 1;

        // Enable caching for bulk rule text lookups during filtering log session
        ruleTextService.enableCache();

        try {
            engine.api.setDebugScriptlets(true);
        } catch (e) {
            logger.error('[ext.FilteringLogApi.onOpenFilteringLogPage]: failed to enable `verbose scriptlets logging` option:', e);
        }

        try {
            engine.api.setCollectHitStats(true);
        } catch (e) {
            logger.error('[ext.FilteringLogApi.onOpenFilteringLogPage]: failed to enable `collect hit stats` option:', e);
        }
    }

    /**
     * Cleanups when last page of log closes.
     */
    public onCloseFilteringLogPage(): void {
        this.openedFilteringLogsPages = Math.max(this.openedFilteringLogsPages - 1, 0);
        if (this.openedFilteringLogsPages === 0) {
            // Disable caching and clear cache when all filtering log pages are closed
            ruleTextService.disableCache();

            // Clear events
            this.tabsInfoMap.forEach((tabInfo) => {
                tabInfo.filteringEvents = [];
            });

            try {
                engine.api.setDebugScriptlets(false);
            } catch (e) {
                logger.error('[ext.FilteringLogApi.onCloseFilteringLogPage]: failed to disable `verbose scriptlets logging` option:', e);
            }

            if (settingsStorage.get(SettingOption.DisableCollectHits)) {
                try {
                    engine.api.setCollectHitStats(false);
                } catch (e) {
                    logger.error('[ext.FilteringLogApi.onCloseFilteringLogPage]: failed to disable `collect hit stats` option:', e);
                }
            }
        }
    }

    /**
     * Creates tab info.
     *
     * @param tab {@link browser.Tabs.Tab} Data.
     * @param isSyntheticTab Is tab is used to send initial requests from new tab in chrome.
     */
    public createTabInfo(tab: Tabs.Tab, isSyntheticTab = false): void {
        const { id, title, url } = tab;

        if (!id || !url || !title) {
            return;
        }

        // Background tab can't be added
        // Synthetic tabs are used to send initial requests from new tab in chrome
        if (id === BACKGROUND_TAB_ID || isSyntheticTab) {
            return;
        }

        const tabInfo: FilteringLogTabInfo = {
            tabId: id,
            title,
            isExtensionTab: isExtensionUrl(url),
            filteringEvents: [],
            domain: getDomain(url),
        };

        this.tabsInfoMap.set(id, tabInfo);

        notifier.notifyListeners(NotifierType.TabAdded, tabInfo);
    }

    /**
     * Updates tab title and url.
     *
     * @param tab {@link browser.Tabs.Tab} Data.
     */
    public updateTabInfo(tab: Tabs.Tab): void {
        const { id, title, url } = tab;

        if (!id || !url || !title) {
            return;
        }

        // Background tab can't be updated
        if (id === BACKGROUND_TAB_ID) {
            return;
        }

        const tabInfo = this.getFilteringInfoByTabId(id);

        if (!tabInfo) {
            this.createTabInfo(tab);
            return;
        }

        tabInfo.title = title;
        tabInfo.isExtensionTab = isExtensionUrl(url);

        notifier.notifyListeners(NotifierType.TabUpdate, tabInfo);
    }

    /**
     * Removes tab info.
     *
     * @param id Tab id.
     */
    public removeTabInfo(id: number): void {
        // Background tab can't be removed
        if (id === BACKGROUND_TAB_ID) {
            return;
        }

        const tabInfo = this.tabsInfoMap.get(id);

        if (tabInfo) {
            notifier.notifyListeners(NotifierType.TabClose, tabInfo);
        }

        this.tabsInfoMap.delete(id);
    }

    /**
     * Returns filtering info for tab.
     *
     * @param tabId Tab id.
     *
     * @returns Tab data for filtering log window.
     */
    public getFilteringInfoByTabId(tabId: number): FilteringLogTabInfo | undefined {
        return this.tabsInfoMap.get(tabId);
    }

    /**
     * Synchronizes currently opened tabs with out state.
     *
     * @returns Array of {@link FilteringLogTabInfo} with data about opened tabs.
     */
    public async synchronizeOpenTabs(): Promise<FilteringLogTabInfo[]> {
        const tabs = await TabsApi.getAll();

        // As Object.keys() returns strings we convert them to integers,
        // because tabId is integer in extension API
        const tabIdsToRemove = Object.keys(this.tabsInfoMap).map((id) => Number(id));

        for (let i = 0; i < tabs.length; i += 1) {
            const openTab = tabs[i];

            if (!openTab?.id) {
                continue;
            }

            const tabInfo = this.tabsInfoMap.get(openTab.id);

            if (!tabInfo) {
                this.createTabInfo(openTab);
            } else {
                // update tab
                this.updateTabInfo(openTab);
            }
            const index = tabIdsToRemove.indexOf(openTab.id);
            if (index >= 0) {
                tabIdsToRemove.splice(index, 1);
            }
        }

        for (let j = 0; j < tabIdsToRemove.length; j += 1) {
            const tabIdToRemove = tabIdsToRemove[j];

            if (tabIdToRemove) {
                this.removeTabInfo(tabIdToRemove);
            }
        }

        return Array.from(this.tabsInfoMap.values());
    }

    /**
     * Remove log requests for tab.
     *
     * @param tabId Tab id.
     * @param ignorePreserveLog Is {@link preserveLogEnabled} flag ignored.
     */
    public clearEventsByTabId(tabId: number, ignorePreserveLog = false): void {
        const tabInfo = this.tabsInfoMap.get(tabId);

        const preserveLog = ignorePreserveLog ? false : FilteringLogApi.isPreserveLogEnabled();

        if (tabInfo && !preserveLog) {
            tabInfo.filteringEvents = [];
            notifier.notifyListeners(NotifierType.TabReset, tabInfo);
        }
    }

    /**
     * Adds a filter log event (for example when applying a csp rule, enforcing a script, sending a request)
     * with data related to that event.
     *
     * @param tabId Tab id.
     * @param data {@link FilteringLogEvent} Event data.
     */
    public async addEventData(tabId: number, data: FilteringLogEvent): Promise<void> {
        const tabInfo = this.getFilteringInfoByTabId(tabId);
        if (!tabInfo || !this.isOpen()) {
            return;
        }

        // Get rule text based on filter id and rule index
        if (data.requestRule) {
            data.requestRule = await FilteringLogApi.applyRuleTextToRuleData(data.requestRule);
        }

        tabInfo.filteringEvents.push(data);

        const shouldRemoveOldestEvent = !FilteringLogApi.isPreserveLogEnabled()
            && (tabInfo.filteringEvents.length > FilteringLogApi.REQUESTS_SIZE_PER_TAB);

        if (shouldRemoveOldestEvent) {
            // don't remove first item, cause it's request to main frame
            tabInfo.filteringEvents.splice(1, 1);
        }
    }

    /**
     * Updates the event data for an already recorded event.
     *
     * @param tabId Tab id.
     * @param eventId Event id.
     * @param data Event data.
     */
    public async updateEventData(
        tabId: number,
        eventId: string,
        data: Partial<FilteringLogEvent>,
    ): Promise<void> {
        const tabInfo = this.getFilteringInfoByTabId(tabId);
        if (!tabInfo || !this.isOpen()) {
            return;
        }

        const { filteringEvents } = tabInfo;

        let event = filteringEvents.find((e) => e.eventId === eventId);

        if (!event) {
            return;
        }

        if (data.requestRule && !event.requestRule?.appliedRuleText) {
            data.requestRule = await FilteringLogApi.applyRuleTextToRuleData(data.requestRule);
        }

        if (data.replaceRules) {
            data.replaceRules = await FilteringLogApi.applyRuleTextToRuleDataArray(data.replaceRules);
        }

        if (data.stealthAllowlistRules) {
            data.stealthAllowlistRules = await FilteringLogApi.applyRuleTextToRuleDataArray(data.stealthAllowlistRules);
        }

        event = Object.assign(event, data);
    }

    /**
     * Retrieves and applies rule text to a single rule data object.
     *
     * @param rule Rule data object containing filterId and ruleIndex.
     *
     * @returns Rule object with rule text applied.
     */
    private static async applyRuleTextToRuleData(rule: FilteringEventRuleData): Promise<FilteringEventRuleData> {
        const { filterId, ruleIndex } = rule;
        const ruleTextData = await ruleTextService.getRuleText(filterId, ruleIndex);
        return ruleTextData ? Object.assign(rule, ruleTextData) : rule;
    }

    /**
     * Retrieves and applies rule text to an array of rule data objects.
     *
     * @param rules Array of rule data objects containing filterId and ruleIndex.
     *
     * @returns Array of rule objects with rule text applied.
     */
    private static async applyRuleTextToRuleDataArray(
        rules: FilteringEventRuleData[],
    ): Promise<FilteringEventRuleData[]> {
        return Promise.all(
            rules.map(async (rule) => FilteringLogApi.applyRuleTextToRuleData(rule)),
        );
    }

    /**
     * Updates the event data for an already recorded event.
     *
     * @param tabId Tab id.
     * @param eventId Event id.
     * @param declarativeRuleInfo Applied declarative rule in JSON and it`s source rule and filter id.
     */
    public async attachDeclarativeRuleToEventData(
        tabId: number,
        eventId: string,
        declarativeRuleInfo: DeclarativeRuleInfo,
    ): Promise<void> {
        const tabInfo = this.getFilteringInfoByTabId(tabId);
        if (!tabInfo || !this.isOpen()) {
            return;
        }

        const { filteringEvents } = tabInfo;

        const event = filteringEvents.find((e) => e.eventId === eventId);

        if (!event) {
            logger.debug('[ext.FilteringLogApi.attachDeclarativeRuleToEventData]: not found event in filtering log to update:', eventId);
            return;
        }

        /**
         * Search for matching request event inside of filtering events.
         * If found matching event we assign declarative rule to that event,
         * otherwise assign it to original event.
         */
        const { sourceRules } = declarativeRuleInfo;

        const matchedFilteringEvent = filteringEvents.find((event) => {
            if (!event.requestRule) {
                return false;
            }

            const { originalRuleText, appliedRuleText, filterId } = event.requestRule;
            const ruleText = originalRuleText || appliedRuleText;

            return ruleText && sourceRules.some((rule) => (
                rule.sourceRule === ruleText
                && rule.filterId === filterId
            ));
        });

        if (matchedFilteringEvent) {
            matchedFilteringEvent.declarativeRuleInfo = declarativeRuleInfo;
        } else {
            event.declarativeRuleInfo = declarativeRuleInfo;
        }
    }

    /**
     * Checks if a cookie event exists or not.
     *
     * @param cookieEvent Cookie event.
     * @param cookieEvent.data Cookie event data.
     *
     * @returns True if a cookie with the same frame domain, name and value
     * has already been written, and false otherwise.
     */
    public isExistingCookieEvent({ data }: CookieEvent): boolean {
        const {
            tabId,
            cookieName,
            cookieValue,
            frameDomain,
        } = data;

        const tabInfo = this.getFilteringInfoByTabId(tabId);
        const filteringEvents = tabInfo?.filteringEvents;

        if (!filteringEvents) {
            return false;
        }

        return filteringEvents.some((event) => {
            return event.frameDomain === frameDomain
                && event.cookieName === cookieName
                && event.cookieValue === cookieValue;
        });
    }
}

export const filteringLogApi = new FilteringLogApi();
