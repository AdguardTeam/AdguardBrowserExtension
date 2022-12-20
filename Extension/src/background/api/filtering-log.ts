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
    CosmeticRule,
    NetworkRule,
    CosmeticRuleType,
    NetworkRuleOption,
} from '@adguard/tswebextension';

import { AntiBannerFiltersId } from '../../common/constants';
import { listeners } from '../notifier';
import { TabsApi } from './extension/tabs';
import { UserRulesApi } from './filters';

export type FilteringEventRuleData = {
    filterId: number,
    ruleText: string,
    isImportant?: boolean,
    documentLevelRule?: boolean,
    isStealthModeRule?: boolean,
    allowlistRule?: boolean,
    cspRule?: boolean,
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
};

export type FilteringLogTabInfo = {
    tabId: number,
    title: string,
    isExtensionTab: boolean,
    filteringEvents: FilteringLogEvent[],
};

export class FilteringLogApi {
    private static REQUESTS_SIZE_PER_TAB = 1000;

    private preserveLogEnabled = false;

    private openedFilteringLogsPages = 0;

    private tabsInfoMap = new Map<number, FilteringLogTabInfo>();

    /**
     * Checks if filtering log page is opened
     *
     * @returns true, if filtering log page is opened, else false
     */
    public isOpen(): boolean {
        return this.openedFilteringLogsPages > 0;
    }

    /**
     * Checks if preserve log is enabled
     *
     * @returns true, if preserve log is enabled, else false
     */
    public isPreserveLogEnabled(): boolean {
        return this.preserveLogEnabled;
    }

    /**
     * Set preserve log state
     *
     * @param enabled - is preserve log enabled
     */
    public setPreserveLogState(enabled: boolean): void {
        this.preserveLogEnabled = enabled;
    }

    /**
     * We collect filtering events if opened at least one page of log
     */
    public onOpenFilteringLogPage(): void {
        this.openedFilteringLogsPages += 1;
    }

    /**
     * Cleanup when last page of log closes
     */
    public onCloseFilteringLogPage(): void {
        this.openedFilteringLogsPages = Math.max(this.openedFilteringLogsPages - 1, 0);
        if (this.openedFilteringLogsPages === 0) {
            // Clear events
            this.tabsInfoMap.forEach((tabInfo) => {
                tabInfo.filteringEvents = [];
            });
        }
    }

    /**
     * Create tab info
     *
     * @param tab - {@link browser.Tabs.Tab} data
     * @param isSyntheticTab - is tab is used to send initial requests from new tab in chrome
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
     * Update tab title and url
     *
     * @param tab - {@link browser.Tabs.Tab} data
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
     * Removes tab info
     *
     * @param id - tab id
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
     * Get filtering info for tab
     *
     * @param tabId - tab id
     *
     * @returns tab data for filtering log window
     */
    public getFilteringInfoByTabId(tabId: number): FilteringLogTabInfo | undefined {
        return this.tabsInfoMap.get(tabId);
    }

    /**
     * Synchronize currently opened tabs with out state
     */
    public async synchronizeOpenTabs(): Promise<FilteringLogTabInfo[]> {
        const tabs = await TabsApi.getAll();

        // As Object.keys() returns strings we convert them to integers,
        // because tabId is integer in extension API
        const tabIdsToRemove = Object.keys(this.tabsInfoMap).map(id => Number(id));

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

        return Object.values(this.tabsInfoMap);
    }

    /**
     * Remove log requests for tab
     *
     * @param tabId - tab id
     * @param ignorePreserveLog - is {@link preserveLogEnabled} flag ignored
     */
    public clearEventsByTabId(tabId: number, ignorePreserveLog = false): void {
        const tabInfo = this.tabsInfoMap.get(tabId);

        const preserveLog = ignorePreserveLog ? false : this.preserveLogEnabled;

        if (tabInfo && !preserveLog) {
            tabInfo.filteringEvents = [];
            listeners.notifyListeners(listeners.TabReset, tabInfo);
        }
    }

    public addEventData(tabId: number, data: FilteringLogEvent): void {
        const tabInfo = this.getFilteringInfoByTabId(tabId);
        if (!tabInfo || !this.isOpen) {
            return;
        }

        tabInfo.filteringEvents.push(data);

        if (tabInfo.filteringEvents.length > FilteringLogApi.REQUESTS_SIZE_PER_TAB) {
            // don't remove first item, cause it's request to main frame
            tabInfo.filteringEvents.splice(1, 1);
        }

        listeners.notifyListeners(listeners.LogEventAdded, tabInfo, data);
    }

    public updateEventData(tabId: number, eventId: string, data: unknown): void {
        const tabInfo = this.getFilteringInfoByTabId(tabId);
        if (!tabInfo || !this.isOpen) {
            return;
        }

        const { filteringEvents } = tabInfo;

        let event = filteringEvents.find(e => e.eventId === eventId);

        if (event) {
            event = Object.assign(event, data);

            listeners.notifyListeners(listeners.LogEventAdded, tabInfo, event);
        }
    }

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

        return filteringEvents.some(event => {
            return event.frameDomain === frameDomain
                && event.cookieName === cookieName
                && event.cookieValue === cookieValue;
        });
    }

    public static createNetworkRuleEventData(rule: NetworkRule): FilteringEventRuleData {
        const data = Object.create(null);

        const filterId = rule.getFilterListId();
        const ruleText = rule.getText();

        data.filterId = filterId;
        data.ruleText = ruleText;

        if (rule.isOptionEnabled(NetworkRuleOption.Important)) {
            data.isImportant = true;
        }

        if (rule.isDocumentLevelAllowlistRule()) {
            data.documentLevelRule = true;
        }

        if (rule.getFilterListId() === AntiBannerFiltersId.StealthModeFilterId) {
            data.isStealthModeRule = true;
        }

        data.allowlistRule = rule.isAllowlist();
        data.cspRule = rule.isOptionEnabled(NetworkRuleOption.Csp);
        data.modifierValue = rule.getAdvancedModifierValue();
        data.cookieRule = rule.isOptionEnabled(NetworkRuleOption.Cookie);

        if (filterId === AntiBannerFiltersId.UserFilterId) {
            const originalRule = UserRulesApi.getSourceRule(rule.getText());
            if (originalRule) {
                data.ruleText = originalRule;
                data.appliedRuleText = rule.getText();
            }
        }

        return data;
    }

    public static createCosmeticRuleEventData(rule: CosmeticRule): FilteringEventRuleData {
        const data = Object.create(null);

        const filterId = rule.getFilterListId();
        const ruleText = rule.getText();

        data.filterId = filterId;
        data.ruleText = ruleText;

        const ruleType = rule.getType();

        if (ruleType === CosmeticRuleType.Html) {
            data.contentRule = true;
        } else if (ruleType === CosmeticRuleType.ElementHiding
            || ruleType === CosmeticRuleType.Css) {
            data.cssRule = true;
        } else if (ruleType === CosmeticRuleType.Js) {
            data.scriptRule = true;
        }

        if (filterId === AntiBannerFiltersId.UserFilterId) {
            const originalRule = UserRulesApi.getSourceRule(rule.getText());
            if (originalRule) {
                data.ruleText = originalRule;
                data.appliedRuleText = rule.getText();
            }
        }

        return data;
    }
}

export const filteringLogApi = new FilteringLogApi();
