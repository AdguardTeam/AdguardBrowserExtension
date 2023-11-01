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
import browser, { Runtime } from 'webextension-polyfill';

import {
    FILTERING_LOG,
    FULLSCREEN_USER_RULES_EDITOR,
    KEEP_ALIVE_PORT_NAME,
} from '../common/constants';
import { MessageType } from '../common/messages';
import { Log } from '../common/log';

import { listeners } from './notifier';
import { filteringLogApi } from './api';
import { fullscreenUserRulesEditor } from './services';
import { KeepAlive } from './keep-alive';

/**
 * ConnectionHandler manages long-lived connections to the {@link Runtime.Port}.
 */
export class ConnectionHandler {
    /**
     * Initializes event listener for {@link browser.runtime.onConnect}.
     */
    public static init(): void {
        browser.runtime.onConnect.addListener(ConnectionHandler.handleConnection);
    }

    /**
     * Handles long-live connection to the port.
     *
     * @param port Object of {@link Runtime.Port}.
     */
    private static handleConnection(port: Runtime.Port): void {
        let listenerId: number;

        Log.info(`Port: "${port.name}" connected`);

        ConnectionHandler.onPortConnection(port);

        port.onMessage.addListener((message) => {
            const { type, data } = message;
            if (type === MessageType.AddLongLivedConnection) {
                const { events } = data;
                listenerId = listeners.addSpecifiedListener(events, async (...data) => {
                    const type = MessageType.NotifyListeners;
                    try {
                        port.postMessage({ type, data });
                    } catch (e) {
                        Log.error(e);
                    }
                });
            }
        });

        port.onDisconnect.addListener(() => {
            ConnectionHandler.onPortDisconnection(port);
            listeners.removeListener(listenerId);
            Log.info(`Port: "${port.name}" disconnected`);
        });
    }

    /**
     * Handler for initial port connection.
     *
     * @throws Basic {@link Error} if the page specified in the port name
     * is not found.
     *
     * @param port Object of {@link Runtime.Port}.
     */
    private static onPortConnection(port: Runtime.Port): void {
        switch (true) {
            case port.name.startsWith(FILTERING_LOG): {
                filteringLogApi.onOpenFilteringLogPage();
                break;
            }

            case port.name.startsWith(FULLSCREEN_USER_RULES_EDITOR): {
                fullscreenUserRulesEditor.onOpenPage();
                break;
            }

            case port.name === KEEP_ALIVE_PORT_NAME: {
                // This handler exists solely to prevent errors from the default case.
                Log.debug('Connected to the port');
                break;
            }

            default: {
                throw new Error(`There is no such pages ${port.name}`);
            }
        }
    }

    /**
     * Handler for port disconnection.
     *
     * @throws Basic {@link Error} if the page specified in the port name
     * is not found.
     *
     * @param port Object of {@link Runtime.Port}.
     */
    private static onPortDisconnection(port: Runtime.Port): void {
        switch (true) {
            case port.name.startsWith(FILTERING_LOG): {
                filteringLogApi.onCloseFilteringLogPage();
                break;
            }

            case port.name.startsWith(FULLSCREEN_USER_RULES_EDITOR): {
                fullscreenUserRulesEditor.onClosePage();
                break;
            }

            case port.name === KEEP_ALIVE_PORT_NAME: {
                // when the port disconnects, we try to find a new tab to inject the content script
                KeepAlive.executeScriptOnTab();
                break;
            }

            default: {
                throw new Error(`There is no such pages ${port.name}`);
            }
        }
    }
}
