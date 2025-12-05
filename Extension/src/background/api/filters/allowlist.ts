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
import zod from 'zod';

import { tabsApi as tsWebExtTabsApi, getDomain } from '../../tswebextension';
import { logger } from '../../../common/logger';
import { SettingOption } from '../../schema';
import { notifier } from '../../notifier';
import {
    settingsStorage,
    allowlistDomainsStorage,
    invertedAllowlistDomainsStorage,
} from '../../storages';
import { engine } from '../../engine';
import { TabsApi } from '../../../common/api/extension';
import { AntiBannerFiltersId, NotifierType } from '../../../common/constants';
import { UrlUtils } from '../../utils';
import { getZodErrorMessage } from '../../../common/error';

import { UserRulesApi } from './userrules';

/**
 * Allowlist and Inverted Allowlist storages have same api.
 * This type is used in generic private methods of {@link AllowlistApi}.
 */
type DomainsStorage =
    | typeof allowlistDomainsStorage
    | typeof invertedAllowlistDomainsStorage;

/**
 * API for managing allowlist domain lists.
 *
 * This class provided methods for creating and deleting rules in
 * {@link allowlistDomainsStorage} and {@link invertedAllowlistDomainsStorage}.
 *
 */
export class AllowlistApi {
    /**
     * Reads stringified domains arrays from persisted storages
     * and saves it in cache.
     * If data is not exist, set empty arrays.
     */
    public static init(): void {
        AllowlistApi.initStorage(allowlistDomainsStorage);
        AllowlistApi.initStorage(invertedAllowlistDomainsStorage);
    }

    /**
     * Checks if allowlist in inverted.
     *
     * @returns True, if inverted, else returns false.
     */
    public static isInverted(): boolean {
        return !settingsStorage.get(SettingOption.DefaultAllowlistMode);
    }

    /**
     * Checks if allowlist is enabled.
     *
     * @returns True, if enabled, else returns false.
     */
    public static isEnabled(): boolean {
        return settingsStorage.get(SettingOption.AllowlistEnabled);
    }

    /**
     * Returns domain list from {@link allowlistDomainsStorage}.
     *
     * @returns List of allowlisted domains in default mode.
     */
    public static getAllowlistDomains(): string[] {
        return AllowlistApi.getDomains(allowlistDomainsStorage);
    }

    /**
     * Returns domain list from {@link invertedAllowlistDomainsStorage}.
     *
     * @returns List of allowlisted domains in inverted mode.
     */
    public static getInvertedAllowlistDomains(): string[] {
        return AllowlistApi.getDomains(invertedAllowlistDomainsStorage);
    }

    /**
     * Sets domain list to {@link allowlistDomainsStorage}.
     *
     * @param domains - Array of domains.
     */
    public static setAllowlistDomains(domains: string[]): void {
        AllowlistApi.setDomains(domains, allowlistDomainsStorage);
    }

    /**
     * Sets domain list to {@link invertedAllowlistDomainsStorage}.
     *
     * @param domains - Array of domains.
     */
    public static setInvertedAllowlistDomains(domains: string[]): void {
        AllowlistApi.setDomains(domains, invertedAllowlistDomainsStorage);
    }

    /**
     * Add domain to {@link allowlistDomainsStorage}.
     *
     * @param domain - Domain string.
     */
    public static addAllowlistDomain(domain: string): void {
        AllowlistApi.addDomain(domain, allowlistDomainsStorage);
    }

    /**
     * Add domain to {@link invertedAllowlistDomainsStorage}.
     *
     * @param domain - Domain string.
     */
    public static addInvertedAllowlistDomain(domain: string): void {
        AllowlistApi.addDomain(domain, invertedAllowlistDomainsStorage);
    }

    /**
     * Remove allowlist records for domain from {@link allowlistDomainsStorage}.
     *
     * @param domain - Domain string.
     */
    public static removeAllowlistDomain(domain: string): void {
        AllowlistApi.findAndRemoveMatchedDomainsAndSubdomainMasks(domain, allowlistDomainsStorage);
    }

    /**
     * Remove allowlist records for domain from {@link invertedAllowlistDomainsStorage}.
     *
     * @param domain - Domain string.
     */
    public static removeInvertedAllowlistDomain(domain: string): void {
        AllowlistApi.findAndRemoveMatchedDomainsAndSubdomainMasks(domain, invertedAllowlistDomainsStorage);
    }

