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

import * as TSUrlFilter from '@adguard/tsurlfilter';
import { log } from './log';
import { cookie } from './cookie';
import { strings } from './strings';
import { dates } from './dates';
import { collections } from './collections';
import { concurrent } from './concurrent';
import { channels } from './channels';
import { Promise } from './Promise';
import { workaround } from './workaround';
import { i18n } from './i18n';
import { filters } from './filters';
import { url } from './url';

/**
 * Request types enumeration
 */
export const RequestTypes = {
    /**
     * Document that is loaded for a top-level frame
     */
    DOCUMENT: 'DOCUMENT',

    /**
     * Document that is loaded for an embedded frame (iframe)
     */
    SUBDOCUMENT: 'SUBDOCUMENT',

    SCRIPT: 'SCRIPT',
    STYLESHEET: 'STYLESHEET',
    OBJECT: 'OBJECT',
    IMAGE: 'IMAGE',
    XMLHTTPREQUEST: 'XMLHTTPREQUEST',
    MEDIA: 'MEDIA',
    FONT: 'FONT',
    WEBSOCKET: 'WEBSOCKET',
    WEBRTC: 'WEBRTC',
    OTHER: 'OTHER',
    CSP: 'CSP',
    COOKIE: 'COOKIE',
    PING: 'PING',

    /**
     * Transforms to TSUrlFilter.RequestType
     *
     * @param requestType
     * @return {number}
     */
    transformRequestType(requestType) {
        const contentTypes = RequestTypes;

        switch (requestType) {
            case contentTypes.DOCUMENT:
                return TSUrlFilter.RequestType.Document;
            case contentTypes.SUBDOCUMENT:
                return TSUrlFilter.RequestType.Subdocument;
            case contentTypes.STYLESHEET:
                return TSUrlFilter.RequestType.Stylesheet;
            case contentTypes.FONT:
                return TSUrlFilter.RequestType.Font;
            case contentTypes.IMAGE:
                return TSUrlFilter.RequestType.Image;
            case contentTypes.MEDIA:
                return TSUrlFilter.RequestType.Media;
            case contentTypes.SCRIPT:
                return TSUrlFilter.RequestType.Script;
            case contentTypes.XMLHTTPREQUEST:
                return TSUrlFilter.RequestType.XmlHttpRequest;
            case contentTypes.WEBSOCKET:
                return TSUrlFilter.RequestType.Websocket;
            case contentTypes.PING:
                return TSUrlFilter.RequestType.Ping;
            default:
                return TSUrlFilter.RequestType.Other;
        }
    },
};

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
    Promise,
    workaround,
    i18n,
    cookie,
    filters,
    url,
};

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
