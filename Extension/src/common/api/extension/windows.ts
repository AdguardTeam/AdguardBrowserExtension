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
import browser, { type Windows, Tabs } from 'webextension-polyfill';

/**
 * Helper class for browser.windows API.
 */
export class WindowsApi {
    /**
     * Calls browser.windows.create with fallback to browser.tabs.create.
     * In case of fallback, compatible data will be reused.
     *
     * This covers cases like Firefox for Android, where browser.windows API is not available.
     * https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2536
     *
     * @param createData Browser.windows.create argument.
     * @returns Created window, tab or null, if no calls were made.
     */
    public static async create(
        createData?: Windows.CreateCreateDataType,
    ): Promise<Windows.Window | Tabs.Tab | null> {
        if (browser.windows) {
            return browser.windows.create(createData);
        }

        const createProperties = createData || {};
        const { url, cookieStoreId } = createProperties;

        if (typeof url === 'string') {
            return browser.tabs.create({
                url,
                cookieStoreId,
            });
        }

        if (Array.isArray(url)) {
            return browser.tabs.create({
                url: url[0],
                cookieStoreId,
            });
        }

        return null;
    }
}
