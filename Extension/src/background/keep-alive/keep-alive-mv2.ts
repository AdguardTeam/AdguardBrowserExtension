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
import { UserAgent } from '../../common/user-agent';
import { KEEP_ALIVE_PORT_NAME } from '../../common/constants';

import { KeepAliveCommon } from './keep-alive-common';

/**
 * Code which is injected into the page as content-script to keep the connection alive.
 * Used in MV2 with code-based script injection.
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

    // AG-37908
    window.addEventListener('pageshow', (event) => {
        if (event.persisted) {
            // The page is restored from BFCache, set up a new connection.
            connect();
        }
    });

    connect();

    window.keepAlive = true;
})();
`;

/**
 * Class responsible for keeping the Firefox event page alive in MV2.
 * It connects to a port, with its handler located in {@link ConnectionHandler}.
 * This is used to prevent ad blinking caused by the termination of the event page.
 * This implementation is temporary and will be removed once a faster engine initialization mechanism is in place.
 */
export class KeepAlive extends KeepAliveCommon {
    /**
     * Adds listeners to tabs updates and finds the first tab to inject the script.
     * In MV2, this only runs on Firefox.
     */
    static init(): void {
        if (UserAgent.isFirefox) {
            /**
             * When tab updates, we try to inject the content script to it.
             */
            browser.tabs.onUpdated.addListener(KeepAlive.onUpdate.bind(KeepAlive));
            KeepAlive.keepServiceWorkerAlive();

            KeepAlive.executeScriptOnTab();
        }
    }

    /**
     * Executes a script on one of the open tabs using MV2 code-based injection.
     *
     * @param tabs Tabs to execute a script on or null by default.
     */
    static async executeScriptOnTab(tabs: browser.Tabs.Tab[] | null = null): Promise<void> {
        tabs = tabs || await browser.tabs.query({ url: '*://*/*' });

        // eslint-disable-next-line no-restricted-syntax
        for (const tab of tabs) {
            try {
                // eslint-disable-next-line no-await-in-loop
                await executeScript(tab.id, { code: keepAliveCode });
                return;
            } catch (e) {
                // use debug level to avoid extension errors when blocking pages is loading
                logger.debug(`[ext.KeepAlive.executeScriptOnTab]: Tab ${tab.id} error: ${e}`);
            }
        }
    }
}
