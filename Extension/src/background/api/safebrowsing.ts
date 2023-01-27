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
import SHA256 from 'crypto-js/sha256';

import { Log } from '../../common/log';
import { SB_SUSPENDED_CACHE_KEY } from '../../common/constants';

import {
    storage,
    settingsStorage,
    sbCache,
    sbRequestCache,
} from '../storages';
import { ExtensionXMLHttpRequest, network } from './network';
import { UrlUtils } from '../utils/url';
import { SettingOption } from '../schema';
import { SAFEBROWSING_OUTPUT } from '../../../../constants';

/**
 * The Safe Browsing API checks whether a site is in a database of potentially
 * dangerous sites or not by creating a hash of the requested URL to eliminate
 * the possibility of identifying visited sites.
 */
export class SafebrowsingApi {
    /**
     * If we've got an error response from the backend, suspend requests for
     * this time: 40 minutes.
     */
    private static readonly SUSPEND_TTL_MS = 40 * 60 * 1000;

    /**
     * Domain hash length.
     */
    private static readonly DOMAIN_HASH_LENGTH = 4;

    /**
     * A key that indicates that the domain is in the allow list.
     */
    private static readonly SB_ALLOW_LIST = 'allowlist';

    /**
     * Initialize new safebrowsing cache from {@link Storage}.
     *
     * @see {@link SbCache#init}
     */
    public static async initCache(): Promise<void> {
        await sbCache.init();
    }

    /**
     * Clears safebrowsing cache.
     */
    public static async clearCache(): Promise<void> {
        await sbCache.clear();
    }

    /**
     * Temporarily allowlist URL.
     * Adds URL to trusted sites (this URL will be ignored by safebrowsing filter).
     *
     * @param url URL.
     */
    public static async addToSafebrowsingTrusted(url: string): Promise<void> {
        const host = UrlUtils.getHost(url);
        if (!host) {
            return;
        }

        await sbCache.set(SafebrowsingApi.createHash(host), SafebrowsingApi.SB_ALLOW_LIST);
    }

    /**
     * Checks URL with safebrowsing filter.
     *
     * @see {@link http://adguard.com/en/how-malware-blocked.html#extension}
     *
     * @param requestUrl Request URL.
     * @param referrerUrl Referrer URL.
     */
    public static async checkSafebrowsingFilter(requestUrl: string, referrerUrl: string): Promise<string | undefined> {
        const safebrowsingDisabled = settingsStorage.get(SettingOption.DisableSafebrowsing);

        if (safebrowsingDisabled) {
            return;
        }

        Log.debug('Checking safebrowsing filter for', requestUrl);

        const sbList = await SafebrowsingApi.lookupUrl(requestUrl);

        if (!sbList) {
            Log.debug('No safebrowsing rule found');
            return;
        }

        Log.debug('Following safebrowsing filter has been fired:', sbList);
        return SafebrowsingApi.getErrorPageURL(requestUrl, referrerUrl, sbList);
    }

    /**
     * Performs lookup to safebrowsing service.
     *
     * @param requestUrl Request url.
     *
     * @returns Safebrowsing list we've detected or null.
     */
    private static async lookupUrl(requestUrl: string): Promise<string | null> {
        const host = UrlUtils.getHost(requestUrl);
        if (!host) {
            return null;
        }

        const hosts = SafebrowsingApi.extractHosts(host);
        if (!hosts || hosts.length === 0) {
            return null;
        }

        // try find request url in cache
        let sbList = SafebrowsingApi.checkHostsInSbCache(hosts);
        if (sbList) {
            return SafebrowsingApi.createResponse(sbList);
        }

        // check safebrowsing is active
        const now = Date.now();
        const suspendedFrom = Number(await storage.get(SB_SUSPENDED_CACHE_KEY));
        if (suspendedFrom && (now - suspendedFrom) < SafebrowsingApi.SUSPEND_TTL_MS) {
            return null;
        }

        const hashesMap = SafebrowsingApi.createHashesMap(hosts);
        const hashes = Object.keys(hashesMap);
        const shortHashes = hashes
            .map((hash) => hash.substring(0, SafebrowsingApi.DOMAIN_HASH_LENGTH))
            // Filter already checked hashes
            .filter(x => !sbRequestCache.get(x));

        if (shortHashes.length === 0) {
            // In case we have not found anything in safebrowsingCache and all short hashes have been checked in
            // safebrowsingRequestsCache - means that there is no need to request backend again
            await sbCache.set(SafebrowsingApi.createHash(host), SafebrowsingApi.SB_ALLOW_LIST);
            return SafebrowsingApi.createResponse(SafebrowsingApi.SB_ALLOW_LIST);
        }

        let response: ExtensionXMLHttpRequest;

        try {
            response = await network.lookupSafebrowsing(shortHashes);
        } catch (e) {
            Log.error('Error response from safebrowsing lookup server for', host);
            await SafebrowsingApi.suspendSafebrowsing();
            return null;
        }

        if (response && response.status >= 500) {
            // Error on server side, suspend request
            Log.error(`Error response status ${response.status} received from safebrowsing lookup server.`);
            await SafebrowsingApi.suspendSafebrowsing();
            return null;
        }

        if (!response) {
            Log.error('Can`t read response from the server');
            return null;
        }

        await SafebrowsingApi.resumeSafebrowsing();

        shortHashes.forEach((x) => {
            sbRequestCache.set(x, true);
        });

        sbList = SafebrowsingApi.SB_ALLOW_LIST;

        if (response.status !== 204) {
            sbList = await SafebrowsingApi.processSbResponse(response.responseText, hashesMap)
            || SafebrowsingApi.SB_ALLOW_LIST;
        }

        await sbCache.set(SafebrowsingApi.createHash(host), sbList);
        return SafebrowsingApi.createResponse(sbList);
    }

