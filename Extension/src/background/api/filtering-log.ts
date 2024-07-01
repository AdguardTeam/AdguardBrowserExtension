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
import { Tabs } from 'webextension-polyfill';

import {
    BACKGROUND_TAB_ID,
    ContentType,
    CookieEvent,
    isExtensionUrl,
    StealthActionEvent,
    getRuleSourceText,
    getRuleSourceIndex,
    PreprocessedFilterList,
} from '@adguard/tswebextension';

import { logger } from '../../common/logger';
import { translator } from '../../common/translators/translator';
import { listeners } from '../notifier';
import { Engine } from '../engine';
import { FiltersStorage, settingsStorage } from '../storages';
import { SettingOption } from '../schema';
import { TabsApi } from '../../common/api/extension/tabs';
import { AntiBannerFiltersId } from '../../common/constants';

export type FilteringEventRuleData = {
    filterId: number,
    ruleIndex: number,
    originalRuleText?: string,
    isImportant?: boolean,
    documentLevelRule?: boolean,
    isStealthModeRule?: boolean,
    allowlistRule?: boolean,
    allowlistStealthRule?: boolean,
    cspRule?: boolean,
    permissionsRule?: boolean,
    modifierValue?: string,
    cookieRule?: boolean,
    contentRule?: boolean,
    cssRule?: boolean,
    scriptRule?: boolean,
    appliedRuleText?: string,
};

export type FilteringLogEvent = {
    eventId: string,
    requestUrl?: string,
    requestDomain?: string,
    frameUrl?: string,
    frameDomain?: string,
    requestType?: ContentType,
    timestamp?: number,
    requestThirdParty?: boolean,
    method?: string,
    statusCode?: number,
    requestRule?: FilteringEventRuleData,
    removeParam?: boolean,
    removeHeader?: boolean,
    headerName?: string,
    element?: string,
    cookieName?: string,
    cookieValue?: string,
    isModifyingCookieRule?: boolean,
    cspReportBlocked?: boolean,
    replaceRules?: FilteringEventRuleData[],
    stealthAllowlistRules?: FilteringEventRuleData[],
    stealthActions?: StealthActionEvent['data']['stealthActions'],
};

export type FilteringLogTabInfo = {
    tabId: number,
    title: string,
    isExtensionTab: boolean,
    filteringEvents: FilteringLogEvent[],
};

/**
 * Interface for representing applied rule text and original rule text.
 */
interface RuleText {
    /**
     * Applied rule text, always present.
     */
    appliedRuleText: string;

    /**
     * Original rule text. Present if the applied rule is a converted rule.
     * If not present, the applied rule text is the same as the original rule text.
     */
    originalRuleText?: string;
}

/**
 * Cached filter data.
 */
type CachedFilterData = Pick<PreprocessedFilterList, 'rawFilterList' | 'conversionMap' | 'sourceMap'>;

/**
 * The filtering log collects all available information about requests
 * and the rules applied to them.
 */
export class FilteringLogApi {
    private static readonly REQUESTS_SIZE_PER_TAB = 1000;

    private preserveLogEnabled = false;

    private openedFilteringLogsPages = 0;

    private tabsInfoMap = new Map<number, FilteringLogTabInfo>([
        [BACKGROUND_TAB_ID, {
            tabId: BACKGROUND_TAB_ID,
            title: translator.getMessage('background_tab_title'),
            isExtensionTab: false,
            filteringEvents: [],
        }],
    ]);

    /**
     * Cache for filters data.
     *
     * The key is the filter list id and the value is the filter data.
     * This cache is used to avoid unnecessary requests to the storage while filtering log is opened.
     * After closing the filtering log, the cache is purged to free up memory.
     */
    private filtersCache = new Map<number, CachedFilterData>();

