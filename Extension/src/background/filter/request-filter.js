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
import { engine } from './engine';
import { utils } from '../utils/common';
import { RequestTypes } from '../utils/request-types';
import { filteringLog } from './filtering-log';
import { localScriptRulesService } from './rules/local-script-rules';
import { cssService } from './services/css-service';
import { webRequestService } from './request-blocking';
import { browserUtils } from '../utils/browser-utils';

export const RequestFilter = (() => {
    /**
     * Simple request cache
     * @param requestCacheMaxSize Max cache size
     */
    const RequestCache = function (requestCacheMaxSize) {
        this.requestCache = Object.create(null);
        this.requestCacheSize = 0;
        this.requestCacheMaxSize = requestCacheMaxSize;

        /**
         * Searches for cached matching result
         *
         * @param requestUrl Request url
         * @param refHost Referrer host
         * @param requestType Request type
         */
        this.searchRequestCache = function (requestUrl, refHost, requestType) {
            const cacheItem = this.requestCache[requestUrl];
            if (!cacheItem) {
                return null;
            }

            const c = cacheItem[requestType];
            if (c && c[1] === refHost) {
                return c[0];
            }

            return null;
        };

        /**
         * Saves matching result to requestCache
         *
         * @param requestUrl Request url
         * @param matchingResult Request result
         * @param refHost Referrer host
         * @param requestType Request type
         */
        this.saveResultToCache = function (requestUrl, matchingResult, refHost, requestType) {
            if (this.requestCacheSize > this.requestCacheMaxSize) {
                this.clearRequestCache();
            }
            if (!this.requestCache[requestUrl]) {
                this.requestCache[requestUrl] = Object.create(null);
                this.requestCacheSize += 1;
            }

            // Two-levels gives us an ability to not to override cached item for
            // different request types with the same url
            this.requestCache[requestUrl][requestType] = [matchingResult, refHost];
        };

        /**
         * Clears request cache
         */
        this.clearRequestCache = function () {
            if (this.requestCacheSize === 0) {
                return;
            }
            this.requestCache = Object.create(null);
            this.requestCacheSize = 0;
        };
    };

    /**
     * Request filter is main class which applies filter rules.
     *
     * @type {Function}
     */
    const RequestFilter = function () {
        // Init small caches for url filtering rules
        this.matchingResultsCache = new RequestCache(this.requestCacheMaxSize);
    };

    RequestFilter.prototype = {

        /**
         * Cache capacity
         */
        requestCacheMaxSize: 1000,

        getRulesCount() {
            return engine.getRulesCount();
        },

        /**
         * An object with the information on the CSS and ExtendedCss stylesheets which
         * need to be injected into a web page.
         *
         * @typedef {Object} SelectorsData
         * @property {Array.<string>} css Regular CSS stylesheets
         * @property {Array.<string>} extendedCss ExtendedCSS stylesheets
         * @property {boolean} cssHitsCounterEnabled If true - collecting CSS rules hits stats
         * is enabled
         */

        /**
         * Builds CSS for the specified web page.
         * http://adguard.com/en/filterrules.html#hideRules
         *
         * @param {string} url Page URL
         * @param {number} options bitmask
         * @returns {*} CSS and ExtCss data for the webpage
         */
        getSelectorsForUrl(url, options) {
            const domain = utils.url.getHost(url);

            const cosmeticResult = engine.getCosmeticResult(domain, options);

            const elemhideCss = [...cosmeticResult.elementHiding.generic, ...cosmeticResult.elementHiding.specific];
            const injectCss = [...cosmeticResult.CSS.generic, ...cosmeticResult.CSS.specific];

            const elemhideExtendedCss = [
                ...cosmeticResult.elementHiding.genericExtCss,
                ...cosmeticResult.elementHiding.specificExtCss,
            ];
            const injectExtendedCss = [
                ...cosmeticResult.CSS.genericExtCss,
                ...cosmeticResult.CSS.specificExtCss,
            ];

            const collectingCosmeticRulesHits = webRequestService.isCollectingCosmeticRulesHits();
            if (collectingCosmeticRulesHits) {
                return {
                    css: cssService.buildStyleSheetHits(elemhideCss, injectCss),
                    extendedCss: cssService.buildStyleSheetHits(elemhideExtendedCss, injectExtendedCss),
                };
            }

            return {
                css: cssService.buildStyleSheet(elemhideCss, injectCss, true),
                extendedCss: cssService.buildStyleSheet(elemhideExtendedCss, injectExtendedCss, false),
            };
        },

        /**
         * Builds domain-specific JS injection for the specified page.
         * http://adguard.com/en/filterrules.html#javascriptInjection
         *
         * @param url Page URL
         * @returns {{scriptSource: string, rule: string}[]} Javascript for the specified URL
         */
        getScriptsForUrl(url) {
            const domain = utils.url.getHost(url);
            const cosmeticResult = engine.getCosmeticResult(
                domain,
                TSUrlFilter.CosmeticOption.CosmeticOptionJS,
            );

            return cosmeticResult.getScriptRules();
        },

        /**
         * Builds the final output string for the specified page.
         * Depending on the browser we either allow or forbid the new remote rules
         * (see how `scriptSource` is used).
         *
         * @param {string} url Page URL
         * @param {Object} tab tab
         * @returns {string} Script to be applied
         */
        getScriptsStringForUrl(url, tab) {
            const debug = filteringLog && filteringLog.isOpen();
            const scriptRules = this.getScriptsForUrl(url);

            const isFirefox = browserUtils.isFirefoxBrowser();
            const isOpera = browserUtils.isOperaBrowser();

            const selectedScriptRules = scriptRules.filter((scriptRule) => {
                const isLocal = localScriptRulesService.isLocal(scriptRule.getText());

                if (isLocal) {
                    return true;
                }

                if (!isLocal) {
                    /**
                     * Note (!) (Firefox, Opera):
                     * In case of Firefox and Opera add-ons,
                     * JS filtering rules are hardcoded into add-on code.
                     * Look at localScriptRulesService.isLocal to learn more.
                     * Commented instructions would be preprocessed during compilation by webpack
                     */
                    /* @if remoteScripts == false */
                    if (!isFirefox && !isOpera) {
                        return true;
                    }
                    /* @endif */

                    /* @if remoteScripts == true */
                    if (!isOpera) {
                        return true;
                    }
                    /* @endif */
                }

                return false;
            });

            if (debug) {
                scriptRules.forEach((scriptRule) => {
                    if (!scriptRule.isGeneric()) {
                        filteringLog.addScriptInjectionEvent(
                            tab,
                            url,
                            RequestTypes.DOCUMENT,
                            scriptRule,
                        );
                    }
                });
            }

            const scripts = selectedScriptRules.map(scriptRule => scriptRule.getScript(debug));

            // remove repeating scripts
            const scriptsCode = [...new Set(scripts)].join('\r\n');

            return `
            (function () {
                try {
                    ${scriptsCode}
                } catch (ex) {
                    console.error('Error executing AG js: ' + ex);
                }
            })();
            `;
        },

        /**
         * Gets or creates matching result
         *
         * @param requestUrl
         * @param referrer
         * @param requestType
         * @return {null}
         */
        getMatchingResult(requestUrl, referrer, requestType) {
            const refHost = utils.url.getHost(referrer);

            let result = this.matchingResultsCache.searchRequestCache(requestUrl, refHost, requestType);
            if (!result) {
                result = engine.createMatchingResult(requestUrl, referrer, requestType);

                if (!result) {
                    return new TSUrlFilter.MatchingResult([], []);
                }

                this.matchingResultsCache.saveResultToCache(requestUrl, result, refHost, requestType);
            }

            return result;
        },

        /**
         * Searches for the whitelist rule for the specified pair (url/referrer)
         *
         * @param requestUrl  Request URL
         * @param referrer    Referrer
         * @param requestType Request type
         * @returns Filter rule found or null
         */
        findWhiteListRule(requestUrl, referrer, requestType) {
            const result = this.getMatchingResult(requestUrl, referrer, requestType);

            const basicResult = result.getBasicResult();
            if (basicResult && basicResult.isWhitelist()) {
                return basicResult;
            }

            return null;
        },

        /**
         * Searches for stealth whitelist rule for the specified pair (url/referrer)
         *
         * @param requestUrl  Request URL
         * @param referrer    Referrer
         * @param requestType Request type
         * @returns Filter rule found or null
         */
        findStealthWhiteListRule(requestUrl, referrer, requestType) {
            const result = this.getMatchingResult(requestUrl, referrer, requestType);
            return result.stealthRule;
        },

        /**
         * Searches for the filter rule for the specified request.
         *
         * @param requestUrl            Request URL
         * @param documentUrl           Document URL
         * @param requestType           Request content type (one of UrlFilterRule.contentTypes)
         * @returns Rule found or null
         */
        findRuleForRequest(requestUrl, documentUrl, requestType) {
            const result = this.getMatchingResult(requestUrl, documentUrl, requestType);
            return result.getBasicResult();
        },

        /**
         * Searches for content rules for the specified domain
         * @param documentUrl Document URL
         * @returns Collection of content rules
         */
        getContentRulesForUrl(documentUrl) {
            const hostname = utils.url.getHost(documentUrl);
            // eslint-disable-next-line max-len
            const cosmeticResult = engine.getCosmeticResult(hostname, TSUrlFilter.CosmeticOption.CosmeticOptionHtml);

            return cosmeticResult.Html.getRules();
        },

        /**
         * Searches for CSP rules for the specified request
         *
         * @param requestUrl Request URL
         * @param documentUrl Document URL
         * @param requestType Request Type (DOCUMENT or SUBDOCUMENT)
         * @returns Collection of CSP rules for applying to the request or null
         */
        findCspRules(requestUrl, documentUrl, requestType) {
            const result = this.getMatchingResult(requestUrl, documentUrl, requestType);
            return result.getCspRules();
        },

        /**
         * Searches for replace modifier rules
         *
         * @param requestUrl
         * @param documentUrl
         * @param requestType
         * @return {[]|*}
         */
        findReplaceRules(requestUrl, documentUrl, requestType) {
            const result = this.getMatchingResult(requestUrl, documentUrl, requestType);
            return result.getReplaceRules();
        },

        /**
         * Searches for cookie rules matching specified request.
         *
         * @param requestUrl Request URL
         * @param documentUrl Document URL
         * @param requestType   Request content type
         * @returns             Matching rules
         */
        findCookieRules(requestUrl, documentUrl, requestType) {
            const result = this.getMatchingResult(requestUrl, documentUrl, requestType);
            return result.getCookieRules();
        },
    };

    return RequestFilter;
})();
