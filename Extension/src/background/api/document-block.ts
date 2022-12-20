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
import { trustedDomainsStorage } from '../storages';

export class DocumentBlockApi {
    public static TRUSTED_TTL_MS = 40 * 60 * 1000; // 40 min

    public static async init(): Promise<void> {
        try {
            const storageData = await trustedDomainsStorage.read();
            if (typeof storageData === 'string') {
                trustedDomainsStorage.setCache(JSON.parse(storageData));
            } else {
                await trustedDomainsStorage.setData([]);
            }
        } catch (e) {
            await trustedDomainsStorage.setData([]);
        }
    }

    public static async getTrustedDomains(): Promise<string[]> {
        const now = Date.now();

        // remove expired
        const data = trustedDomainsStorage.getData().filter(({ expires }) => now < expires);
        await trustedDomainsStorage.setData(data);

        return data.map(({ domain }) => domain);
    }

    public static async setTrustedDomain(url: string): Promise<void> {
        const { hostname } = new URL(url);

        const now = Date.now();

        // remove expired and duplicates
        const data = trustedDomainsStorage
            .getData()
            .filter(({ expires, domain }) => (now < expires) && (domain !== hostname));

        data.push({ domain: hostname, expires: DocumentBlockApi.TRUSTED_TTL_MS + now });

        await trustedDomainsStorage.setData(data);
    }
}
