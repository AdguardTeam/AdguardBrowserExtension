/**
 * This file is part of Adguard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * Adguard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Adguard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Adguard Browser Extension. If not, see <http://www.gnu.org/licenses/>.
 */

import { contentPage } from './content-script';

/**
 * Script used to subscribe to scriptlets dispatched events
 * Loaded on content script start to ensure the fastest load
 */
export const subscribeToScriptlets = (function () {
    /**
     * Subscribe to close-window scriptlet's event
     * window.close() usage is restricted in Chrome so we use tabs API to do that
     * https://github.com/AdguardTeam/Scriptlets/issues/170
     */
    const subscribeToCloseWindow = async () => {
        const closeWindowHandler = () => {
            contentPage.sendMessage({
                type: 'scriptletCloseWindow',
            });
        };
        // Events may be passed differently in MV3
        window.addEventListener('adguard:scriptlet-close-window', closeWindowHandler);
        setTimeout(() => {
            window.removeEventListener('adguard:scriptlet-close-window', closeWindowHandler);
        }, 1000);
        // Scriptlet is loaded first so we notify it that content script is ready
        dispatchEvent(new Event('adguard:subscribed-to-close-window'));
    };

    /**
     * Initializing content script
     */
    const init = function () {
        subscribeToCloseWindow();
    };

    return {
        init,
    };
})();
