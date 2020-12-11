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
import { BACKGROUND_TAB_ID, utils } from '../utils/common';
import { RequestTypes } from '../utils/request-types';
import { listeners } from '../notifier';
import { filteringLog } from './filtering-log';
import { settings } from '../settings/user-settings';
import { frames } from '../tabs/frames';
import { hitStats } from './rules/hit-stats';
import { filteringApi } from './filtering-api';
import { prefs } from '../prefs';
import { requestContextStorage } from './request-context-storage';
import { documentFilterService } from './services/document-filter';
import { redirectService } from './services/redirect-service';
import { allowlist } from './allowlist';
import { browserUtils } from '../utils/browser-utils';

export const webRequestService = (function () {
    const onRequestBlockedChannel = utils.channels.newChannel();

    /**
     * Checks if we can collect hit stats for this tab:
     * Option "Send ad filters usage" is enabled and tab isn't incognito
     * @param {object} tab
     * @returns {boolean}
     */
    const canCollectHitStatsForTab = function (tab) {
        if (!tab) {
            return settings.collectHitsCount();
        }

        return tab
            && settings.collectHitsCount()
            && !frames.isIncognitoTab(tab);
    };

    /**
     * Records filtering rule hit
     *
     * @param tab            Tab object
     * @param requestRule    Rule to record
     * @param requestUrl     Request URL
     */
    const recordRuleHit = function (tab, requestRule, requestUrl) {
        if (requestRule
            && !utils.filters.isUserFilterRule(requestRule)
            && !utils.filters.isWhitelistFilterRule(requestRule)
            && canCollectHitStatsForTab(tab)) {
            const domain = frames.getFrameDomain(tab);
            hitStats.addRuleHit(domain, requestRule.getText(), requestRule.getFilterListId(), requestUrl);
        }
    };

    /**
     * An object with the selectors and scripts to be injected into the page
     * @typedef {Object} SelectorsAndScripts
     * @property {SelectorsData} selectors An object with the CSS styles that needs to be applied
     * @property {string} scripts Javascript to be injected into the page
     * @property {boolean} collapseAllElements If true, content script must force the collapse check of the page elements
     */

    /**
     * Prepares CSS and JS which should be injected to the page.
     *
     * @param tab                       Tab data
     * @param documentUrl               Document URL
     * @param {boolean} force           Indicates whether to retrieve JS and Css selectors, used in 'webrequest' call
     *
     * When cssFilterOptions and force are undefined, we handle it in a special way
     * that depends on whether the browser supports inserting CSS and scripts from the background page
     *
     * @returns {SelectorsAndScripts} an object with the selectors and scripts to be injected into the page
     */
    const processGetSelectorsAndScripts = function (tab, documentUrl, force) {
        const result = Object.create(null);

        if (!tab) {
            return result;
        }

        if (!filteringApi.isReady()) {
            result.requestFilterReady = false;
            return result;
        }

        if (frames.isTabProtectionDisabled(tab)) {
            return result;
        }

        if (frames.isTabWhitelisted(tab)) {
            return result;
        }

        const cosmeticOptions = filteringApi.getCosmeticOption(
            documentUrl, documentUrl, RequestTypes.DOCUMENT,
        );

        if (force || !prefs.features.canUseInsertCSSAndExecuteScript) {
            // Retrieve ExtendedCss selectors only if canUseInsertCSSAndExecuteScript in unavailable
            result.selectors = filteringApi.getSelectorsForUrl(
                documentUrl, cosmeticOptions, true, !prefs.features.canUseInsertCSSAndExecuteScript,
            );
            result.scripts = filteringApi.getScriptsStringForUrl(documentUrl, tab);
        } else {
            // In preload content script only ExtendedCss selectors are necessary.
            // Traditional css selectors would be injected via tabs.injectCss.
            result.selectors = filteringApi.getSelectorsForUrl(
                documentUrl, cosmeticOptions, false, true,
            );
        }

        // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/1337
        result.collectRulesHits = isCollectingCosmeticRulesHits(tab);
        result.collapseAllElements = filteringApi.shouldCollapseAllElements();

        return result;
    };

    /**
     * Checks if request that is wrapped in page script should be blocked.
     * We do this because browser API doesn't have full support for intercepting all requests, e.g. WebSocket or WebRTC.
     *
     * @param tab           Tab
     * @param requestUrl    request url
     * @param referrerUrl   referrer url
     * @param requestType   Request type (WEBSOCKET or WEBRTC)
     * @returns {boolean}   true if request is blocked
     */
    const checkPageScriptWrapperRequest = function (tab, requestUrl, referrerUrl, requestType) {
        if (!tab) {
            return false;
        }

        let requestRule = getRuleForRequest(tab, requestUrl, referrerUrl, requestType);
        requestRule = postProcessRequest(tab, requestUrl, referrerUrl, requestType, requestRule);

        requestContextStorage.recordEmulated(requestUrl, referrerUrl, requestType, tab, requestRule);

        return isRequestBlockedByRule(requestRule);
    };

    /**
     * Checks if request is blocked
     *
     * @param tab           Tab
     * @param requestUrl    request url
     * @param referrerUrl   referrer url
     * @param requestType   one of RequestType
     * @returns {boolean}   true if request is blocked
     */
    const processShouldCollapse = function (tab, requestUrl, referrerUrl, requestType) {
        if (!tab) {
            return false;
        }

        const requestRule = getRuleForRequest(tab, requestUrl, referrerUrl, requestType);
        return isRequestBlockedByRule(requestRule);
    };

    /**
     * Checks if requests are blocked
     *
     * @param tab               Tab
     * @param referrerUrl       referrer url
     * @param collapseRequests  requests array
     * @returns {*}             requests array
     */
    const processShouldCollapseMany = function (tab, referrerUrl, collapseRequests) {
        if (!tab) {
            return collapseRequests;
        }

        for (let i = 0; i < collapseRequests.length; i += 1) {
            const request = collapseRequests[i];
            const requestRule = getRuleForRequest(tab, request.elementUrl, referrerUrl, request.requestType);
            request.collapse = isRequestBlockedByRule(requestRule);
        }

        return collapseRequests;
    };

    /**
     * Checks if request is blocked by rule
     * Do not allow redirect rules because they can't be used in collapse check functions
     *
     * @param requestRule
     * @returns {*|boolean}
     */
    const isRequestBlockedByRule = (requestRule) => {
        return requestRule
            && !requestRule.isWhitelist()
            && !requestRule.isOptionEnabled(TSUrlFilter.NetworkRuleOption.Replace)
            && !requestRule.isOptionEnabled(TSUrlFilter.NetworkRuleOption.Redirect);
    };

    /**
     * Checks if popup is blocked by rule
     * @param requestRule
     * @returns {*|boolean|true}
     */
    const isPopupBlockedByRule = (requestRule) => {
        return requestRule && !requestRule.isWhitelist()
            && requestRule.isOptionEnabled(TSUrlFilter.NetworkRuleOption.Popup);
    };

    /**
     * Check if document is blocked by rule
     * @param requestRule
     * @return {*|boolean|true}
     */
    const isDocumentBlockingRule = (requestRule) => {
        return requestRule && !requestRule.isWhitelist()
            && requestRule.isOptionEnabled(TSUrlFilter.NetworkRuleOption.Elemhide)
            && requestRule.isOptionEnabled(TSUrlFilter.NetworkRuleOption.Jsinject)
            && requestRule.isOptionEnabled(TSUrlFilter.NetworkRuleOption.Urlblock);
    };

    /**
     * Gets blocked response by rule
     * For details see https://developer.chrome.com/extensions/webRequest#type-BlockingResponse
     * or https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/webRequest/BlockingResponse
     * @param requestRule   Request rule or null
     * @param requestType   Request type
     * @param requestUrl    Request url
     * @returns {*} Blocked response or null
     */
    const getBlockedResponseByRule = function (requestRule, requestType, requestUrl) {
        if (isRequestBlockedByRule(requestRule)) {
            const isDocumentLevel = requestType === RequestTypes.DOCUMENT
                || requestType === RequestTypes.SUBDOCUMENT;

            if (isDocumentLevel && isDocumentBlockingRule(requestRule)) {
                const documentBlockedPage = documentFilterService.getDocumentBlockPageUrl(
                    requestUrl,
                    requestRule.getText(),
                );

                if (documentBlockedPage) {
                    return { documentBlockedPage };
                }

                return null;
            }

            // Don't block main_frame request
            if (requestType !== RequestTypes.DOCUMENT) {
                return { cancel: true };
            }
        // check if request rule is blocked by rule and is redirect rule
        } else if (requestRule && !requestRule.isWhitelist()) {
            if (requestRule.isOptionEnabled(TSUrlFilter.NetworkRuleOption.Redirect)) {
                // eslint-disable-next-line max-len
                const redirectUrl = redirectService.createRedirectUrl(requestRule.getAdvancedModifierValue());
                if (redirectUrl) {
                    return { redirectUrl };
                }
            }
        }
        return null;
    };

    /**
     * Finds rule for request
     *
     * @param tab           Tab
     * @param requestUrl    request url
     * @param referrerUrl   referrer url
     * @param requestType   one of RequestType
     * @returns {*}         rule or null
     */
    const getRuleForRequest = function (tab, requestUrl, referrerUrl, requestType) {
        if (frames.isTabProtectionDisabled(tab)) {
            // don't process request
            return null;
        }

        let whitelistRule;
        /**
         * Background requests will be whitelisted if their referrer
         * url will match with user whitelist rule
         * https://github.com/AdguardTeam/AdguardBrowserExtension/issues/1032
         */
        if (tab.tabId === BACKGROUND_TAB_ID) {
            whitelistRule = allowlist.findAllowlistRule(referrerUrl);
        } else {
            whitelistRule = frames.getFrameWhitelistRule(tab);
        }

        if (whitelistRule && whitelistRule.isDocumentWhitelistRule()) {
            // Frame is whitelisted by the main frame's $document rule
            // We do nothing more in this case - return the rule.
            return whitelistRule;
        }

        if (!whitelistRule) {
            // If whitelist rule is not found for the main frame, we check it for referrer
            whitelistRule = filteringApi.findWhitelistRule(requestUrl, referrerUrl, RequestTypes.DOCUMENT);
        }

        return filteringApi.findRuleForRequest(requestUrl, referrerUrl, requestType, whitelistRule);
    };

    /**
     * Finds all content rules for the url
     * @param tab Tab
     * @param documentUrl Document URL
     * @returns collection of content rules or null
     */
    const getContentRules = function (tab, documentUrl) {
        if (frames.shouldStopRequestProcess(tab)) {
            // don't process request
            return null;
        }

        const whitelistRule = filteringApi.findWhitelistRule(documentUrl, documentUrl, RequestTypes.DOCUMENT);
        if (whitelistRule && whitelistRule.isOptionEnabled(TSUrlFilter.NetworkRuleOption.Content)) {
            return null;
        }

        return filteringApi.getContentRulesForUrl(documentUrl);
    };

    /**
     * Find CSP rules for request
     * @param tab           Tab
     * @param requestUrl    Request URL
     * @param referrerUrl   Referrer URL
     * @param requestType   Request type (DOCUMENT or SUBDOCUMENT)
     * @returns {Array}     Collection of rules or null
     */
    const getCspRules = function (tab, requestUrl, referrerUrl, requestType) {
        if (frames.shouldStopRequestProcess(tab)) {
            // don't process request
            return null;
        }

        // @@||example.org^$document or @@||example.org^$urlblock —
        // disables all the $csp rules on all the pages matching the rule pattern.
        // eslint-disable-next-line max-len
        const whitelistRule = filteringApi.findWhitelistRule(requestUrl, referrerUrl, RequestTypes.DOCUMENT);
        if (whitelistRule && whitelistRule.isOptionEnabled(TSUrlFilter.NetworkRuleOption.Urlblock)) {
            return null;
        }

        return filteringApi.getCspRules(requestUrl, referrerUrl, requestType);
    };

    /**
     * Find cookie rules for request
     * @param tab           Tab
     * @param requestUrl    Request URL
     * @param referrerUrl   Referrer URL
     * @param requestType   Request type
     * @returns {Array}     Collection of rules or null
     */
    const getCookieRules = (tab, requestUrl, referrerUrl, requestType) => {
        if (frames.shouldStopRequestProcess(tab)) {
            // Don't process request
            return null;
        }

        const whitelistRule = filteringApi.findWhitelistRule(requestUrl, referrerUrl, RequestTypes.DOCUMENT);
        if (whitelistRule && whitelistRule.isDocumentWhitelistRule()) {
            // $cookie rules are not affected by regular exception rules (@@) unless it's a $document exception.
            return null;
        }

        // Get all $cookie rules matching the specified request
        return filteringApi.getCookieRules(requestUrl, referrerUrl, requestType);
    };

    /**
     * Find replace rules for request
     * @param tab
     * @param requestUrl
     * @param referrerUrl
     * @param requestType
     * @returns {*} Collection of rules or null
     */
    const getReplaceRules = (tab, requestUrl, referrerUrl, requestType) => {
        if (frames.shouldStopRequestProcess(tab)) {
            // don't process request
            return null;
        }

        const whitelistRule = filteringApi.findWhitelistRule(requestUrl, referrerUrl, RequestTypes.DOCUMENT);
        if (whitelistRule && whitelistRule.isOptionEnabled(TSUrlFilter.NetworkRuleOption.Content)) {
            return null;
        }

        return filteringApi.getReplaceRules(requestUrl, referrerUrl, requestType);
    };

    /**
     * Remove query parameters by rules for request
     * @param tab
     * @param requestUrl
     * @param referrerUrl
     * @param requestType
     * @returns {*} Collection of rules or null
     */
    const removeParamFromUrl = (tab, requestUrl, referrerUrl, requestType) => {
        if (frames.shouldStopRequestProcess(tab)) {
            // don't process request
            return null;
        }

        const whitelistRule = filteringApi.findWhitelistRule(
            requestUrl, referrerUrl, RequestTypes.DOCUMENT,
        );
        if (whitelistRule && whitelistRule.isOptionEnabled(TSUrlFilter.NetworkRuleOption.RemoveParam)) {
            return null;
        }

        const rules = filteringApi.getRemoveParamRules(requestUrl, referrerUrl, requestType);

        let result = requestUrl;
        rules.forEach((r) => {
            if (!r.isWhitelist()) {
                const ruleResult = r.getAdvancedModifier().removeParameters(result);
                if (ruleResult !== result) {
                    filteringLog.addRemoveParamEvent(tab, requestUrl, requestType, r);
                }

                result = ruleResult;
            }
        });

        if (result !== requestUrl) {
            return result;
        }

        return null;
    };

    /**
     * Processes HTTP response.
     * It could do the following:
     * 1. Add event to the filtering log (for DOCUMENT requests)
     * 2. Record page stats (if it's enabled)
     *
     * @param tab Tab object
     * @param requestUrl Request URL
     * @param referrerUrl Referrer URL
     * @param requestType Request type
     * @return {void}
     */
    const processRequestResponse = function (tab, requestUrl, referrerUrl, requestType) {
        // add page view to stats
        if (requestType === RequestTypes.DOCUMENT) {
            const domain = frames.getFrameDomain(tab);
            if (canCollectHitStatsForTab(tab)) {
                hitStats.addDomainView(domain);
            }
        }
    };

    /**
     * Request post processing, firing events, add log records etc.
     *
     * @param tab           Tab
     * @param requestUrl    request url
     * @param referrerUrl   referrer url
     * @param requestType   one of RequestType
     * @param requestRule   rule
     * @return {object} Request rule if suitable by its own type and request type or null
     */
    const postProcessRequest = function (tab, requestUrl, referrerUrl, requestType, requestRule) {
        if (requestRule && !requestRule.isWhitelist()) {
            const isRequestBlockingRule = isRequestBlockedByRule(requestRule);
            const isReplaceRule = requestRule.isOptionEnabled(TSUrlFilter.NetworkRuleOption.Replace);

            // Url blocking rules are not applicable to the main_frame
            if (isRequestBlockingRule && requestType === RequestTypes.DOCUMENT) {
                // except rules with $document and $popup modifiers
                const isDocumentRule = requestRule.isOptionEnabled(TSUrlFilter.NetworkRuleOption.Urlblock)
                    && requestRule.isOptionEnabled(TSUrlFilter.NetworkRuleOption.Elemhide)
                    && requestRule.isOptionEnabled(TSUrlFilter.NetworkRuleOption.Jsinject)
                    && requestRule.isOptionEnabled(TSUrlFilter.NetworkRuleOption.Content);
                const isPopupBlockingRule = isPopupBlockedByRule(requestRule);

                if (!isDocumentRule && !isPopupBlockingRule) {
                    requestRule = null;
                }
            }

            // Replace rules are processed in content-filtering
            if (isReplaceRule) {
                requestRule = null;
            }

            if (requestRule) {
                listeners.notifyListenersAsync(listeners.ADS_BLOCKED, requestRule, tab, 1);
                const details = {
                    tabId: tab.tabId,
                    requestUrl,
                    referrerUrl,
                    requestType,
                };
                details.rule = requestRule.getText();
                details.filterId = requestRule.getFilterListId();
                onRequestBlockedChannel.notify(details);
            }
        }

        return requestRule;
    };

    var isCollectingCosmeticRulesHits = (tab) => {
        /**
         * Edge Legacy browser doesn't support css content attribute for node elements except
         * :before and :after
         * Due to this we can't use cssHitsCounter for edge browser
         */
        if (browserUtils.isEdgeBrowser()) {
            return false;
        }

        // TODO fix in tsurlfilter
        return false;
        return canCollectHitStatsForTab(tab) || filteringLog.isOpen();
    };


    // EXPOSE
    return {
        processGetSelectorsAndScripts,
        checkPageScriptWrapperRequest,
        processShouldCollapse,
        processShouldCollapseMany,
        isRequestBlockedByRule,
        isPopupBlockedByRule,
        getBlockedResponseByRule,
        getRuleForRequest,
        getCspRules,
        getCookieRules,
        getContentRules,
        getReplaceRules,
        removeParamFromUrl,
        processRequestResponse,
        postProcessRequest,
        recordRuleHit,
        onRequestBlocked: onRequestBlockedChannel,
        isCollectingCosmeticRulesHits,
    };
})();
