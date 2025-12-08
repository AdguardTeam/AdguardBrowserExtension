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
import browser, { type Windows, type Tabs } from 'webextension-polyfill';

import { getErrorMessage } from '@adguard/logger';

import { logger } from '../../logger';
import { UserAgent } from '../../user-agent';

/**
 * Helper class for browser.windows API.
 */
export class WindowsApi {
    /**
     * Checks if browser.windows API is supported.
     *
     * Do not use browser.windows API if it is not supported,
     * for example on Android: not supported in Firefox and does not work in Edge.
     *
     * @see {@link https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/windows}
     * @see {@link https://learn.microsoft.com/en-us/microsoft-edge/extensions-chromium/developer-guide/api-support}
     *
     * @returns True if browser.windows API is supported, false otherwise.
     */
    private static async isSupported() {
        const isAndroid = await UserAgent.getIsAndroid();

        /**
         * We need separate check for Edge on Android,
         * because it has browser.windows API defined,
         * but it does nothing when you try to use it
         */
        if (isAndroid && UserAgent.isEdge) {
            return false;
        }

        return !!browser.windows
            && typeof browser.windows.update === 'function'
            && typeof browser.windows.create === 'function';
    }

    /**
     * Calls browser.windows.create with fallback to browser.tabs.create.
     * In case of fallback, compatible data will be reused.
     *
     * @param createData Browser.windows.create argument.
     *
     * @returns Created window, tab or null, if no calls were made.
     */
    public static async create(
        createData?: Windows.CreateCreateDataType,
    ): Promise<Windows.Window | Tabs.Tab | null> {
        if (await WindowsApi.isSupported()) {
            return browser.windows.create(createData);
        }

        const createProperties = createData || {};
        const { url, cookieStoreId } = createProperties;

        const firstUrl = Array.isArray(url) ? url[0] : url;
        const isUrlSpecified = typeof firstUrl === 'string';

        try {
            if (isUrlSpecified) {
                return await browser.tabs.create({
                    url: firstUrl,
                    cookieStoreId,
                });
            }

            return null;
        } catch (e) {
            const message = getErrorMessage(e);

            // Android Edge does not support cookieStoreId property.
            if (message.includes("Unexpected property: 'cookieStoreId'") && isUrlSpecified) {
                return browser.tabs.create({
                    url: Array.isArray(url) ? url[0] : url,
                });
            }

            return null;
        }
    }

    /**
     * Updates the properties of a window with specified ID.
     *
     * @param windowId Window ID. May be undefined.
     * @param updateInfo Update info.
     */
    public static async update(
        windowId: number | undefined,
        updateInfo: Windows.UpdateUpdateInfoType,
    ): Promise<void> {
        if (!windowId) {
            logger.debug('[ext.WindowsApi.update]: windowId is not specified');
            return;
        }

        if (!(await WindowsApi.isSupported())) {
            logger.debug('[ext.WindowsApi.update]: browser.windows API is not supported');
            return;
        }

        await browser.windows.update(windowId, updateInfo);
    }
}
