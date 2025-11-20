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

import { logger } from '../../common/logger';
import { messenger } from '../../pages/services/messenger';
import { isHttpRequest } from '../tswebextension';

/**
 * Base class responsible for keeping the Chrome service worker or Firefox service worker page alive.
 * It connects to a port, with its handler located in {@link ConnectionHandler}.
 * This is used to prevent ad blinking caused by the termination of the service worker or event page.
 * This implementation is temporary and will be removed once a faster engine initialization mechanism is in place.
 */
export abstract class KeepAliveCommon {
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
            logger.debug('[ext.KeepAliveCommon.resyncEventSubscriptions]: cannot update listeners:', e);
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
    protected static keepServiceWorkerAlive(): void {
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
    protected static onUpdate(
        tabId: number,
        info: browser.Tabs.OnUpdatedChangeInfoType,
        tab: browser.Tabs.Tab,
    ): void {
        if (info.url && isHttpRequest(info.url)) {
            // @ts-ignore - executeScriptOnTab is implemented in child classes
            this.executeScriptOnTab([tab]);
        }
    }
}