    /**
     * Calculates hash for host string.
     *
     * Public for test purposes.
     *
     * @param host Host string.
     *
     * @returns Host SHA256 hash.
     */
    public static createHash(host: string): string {
        return SHA256(`${host}/`).toString().toUpperCase();
    }

    /**
     * Access denied page URL.
     *
     * @param requestUrl    Request URL.
     * @param referrerUrl   Referrer URL.
     * @param sbList        Safebrowsing list.
     * @returns Page URL.
     */
    private static getErrorPageURL(
        requestUrl: string,
        referrerUrl: string,
        sbList: string,
    ): string {
        const listName = sbList || 'malware';
        const isMalware = listName.includes('malware');
        let url = `${SAFEBROWSING_OUTPUT}.html`;
        url += `?malware=${isMalware}`;

        const host = UrlUtils.getHost(requestUrl);

        if (host) {
            url += `&host=${encodeURIComponent(host)}`;
        }

        url += `&url=${encodeURIComponent(requestUrl)}`;
        url += `&ref=${encodeURIComponent(referrerUrl)}`;

        return browser.runtime.getURL(url);
    }

    /**
     * Parses safebrowsing service response.
     *
     * @param responseText  Response text.
     * @param hashesMap  Hashes hosts map.
     * @returns Safebrowsing list or null.
     */
    private static async processSbResponse(
        responseText: string,
        hashesMap: { [key: string]: string },
    ): Promise<string | null> {
        if (!responseText || responseText.length > 10 * 1024) {
            return null;
        }

        try {
            const data: { hash: string, list: string }[] = [];

            responseText.split('\n')
                // filter empty lines
                .filter(line => !!line)
                .forEach(line => {
                    const row = line.split(':');

                    const hash = row[2];
                    const list = row[0];

                    if (hash && list) {
                        data.push({ hash, list });
                    }
                });

            const saveTasks = data.map(({ hash, list }) => sbCache.set(hash, list));

            await Promise.all(saveTasks);

            const matched = data.find(({ hash }) => hashesMap[hash]);

            if (matched) {
                return matched.list;
            }

            return null;
        } catch (ex) {
            Log.error('Error parse safebrowsing response, cause', ex);
        }
        return null;
    }

    /**
     * Creates lookup callback parameter.
     *
     * @param sbList Safebrowsing list we've detected or null.
     * @returns Safebrowsing list or null if this list is SB_ALLOW_LIST (means that site was allowlisted).
     */
    private static createResponse(sbList: string): string | null {
        return (sbList === SafebrowsingApi.SB_ALLOW_LIST) ? null : sbList;
    }

    /**
     * Resumes previously suspended work of SafebrowsingFilter.
     */
    private static async resumeSafebrowsing(): Promise<void> {
        await storage.remove(SB_SUSPENDED_CACHE_KEY);
    }

    /**
     * Suspend work of SafebrowsingFilter (in case of backend error).
     */
    private static async suspendSafebrowsing(): Promise<void> {
        await storage.set(SB_SUSPENDED_CACHE_KEY, Date.now());
    }

    /**
     * Calculates SHA256 hashes for strings in hosts and then
     * gets prefixes for calculated hashes.
     *
     * @param hosts List of hosts.
     *
     * @returns Key value record, where key is calculated hash and value is host.
     */
    private static createHashesMap(hosts: string[]): { [key: string]: string } {
        const result = Object.create(null);

        for (let i = 0; i < hosts.length; i += 1) {
            const host = hosts[i];

            if (!host) {
                continue;
            }

            const hash = SafebrowsingApi.createHash(host);
            result[hash] = host;
        }

        return result;
    }

    /**
     * Checks safebrowsing cache.
     *
     * @param hosts List of hosts.
     *
     * @returns Matched safebrowsing list name or null.
     */
    private static checkHostsInSbCache(hosts: string[]): string | null {
        for (let i = 0; i < hosts.length; i += 1) {
            const host = hosts[i];

            if (!host) {
                continue;
            }

            const sbList = sbCache.get(SafebrowsingApi.createHash(host));
            if (sbList) {
                return sbList;
            }
        }
        return null;
    }

    /**
     * Extracts hosts from one host.
     * This method returns all sub-domains and IP address of the specified host.
     *
     * @param host Host string.
     *
     * @returns List of sub-domains and ip addresses strings.
     */
    private static extractHosts(host: string): string[] {
        const hosts: string[] = [];
        if (UrlUtils.isIpv4(host) || UrlUtils.isIpv6(host)) {
            hosts.push(host);
            return hosts;
        }

        const parts = host.split('.');
        if (parts.length <= 2) {
            hosts.push(host);
        } else {
            for (let i = 0; i <= parts.length - 2; i += 1) {
                hosts.push(parts.slice(i).join('.'));
            }
        }

        return hosts;
    }
}
