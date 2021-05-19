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
            value: '1',
        },
        GLOBAL_PRIVACY_CONTROL: {
            name: 'Sec-GPC',
            value: '1',
        },
    };

    const STEALTH_ACTIONS = {
        HIDE_REFERRER: 1 << 0,
        HIDE_SEARCH_QUERIES: 1 << 1,
        BLOCK_CHROME_CLIENT_DATA: 1 << 2,
        SEND_DO_NOT_TRACK: 1 << 3,
        FIRST_PARTY_COOKIES: 1 << 4,
        THIRD_PARTY_COOKIES: 1 << 5,
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
     * Crops url path
     * @param url URL
     * @return {string} URL without path
     */
    const getHiddenRefHeaderUrl = (url) => {
        const host = adguard.utils.url.getHost(url);
        return (url.indexOf('https') === 0 ? 'https://' : 'http://') + host + '/';
    };

    /**
     * Generates rule removing cookies
     *
     * @param {number} maxAgeMinutes Cookie maxAge in minutes
     * @param {number} stealthActions stealth actions to add to the rule
     */
    const generateRemoveRule = function (maxAgeMinutes, stealthActions) {
        const maxAgeOption = maxAgeMinutes > 0 ? `;maxAge=${maxAgeMinutes * 60}` : '';
        const rule = new adguard.rules.UrlFilterRule(`$cookie=/.+/${maxAgeOption}`);
        rule.addStealthActions(stealthActions);
        return rule;
    };

    /**
     * Checks if stealth mode is disabled
     * @returns {boolean}
     */
    const isStealthModeDisabled = () => {
        return adguard.settings.getProperty(adguard.settings.DISABLE_STEALTH_MODE)
            || adguard.settings.isFilteringDisabled();
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
            adguard.requestContextStorage.update(requestId, { requestRule: stealthWhiteListRule });
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

                refHeader.value = getHiddenRefHeaderUrl(requestUrl);
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

                refHeader.value = getHiddenRefHeaderUrl(requestUrl);
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
            requestHeaders.push(HEADER_VALUES.GLOBAL_PRIVACY_CONTROL);
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

        const whiteListRule = adguard.requestFilter.findWhiteListRule(requestUrl, referrerUrl, requestType);
        if (whiteListRule && whiteListRule.isDocumentWhiteList()) {
            adguard.console.debug('Whitelist rule found');
            return false;
        }

        // If stealth is whitelisted
        const stealthWhiteListRule = findStealthWhitelistRule(requestUrl, referrerUrl, requestType);
        if (stealthWhiteListRule) {
            adguard.console.debug('Whitelist stealth rule found');
            return null;
        }

        const result = [];

        adguard.console.debug('Stealth service lookup cookie rules for {0}', requestUrl);

        // Remove cookie header for first-party requests
        const blockCookies = getStealthSettingValue(adguard.settings.SELF_DESTRUCT_FIRST_PARTY_COOKIES);
        if (blockCookies) {
            result.push(generateRemoveRule(
                adguard.settings.getProperty(adguard.settings.SELF_DESTRUCT_FIRST_PARTY_COOKIES_TIME),
                STEALTH_ACTIONS.FIRST_PARTY_COOKIES
            ));
        }

        const blockThirdPartyCookies = getStealthSettingValue(adguard.settings.SELF_DESTRUCT_THIRD_PARTY_COOKIES);
        if (!blockThirdPartyCookies) {
            adguard.console.debug('Stealth service processed lookup cookie rules for {0}', requestUrl);
            return result;
        }

        // Marks requests without referrer as first-party.
        // It's important to prevent removing google auth cookies. (for requests in background tab)
        const thirdParty = referrerUrl && adguard.utils.url.isThirdPartyRequest(requestUrl, referrerUrl);
        const isMainFrame = requestType === adguard.RequestTypes.DOCUMENT;

        // Remove cookie header for third-party requests
        if (thirdParty && !isMainFrame) {
            result.push(generateRemoveRule(
                adguard.settings.getProperty(adguard.settings.SELF_DESTRUCT_THIRD_PARTY_COOKIES_TIME),
                STEALTH_ACTIONS.THIRD_PARTY_COOKIES
            ));
        }

        adguard.console.debug('Stealth service processed lookup cookie rules for {0}', requestUrl);

        return result;
    };

    /**
     * Checks if tab is whitelisted for stealth
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
    const handleBlockWebRTC = () => {
        // Edge doesn't support privacy api
        // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/privacy
        if (!browser.privacy) {
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

    const handleWebRTCEnabling = () => {
        adguard.utils.browser.containsPermissions(['privacy'])
            .then(result => {
                if (result) {
                    return true;
                }
                return adguard.utils.browser.requestPermissions(['privacy']);
            })
            .then(granted => {
                if (granted) {
                    handleBlockWebRTC();
                } else {
                    // If privacy permission is not granted set block webrtc value to false
                    adguard.settings.setProperty(adguard.settings.BLOCK_WEBRTC, false);
                }
            })
            .catch(error => {
                adguard.console.error(error);
            });
    };

    const handleWebRTCDisabling = () => {
        adguard.utils.browser.containsPermissions(['privacy'])
            .then(result => {
                if (result) {
                    handleBlockWebRTC();
                    return adguard.utils.browser.removePermission(['privacy']);
                }
                return true;
            });
    };

    const handlePrivacyPermissions = () => {
        const webRTCEnabled = getStealthSettingValue(adguard.settings.BLOCK_WEBRTC);
        if (webRTCEnabled) {
            handleWebRTCEnabling();
        } else {
            handleWebRTCDisabling();
        }
    };

    /**
     * Browsers api doesn't allow to get optional permissions
     * via chrome.permissions.getAll and we can't check privacy
     * availability via `browser.privacy !== undefined` till permission
     * isn't enabled by the user
     *
     * That's why use edge browser detection
     * Privacy methods are not working at all in the Edge
     * @returns {boolean}
     */
    const canBlockWebRTC = () => {
        return !adguard.utils.browser.isEdgeBrowser();
    };

    /**
     * We handle privacy permission only for chromium browsers
     * In the Firefox privacy permission is available by default
     * because they can't be optional there
     * @returns {boolean}
     */
    const shouldHandlePrivacyPermission = () => {
        return adguard.utils.browser.isChromium();
    };

    if (canBlockWebRTC()) {
        adguard.settings.onUpdated.addListener(function (setting) {
            if (setting === adguard.settings.BLOCK_WEBRTC
                || setting === adguard.settings.DISABLE_STEALTH_MODE) {
                if (shouldHandlePrivacyPermission()) {
                    handlePrivacyPermissions();
                } else {
                    handleBlockWebRTC();
                }
            }
        });

        adguard.listeners.addListener(function (event) {
            switch (event) {
                case adguard.listeners.APPLICATION_INITIALIZED:
                    adguard.utils.browser.containsPermissions(['privacy'])
                        .then(result => {
                            if (result) {
                                handleBlockWebRTC();
                            }
                        });
                    break;
                default:
                    break;
            }
        });
    }

    /**
     * Checks if setting is enabled and returns dom signal string
     * https://github.com/AdguardTeam/AdguardBrowserExtension/issues/1804
     * @return {string|null}
     */
    const getDomSignalScript = () => {
        const sendDoNotTrack = getStealthSettingValue(adguard.settings.SEND_DO_NOT_TRACK);

        if (!sendDoNotTrack) {
            return null;
        }

        const script = `(function() {
    try {
        if ('globalPrivacyControl' in Navigator.prototype) {
            return
        };
        Object.defineProperty(Navigator.prototype, "globalPrivacyControl", {
            get: () => true,
            configurable: true,
            enumerable: true
        });
    } catch (ex) {
        console.error('AG: Error executing send dom signal: ' + ex);
    }
})();`;

        return script;
    };

    return {
        processRequestHeaders,
        getCookieRules,
        canBlockWebRTC,
        getDomSignalScript,
        STEALTH_ACTIONS,
    };
})(adguard);
