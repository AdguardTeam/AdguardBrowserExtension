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
import { MessageType, sendMessage } from '../common/messages';

/**
 * Script used to subscribe to scriptlets dispatched events
 * Loaded on content script start to ensure the fastest load
 */
export class SubscribeToScriptlets {
    private static removeListenerTimeoutMs = 1000;

    private static closeWindowEventName = 'adguard:scriptlet-close-window';

    private static subscribedToCloseWindowEventName = 'adguard:subscribed-to-close-window';

    /**
     * Initializing content script
     */
    public static init(): void {
        SubscribeToScriptlets.subscribeToCloseWindow();
    }

    /**
     * Subscribe to close-window scriptlet's event
     * window.close() usage is restricted in Chrome so we use tabs API to do that
     * https://github.com/AdguardTeam/Scriptlets/issues/170
     */
    private static subscribeToCloseWindow(): void {
        // Events may be passed differently in MV3
        window.addEventListener(
            SubscribeToScriptlets.closeWindowEventName,
            SubscribeToScriptlets.closeWindowHandler,
        );

        setTimeout(() => {
            window.removeEventListener(
                SubscribeToScriptlets.closeWindowEventName,
                SubscribeToScriptlets.closeWindowHandler,
            );
        }, SubscribeToScriptlets.removeListenerTimeoutMs);

        // Scriptlet is loaded first so we notify it that content script is ready
        dispatchEvent(new Event(SubscribeToScriptlets.subscribedToCloseWindowEventName));
    }

    /**
     * Send {@link MessageType.ScriptletCloseWindow} to background
     */
    private static closeWindowHandler(): void {
        sendMessage({ type: MessageType.ScriptletCloseWindow });
    }
}
