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

import { executeScript } from '../services/scripting';
import { logger } from '../../common/logger';

import { KeepAliveCommon } from './keep-alive-common';

/**
 * Function to keep the connection alive by reconnecting if disconnected.
 * Used in MV3 with function-based script injection.
 */
function keepAliveFunc(): void {
    // We avoid adding a global type declaration to prevent confusion with the service worker,
    // as this will be used only on this page.
    // @ts-ignore
    if (window.keepAlive) {
        return;
    }

    /**
     * Connects to the background script and reconnects if disconnected.
     */
    function connect(): void {
        // not in the constant, because it is injected into the page, and it will lose the context of this variable
        // @see KEEP_ALIVE_PORT_NAME
        chrome.runtime.connect({ name: 'keep-alive' })
            .onDisconnect
            .addListener(() => {
                connect();
            });
    }

    // AG-37908
    window.addEventListener('pageshow', (event) => {
        if (event.persisted) {
            // The page is restored from BFCache, set up a new connection.
            connect();
        }
    });

    connect();

    // We avoid adding a global type declaration to prevent confusion with the service worker,
    // as this will be used only on this page.
    // @ts-ignore
    window.keepAlive = true;
}

/**
 * Class responsible for keeping the Chrome service worker alive in MV3.
 * It connects to a port, with its handler located in {@link ConnectionHandler}.
 * This is used to prevent ad blinking caused by the termination of the service worker.
 * This implementation is temporary and will be removed once a faster engine initialization mechanism is in place.
 */
export class KeepAlive extends KeepAliveCommon {
    /**
     * Adds listeners to tabs updates and finds the first tab to inject the script.
     * In MV3, this always runs (for all browsers).
     */
    static init(): void {
        /**
         * When tab updates, we try to inject the content script to it.
         */
        browser.tabs.onUpdated.addListener(KeepAlive.onUpdate);
        KeepAlive.keepServiceWorkerAlive();

        KeepAlive.executeScriptOnTab();
    }

    /**
     * Executes a script on one of the open tabs using MV3 function-based injection.
     *
     * @param tabs Tabs to execute a script on or null by default.
     */
    static async executeScriptOnTab(tabs: browser.Tabs.Tab[] | null = null): Promise<void> {
        tabs = tabs || await browser.tabs.query({ url: '*://*/*' });

        // eslint-disable-next-line no-restricted-syntax
        for (const tab of tabs) {
            try {
                // eslint-disable-next-line no-await-in-loop
                await executeScript(tab.id, { func: keepAliveFunc });
                return;
            } catch (e) {
                // use debug level to avoid extension errors when blocking pages is loading
                logger.debug(`[ext.KeepAlive.executeScriptOnTab]: Tab ${tab.id} error: ${e}`);
            }
        }
    }
}
