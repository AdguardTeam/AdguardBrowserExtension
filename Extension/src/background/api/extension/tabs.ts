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
import browser, { Tabs, Windows } from 'webextension-polyfill';
import { Prefs } from '../../prefs';

/**
 * Extended {@link Tabs.CreateCreatePropertiesType} for {@link TabsApi.openTab} method
 */
export type OpenTabProps = Tabs.CreateCreatePropertiesType & {
    // If tab with url is found, focus it instead create new one
    focusIfOpen?: boolean,
};

/**
 * Extended {@link Windows.CreateCreateDataType} for {@link TabsApi.openWindow} method
 */
export type OpenWindowProps = Windows.CreateCreateDataType & {
    // If window with url is found, focus it instead create new one
    focusIfOpen?: boolean,
};

/**
 * Helper class for browser.tabs API
 */
export class TabsApi {
    /**
     * Get first matched tab for passed {@link Tabs.QueryQueryInfoType}
     *
     * @param queryInfo - browser.tabs.query argument
     * @returns first matched tab or undefined
     */
    public static async findOne(queryInfo: Tabs.QueryQueryInfoType): Promise<Tabs.Tab | undefined> {
        const [tab] = await browser.tabs.query(queryInfo);

        return tab;
    }

    /**
     * Activates an existing tab regardless of the browser window
     *
     * @param tab - {@link Tabs.Tab} data
     */
    public static async focus(tab: Tabs.Tab): Promise<void> {
        const { id, windowId } = tab;

        await browser.tabs.update(id, { active: true });
        if (windowId) {
            await browser.windows.update(windowId, { focused: true });
        }
    }

    /**
     * Get all opened tabs info
     *
     * @returns array of opened tabs
     */
    public static async getAll(): Promise<Tabs.Tab[]> {
        return browser.tabs.query({});
    }

    /**
     * Get active tab in current window
     *
     * @returns active tab info or undefined
     */
    public static async getActive(): Promise<Tabs.Tab | undefined> {
        return TabsApi.findOne({
            currentWindow: true,
            active: true,
        });
    }

    /**
     * Creates new tab with specified {@link OpenTabProps}
     *
     * If {@link OpenTabProps.focusIfOpen} is true,
     * try to focus on existed tab with {@link OpenTabProps.url} instead creating new one
     *
     * @param param  - Extended {@link Tabs.CreateCreatePropertiesType} record with `focusIfOpen` boolean flag
     * @param param.focusIfOpen - if true, try to focus existed tab with specified url instead creating new one
     * @param param.url - tab url
     */
    public static async openTab({ focusIfOpen, url, ...props }: OpenTabProps): Promise<void> {
        if (focusIfOpen) {
            const tab = await TabsApi.findOne({ url });

            if (tab && !tab.active) {
                await TabsApi.focus(tab);
                return;
            }
        }

        await browser.tabs.create({
            url,
            ...props,
        });
    }

    /**
     * Creates new window with specified {@link OpenWindowProps}
     *
     * If {@link OpenWindowProps.focusIfOpen} is true,
     * try to focus on existed tab with {@link OpenTabProps.url} in any window instead creating new one
     *
     * @param param  - Extended {@link Windows.CreateCreateDataType} record with `focusIfOpen` boolean flag
     * @param param.focusIfOpen - if true, try to focus existed tab
     * with specified url in any window instead creating new one
     * @param param.url - tab url
     */
    public static async openWindow({ focusIfOpen, url, ...props }: OpenWindowProps): Promise<void> {
        if (focusIfOpen) {
            const tab = await TabsApi.findOne({ url });

            if (tab && !tab.active) {
                await TabsApi.focus(tab);
                return;
            }
        }

        await browser.windows.create({
            url,
            ...props,
        });
    }

    /**
     * Check, if page in tab is extension page
     *
     * @param tab - {@link Tabs.Tab} data
     * @returns true if it is extension page, else returns false
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
