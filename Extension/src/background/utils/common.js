/**
 * This file is part of Adguard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * Adguard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Adguard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Adguard Browser Extension.  If not, see <http://www.gnu.org/licenses/>.
 */

import { log } from '../../common/log';
import { cookie } from './cookie';
import { strings } from '../../common/strings';
import { dates } from './dates';
import { collections } from './collections';
import { concurrent } from './concurrent';
import { channels } from './channels';
import { workaround } from './workaround';
import { i18n } from './i18n';
import { filters } from './filters';
import { url } from './url';

/**
 * Background tab id in browsers is defined as -1
 */
export const BACKGROUND_TAB_ID = -1;

/**
 * Main frame id is equal to 0
 */
export const MAIN_FRAME_ID = 0;

/**
 * Utilities namespace
 */
export const utils = {
    strings,
    dates,
    collections,
    concurrent,
    channels,
    workaround,
    i18n,
    cookie,
    filters,
    url,
};

/**
 * Converts chrome tabs into tabs
 * https://developer.chrome.com/extensions/tabs#type-Tab
 * @param chromeTab
 * @returns tab
 */
export function toTabFromChromeTab(chromeTab) {
    return {
        tabId: chromeTab.id,
        url: chromeTab.url,
        title: chromeTab.title,
        incognito: chromeTab.incognito,
        status: chromeTab.status,
    };
}

/**
 * Unload handler. When extension is unload then 'fireUnload' is invoked.
 * You can add own handler with method 'when'
 * @type {{when, fireUnload}}
 */
export const unload = (function () {
    const unloadChannel = utils.channels.newChannel();

    const when = function (callback) {
        if (typeof callback !== 'function') {
            return;
        }
        unloadChannel.addListener(() => {
            try {
                callback();
            } catch (ex) {
                log.error('Error while invoke unload method');
                log.error(ex);
            }
        });
    };

    const fireUnload = function (reason) {
        log.info(`Unload is fired: ${reason}`);
        unloadChannel.notifyInReverseOrder(reason);
    };

    return {
        when,
        fireUnload,
    };
})();