    /**
     * Finds and removes any domains which can match provided domain by exactly
     * same domain or by sub-domain mask.
     *
     * @param domain Domain which should be excluded from allowlist.
     * @param storage Storage with allowlist domains.
     */
    private static findAndRemoveMatchedDomainsAndSubdomainMasks(domain: string, storage: DomainsStorage): void {
        const domainsToCheck = AllowlistApi.getDomains(storage);

        // Firstly check for exactly same domains in allowlist.
        const domainsToRemove = domainsToCheck.filter((record) => record === domain);

        // Make a copy of parameter before editing.
        let domainToCheck = domain.split('').join('');
        // While we have at least one dot, check for possible upper mask domains.
        while (domainToCheck.indexOf('.') > -1) {
            // Domain can be match by upper-domain mask.
            domainToCheck = UrlUtils.getUpperLevelDomain(domainToCheck);

            // eslint-disable-next-line @typescript-eslint/no-loop-func
            const matchedSubDomainMasks = domainsToCheck.filter((record) => record === `*.${domainToCheck}`);

            domainsToRemove.push(...matchedSubDomainMasks);
        }

        domainsToRemove.forEach((d) => {
            AllowlistApi.removeDomain(d, storage);
        });
    }

    /**
     * Enable filtering for specified tab by changing the allowlist or deleting allowlist rule from user list.
     *
     * @param tabId Tab id.
     * @param tabRefresh Tab refresh flag.
     */
    public static async enableTabFiltering(tabId: number, tabRefresh: boolean = false): Promise<void> {
        const tabContext = tsWebExtTabsApi.getTabContext(tabId);

        if (!tabContext) {
            return;
        }

        const { mainFrameRule } = tabContext;

        if (!mainFrameRule) {
            return;
        }

        const filterId = mainFrameRule.getFilterListId();

        if (filterId === AntiBannerFiltersId.UserFilterId) {
            await AllowlistApi.removeAllowlistRuleFromUserList(mainFrameRule.getIndex(), tabId, tabRefresh);
            return;
        }

        const { info: { url } } = tabContext;

        if (url && filterId === AntiBannerFiltersId.AllowlistFilterId) {
            await AllowlistApi.enableTabUrlFiltering(url, tabId, tabRefresh);
        }
    }

    /**
     * Disables filtering for specified url by adding domain to the allowlist.
     *
     * Please note that this method does not reload the tab.
     *
     * @param url Tab document url.
     */
    public static async disableFilteringForUrl(url: string): Promise<void> {
        const domain = getDomain(url);

        if (!domain) {
            logger.debug(`[ext.AllowlistApi.disableFilteringForUrl]: no domain in url "${url}"`);
            return;
        }

        if (AllowlistApi.isInverted()) {
            AllowlistApi.removeInvertedAllowlistDomain(domain);
        } else {
            AllowlistApi.addAllowlistDomain(domain);
        }

        await engine.update();
    }

    /**
     * Disable filtering for specified tab by adding url to the allowlist.
     *
     * @param tabId Tab id.
     */
    public static async disableTabFilteringForTabId(tabId: number): Promise<void> {
        const tabContext = tsWebExtTabsApi.getTabContext(tabId);
        if (!tabContext) {
            return;
        }

        const { info: { url } } = tabContext;
        if (!url) {
            return;
        }

        await AllowlistApi.disableTabUrlFiltering(url, tabId);
    }

    /**
     * Enable filtering for specified tab by changing the allowlist.
     *
     * If default allowlist mode, removes domain from {@link allowlistDomainsStorage}.
     * If inverted allowlist mode, adds domain to {@link invertedAllowlistDomainsStorage}.
     * Updates {@link Engine} and reloads the tab if {@link tabRefresh} is true.
     *
     * @param url Tab document url.
     * @param tabId Tab id.
     * @param tabRefresh Is tab refresh needed after removing tab url from the allowlist.
     * We do not refresh the tab after changing the allowlist via the filtering log.
     */
    private static async enableTabUrlFiltering(
        url: string,
        tabId: number,
        tabRefresh: boolean = false,
    ): Promise<void> {
        const domain = getDomain(url);

        if (!domain) {
            logger.debug(`[ext.AllowlistApi.enableTabUrlFiltering]: no domain in url "${url}" of tab ${tabId}`);
            return;
        }

        if (AllowlistApi.isInverted()) {
            AllowlistApi.addInvertedAllowlistDomain(domain);
        } else {
            AllowlistApi.removeAllowlistDomain(domain);
        }

        await engine.update();

        if (tabRefresh) {
            await TabsApi.reload(tabId);
        }
    }

