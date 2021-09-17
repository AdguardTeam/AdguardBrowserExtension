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

import { antiBannerService } from './antibanner';

/**
 * Api for filtering and elements hiding.
 *
 * TODO: Delete this service
 */
export const filteringApi = (function () {
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

    /**
     * @param {MatchQuery} matchQuery - {@link MatchQuery}
     */
    const findRuleForRequest = function (matchQuery) {
        return getRequestFilter().findRuleForRequest(matchQuery);
    };

    /**
     * @param {MatchQuery} matchQuery - {@link MatchQuery}
     */
    const findAllowlistRule = function (matchQuery) {
        return getRequestFilter().findAllowlistRule(matchQuery);
    };

    const findDocumentRule = function (documentUrl) {
        return getRequestFilter().findDocumentRule(documentUrl);
    };

    /**
     * @param {MatchQuery} matchQuery - {@link MatchQuery}
     */
    const findStealthAllowlistRule = function (matchQuery) {
        return getRequestFilter().findStealthAllowlistRule(matchQuery);
    };

    const getSelectorsForUrl = function (documentUrl, cosmeticOptions, traditionalCss, extCss) {
        return getRequestFilter().getSelectorsForUrl(documentUrl, cosmeticOptions, !traditionalCss, !extCss);
    };

    const getScriptsStringForUrl = function (documentUrl, tab, cosmeticOptions) {
        return getRequestFilter().getScriptsStringForUrl(documentUrl, tab, cosmeticOptions);
    };

    const getContentRulesForUrl = function (documentUrl) {
        return getRequestFilter().getContentRulesForUrl(documentUrl);
    };

    /**
     * @param {MatchQuery} matchQuery - {@link MatchQuery}
     */
    const getCspRules = function (matchQuery) {
        return getRequestFilter().findCspRules(matchQuery);
    };

    /**
     * @param {MatchQuery} matchQuery - {@link MatchQuery}
     */
    const getCookieRules = function (matchQuery) {
        return getRequestFilter().findCookieRules(matchQuery);
    };

    /**
     * @param {MatchQuery} matchQuery - {@link MatchQuery}
     */
    const getReplaceRules = function (matchQuery) {
        return getRequestFilter().findReplaceRules(matchQuery);
    };

    /**
     * @param {MatchQuery} matchQuery - {@link MatchQuery}
     */
    const getCosmeticOption = function (matchQuery) {
        return getRequestFilter().getMatchingResult(matchQuery).getCosmeticOption();
    };

    /**
     * @param {MatchQuery} matchQuery - {@link MatchQuery}
     */
    const getRemoveParamRules = function (matchQuery) {
        return getRequestFilter().getMatchingResult(matchQuery).getRemoveParamRules();
    };

    /**
     * @param {MatchQuery} matchQuery - {@link MatchQuery}
     */
    const getRemoveHeaderRules = function (matchQuery) {
        return getRequestFilter().getMatchingResult(matchQuery).getRemoveHeaderRules();
    };

    const getRequestFilterInfo = function () {
        return antiBannerService.getRequestFilterInfo();
    };

    return {

        isReady,
        shouldCollapseAllElements,

        findRuleForRequest,
        findAllowlistRule,
        findDocumentRule,

        getSelectorsForUrl,
        getScriptsStringForUrl,
        getContentRulesForUrl,
        getCspRules,
        getCookieRules,
        getReplaceRules,
        getRemoveParamRules,
        getRemoveHeaderRules,
        findStealthAllowlistRule,
        getCosmeticOption,

        getRequestFilterInfo,
    };
})();
