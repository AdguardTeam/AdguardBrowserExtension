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

adguard.webRequestService = (function (adguard) {
    'use strict';

    const onRequestBlockedChannel = adguard.utils.channels.newChannel();

    /**
     * Checks if we can collect hit stats for this tab:
     * Option "Send ad filters usage" is enabled and tab isn't incognito
     * @param {object} tab
     * @returns {boolean}
     */
    const canCollectHitStatsForTab = function (tab) {
        if (!tab) {
            return adguard.settings.collectHitsCount();
        }

        return tab
            && adguard.settings.collectHitsCount()
            && !adguard.frames.isIncognitoTab(tab);
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
            && !adguard.utils.filters.isUserFilterRule(requestRule)
            && !adguard.utils.filters.isWhiteListFilterRule(requestRule)
            && canCollectHitStatsForTab(tab)) {
            const domain = adguard.frames.getFrameDomain(tab);
            adguard.hitStats.addRuleHit(domain, requestRule.getText(), requestRule.getFilterListId(), requestUrl);
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
     * @param {boolean} retrieveScripts Indicates whether to retrieve JS rules or not
     *
     * When cssFilterOptions and retrieveScripts are undefined, we handle it in a special way
     * that depends on whether the browser supports inserting CSS and scripts from the background page
     *
     * @returns {SelectorsAndScripts} an object with the selectors and scripts to be injected into the page
     */
    const processGetSelectorsAndScripts = function (tab, documentUrl, retrieveScripts) {
        const result = Object.create(null);

        if (!tab) {
            return result;
        }

        if (!adguard.filteringApi.isReady()) {
            result.requestFilterReady = false;
            return result;
        }

        if (adguard.frames.isTabProtectionDisabled(tab)) {
            return result;
        }

        if (adguard.frames.isTabWhiteListed(tab)) {
            return result;
        }

        const cosmeticOptions = adguard.filteringApi.getCosmeticOption(
            documentUrl, documentUrl, adguard.RequestTypes.DOCUMENT
        );

        result.collapseAllElements = adguard.filteringApi.shouldCollapseAllElements();
        result.selectors = adguard.filteringApi.getSelectorsForUrl(documentUrl, cosmeticOptions);

        const canUseInsertCSSAndExecuteScript = adguard.prefs.features.canUseInsertCSSAndExecuteScript;
        if (retrieveScripts || !canUseInsertCSSAndExecuteScript) {
            result.scripts = adguard.filteringApi.getScriptsStringForUrl(documentUrl, tab);
        }

        // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/1337
        result.collectRulesHits = adguard.webRequestService.isCollectingCosmeticRulesHits(tab);

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

        adguard.requestContextStorage.recordEmulated(requestUrl, referrerUrl, requestType, tab, requestRule);

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

        for (let i = 0; i < collapseRequests.length; i++) {
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
            && !requestRule.isOptionEnabled(NetworkRuleOption.Replace)
            && !requestRule.isOptionEnabled(NetworkRuleOption.Redirect);
    };

    /**
     * Checks if popup is blocked by rule
     * @param requestRule
     * @returns {*|boolean|true}
     */
    const isPopupBlockedByRule = (requestRule) => {
        return requestRule && !requestRule.isWhitelist()
            && requestRule.isOptionEnabled(NetworkRuleOption.Popup);
    };

    /**
     * Check if document is blocked by rule
     * @param requestRule
     * @return {*|boolean|true}
     */
    const isDocumentBlockingRule = (requestRule) => {
        return requestRule && !requestRule.isWhitelist()
            && requestRule.isOptionEnabled(NetworkRuleOption.Elemhide)
            && requestRule.isOptionEnabled(NetworkRuleOption.Jsinject)
            && requestRule.isOptionEnabled(NetworkRuleOption.Urlblock);
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
            const isDocumentLevel = requestType === adguard.RequestTypes.DOCUMENT
                || requestType === adguard.RequestTypes.SUBDOCUMENT;

            if (isDocumentLevel && isDocumentBlockingRule(requestRule)) {
                const documentBlockedPage = adguard.documentFilterService.getDocumentBlockPageUrl(
                    requestUrl,
                    requestRule.getText()
                );

                if (documentBlockedPage) {
                    return { documentBlockedPage };
                }

                return null;
            }

            // Don't block main_frame request
            if (requestType !== adguard.RequestTypes.DOCUMENT) {
                return { cancel: true };
            }
        // check if request rule is blocked by rule and is redirect rule
        } else if (requestRule && !requestRule.isWhitelist()) {
            if (requestRule.isOptionEnabled(NetworkRuleOption.Redirect)) {
                // eslint-disable-next-line max-len
                const redirectUrl = adguard.redirectFilterService.buildRedirectUrl(requestRule.getAdvancedModifierValue());
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
        if (adguard.frames.isTabProtectionDisabled(tab)) {
            // don't process request
            return null;
        }

        let whitelistRule;
        /**
         * Background requests will be whitelisted if their referrer
         * url will match with user whitelist rule
         * https://github.com/AdguardTeam/AdguardBrowserExtension/issues/1032
         */
        if (tab.tabId === adguard.BACKGROUND_TAB_ID) {
            whitelistRule = adguard.whitelist.findWhiteListRule(referrerUrl);
        } else {
            whitelistRule = adguard.frames.getFrameWhiteListRule(tab);
        }

        if (whitelistRule && whitelistRule.isDocumentWhitelistRule()) {
            // Frame is whitelisted by the main frame's $document rule
            // We do nothing more in this case - return the rule.
            return whitelistRule;
        } else if (!whitelistRule) {
            // If whitelist rule is not found for the main frame, we check it for referrer
            whitelistRule = adguard.filteringApi.findWhiteListRule(requestUrl, referrerUrl, adguard.RequestTypes.DOCUMENT);
        }

        return adguard.filteringApi.findRuleForRequest(requestUrl, referrerUrl, requestType, whitelistRule);
    };

    /**
     * Finds all content rules for the url
     * @param tab Tab
     * @param documentUrl Document URL
     * @returns collection of content rules or null
     */
    const getContentRules = function (tab, documentUrl) {
        if (adguard.frames.shouldStopRequestProcess(tab)) {
            // don't process request
            return null;
        }

        const whitelistRule = adguard.filteringApi.findWhiteListRule(documentUrl, documentUrl, adguard.RequestTypes.DOCUMENT);
        if (whitelistRule && whitelistRule.isOptionEnabled(NetworkRuleOption.Content)) {
            return null;
        }

        return adguard.filteringApi.getContentRulesForUrl(documentUrl);
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
        if (adguard.frames.shouldStopRequestProcess(tab)) {
            // don't process request
            return null;
        }

        // @@||example.org^$document or @@||example.org^$urlblock — disables all the $csp rules on all the pages matching the rule pattern.
        const whitelistRule = adguard.filteringApi.findWhiteListRule(requestUrl, referrerUrl, adguard.RequestTypes.DOCUMENT);
        if (whitelistRule && whitelistRule.isOptionEnabled(NetworkRuleOption.Urlblock)) {
            return null;
        }

        return adguard.filteringApi.getCspRules(requestUrl, referrerUrl, requestType);
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
        if (adguard.frames.shouldStopRequestProcess(tab)) {
            // Don't process request
            return null;
        }

        const whitelistRule = adguard.filteringApi.findWhiteListRule(requestUrl, referrerUrl, adguard.RequestTypes.DOCUMENT);
        if (whitelistRule && whitelistRule.isDocumentWhitelistRule()) {
            // $cookie rules are not affected by regular exception rules (@@) unless it's a $document exception.
            return null;
        }

        // Get all $cookie rules matching the specified request
        return adguard.filteringApi.getCookieRules(requestUrl, referrerUrl, requestType);
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
        if (adguard.frames.shouldStopRequestProcess(tab)) {
            // don't process request
            return null;
        }

        const whitelistRule = adguard.filteringApi.findWhiteListRule(requestUrl, referrerUrl, adguard.RequestTypes.DOCUMENT);
        if (whitelistRule && whitelistRule.isOptionEnabled(NetworkRuleOption.Content)) {
            return null;
        }

        return adguard.filteringApi.getReplaceRules(requestUrl, referrerUrl, requestType);
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
        if (requestType === adguard.RequestTypes.DOCUMENT) {
            const domain = adguard.frames.getFrameDomain(tab);
            if (canCollectHitStatsForTab(tab)) {
                adguard.hitStats.addDomainView(domain);
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
    var postProcessRequest = function (tab, requestUrl, referrerUrl, requestType, requestRule) {
        if (requestRule && !requestRule.whiteListRule) {
            var isRequestBlockingRule = isRequestBlockedByRule(requestRule);
            var isReplaceRule = requestRule.isOptionEnabled(NetworkRuleOption.Replace);

            // Url blocking rules are not applicable to the main_frame
            if (isRequestBlockingRule && requestType === adguard.RequestTypes.DOCUMENT) {
                // TODO: [TSUrlFilter] Fix blocking $document rules
                // except rules with $document and $popup modifiers
                // const isPopupBlockingRule = isPopupBlockedByRule(requestRule);
                // if (!requestRule.isDocumentRule() && !isPopupBlockingRule) {
                //     requestRule = null;
                // }

                const isPopupBlockingRule = isPopupBlockedByRule(requestRule);
                if (!isPopupBlockingRule) {
                    requestRule = null;
                }
            }

            // Replace rules are processed in content-filtering
            if (isReplaceRule) {
                requestRule = null;
            }

            if (requestRule) {
                adguard.listeners.notifyListenersAsync(adguard.listeners.ADS_BLOCKED, requestRule, tab, 1);
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

    const isCollectingCosmeticRulesHits = (tab) => {
        /**
         * Edge Legacy browser doesn't support css content attribute for node elements except
         * :before and :after
         * Due to this we can't use cssHitsCounter for edge browser
         */
        if (adguard.utils.browser.isEdgeBrowser()) {
            return false;
        }

        return canCollectHitStatsForTab(tab) || adguard.filteringLog.isOpen();
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
        processRequestResponse,
        postProcessRequest,
        recordRuleHit,
        onRequestBlocked: onRequestBlockedChannel,
        isCollectingCosmeticRulesHits,
    };
})(adguard);
