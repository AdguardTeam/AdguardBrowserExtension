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

import { isHttpRequest } from '@adguard/tswebextension';

import { Log } from '../common/log';
import { UserAgent } from '../common/user-agent';

const DISCONNECT_TIMEOUT_MS = 1000 * 60 * 4; // 4 minutes
const PORT_NAME = 'keepAlive';

/**
 * Code which is injected into the page as content-script to keep the connection alive.
 */
const code = `
(() => {
    // used to avoid multiple connections from the same tab
    if (window.keepAlive) {
        return;
    }

    function connect() {
        browser.runtime.connect({ name: '${PORT_NAME}' })
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
 * On tab update event handler.
 *
 * @param tabId - Tab id, not used in the code. Required by API.
 * @param info - Tab update info.
 * @param tab - Tab details.
 */
const onUpdate = (
    tabId: number,
    info: browser.Tabs.OnUpdatedChangeInfoType,
    tab: browser.Tabs.Tab,
): void => {
    if (info.url && isHttpRequest(info.url)) {
        executeScriptOnTab([tab]);
    }
};

/**
 * Executes a script on one of the open tabs.
 *
 * @param tabs - Tabs to execute a script on or null by default.
 */
async function executeScriptOnTab(tabs: browser.Tabs.Tab[] | null = null): Promise<void> {
    if (chrome.runtime.lastError) {
        // tab was closed before setTimeout ran
    }

    tabs = tabs || await browser.tabs.query({ url: '*://*/*' });

    // eslint-disable-next-line no-restricted-syntax
    for (const tab of tabs) {
        try {
            // eslint-disable-next-line no-await-in-loop
            await browser.tabs.executeScript(tab.id, { code });
            browser.tabs.onUpdated.removeListener(onUpdate);
            return;
        } catch (e) {
            Log.error(e);
        }
    }
    browser.tabs.onUpdated.addListener(onUpdate);
}

/**
 * Main entry point.
 */
export const keepAlive = (): void => {
    if (UserAgent.isFirefox) {
        browser.runtime.onConnect.addListener(port => {
            if (port.name === PORT_NAME) {
                setTimeout(() => port.disconnect(), DISCONNECT_TIMEOUT_MS);
                port.onDisconnect.addListener(() => executeScriptOnTab());
            }
        });

        executeScriptOnTab();
    }
};
