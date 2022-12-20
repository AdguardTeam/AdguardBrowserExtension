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

import { AntiBannerFiltersId, RequestType } from '../../../../common/constants';
import { strings } from '../../../../common/strings';
import { reactTranslator } from '../../../../common/translators/reactTranslator';

/**
 * Url utils
 *
 * @type {{getUrlWithoutScheme, isHierarchicUrl, getProtocol, getCookieDomain}}
 */
export const UrlUtils = {
    getProtocol(url) {
        try {
            const urlObject = new URL(url);
            return urlObject.protocol;
        } catch (e) {
            return '';
        }
    },

    /**
     * Removes protocol from URL and "www." if url starts with it
     *
     * @param url
     */
    getUrlWithoutScheme(url) {
        let resultUrl;

        const protocol = this.getProtocol(url);
        if (this.isHierarchicUrl(url)) {
            resultUrl = url.replace(`${protocol}//`, '');
        } else {
            resultUrl = url.replace(protocol, '');
        }

        return strings.startWith(resultUrl, 'www.') ? resultUrl.substring(4) : resultUrl;
    },

    /**
     * Checks the given URL whether is hierarchical or not
     *
     * @param url
     * @returns {boolean}
     */
    isHierarchicUrl(url) {
        return url.indexOf('//') !== -1;
    },

    /**
     * Gets domain for cookie rule
     *
     * @param {string} frameDomain
     * @returns {string}
     */
    getCookieDomain(frameDomain) {
        return frameDomain[0] === '.'
            ? frameDomain.substring(1)
            : frameDomain;
    },
};

/**
 * Filter's name for filterId
 *
 * @param {number} filterId
 * @param filtersMetadata
 * @returns {string}
 */
export const getFilterName = (filterId, filtersMetadata) => {
    if (filterId === AntiBannerFiltersId.UserFilterId) {
        return reactTranslator.getMessage('options_userfilter');
    }

    if (filterId === AntiBannerFiltersId.AllowlistFilterId) {
        return reactTranslator.getMessage('options_allowlist');
    }

    const filterMetadata = filtersMetadata?.filter((el) => el.filterId === filterId)[0];

    return filterMetadata ? filterMetadata.name : null;
};

/**
 * Request type map
 *
 * @param event
 * @returns {string}
 */
export const getRequestEventType = (event) => {
    const {
        requestType,
        requestRule,
        cspReportBlocked,
        removeHeader,
        removeParam,
    } = event;

    let requestEventType = requestType;

    if (requestRule?.cookieRule
        || requestRule?.isModifyingCookieRule) {
        requestEventType = RequestType.Cookie;
    } else if (cspReportBlocked) {
        // By default csp requests in firefox have other request type,
        // but if event cspReportBlocked is true
        // we consider such request to have "CSP report" type
        requestEventType = RequestType.CspReport;
    } else if (removeHeader) {
        return 'REMOVEHEADER';
    } else if (removeParam) {
        return 'REMOVEPARAM';
    }

    switch (requestEventType) {
        case 'DOCUMENT':
        case 'SUBDOCUMENT':
            return 'HTML';
        case 'STYLESHEET':
            return 'CSS';
        case 'SCRIPT':
            return 'JavaScript';
        case 'XMLHTTPREQUEST':
            return 'XHR';
        case 'IMAGE':
            return 'Image';
        case 'OBJECT':
        case 'MEDIA':
            return 'Media';
        case 'FONT':
            return 'Font';
        case 'WEBSOCKET':
            return 'WebSocket';
        case 'WEBRTC':
            return 'WebRTC';
        case 'CSP':
            return 'CSP';
        case 'CSP_REPORT':
            return 'CSP report';
        case 'COOKIE':
            return 'Cookie';
        case 'PING':
            return 'Ping';
        case 'OTHER':
            return 'Other';
        default:
            return '';
    }
};

/**
 * Returns data for cookie event
 *
 * @param event
 * @returns {string|null}
 */
export const getCookieData = (event) => {
    if (!event.requestRule?.cookieRule || !event?.cookieName) {
        return null;
    }
    return event.cookieValue
        ? `${event.cookieName} = ${event.cookieValue}`
        : event.cookieName;
};
