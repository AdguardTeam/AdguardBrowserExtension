/* eslint-disable no-use-before-define */
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

import * as TSUrlFilter from '@adguard/tsurlfilter';
import { settings } from '../../settings/user-settings';
import { log } from '../../../common/log';
import { requestContextStorage } from '../request-context-storage';
import { filteringApi } from '../filtering-api';
import { listeners } from '../../notifier';
import { frames } from '../../tabs/frames';
import { browserUtils } from '../../utils/browser-utils';
import { browser } from '../../extension-api/browser';
import { STEALTH_ACTIONS } from '../../../common/constants';
import { utils } from '../../utils/common';
import { RequestTypes } from '../../utils/request-types';

/**
 * Class to apply stealth settings
 * - Cookie
 * - Headers
 * - WebRTC
 */
export const stealthService = (() => {
    /**
     * Processes request headers
     *
     * @param {string} requestId Request identifier
     * @param {Array} requestHeaders Request headers
     * @return {boolean} True if headers were modified
     */
    const processRequestHeaders = function (requestId, requestHeaders) {
        const context = requestContextStorage.get(requestId);
        if (!context) {
            return false;
        }

        const { requestUrl, requestType } = context;
        log.debug('Stealth service processing request headers for {0}', requestUrl);

        if (!canApplyStealthActionsToContext(context)) {
            return false;
        }

        const stealthActions = engine.processRequestHeaders(
            requestUrl, RequestTypes.transformRequestType(requestType), requestHeaders,
        );

        if (stealthActions > 0) {
            requestContextStorage.update(requestId, { stealthActions });
        }

        log.debug('Stealth service processed request headers for {0}', requestUrl);

        return stealthActions > 0;
    };

    /**
     * Returns rule list with stealth mode rules
     * @return {StringRuleList}
     */
    const getStealthModeRuleList = () => {
        const rulesTexts = engine.getCookieRulesTexts().join('\n');
        return new TSUrlFilter.StringRuleList(utils.filters.STEALTH_MODE_FILTER_ID, rulesTexts, false, false);
    };

    /**
     * Checks is engine has stealth mode rules
     * @return {boolean}
     */
    const hasFilterRules = () => {
        return engine.getCookieRulesTexts().length > 0;
    };

    /**
     * Checks if stealth actions are available for provided request context
     *
     * @param context
     * @return {boolean}
     */
    const canApplyStealthActionsToContext = (context) => {
        const { requestUrl, requestType, tab } = context;

        if (frames.shouldStopRequestProcess(tab)) {
            log.debug('Tab allowlisted or protection disabled');
            return false;
        }

        const mainFrameUrl = frames.getMainFrameUrl(tab);
        if (!mainFrameUrl) {
            // frame wasn't recorded in onBeforeRequest event
            log.debug('Frame was not recorded in onBeforeRequest event');
            return false;
        }

        return canApplyStealthActions(tab, requestUrl, mainFrameUrl, requestType);
    };

    /**
     * Checks if stealth actions are available for provided request with parameters
     *
     * @param tab
     * @param requestUrl
     * @param referrerUrl
     * @param requestType
     * @return {boolean}
     */
    const canApplyStealthActions = (tab, requestUrl, referrerUrl, requestType) => {
        // if stealth mode is disabled
        if (isStealthModeDisabled()) {
            return false;
        }

        const allowlistRule = filteringApi.findAllowlistRule({
            requestUrl,
            frameUrl: referrerUrl,
            requestType,
            frameRule: frames.getFrameRule(tab),
        });

        if (allowlistRule && allowlistRule.isDocumentAllowlistRule()) {
            log.debug(`Allowlist rule found: ${allowlistRule.getText()}`);
            return false;
        }

        // If stealth is allowlisted
        const stealthAllowlistRule = findStealthAllowlistRule(requestUrl, referrerUrl, requestType);
        if (stealthAllowlistRule) {
            log.debug(`Allowlist stealth rule found: ${stealthAllowlistRule.getText()}`);
            return false;
        }

        return true;
    };

    /**
     * Checks if tab is allowlisted for stealth
     *
     * @param requestUrl
     * @param referrerUrl
     * @param requestType
     * @returns allowlist rule if found
     */
    const findStealthAllowlistRule = function (requestUrl, referrerUrl, requestType) {
        if (referrerUrl) {
            const stealthDocumentAllowlistRule = filteringApi.findStealthAllowlistRule({
                requestUrl: referrerUrl,
                frameUrl: referrerUrl,
                requestType,
            });
            if (stealthDocumentAllowlistRule && stealthDocumentAllowlistRule.isDocumentAllowlistRule()) {
                log.debug('Stealth document allowlist rule found.');
                return stealthDocumentAllowlistRule;
            }
        }

        const stealthAllowlistRule = filteringApi.findStealthAllowlistRule({
            requestUrl,
            frameUrl: referrerUrl,
            requestType,
        });

        if (stealthAllowlistRule) {
            log.debug('Stealth allowlist rule found.');
            return stealthAllowlistRule;
        }

        return null;
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
     * Initializes service
     */
    const init = () => {
        engine = new TSUrlFilter.StealthService(getConfig());
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

    /**
     * Returns stealth service configuration object
     */
    const getConfig = () => {
        return {
            blockChromeClientData: getStealthSettingValue(settings.BLOCK_CHROME_CLIENT_DATA),
            hideReferrer: getStealthSettingValue(settings.HIDE_REFERRER),
            hideSearchQueries: getStealthSettingValue(settings.HIDE_SEARCH_QUERIES),
            sendDoNotTrack: getStealthSettingValue(settings.SEND_DO_NOT_TRACK),
            selfDestructThirdPartyCookies: getStealthSettingValue(settings.SELF_DESTRUCT_THIRD_PARTY_COOKIES),
            selfDestructThirdPartyCookiesTime: settings.getProperty(settings.SELF_DESTRUCT_THIRD_PARTY_COOKIES_TIME),
            selfDestructFirstPartyCookies: getStealthSettingValue(settings.SELF_DESTRUCT_FIRST_PARTY_COOKIES),
            selfDestructFirstPartyCookiesTime: settings.getProperty(settings.SELF_DESTRUCT_FIRST_PARTY_COOKIES_TIME),
        };
    };

    const STEALTH_SETTINGS = [
        settings.DISABLE_STEALTH_MODE,
        settings.BLOCK_CHROME_CLIENT_DATA,
        settings.HIDE_REFERRER,
        settings.HIDE_SEARCH_QUERIES,
        settings.SEND_DO_NOT_TRACK,
        settings.SELF_DESTRUCT_FIRST_PARTY_COOKIES,
        settings.SELF_DESTRUCT_FIRST_PARTY_COOKIES_TIME,
        settings.SELF_DESTRUCT_THIRD_PARTY_COOKIES,
        settings.SELF_DESTRUCT_THIRD_PARTY_COOKIES_TIME,
        settings.BLOCK_WEBRTC,
    ];

    let engine = new TSUrlFilter.StealthService(getConfig());

    settings.onUpdated.addListener((setting) => {
        if (STEALTH_SETTINGS.includes(setting)) {
            // Rebuild engine on settings update
            engine = new TSUrlFilter.StealthService(getConfig());
            listeners.notifyListeners(listeners.UPDATE_FILTER_RULES);
        }
    });

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
        init,
        processRequestHeaders,
        getStealthModeRuleList,
        hasFilterRules,
        canBlockWebRTC,
        STEALTH_ACTIONS,
    };
})();
