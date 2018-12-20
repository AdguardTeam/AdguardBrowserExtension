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
     * @type {Array.<string>}
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
        REFERRER: 'Referer',
        X_CLIENT_DATA: 'X-Client-Data',
        DO_NOT_TRACK: 'DNT',
    };

    /**
     * Header values
     */
    const HEADER_VALUES = {
        DO_NOT_TRACK: {
            name: 'DNT',
            value: '1'
        },
    };

    const STEALTH_ACTIONS = {
        HIDE_REFERRER: 1 << 0,
        HIDE_SEARCH_QUERIES: 1 << 1,
        BLOCK_CHROME_CLIENT_DATA: 1 << 2,
        SEND_DO_NOT_TRACK: 1 << 3,
    };

    /**
     * Is url search engine
     *
     * @param {string} url
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
     * Generates rule removing cookies
     *
     * @param {number} maxAgeMinutes Cookie maxAge in minutes
     */
    const generateRemoveRule = function (maxAgeMinutes) {
        const maxAgeOption = maxAgeMinutes > 0 ? `;maxAge=${maxAgeMinutes * 60}` : '';
        return new adguard.rules.UrlFilterRule(`$cookie=/.+/${maxAgeOption}`);
    };

    /**
     * Checks if stealth mode is disabled
     * @returns {boolean}
     */
    const isStealthModeDisabled = () => {
        return adguard.settings.getProperty(adguard.settings.DISABLE_STEALTH_MODE);
    };

    /**
     * Returns stealth setting current value, considering if global stealth setting is enabled
     * @param stealthSettingName
     * @returns {boolean}
     */
    const getStealthSettingValue = (stealthSettingName) => {
        if (isStealthModeDisabled()) {
            return false;
        }
        return adguard.settings.getProperty(stealthSettingName);
    };

    /**
     * Processes request headers
     *
     * @param {string} requestId Request identifier
     * @param {Array} requestHeaders Request headers
     * @return {boolean} True if headers were modified
     */
    const processRequestHeaders = function (requestId, requestHeaders) {
        // If stealth mode is disabled do not process headers
        if (isStealthModeDisabled()) {
            return false;
        }

        const context = adguard.requestContextStorage.get(requestId);
        if (!context) {
            return false;
        }

        const tab = context.tab;
        const requestUrl = context.requestUrl;
        const requestType = context.requestType;

        adguard.console.debug('Stealth service processing request headers for {0}', requestUrl);

        if (adguard.frames.shouldStopRequestProcess(tab)) {
            adguard.console.debug('Tab whitelisted or protection disabled');
            return false;
        }

        let mainFrameUrl = adguard.frames.getMainFrameUrl(tab);
        if (!mainFrameUrl) {
            // frame wasn't recorded in onBeforeRequest event
            adguard.console.debug('Frame was not recorded in onBeforeRequest event');
            return false;
        }

        const whiteListRule = adguard.requestFilter.findWhiteListRule(requestUrl, mainFrameUrl, requestType);
        if (whiteListRule && whiteListRule.isDocumentWhiteList()) {
            adguard.console.debug('Whitelist rule found');
            return false;
        }

        const stealthWhiteListRule = findStealthWhitelistRule(requestUrl, mainFrameUrl, requestType);
        if (stealthWhiteListRule) {
            adguard.console.debug('Whitelist stealth rule found');
            adguard.filteringLog.addHttpRequestEvent(tab, requestUrl, mainFrameUrl, requestType, stealthWhiteListRule);
            return false;
        }

        let stealthActions = 0;

        // Remove referrer for third-party requests
        const hideReferrer = getStealthSettingValue(adguard.settings.HIDE_REFERRER);
        if (hideReferrer) {
            adguard.console.debug('Remove referrer for third-party requests');
            const refHeader = adguard.utils.browser.findHeaderByName(requestHeaders, HEADERS.REFERRER);
            if (refHeader &&
                adguard.utils.url.isThirdPartyRequest(requestUrl, refHeader.value)) {

                refHeader.value = requestUrl;
                stealthActions |= STEALTH_ACTIONS.HIDE_REFERRER;
            }
        }

        // Hide referrer in case of search engine is referrer
        const isMainFrame = requestType === adguard.RequestTypes.DOCUMENT;
        const hideSearchQueries = getStealthSettingValue(adguard.settings.HIDE_SEARCH_QUERIES);
        if (hideSearchQueries && isMainFrame) {
            adguard.console.debug('Hide referrer in case of search engine is referrer');
            const refHeader = adguard.utils.browser.findHeaderByName(requestHeaders, HEADERS.REFERRER);
            if (refHeader &&
                isSearchEngine(refHeader.value) &&
                adguard.utils.url.isThirdPartyRequest(requestUrl, refHeader.value)) {

                refHeader.value = requestUrl;
                stealthActions |= STEALTH_ACTIONS.HIDE_SEARCH_QUERIES;
            }
        }

        // Remove X-Client-Data header
        const blockChromeClientData = getStealthSettingValue(adguard.settings.BLOCK_CHROME_CLIENT_DATA);
        if (blockChromeClientData) {
            adguard.console.debug('Remove X-Client-Data header');
            if (adguard.utils.browser.removeHeader(requestHeaders, HEADERS.X_CLIENT_DATA)) {
                stealthActions |= STEALTH_ACTIONS.BLOCK_CHROME_CLIENT_DATA;
            }
        }

        // Adding Do-Not-Track (DNT) header
        const sendDoNotTrack = getStealthSettingValue(adguard.settings.SEND_DO_NOT_TRACK);
        if (sendDoNotTrack) {
            adguard.console.debug('Adding Do-Not-Track (DNT) header');
            requestHeaders.push(HEADER_VALUES.DO_NOT_TRACK);
            stealthActions |= STEALTH_ACTIONS.SEND_DO_NOT_TRACK;
        }

        if (stealthActions > 0) {
            adguard.requestContextStorage.update(requestId, { stealthActions });
        }

        adguard.console.debug('Stealth service processed request headers for {0}', requestUrl);

        return stealthActions > 0;
    };

    /**
     * Returns synthetic set of rules matching the specified request
     *
     * @param requestUrl
     * @param referrerUrl
     * @param requestType
     */
    const getCookieRules = function (requestUrl, referrerUrl, requestType) {
        // if stealth mode is disabled
        if (isStealthModeDisabled()) {
            return null;
        }

        // If stealth is whitelisted
        const whiteListRule = findStealthWhitelistRule(requestUrl, referrerUrl, requestType);
        if (whiteListRule) {
            return null;
        }

        const result = [];

        adguard.console.debug('Stealth service lookup cookie rules for {0}', requestUrl);

        // Remove cookie header for first-party requests
        const blockCookies = getStealthSettingValue(adguard.settings.SELF_DESTRUCT_FIRST_PARTY_COOKIES);
        if (blockCookies) {
            result.push(generateRemoveRule(adguard.settings.getProperty(adguard.settings.SELF_DESTRUCT_FIRST_PARTY_COOKIES_TIME)));
        }

        const blockThirdPartyCookies = getStealthSettingValue(adguard.settings.SELF_DESTRUCT_THIRD_PARTY_COOKIES);
        if (!blockThirdPartyCookies) {
            adguard.console.debug('Stealth service processed lookup cookie rules for {0}', requestUrl);
            return result;
        }

        const thirdParty = adguard.utils.url.isThirdPartyRequest(requestUrl, referrerUrl);
        const isMainFrame = requestType === adguard.RequestTypes.DOCUMENT;

        // Remove cookie header for third-party requests
        if (thirdParty && !isMainFrame) {
            result.push(generateRemoveRule(adguard.settings.getProperty(adguard.settings.SELF_DESTRUCT_THIRD_PARTY_COOKIES_TIME)));
        }

        adguard.console.debug('Stealth service processed lookup cookie rules for {0}', requestUrl);

        return result;
    };

    /**
     * Checks if tab if whitelisted for stealth
     *
     * @param requestUrl
     * @param referrerUrl
     * @param requestType
     * @returns whitelist rule if found
     */
    const findStealthWhitelistRule = function (requestUrl, referrerUrl, requestType) {
        const stealthDocumentWhitelistRule = adguard.requestFilter.findStealthWhiteListRule(referrerUrl, referrerUrl, requestType);
        if (stealthDocumentWhitelistRule && stealthDocumentWhitelistRule.isDocumentWhiteList()) {
            adguard.console.debug('Stealth document whitelist rule found.');
            return stealthDocumentWhitelistRule;
        }

        const stealthWhiteListRule = adguard.requestFilter.findStealthWhiteListRule(requestUrl, referrerUrl, requestType);
        if (stealthWhiteListRule) {
            adguard.console.debug('Stealth whitelist rule found.');
            return stealthWhiteListRule;
        }

        return null;
    };

    /**
     * Updates browser privacy.network settings depending on blocking WebRTC or not
     */
    const handleWebRTCDisabled = () => {

        // Edge doesn't support privacy api
        // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/privacy
        if (typeof browser.privacy === 'undefined') {
            return;
        }

        const resetLastError = () => {
            const ex = browser.runtime.lastError;
            if (ex) {
                adguard.console.error('Error updating privacy.network settings: {0}', ex);
            }
        };

        const webRTCDisabled = getStealthSettingValue(adguard.settings.BLOCK_WEBRTC);

        // Deprecated since Chrome 48
        if (typeof browser.privacy.network.webRTCMultipleRoutesEnabled === 'object') {
            if (webRTCDisabled) {
                browser.privacy.network.webRTCMultipleRoutesEnabled.set({
                    value: false,
                    scope: 'regular',
                }, resetLastError);
            } else {
                browser.privacy.network.webRTCMultipleRoutesEnabled.clear({
                    scope: 'regular',
                }, resetLastError);
            }
        }

        // Since chromium 48
        if (typeof browser.privacy.network.webRTCIPHandlingPolicy === 'object') {
            if (webRTCDisabled) {
                browser.privacy.network.webRTCIPHandlingPolicy.set({
                    value: 'disable_non_proxied_udp',
                    scope: 'regular',
                }, resetLastError);
            } else {
                browser.privacy.network.webRTCIPHandlingPolicy.clear({
                    scope: 'regular',
                }, resetLastError);
            }
        }

        if (typeof browser.privacy.network.peerConnectionEnabled === 'object') {
            if (webRTCDisabled) {
                browser.privacy.network.peerConnectionEnabled.set({
                    value: false,
                    scope: 'regular',
                }, resetLastError);
            } else {
                browser.privacy.network.peerConnectionEnabled.clear({
                    scope: 'regular',
                }, resetLastError);
            }
        }
    };

    /**
     * More detailed string pattern suffixes, stored by their common root.
     */
    const TRACKERS_BY_ROOT = {

        // Google's Urchin Tracking Module
        'utm_': [
            'source',
            'medium',
            'term',
            'campaign',
            'content',
            'name',
            'cid',
            'reader',
            'viz_id',
            'pubreferrer',
            'swu'
        ],

        // Adobe Omniture SiteCatalyst
        'IC': [
            'ID'
        ],

        // Adobe Omniture SiteCatalyst
        'ic': [
            'id'
        ],

        // Hubspot
        '_hs': [
            'enc',
            'mi'
        ],

        // Marketo
        'mkt_': [
            'tok'
        ],

        // MailChimp
        // https://developer.mailchimp.com/documentation/mailchimp/guides/getting-started-with-ecommerce/
        'mc_': [
            'cid',
            'eid'
        ],

        // comScore Digital Analytix?
        // http://www.about-digitalanalytics.com/comscore-digital-analytix-url-campaign-generator
        'ns_': [
            'source',
            'mchannel',
            'campaign',
            'linkname',
            'fee'
        ],

        // Simple Reach
        'sr_': [
            'share'
        ],

        // Vero
        'vero_': [
            'conv',
            'id'
        ],

        // Non-prefixy and 1-offs
        '': [
            // Facebook Click Identifier
            // http://thisinterestsme.com/facebook-fbclid-parameter/
            'fbclid',
            // Google Click Identifier
            'gclid',
            // Some other Google Click thing
            'ocid',
            // Unknown
            'ncid',
            // Unknown
            'nr_email_referer',
            // Generic-ish. Facebook, Product Hunt and others
            'ref',
            // Alibaba-family 'super position model' tracker:
            // https://github.com/newhouse/url-tracking-stripper/issues/38
            'spm'
        ]
    };


    // Go through all the trackers by their root and turn them into a big regex...
    const TRACKER_REGEXES_BY_ROOT = {};
    for (let root in TRACKERS_BY_ROOT) {
        // Old way, matching at the end 1 or unlimited times.
        // TRACKER_REGEXES_BY_ROOT[root] = new RegExp("((^|&)" + root + "(" + TRACKERS_BY_ROOT[root].join('|') + ")=[^&#]+)", "ig");
        // New way, matching at the end 0 or unlimited times. Hope this doesn't come back to be a problem.
        TRACKER_REGEXES_BY_ROOT[root] = new RegExp("((^|&)" + root + "(" + TRACKERS_BY_ROOT[root].join('|') + ")=[^&#]*)", "ig");
    }

    /**
     * Strips out the tracking codes/parameters from a URL and return the cleansed URL
     *
     * @param requestId
     */
    const removeTrackersFromUrl = (requestId) => {

        // If stealth mode is disabled
        if (isStealthModeDisabled()) {
            return null;
        }

        const context = adguard.requestContextStorage.get(requestId);
        if (!context) {
            return null;
        }

        const tab = context.tab;
        const requestUrl = context.requestUrl;
        const requestType = context.requestType;

        adguard.console.debug('Stealth service processing request url for {0}', requestUrl);

        if (adguard.frames.shouldStopRequestProcess(tab)) {
            adguard.console.debug('Tab whitelisted or protection disabled');
            return null;
        }

        const mainFrameUrl = adguard.frames.getMainFrameUrl(tab);
        if (!mainFrameUrl) {
            // frame wasn't recorded in onBeforeRequest event
            adguard.console.debug('Frame was not recorded in onBeforeRequest event');
            return null;
        }

        const whiteListRule = adguard.requestFilter.findWhiteListRule(requestUrl, mainFrameUrl, requestType);
        if (whiteListRule && whiteListRule.isDocumentWhiteList()) {
            adguard.console.debug('Whitelist rule found');
            return null;
        }

        const stealthWhiteListRule = findStealthWhitelistRule(requestUrl, mainFrameUrl, requestType);
        if (stealthWhiteListRule) {
            adguard.console.debug('Whitelist stealth rule found');
            adguard.filteringLog.addHttpRequestEvent(tab, requestUrl, mainFrameUrl, requestType, stealthWhiteListRule);
            return null;
        }

        const urlPieces = requestUrl.split('?');

        // If no params, nothing to modify
        if (urlPieces.length === 1) {
            return null;
        }

        // Go through all the pattern roots
        for (let root in TRACKER_REGEXES_BY_ROOT) {
            // If we see the root in the params part, then we should probably try to do some replacements
            if (urlPieces[1].indexOf(root) !== -1) {
                urlPieces[1] = urlPieces[1].replace(TRACKER_REGEXES_BY_ROOT[root], '');
            }
        }

        // If we've collapsed the URL to the point where there's an '&' against the '?'
        // then we need to get rid of that.
        while (urlPieces[1].charAt(0) === '&') {
            urlPieces[1] = urlPieces[1].substr(1);
        }

        const result = urlPieces[1] ? urlPieces.join('?') : urlPieces[0];

        if (result !== requestUrl) {
            adguard.console.debug('Stealth stripped tracking parameters for url: ' + requestUrl);
            //TODO: Add log event
            adguard.filteringLog.addHttpRequestEvent(tab, requestUrl, mainFrameUrl, requestType, stealthWhiteListRule);

            return result;
        }

        return null;
    };

    adguard.settings.onUpdated.addListener(function (setting) {
        if (setting === adguard.settings.BLOCK_WEBRTC
            || setting === adguard.settings.DISABLE_STEALTH_MODE) {
            handleWebRTCDisabled();
        }
    });

    adguard.listeners.addListener(function (event) {
        switch (event) {
            case adguard.listeners.APPLICATION_INITIALIZED:
                handleWebRTCDisabled();
                break;
            default: break;
        }
    });

    return {
        processRequestHeaders: processRequestHeaders,
        getCookieRules: getCookieRules,
        removeTrackersFromUrl: removeTrackersFromUrl
    };

})(adguard);