    /**
     * Disable filtering for specified tab by changing the allowlist.
     *
     * If default allowlist mode, adds domain to {@link allowlistDomainsStorage}.
     * If inverted allowlist mode, removes domain from {@link invertedAllowlistDomainsStorage}.
     * Updates tswebextension configuration and reload tab after changes apply.
     *
     * @param url Tab document url.
     * @param tabId Tab id.
     */
    private static async disableTabUrlFiltering(
        url: string,
        tabId: number,
    ): Promise<void> {
        // Should be awaited before reloading to allow the engine to update.
        // AG-42124
        await AllowlistApi.disableFilteringForUrl(url);

        await TabsApi.reload(tabId);
    }

    /**
     * Enable filtering for specified tab by deleting allowlist rule from user list.
     *
     * Updates {@link Engine} and reloads the tab if {@link tabRefresh} is true.
     *
     * @param ruleIndex Rule index.
     * @param tabId Tab id.
     * @param tabRefresh Is tab refresh needed after removing rule from the user list.
     * We do not refresh the tab after rule deletion via the filtering log.
     */
    private static async removeAllowlistRuleFromUserList(
        ruleIndex: number,
        tabId: number,
        tabRefresh: boolean = false,
    ): Promise<void> {
        await UserRulesApi.removeUserRuleByIndex(ruleIndex);

        await engine.update();

        if (tabRefresh) {
            await TabsApi.reload(tabId);
        }
    }

    /**
     * Add domain to specified {@link DomainsStorage}.
     *
     * @param domain - Domain string.
     * @param storage - Specified {@link DomainsStorage}.
     */
    private static addDomain(domain: string, storage: DomainsStorage): void {
        const domains = storage.getData();

        domains.push(domain);

        AllowlistApi.setDomains(domains, storage);
    }

    /**
     * Remove domain to specified storage.
     *
     * @param domain - Domain string.
     * @param storage - Specified {@link DomainsStorage}.
     */
    private static removeDomain(domain: string, storage: DomainsStorage): void {
        const domains = storage.getData();

        AllowlistApi.setDomains(domains.filter((d) => d !== domain), storage);
    }

    /**
     * Returns domains from specified storage.
     *
     * @param storage - Specified {@link DomainsStorage}.
     *
     * @returns List of domains.
     */
    private static getDomains(storage: DomainsStorage): string[] {
        return storage.getData();
    }

    /**
     * Set domains list to specified storage.
     *
     * @param domains - List of domains.
     * @param storage - Specified {@link DomainsStorage}.
     */
    private static setDomains(domains: string[], storage: DomainsStorage): void {
        // remove empty strings
        domains = domains.filter((domain) => !!domain);

        // remove duplicates
        domains = Array.from(new Set(domains));

        storage.setData(domains);

        notifier.notifyListeners(NotifierType.UpdateAllowlistFilterRules);
    }

    /**
     * Read stringified domains array from specified allowlist storage,
     * parse it and set memory cache.
     *
     * If data is not exist, set default data.
     *
     * @param storage - Default allowlist or inverted domains storage.
     * @param defaultData - Default storage data.
     */
    private static initStorage(storage: DomainsStorage, defaultData: string[] = []): void {
        try {
            const storageData = storage.read();
            if (typeof storageData === 'string') {
                const data = zod.string().array().parse(JSON.parse(storageData));
                storage.setCache(data);
            } else {
                storage.setData(defaultData);
            }
        } catch (e) {
            logger.warn(`[ext.AllowlistApi.initStorage]: cannot parse ${storage.key} storage data from persisted storage, reset to default. Origin error:`, getZodErrorMessage(e));
            storage.setData(defaultData);
        }
    }
}
