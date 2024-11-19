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

import { executeScript } from 'scripting-service';

import { logger } from '../common/logger';
import { UserAgent } from '../common/user-agent';
import { KEEP_ALIVE_PORT_NAME } from '../common/constants';
import { messenger } from '../pages/services/messenger';

import { isHttpRequest } from './tswebextension';

/**
 * Code which is injected into the page as content-script to keep the connection alive.
 */
const keepAliveCode = `
(() => {
    // used to avoid multiple connections from the same tab
    if (window.keepAlive) {
        return;
    }

    function connect() {
        browser.runtime.connect({ name: '${KEEP_ALIVE_PORT_NAME}' })
            .onDisconnect
            .addListener(() => {
                connect();
            });
    }

    connect();

    window.keepAlive = true;
})();
`;

/**
 * Function to keep the connection alive by reconnecting if disconnected.
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

    connect();

    // We avoid adding a global type declaration to prevent confusion with the service worker,
    // as this will be used only on this page.
    // @ts-ignore
    window.keepAlive = true;
}

/**
 * Class responsible for keeping the Chrome service worker or Firefox service worker page alive.
 * It connects to a port, with its handler located in {@link ConnectionHandler}.
 * This is used to prevent ad blinking caused by the termination of the service worker or event page.
 * This implementation is temporary and will be removed once a faster engine initialization mechanism is in place.
 */
export class KeepAlive {
    /**
     * Adds listeners to tabs updates and finds the first tab to inject the script.
     */
    static init(): void {
        if (UserAgent.isFirefox || __IS_MV3__) {
            /**
             * When tab updates, we try to inject the content script to it.
             */
            browser.tabs.onUpdated.addListener(KeepAlive.onUpdate);
            KeepAlive.keepServiceWorkerAlive();

            KeepAlive.executeScriptOnTab();
        }
    }

    /**
     * Called after the background page has reloaded.
     * It is necessary for event page, which can reload,
     * but options page subscribes to events only once.
     * This function notifies all listeners to update by sending an UpdateListeners message.
     * TODO: can be removed after all pages connected via long living messages.
     */
    static async resyncEventSubscriptions(): Promise<void> {
        try {
            await messenger.updateListeners();
        } catch (e) {
            // This error occurs if there are no pages able to handle this listener.
            // It could happen if the background page reloaded when the options page was not open.
            logger.debug(e);
        }
    }

    /**
     * Executes a script on one of the open tabs.
     *
     * @param tabs Tabs to execute a script on or null by default.
     */
    static async executeScriptOnTab(tabs: browser.Tabs.Tab[] | null = null): Promise<void> {
        tabs = tabs || await browser.tabs.query({ url: '*://*/*' });

        // eslint-disable-next-line no-restricted-syntax
        for (const tab of tabs) {
            try {
                if (__IS_MV3__) {
                    // TODO - remove ts-ignore for mv3 version
                    // @ts-ignore
                    // eslint-disable-next-line no-await-in-loop
                    await executeScript(tab.id, { func: keepAliveFunc });
                } else {
                    // TODO - remove ts-ignore for mv2 version
                    // @ts-ignore
                    // eslint-disable-next-line no-await-in-loop
                    await executeScript(tab.id, { code: keepAliveCode });
                }
                return;
            } catch (e) {
                logger.error(e);
            }
        }
    }

    /**
     * Prolongs the service worker's lifespan by periodically invoking a runtime API.
     *
     * Note:
     * - This is not an official solution and may be removed or become unsupported in the future.
     * - It does not restart the service worker if it has already been terminated.
     *   For that, a port connect/disconnect workaround is used.
     */
    private static keepServiceWorkerAlive(): void {
        // Usually a service worker dies after 30 seconds,
        // using 20 seconds should be enough to keep it alive.
        const KEEP_ALIVE_INTERVAL_MS = 20000;
        setInterval(async () => {
            await browser.runtime.getPlatformInfo();
        }, KEEP_ALIVE_INTERVAL_MS);
    }

    /**
     * On tab update event handler.
     *
     * @param tabId Tab id, not used in the code. Required by API.
     * @param info Tab update info.
     * @param tab Tab details.
     */
    private static onUpdate = (
        tabId: number,
        info: browser.Tabs.OnUpdatedChangeInfoType,
        tab: browser.Tabs.Tab,
    ): void => {
        if (info.url && isHttpRequest(info.url)) {
            KeepAlive.executeScriptOnTab([tab]);
        }
    };
}
