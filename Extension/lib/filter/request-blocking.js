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

    var onRequestBlockedChannel = adguard.utils.channels.newChannel();

    /**
     * Checks if we can collect hit stats for this tab:
     * Option "Send ad filters usage" is enabled and tab isn't incognito and integration mode is disabled
     * @param {object} tab
     * @returns {boolean}
     */
    var canCollectHitStatsForTab = function (tab) {
        if (!tab) {
            return adguard.settings.collectHitsCount();
        }

        return tab &&
            adguard.settings.collectHitsCount() &&
            !adguard.frames.isIncognitoTab(tab) &&
            !adguard.frames.isTabAdguardDetected(tab);
    };

    /**
     * Records filtering rule hit
     *
     * @param tab            Tab object
     * @param requestRule    Rule to record
     * @param requestUrl     Request URL
     */
    var recordRuleHit = function (tab, requestRule, requestUrl) {
        if (requestRule &&
            !adguard.utils.filters.isUserFilterRule(requestRule) &&
            !adguard.utils.filters.isWhiteListFilterRule(requestRule) &&
            canCollectHitStatsForTab(tab)) {
            var domain = adguard.frames.getFrameDomain(tab);
            adguard.hitStats.addRuleHit(domain, requestRule.ruleText, requestRule.filterId, requestUrl);
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
     * @param cssFilterOptions          Bitmask for the CssFilter
     * @param {boolean} retrieveScripts Indicates whether to retrieve JS rules or not
     *
     * When cssFilterOptions and retrieveScripts are undefined, we handle it in a special way
     * that depends on whether the browser supports inserting CSS and scripts from the background page
     *
     * @returns {SelectorsAndScripts} an object with the selectors and scripts to be injected into the page
     */
    var processGetSelectorsAndScripts = function (tab, documentUrl, cssFilterOptions, retrieveScripts) {

        var result = Object.create(null);

        if (!tab) {
            return result;
        }

        if (!adguard.requestFilter.isReady()) {
            result.requestFilterReady = false;
            return result;
        }

        if (adguard.frames.isTabAdguardDetected(tab) ||
            adguard.frames.isTabProtectionDisabled(tab)) {
            return result;
        }

        // Looking for the whitelist rule
        var whitelistRule = adguard.frames.getFrameWhiteListRule(tab);
        if (!whitelistRule) {
            // Check whitelist for current frame
            var mainFrameUrl = adguard.frames.getMainFrameUrl(tab);
            whitelistRule = adguard.requestFilter.findWhiteListRule(documentUrl, mainFrameUrl, adguard.RequestTypes.DOCUMENT);
        }

        let CssFilter = adguard.rules.CssFilter;


        // Check what exactly is disabled by this rule
        var elemHideFlag = whitelistRule && whitelistRule.isElemhide();
        var genericHideFlag = whitelistRule && whitelistRule.isGenericHide();

        // content-message-handler calls it in this way
        if (typeof cssFilterOptions === 'undefined' && typeof retrieveScripts === 'undefined') {
            // Build up default flags.
            let canUseInsertCSSAndExecuteScript = adguard.prefs.features.canUseInsertCSSAndExecuteScript;
            // If tabs.executeScript is unavailable, retrieve JS rules now.
            retrieveScripts = !canUseInsertCSSAndExecuteScript;
            if (!elemHideFlag) {
                cssFilterOptions = CssFilter.RETRIEVE_EXTCSS;
                if (!canUseInsertCSSAndExecuteScript) {
                    cssFilterOptions += CssFilter.RETRIEVE_TRADITIONAL_CSS;
                }
                if (genericHideFlag) {
                    cssFilterOptions += CssFilter.GENERIC_HIDE_APPLIED;
                }
            }
        } else {
            if (!elemHideFlag && genericHideFlag) {
                cssFilterOptions += CssFilter.GENERIC_HIDE_APPLIED;
            }
        }

        var retrieveSelectors = !elemHideFlag && (cssFilterOptions & (CssFilter.RETRIEVE_TRADITIONAL_CSS + CssFilter.RETRIEVE_EXTCSS)) !== 0;

        // It's important to check this after the recordRuleHit call
        // as otherwise we will never record $document rules hit for domain
        if (adguard.frames.isTabWhiteListed(tab)) {
            return result;
        }

        if (retrieveSelectors) {
            result.collapseAllElements = adguard.requestFilter.shouldCollapseAllElements();
            result.selectors = adguard.requestFilter.getSelectorsForUrl(documentUrl, cssFilterOptions);
        }

        if (retrieveScripts) {
            var jsInjectFlag = whitelistRule && whitelistRule.isJsInject();
            if (!jsInjectFlag) {
                // JS rules aren't disabled, returning them
                result.scripts = adguard.requestFilter.getScriptsStringForUrl(documentUrl, tab);
            }
        }
        // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/1337
        result.collectRulesHits = elemHideFlag ? false : adguard.webRequestService.isCollectingCosmeticRulesHits(tab);

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
    var checkPageScriptWrapperRequest = function (tab, requestUrl, referrerUrl, requestType) {

        if (!tab) {
            return false;
        }

        var requestRule = getRuleForRequest(tab, requestUrl, referrerUrl, requestType);
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
    var processShouldCollapse = function (tab, requestUrl, referrerUrl, requestType) {

        if (!tab) {
            return false;
        }

        var requestRule = getRuleForRequest(tab, requestUrl, referrerUrl, requestType);
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
    var processShouldCollapseMany = function (tab, referrerUrl, collapseRequests) {

        if (!tab) {
            return collapseRequests;
        }

        for (var i = 0; i < collapseRequests.length; i++) {
            var request = collapseRequests[i];
            var requestRule = getRuleForRequest(tab, request.elementUrl, referrerUrl, request.requestType);
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
    var isRequestBlockedByRule = function (requestRule) {
        return requestRule
            && !requestRule.whiteListRule
            && !requestRule.getReplace()
            && !requestRule.isRedirectRule();
    };

    /**
     * Checks if popup is blocked by rule
     * @param requestRule
     * @returns {*|boolean|true}
     */
    var isPopupBlockedByRule = function (requestRule) {
        return requestRule && !requestRule.whiteListRule && requestRule.isBlockPopups();
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

            if (isDocumentLevel && requestRule.isDocumentRule()) {
                const documentBlockedPage = adguard.rules.documentFilterService.getDocumentBlockPageUrl(
                    requestUrl,
                    requestRule.ruleText
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
        } else if (requestRule && !requestRule.whiteListRule && requestRule.isRedirectRule()) {
            const redirectOption = requestRule.getRedirect();
            const redirectUrl = redirectOption.getRedirectUrl();
            return { redirectUrl };
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
    var getRuleForRequest = function (tab, requestUrl, referrerUrl, requestType) {

        if (adguard.frames.isTabAdguardDetected(tab) || adguard.frames.isTabProtectionDisabled(tab)) {
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

        if (whitelistRule && whitelistRule.isDocumentWhiteList()) {
            // Frame is whitelisted by the main frame's $document rule
            // We do nothing more in this case - return the rule.
            return whitelistRule;
        } else if (!whitelistRule) {
            // If whitelist rule is not found for the main frame, we check it for referrer
            whitelistRule = adguard.requestFilter.findWhiteListRule(requestUrl, referrerUrl, adguard.RequestTypes.DOCUMENT);
        }

        return adguard.requestFilter.findRuleForRequest(requestUrl, referrerUrl, requestType, whitelistRule);
    };

    /**
     * Finds all content rules for the url
     * @param tab Tab
     * @param documentUrl Document URL
     * @returns collection of content rules or null
     */
    var getContentRules = function (tab, documentUrl) {

        if (adguard.frames.shouldStopRequestProcess(tab)) {
            // don't process request
            return null;
        }

        var whitelistRule = adguard.requestFilter.findWhiteListRule(documentUrl, documentUrl, adguard.RequestTypes.DOCUMENT);
        if (whitelistRule && whitelistRule.isContent()) {
            return null;
        }

        return adguard.requestFilter.getContentRulesForUrl(documentUrl);
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
        let whitelistRule = adguard.requestFilter.findWhiteListRule(requestUrl, referrerUrl, adguard.RequestTypes.DOCUMENT);
        if (whitelistRule && whitelistRule.isUrlBlock()) {
            return null;
        }

        return adguard.requestFilter.getCspRules(requestUrl, referrerUrl, requestType);
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

        const whitelistRule = adguard.requestFilter.findWhiteListRule(requestUrl, referrerUrl, adguard.RequestTypes.DOCUMENT);
        if (whitelistRule && whitelistRule.isDocumentWhiteList()) {
            // $cookie rules are not affected by regular exception rules (@@) unless it's a $document exception.
            return null;
        }

        // Get all $cookie rules matching the specified request
        return adguard.requestFilter.getCookieRules(requestUrl, referrerUrl, requestType);
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

        const whitelistRule = adguard.requestFilter.findWhiteListRule(requestUrl, referrerUrl, adguard.RequestTypes.DOCUMENT);

        if (whitelistRule && whitelistRule.isContent()) {
            return null;
        }

        return adguard.requestFilter.getReplaceRules(requestUrl, referrerUrl, requestType);
    };

    /**
     * Processes HTTP response.
     * It could do the following:
     * 1. Detect desktop AG and switch to integration mode
     * 2. Add event to the filtering log (for DOCUMENT requests)
     * 3. Record page stats (if it's enabled)
     *
     * @param tab Tab object
     * @param requestUrl Request URL
     * @param referrerUrl Referrer URL
     * @param requestType Request type
     * @param responseHeaders Response headers
     * @return {object} Request rule parsed from integration headers or null
     */
    var processRequestResponse = function (tab, requestUrl, referrerUrl, requestType, responseHeaders) {
        if (requestType === adguard.RequestTypes.DOCUMENT) {
            // Check headers to detect Adguard application
            if (adguard.integration.isSupported() && // Integration module may be missing
                !adguard.prefs.mobile && // Mobile Firefox doesn't support integration mode
                !adguard.utils.browser.isEdgeBrowser()) {
                // TODO[Edge]: Integration mode is not fully functional in Edge (cannot
                // redefine Referer header yet and Edge doesn't intercept requests from
                // background page)
                adguard.integration.checkHeaders(tab, responseHeaders, requestUrl);
            }
        }

        // add page view to stats
        if (requestType === adguard.RequestTypes.DOCUMENT) {
            var domain = adguard.frames.getFrameDomain(tab);
            if (canCollectHitStatsForTab(tab)) {
                adguard.hitStats.addDomainView(domain);
            }
        }

        // In integration mode, binds rule from headers or nothing to the request
        if (adguard.integration.isSupported() && adguard.frames.isTabAdguardDetected(tab)) {
            // Parse rule applied to request from response headers
            return adguard.integration.parseAdguardRuleFromHeaders(responseHeaders);
        }

        return null;
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

        if (adguard.frames.isTabAdguardDetected(tab)) {
            // Do nothing, rules from integrated app will be processed on response
            return;
        }

        if (requestRule && !requestRule.whiteListRule) {
            var isRequestBlockingRule = isRequestBlockedByRule(requestRule);
            var isPopupBlockingRule = isPopupBlockedByRule(requestRule);
            var isReplaceRule = !!requestRule.getReplace();

            // Url blocking rules are not applicable to the main_frame
            if (isRequestBlockingRule && requestType === adguard.RequestTypes.DOCUMENT) {
                // except rules with $document and $popup modifiers
                if (!requestRule.isDocumentRule() && !isPopupBlockingRule) {
                    requestRule = null;
                }
            }

            // Replace rules are processed in content-filtering.js
            if (isReplaceRule) {
                requestRule = null;
            }

            if (requestRule) {
                adguard.listeners.notifyListenersAsync(adguard.listeners.ADS_BLOCKED, requestRule, tab, 1);
                var details = {
                    tabId: tab.tabId,
                    requestUrl: requestUrl,
                    referrerUrl: referrerUrl,
                    requestType: requestType
                };
                details.rule = requestRule.ruleText;
                details.filterId = requestRule.filterId;
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
