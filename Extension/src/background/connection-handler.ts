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

import { FILTERING_LOG, FULLSCREEN_USER_RULES_EDITOR } from '../common/constants';

import { MessageType } from '../common/messages';

import { Log } from '../common/log';
import { listeners } from './notifier';
import { filteringLogApi } from './api';
import { fullscreenUserRulesEditor } from './services';

export class ConnectionHandler {
    public static init(): void {
        browser.runtime.onConnect.addListener(ConnectionHandler.handleConnection);
    }

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

            default: {
                throw new Error(`There is no such pages ${port.name}`);
            }
        }
    }

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

            default: {
                throw new Error(`There is no such pages ${port.name}`);
            }
        }
    }
}