    /**
     * Purges filters cache.
     *
     * @param filterIds Filter ids to remove from cache. If not provided, the whole cache will be purged.
     */
    private purgeFiltersCache(filterIds?: number[]): void {
        if (filterIds) {
            filterIds.forEach((filterId) => this.filtersCache.delete(filterId));
            return;
        }

        this.filtersCache.clear();
    }

    /**
     * Called when filters are changed.
     *
     * @param filterIds Filter ids that were changed.
     */
    public onFiltersChanged(filterIds: number[]): void {
        // The cache is only relevant if the filtering log is open
        if (this.isOpen()) {
            this.purgeFiltersCache(filterIds);
        }
    }

    /**
     * Helper method to get filter data.
     * It handles a cache internally to speed up requests for the same filter next time.
     *
     * @param filterId Filter id.
     * @returns Filter data or undefined if the filter is not found.
     */
    private async getFilterData(filterId: number): Promise<CachedFilterData | undefined> {
        if (this.filtersCache.has(filterId)) {
            return this.filtersCache.get(filterId);
        }

        try {
            const [rawFilterList, conversionMap, sourceMap] = await Promise.all([
                FiltersStorage.getPreprocessedFilterList(filterId),
                FiltersStorage.getConversionMap(filterId),
                FiltersStorage.getSourceMap(filterId),
            ]);

            // Raw filter list and source map are required to get rule texts
            if (!rawFilterList || !sourceMap) {
                return undefined;
            }

            const filterData: CachedFilterData = {
                rawFilterList,
                conversionMap,
                sourceMap,
            };

            this.filtersCache.set(filterId, filterData);

            return filterData;
        } catch (e) {
            logger.error(`Failed to get filter data for filter id ${filterId}`, e);
        }

        return undefined;
    }

    /**
     * Gets rule text for the specified filter id and rule index.
     * If the rule is not found, returns null.
     * It handles a cache internally to speed up requests for the same filter next time.
     *
     * @param filterId Filter id.
     * @param ruleIndex Rule index.
     * @returns Rule text or null if the rule is not found.
     */
    public async getRuleText(filterId: number, ruleIndex: number): Promise<RuleText | null> {
        // Note: We do not store rule texts for stealth / allowlist rules in the browser storage,
        // so we can't get the original rule text for them.
        // For stealth rules, we send appliedRuleText directly from the engine.
        // TODO: Resolve this issue in the future.
        if (
            filterId === AntiBannerFiltersId.StealthModeFilterId
            || filterId === AntiBannerFiltersId.AllowlistFilterId
        ) {
            return null;
        }

        const filterData = await this.getFilterData(filterId);

        if (!filterData) {
            logger.error(`Failed to get filter data for filter id ${filterId}`);
            return null;
        }

        const { rawFilterList, conversionMap, sourceMap } = filterData;

        // Get line start index in the source file by rule start index in the byte array
        const lineStartIndex = getRuleSourceIndex(ruleIndex, sourceMap);

        if (lineStartIndex === -1) {
            logger.error(`Failed to get line start index for filter id ${filterId} and rule index ${ruleIndex}`);
            return null;
        }

        const appliedRuleText = getRuleSourceText(lineStartIndex, rawFilterList);

        if (!appliedRuleText) {
            logger.error(`Failed to get rule text for filter id ${filterId} and rule index ${ruleIndex}`);
            return null;
        }

        const result: RuleText = {
            appliedRuleText,
        };

        if (conversionMap && conversionMap[lineStartIndex]) {
            result.originalRuleText = conversionMap[lineStartIndex];
        }

        return result;
    }

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
    public isPreserveLogEnabled(): boolean {
        return this.preserveLogEnabled;
    }

    /**
     * Sets preserve log state.
     *
     * @param enabled Is preserve log enabled.
     */
    public setPreserveLogState(enabled: boolean): void {
        this.preserveLogEnabled = enabled;
    }

