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

/* global adguard */

adguard.stealthService = (function (adguard) {

    'use strict';

    /**
     * Search engines regexps
     *
     * @type {[*]}
     */
    const SEARCH_ENGINES = [
        /https?:\/\/(www\.)?google\./i,
        /https?:\/\/(www\.)?yandex\./i,
        /https?:\/\/(www\.)?bing\./i,
        /https?:\/\/(www\.)?yahoo\./i,
        /https?:\/\/(www\.)?go\.mail\.ru/i,
        /https?:\/\/(www\.)?ask\.com/i,
        /https?:\/\/(www\.)?aol\.com/i,
        /https?:\/\/(www\.)?baidu\.com/i,
        /https?:\/\/(www\.)?seznam\.cz/i
    ];

    /**
     * Headers
     */
    const HEADERS = {
        USER_AGENT: 'User-Agent',
        REFERRER: 'Referer',
        COOKIE: 'Cookie',
        SET_COOKIE: 'Set-Cookie',
        ETAG: 'ETag',
        X_CLIENT_DATA: 'X-Client-Data'
    };

    /**
     * Header values
     */
    const HEADER_VALUES = {
        PRAGMA: {
            name: 'Pragma',
            value: 'no-cache'
        },
        DO_NOT_TRACK: {
            name: 'DNT',
            value: '1'
        },
        REFERRER: {
            name: 'Referer',
            value: 'https://adguard.com/referrer.html'
        }
    };

    /**
     * Is url search engine
     *
     * @param url
     * @returns {boolean}
     */
    const isSearchEngine = function (url) {
        if (!url) {
            return false;
        }

        for (let i = 0; i < SEARCH_ENGINES.length; i++) {
            if (SEARCH_ENGINES[i].test(url)) {
                return true;
            }
        }

        return false;
    };

    /**
     * Generates rule replacing header matching header.name with header.value
     *
     * @param {*} header object name-value
     */
    const generateReplaceRule = function (header) {
        const rule = new adguard.rules.UrlFilterRule(`$cookie=${header.name.toLowerCase()}`);
        rule.replaceCookieValue = header.value;

        return rule;
    };

    /**
     * Generates rule removing header matching headerName
     *
     * @param headerName header name
     */
    const generateRemoveRule = function (headerName) {
        return new adguard.rules.UrlFilterRule(`$cookie=${headerName.toLowerCase()}`);
    };

    /**
     * Returns synthetic set of rules matching the specified request
     *
     * @param requestUrl
     * @param referrerUrl
     * @param requestType
     */
    const getRules = function (requestUrl, referrerUrl, requestType) {

        const result = [];

        adguard.console.debug('Stealth service processing headers for {0}', requestUrl);

        const thirdParty = adguard.utils.url.isThirdPartyRequest(requestUrl, referrerUrl);
        let isMainFrame = requestType === "DOCUMENT";

        // Remove referrer for third-party requests
        const hideReferrer = adguard.settings.getProperty(adguard.settings.HIDE_REFERRER);
        if (thirdParty && hideReferrer) {
            adguard.console.debug('Remove referrer for third-party requests');
            result.push(generateReplaceRule(HEADER_VALUES.REFERRER));
        }

        // Hide referrer in case of search engine is referrer
        const hideSearchQueries = adguard.settings.getProperty(adguard.settings.HIDE_SEARCH_QUERIES);
        if (hideSearchQueries && isMainFrame && thirdParty && isSearchEngine(requestUrl)) {
            adguard.console.debug('Hide referrer in case of search engine is referrer');
            result.push(generateReplaceRule(HEADER_VALUES.REFERRER));
        }

        // Remove X-Client-Data header
        const blockChromeClientData = adguard.settings.getProperty(adguard.settings.BLOCK_CHROME_CLIENT_DATA);
        if (blockChromeClientData) {
            adguard.console.debug('Remove X-Client-Data header');
            result.push(generateRemoveRule(HEADERS.X_CLIENT_DATA));
        }

        // Adding Do-Not-Track (DNT) header
        const sendDoNotTrack = adguard.settings.getProperty(adguard.settings.SEND_DO_NOT_TRACK);
        if (sendDoNotTrack) {
            adguard.console.debug('Adding Do-Not-Track (DNT) header');
            result.push(generateReplaceRule(HEADER_VALUES.DO_NOT_TRACK));
        }

        // Remove cookie header for first-party requests
        // TODO: Use self-destruct times
        const blockCookies = adguard.settings.getProperty(adguard.settings.SELF_DESTRUCT_THIRD_PARTY_COOKIES);
        if (blockCookies) {
            result.push(generateRemoveRule(HEADERS.COOKIE));
            result.push(generateRemoveRule(HEADERS.SET_COOKIE));
            result.push(generateRemoveRule(HEADERS.ETAG));
            // TODO: Find out if we need to modify pragma?
            // result.push(generateReplaceRule(HEADER_VALUES.PRAGMA));
        }

        // Remove cookie header for third-party requests
        // TODO: Use self-destruct times
        const blockThirdPartyCookies = adguard.settings.getProperty(adguard.settings.SELF_DESTRUCT_THIRD_PARTY_COOKIES);
        if (thirdParty && blockThirdPartyCookies && !isMainFrame) {
            result.push(generateRemoveRule(HEADERS.COOKIE));
            result.push(generateRemoveRule(HEADERS.SET_COOKIE));
            result.push(generateRemoveRule(HEADERS.ETAG));
            // TODO: Find out if we need to modify pragma?
            // result.push(generateReplaceRule(HEADER_VALUES.PRAGMA));
        }

        adguard.console.debug('Stealth service processed headers for {0}', requestUrl);

        return result;
    };

    return {
        getRules: getRules
    };

})(adguard);