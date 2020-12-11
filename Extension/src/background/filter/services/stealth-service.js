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
import { utils } from '../../utils/common';
import { RequestTypes } from '../../utils/request-types';
import { settings } from '../../settings/user-settings';
import { log } from '../../../common/log';
import { requestContextStorage } from '../request-context-storage';
import { filteringApi } from '../filtering-api';
import { filteringLog } from '../filtering-log';
import { listeners } from '../../notifier';
import { frames } from '../../tabs/frames';
import { browserUtils } from '../../utils/browser-utils';
import { browser } from '../../extension-api/browser';
import { STEALTH_ACTIONS } from '../../../common/constants';

// TODO: [TSUrlFilter] Use TSURLFilter stealthService

/**
 * Class to apply stealth settings
 * - Cookie
 * - Headers
 * - WebRTC
 */
export const stealthService = (() => {
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
        /https?:\/\/(www\.)?seznam\.cz/i,
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

        for (let i = 0; i < SEARCH_ENGINES.length; i += 1) {
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
        const host = utils.url.getHost(url);
        return `${(url.indexOf('https') === 0 ? 'https://' : 'http://') + host}/`;
    };

    /**
     * Generates rule removing cookies
     *
     * @param {number} maxAgeMinutes Cookie maxAge in minutes
     * @param {number} stealthActions stealth actions to add to the rule
     */
    const generateRemoveRule = function (maxAgeMinutes, stealthActions) {
        const maxAgeOption = maxAgeMinutes > 0 ? `;maxAge=${maxAgeMinutes * 60}` : '';
        const rule = new TSUrlFilter.NetworkRule(`$cookie=/.+/${maxAgeOption}`, 0);
        rule.stealthActions = stealthActions;
        return rule;
    };

    /**
     * Checks if stealth mode is disabled
     * @returns {boolean}
     */
    const isStealthModeDisabled = () => {
        return settings.getProperty(settings.DISABLE_STEALTH_MODE)
            || settings.isFilteringDisabled();
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
        return settings.getProperty(stealthSettingName);
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

        const context = requestContextStorage.get(requestId);
        if (!context) {
            return false;
        }

        const { tab } = context;
        const { requestUrl } = context;
        const { requestType } = context;

        log.debug('Stealth service processing request headers for {0}', requestUrl);

        if (frames.shouldStopRequestProcess(tab)) {
            log.debug('Tab whitelisted or protection disabled');
            return false;
        }

        const mainFrameUrl = frames.getMainFrameUrl(tab);
        if (!mainFrameUrl) {
            // frame wasn't recorded in onBeforeRequest event
            log.debug('Frame was not recorded in onBeforeRequest event');
            return false;
        }

        const whitelistRule = filteringApi.findWhitelistRule(requestUrl, mainFrameUrl, requestType);
        if (whitelistRule && whitelistRule.isDocumentWhitelistRule()) {
            log.debug('Whitelist rule found');
            return false;
        }

        const stealthWhitelistRule = findStealthWhitelistRule(requestUrl, mainFrameUrl, requestType);
        if (stealthWhitelistRule) {
            log.debug('Whitelist stealth rule found');
            requestContextStorage.update(requestId, { requestRule: stealthWhitelistRule });
            return false;
        }

        let stealthActions = 0;

        // Remove referrer for third-party requests
        const hideReferrer = getStealthSettingValue(settings.HIDE_REFERRER);
        if (hideReferrer) {
            log.debug('Remove referrer for third-party requests');
            const refHeader = browserUtils.findHeaderByName(requestHeaders, HEADERS.REFERRER);
            if (refHeader
                && utils.url.isThirdPartyRequest(requestUrl, refHeader.value)) {
                refHeader.value = getHiddenRefHeaderUrl(requestUrl);
                stealthActions |= STEALTH_ACTIONS.HIDE_REFERRER;
            }
        }

        // Hide referrer in case of search engine is referrer
        const isMainFrame = requestType === RequestTypes.DOCUMENT;
        const hideSearchQueries = getStealthSettingValue(settings.HIDE_SEARCH_QUERIES);
        if (hideSearchQueries && isMainFrame) {
            log.debug('Hide referrer in case of search engine is referrer');
            const refHeader = browserUtils.findHeaderByName(requestHeaders, HEADERS.REFERRER);
            if (refHeader
                && isSearchEngine(refHeader.value)
                && utils.url.isThirdPartyRequest(requestUrl, refHeader.value)) {
                refHeader.value = getHiddenRefHeaderUrl(requestUrl);
                stealthActions |= STEALTH_ACTIONS.HIDE_SEARCH_QUERIES;
            }
        }

        // Remove X-Client-Data header
        const blockChromeClientData = getStealthSettingValue(settings.BLOCK_CHROME_CLIENT_DATA);
        if (blockChromeClientData) {
            log.debug('Remove X-Client-Data header');
            if (browserUtils.removeHeader(requestHeaders, HEADERS.X_CLIENT_DATA)) {
                stealthActions |= STEALTH_ACTIONS.BLOCK_CHROME_CLIENT_DATA;
            }
        }

        // Adding Do-Not-Track (DNT) header
        const sendDoNotTrack = getStealthSettingValue(settings.SEND_DO_NOT_TRACK);
        if (sendDoNotTrack) {
            log.debug('Adding Do-Not-Track (DNT) header');
            requestHeaders.push(HEADER_VALUES.DO_NOT_TRACK);
            stealthActions |= STEALTH_ACTIONS.SEND_DO_NOT_TRACK;
        }

        if (stealthActions > 0) {
            requestContextStorage.update(requestId, { stealthActions });
        }

        log.debug('Stealth service processed request headers for {0}', requestUrl);

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

        const whitelistRule = filteringApi.findWhitelistRule(requestUrl, referrerUrl, requestType);
        if (whitelistRule && whitelistRule.isDocumentWhitelistRule()) {
            log.debug('Whitelist rule found');
            return false;
        }

        // If stealth is whitelisted
        const stealthWhitelistRule = findStealthWhitelistRule(requestUrl, referrerUrl, requestType);
        if (stealthWhitelistRule) {
            log.debug('Whitelist stealth rule found');
            return null;
        }

        const result = [];

        log.debug('Stealth service lookup cookie rules for {0}', requestUrl);

        // Remove cookie header for first-party requests
        const blockCookies = getStealthSettingValue(settings.SELF_DESTRUCT_FIRST_PARTY_COOKIES);
        if (blockCookies) {
            result.push(generateRemoveRule(settings.getProperty(settings.SELF_DESTRUCT_FIRST_PARTY_COOKIES_TIME), STEALTH_ACTIONS.FIRST_PARTY_COOKIES));
        }

        const blockThirdPartyCookies = getStealthSettingValue(settings.SELF_DESTRUCT_THIRD_PARTY_COOKIES);
        if (!blockThirdPartyCookies) {
            log.debug('Stealth service processed lookup cookie rules for {0}', requestUrl);
            return result;
        }

        // Marks requests without referrer as first-party.
        // It's important to prevent removing google auth cookies. (for requests in background tab)
        const thirdParty = referrerUrl && utils.url.isThirdPartyRequest(requestUrl, referrerUrl);
        const isMainFrame = requestType === RequestTypes.DOCUMENT;

        // Remove cookie header for third-party requests
        if (thirdParty && !isMainFrame) {
            result.push(generateRemoveRule(settings.getProperty(settings.SELF_DESTRUCT_THIRD_PARTY_COOKIES_TIME), STEALTH_ACTIONS.THIRD_PARTY_COOKIES));
        }

        log.debug('Stealth service processed lookup cookie rules for {0}', requestUrl);

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
        if (referrerUrl) {
            const stealthDocumentWhitelistRule = filteringApi.findStealthWhitelistRule(referrerUrl, referrerUrl, requestType);
            if (stealthDocumentWhitelistRule && stealthDocumentWhitelistRule.isDocumentWhitelistRule()) {
                log.debug('Stealth document whitelist rule found.');
                return stealthDocumentWhitelistRule;
            }
        }

        const stealthWhitelistRule = filteringApi.findStealthWhitelistRule(requestUrl, referrerUrl, requestType);
        if (stealthWhitelistRule) {
            log.debug('Stealth whitelist rule found.');
            return stealthWhitelistRule;
        }

        return null;
    };

    /**
     * Updates browser privacy.network settings depending on blocking WebRTC or not
     */
    const handleBlockWebRTC = async () => {
        // Edge doesn't support privacy api
        // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/privacy
        if (!browser.privacy) {
            return;
        }

        const logError = (e) => {
            log.error('Error updating privacy.network settings: {0}', e);
        };

        const webRTCDisabled = getStealthSettingValue(settings.BLOCK_WEBRTC);

        // Deprecated since Chrome 48
        if (typeof browser.privacy.network.webRTCMultipleRoutesEnabled === 'object') {
            try {
                if (webRTCDisabled) {
                    await browser.privacy.network.webRTCMultipleRoutesEnabled.set({
                        value: false,
                        scope: 'regular',
                    });
                } else {
                    await browser.privacy.network.webRTCMultipleRoutesEnabled.clear({
                        scope: 'regular',
                    });
                }
            } catch (e) {
                logError(e);
            }
        }

        // Since chromium 48
        if (typeof browser.privacy.network.webRTCIPHandlingPolicy === 'object') {
            try {
                if (webRTCDisabled) {
                    await browser.privacy.network.webRTCIPHandlingPolicy.set({
                        value: 'disable_non_proxied_udp',
                        scope: 'regular',
                    });
                } else {
                    await browser.privacy.network.webRTCIPHandlingPolicy.clear({
                        scope: 'regular',
                    });
                }
            } catch (e) {
                logError(e);
            }
        }

        if (typeof browser.privacy.network.peerConnectionEnabled === 'object') {
            try {
                if (webRTCDisabled) {
                    browser.privacy.network.peerConnectionEnabled.set({
                        value: false,
                        scope: 'regular',
                    });
                } else {
                    browser.privacy.network.peerConnectionEnabled.clear({
                        scope: 'regular',
                    });
                }
            } catch (e) {
                logError(e);
            }
        }
    };

    /**
     * Strips out the tracking codes/parameters from a URL and return the cleansed URL
     *
     * @param requestId
     */
    const removeTrackersFromUrl = (requestId) => {
        if (!getStealthSettingValue(settings.STRIP_TRACKING_PARAMETERS)) {
            return null;
        }

        const context = requestContextStorage.get(requestId);
        if (!context || context.requestType !== RequestTypes.DOCUMENT) {
            return null;
        }

        const { requestUrl, requestType, tab } = context;

        log.debug('Stealth service processing request url for {0}', requestUrl);

        if (frames.shouldStopRequestProcess(tab)) {
            log.debug('Tab whitelisted or protection disabled');
            return null;
        }

        const mainFrameUrl = frames.getMainFrameUrl(tab);
        if (!mainFrameUrl) {
            // frame wasn't recorded in onBeforeRequest event
            log.debug('Frame was not recorded in onBeforeRequest event');
            return null;
        }

        const whitelistRule = filteringApi.findWhitelistRule(requestUrl, mainFrameUrl, requestType);
        if (whitelistRule && whitelistRule.isDocumentWhitelistRule()) {
            log.debug('Whitelist rule found');
            return null;
        }

        const stealthWhitelistRule = findStealthWhitelistRule(requestUrl, mainFrameUrl, requestType);
        if (stealthWhitelistRule) {
            log.debug('Whitelist stealth rule found');
            filteringLog.addHttpRequestEvent(tab, requestUrl, mainFrameUrl, requestType, stealthWhitelistRule);
            return null;
        }

        const urlPieces = requestUrl.split('?');

        // If no params, nothing to modify
        if (urlPieces.length === 1) {
            return null;
        }

        const trackingParameters = settings.getProperty(settings.TRACKING_PARAMETERS)
            .trim()
            .split(',')
            .map(x => x.replace('=', '').replace(/\*/g, '[^&#=]*').trim())
            .filter(x => x);
        const trackingParametersRegExp = new RegExp(`((^|&)(${trackingParameters.join('|')})=[^&#]*)`, 'ig');
        urlPieces[1] = urlPieces[1].replace(trackingParametersRegExp, '');

        // If we've collapsed the URL to the point where there's an '&' against the '?'
        // then we need to get rid of that.
        while (urlPieces[1].charAt(0) === '&') {
            urlPieces[1] = urlPieces[1].substr(1);
        }

        const result = urlPieces[1] ? urlPieces.join('?') : urlPieces[0];

        if (result !== requestUrl) {
            log.debug(`Stealth stripped tracking parameters for url: ${requestUrl}`);
            filteringLog.bindStealthActionsToHttpRequestEvent(
                tab,
                STEALTH_ACTIONS.STRIPPED_TRACKING_URL,
                context.eventId,
            );

            return result;
        }

        return null;
    };

    const handleWebRTCEnabling = () => {
        browserUtils.containsPermissions(['privacy'])
            .then(result => {
                if (result) {
                    return true;
                }
                return browserUtils.requestPermissions(['privacy']);
            })
            .then(async (granted) => {
                if (granted) {
                    await handleBlockWebRTC();
                } else {
                    // If privacy permission is not granted set block webrtc value to false
                    settings.setProperty(settings.BLOCK_WEBRTC, false);
                }
            })
            .catch(error => {
                log.error(error);
            });
    };

    const handleWebRTCDisabling = () => {
        browserUtils.containsPermissions(['privacy'])
            .then(async (result) => {
                if (result) {
                    await handleBlockWebRTC();
                    return browserUtils.removePermission(['privacy']);
                }
                return true;
            });
    };

    const handlePrivacyPermissions = () => {
        const webRTCEnabled = getStealthSettingValue(settings.BLOCK_WEBRTC);
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
        return !browserUtils.isEdgeBrowser();
    };

    /**
     * We handle privacy permission only for chromium browsers
     * In the Firefox privacy permission is available by default
     * because they can't be optional there
     * @returns {boolean}
     */
    const shouldHandlePrivacyPermission = () => {
        return browserUtils.isChromium();
    };

    if (canBlockWebRTC()) {
        settings.onUpdated.addListener(async (setting) => {
            if (setting === settings.BLOCK_WEBRTC
                || setting === settings.DISABLE_STEALTH_MODE) {
                if (shouldHandlePrivacyPermission()) {
                    handlePrivacyPermissions();
                } else {
                    await handleBlockWebRTC();
                }
            }
        });

        listeners.addListener((event) => {
            switch (event) {
                case listeners.APPLICATION_INITIALIZED:
                    browserUtils.containsPermissions(['privacy'])
                        .then(async (result) => {
                            if (result) {
                                await handleBlockWebRTC();
                            }
                        });
                    break;
                default:
                    break;
            }
        });
    }


    return {
        processRequestHeaders,
        getCookieRules,
        removeTrackersFromUrl,
        canBlockWebRTC,
        STEALTH_ACTIONS,
    };
})();