    /**
     * We collect filtering events if opened at least one page of log.
     */
    public async onOpenFilteringLogPage(): Promise<void> {
        this.openedFilteringLogsPages += 1;

        try {
            Engine.api.setDebugScriptlets(true);
        } catch (e) {
            logger.error('Failed to enable `verbose scriptlets logging` option', e);
        }

        try {
            Engine.api.setCollectHitStats(true);
        } catch (e) {
            logger.error('Failed to enable `collect hit stats` option', e);
        }
    }

    /**
     * Cleanups when last page of log closes.
     */
    public onCloseFilteringLogPage(): void {
        this.openedFilteringLogsPages = Math.max(this.openedFilteringLogsPages - 1, 0);
        if (this.openedFilteringLogsPages === 0) {
            // Purge filters cache to free up memory
            this.purgeFiltersCache();

            // Clear events
            this.tabsInfoMap.forEach((tabInfo) => {
                tabInfo.filteringEvents = [];
            });

            try {
                Engine.api.setDebugScriptlets(false);
            } catch (e) {
                logger.error('Failed to disable `verbose scriptlets logging` option', e);
            }

            if (settingsStorage.get(SettingOption.DisableCollectHits)) {
                try {
                    Engine.api.setCollectHitStats(false);
                } catch (e) {
                    logger.error('Failed to disable `collect hit stats` option', e);
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
        };

        this.tabsInfoMap.set(id, tabInfo);

        listeners.notifyListeners(listeners.TabAdded, tabInfo);
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

        listeners.notifyListeners(listeners.TabUpdate, tabInfo);
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
            listeners.notifyListeners(listeners.TabClose, tabInfo);
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

        const preserveLog = ignorePreserveLog ? false : this.preserveLogEnabled;

        if (tabInfo && !preserveLog) {
            tabInfo.filteringEvents = [];
            listeners.notifyListeners(listeners.TabReset, tabInfo);
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
            const { filterId, ruleIndex } = data.requestRule;
            // TODO: Remove sending getText for stealth rules
            // Special case: do not get rule text for stealth rules - they already have appliedRuleText
            if (filterId !== AntiBannerFiltersId.StealthModeFilterId) {
                const ruleTextData = await this.getRuleText(filterId, ruleIndex);
                if (ruleTextData) {
                    data.requestRule = Object.assign(data.requestRule, ruleTextData);
                }
            }
        }

        tabInfo.filteringEvents.push(data);

        if (tabInfo.filteringEvents.length > FilteringLogApi.REQUESTS_SIZE_PER_TAB) {
            // don't remove first item, cause it's request to main frame
            tabInfo.filteringEvents.splice(1, 1);
        }

        // TODO: Looks like not using. Maybe lost listener in refactoring.
        listeners.notifyListeners(listeners.LogEventAdded, tabInfo, data);
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

        if (event) {
            if (data.requestRule) {
                const { filterId, ruleIndex } = data.requestRule;
                // TODO: Remove sending getText for stealth rules
                // Special case: do not get rule text for stealth rules - they already have appliedRuleText
                if (filterId !== AntiBannerFiltersId.StealthModeFilterId) {
                    const ruleTextData = await this.getRuleText(filterId, ruleIndex);
                    if (ruleTextData) {
                        data.requestRule = Object.assign(data.requestRule, ruleTextData);
                    }
                }
            }

            if (data.replaceRules) {
                data.replaceRules = await Promise.all(
                    data.replaceRules.map(async (rule) => {
                        const { filterId, ruleIndex } = rule;
                        const ruleTextData = await this.getRuleText(filterId, ruleIndex);
                        if (ruleTextData) {
                            return Object.assign(rule, ruleTextData);
                        }
                        return rule;
                    }),
                );
            }

            event = Object.assign(event, data);

            // TODO: Looks like not using. Maybe lost listener in refactoring.
            listeners.notifyListeners(listeners.LogEventAdded, tabInfo, event);
        }
    }

    /**
     * Checks if a cookie event exists or not.
     *
     * @param cookieEvent Cookie event.
     * @param cookieEvent.data Cookie event data.
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
