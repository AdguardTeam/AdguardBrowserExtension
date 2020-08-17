/**
 * Api for filtering and elements hiding.
 */
adguard.filteringApi = (function (adguard) {
    'use strict';

    const { antiBannerService } = adguard;

    function getRequestFilter() {
        return antiBannerService.getRequestFilter();
    }

    /**
     * @returns boolean true when request filter was initialized first time
     */
    const isReady = function () {
        return antiBannerService.getRequestFilterInitTime() > 0;
    };

    /**
     * When browser just started we need some time on request filter initialization.
     * This could be a problem in case when browser has a homepage and it is just started.
     * In this case request filter is not yet initalized so we don't block requests and inject css.
     * To fix this, content script will repeat requests for selectors until request filter is ready
     * and it will also collapse all elements which should have been blocked.
     *
     * @returns boolean true if we should collapse elements with content script
     */
    const shouldCollapseAllElements = function () {
        // We assume that if content script is requesting CSS in first 5 seconds after request filter init,
        // then it is possible, that we've missed some elements and now we should collapse these elements
        const requestFilterInitTime = antiBannerService.getRequestFilterInitTime();
        return (requestFilterInitTime > 0) && (requestFilterInitTime + 5000 > new Date().getTime());
    };

    const findRuleForRequest = function (requestUrl, documentUrl, requestType, documentWhitelistRule) {
        return getRequestFilter().findRuleForRequest(requestUrl, documentUrl, requestType, documentWhitelistRule);
    };

    const findWhiteListRule = function (requestUrl, referrer, requestType) {
        return getRequestFilter().findWhiteListRule(requestUrl, referrer, requestType);
    };

    const findStealthWhiteListRule = function (requestUrl, referrer, requestType) {
        return getRequestFilter().findStealthWhiteListRule(requestUrl, referrer, requestType);
    };

    const getSelectorsForUrl = function (documentUrl, genericHideFlag) {
        return getRequestFilter().getSelectorsForUrl(documentUrl, genericHideFlag);
    };

    const getScriptsForUrl = function (documentUrl) {
        return getRequestFilter().getScriptsForUrl(documentUrl);
    };

    const getScriptsStringForUrl = function (documentUrl, tab) {
        return getRequestFilter().getScriptsStringForUrl(documentUrl, tab);
    };

    const getContentRulesForUrl = function (documentUrl) {
        return getRequestFilter().getContentRulesForUrl(documentUrl);
    };

    const getCspRules = function (requestUrl, referrer, requestType) {
        return getRequestFilter().findCspRules(requestUrl, referrer, requestType);
    };

    const getCookieRules = function (requestUrl, referrer, requestType) {
        return getRequestFilter().findCookieRules(requestUrl, referrer, requestType);
    };

    const getReplaceRules = function (requestUrl, referrer, requestType) {
        return getRequestFilter().findReplaceRules(requestUrl, referrer, requestType);
    };

    const getCosmeticOption = function (requestUrl, referrer, requestType) {
        return getRequestFilter().getMatchingResult(requestUrl, referrer, requestType).getCosmeticOption();
    };

    const getRemoveParamRules = function (requestUrl, referrer, requestType) {
        return getRequestFilter().getMatchingResult(requestUrl, referrer, requestType).getRemoveParamRules();
    };

    const getRequestFilterInfo = function () {
        return antiBannerService.getRequestFilterInfo();
    };

    return {

        isReady,
        shouldCollapseAllElements,

        findRuleForRequest,
        findWhiteListRule,

        getSelectorsForUrl,
        getScriptsForUrl,
        getScriptsStringForUrl,
        getContentRulesForUrl,
        getCspRules,
        getCookieRules,
        getReplaceRules,
        getRemoveParamRules,
        findStealthWhiteListRule,
        getCosmeticOption,

        getRequestFilterInfo,
    };
})(adguard);
