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
import browser, { Tabs } from 'webextension-polyfill';
import { Prefs } from '../../prefs';

/**
 * Helper class for browser.tabs API.
 */
export class TabsApi {
    /**
     * Get first matched tab for passed {@link Tabs.QueryQueryInfoType}.
     *
     * @param queryInfo Browser.tabs.query argument.
     * @returns First matched tab or undefined.
     */
    public static async findOne(queryInfo: Tabs.QueryQueryInfoType): Promise<Tabs.Tab | undefined> {
        const [tab] = await browser.tabs.query(queryInfo);

        return tab;
    }

    /**
     * Activates an existing tab regardless of the browser window.
     *
     * @param tab {@link Tabs.Tab} Data.
     */
    public static async focus(tab: Tabs.Tab): Promise<void> {
        const { id, windowId } = tab;

        await browser.tabs.update(id, { active: true });
        if (windowId) {
            await browser.windows.update(windowId, { focused: true });
        }
    }

    /**
     * Get all opened tabs info.
     *
     * @returns Array of opened tabs.
     */
    public static async getAll(): Promise<Tabs.Tab[]> {
        return browser.tabs.query({});
    }

    /**
     * Get active tab in current window.
     *
     * @returns Active tab info or undefined.
     */
    public static async getActive(): Promise<Tabs.Tab | undefined> {
        return TabsApi.findOne({
            currentWindow: true,
            active: true,
        });
    }

    /**
     * Check, if page in tab is extension page.
     *
     * @param tab {@link Tabs.Tab} Data.
     * @returns True if it is extension page, else returns false.
     */
    public static isAdguardExtensionTab(tab: Tabs.Tab): boolean {
        const { url } = tab;

        if (!url) {
            return false;
        }

        try {
            const parsed = new URL(url);

            const { protocol, hostname } = parsed;

            const scheme = Prefs.baseUrl.split('://')[0];

            if (!scheme) {
                return false;
            }

            return protocol.indexOf(scheme) > -1 && hostname === Prefs.id;
        } catch (e) {
            return false;
        }
    }
}
