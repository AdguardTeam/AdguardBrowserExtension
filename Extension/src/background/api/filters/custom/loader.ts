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
import { network } from '../../network';

/**
 * Helper class for custom filters downloading with specified request time limitation.
 */
export class CustomFilterLoader {
    /**
     * Custom filter rules downloading limit in ms.
     */
    private static DOWNLOAD_LIMIT_MS = 3 * 1000;

    /**
     * Limits custom filter rules downloading with timeout.
     *
     * @param url Custom filter download url.
     * @throws Error if filter was not downloaded in {@link DOWNLOAD_LIMIT_MS}.
     * @returns Downloaded custom filter rules.
     */
    public static async downloadRulesWithTimeout(url: string): Promise<string[]> {
        return Promise.race([
            network.downloadFilterRulesBySubscriptionUrl(url),
            new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Fetch timeout is over')), CustomFilterLoader.DOWNLOAD_LIMIT_MS);
            }),
        ]) as Promise<string[]>;
    }
}
