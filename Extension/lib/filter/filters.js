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

(function (adguard) {
    'use strict';

    /**
     * Simple request cache
     * @param requestCacheMaxSize Max cache size
     */
    const RequestCache = function (requestCacheMaxSize) {
        this.requestCache = Object.create(null);
        this.requestCacheSize = 0;
        this.requestCacheMaxSize = requestCacheMaxSize;

        /**
         * Searches for cached filter rule
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
                return c;
            }

            return null;
        };

        /**
         * Saves resulting filtering rule to requestCache
         *
         * @param requestUrl Request url
         * @param rule Rule found
         * @param refHost Referrer host
         * @param requestType Request type
         */
        this.saveResultToCache = function (requestUrl, rule, refHost, requestType) {
            if (this.requestCacheSize > this.requestCacheMaxSize) {
                this.clearRequestCache();
            }
            if (!this.requestCache[requestUrl]) {
                this.requestCache[requestUrl] = Object.create(null);
                this.requestCacheSize += 1;
            }

            // Two-levels gives us an ability to not to override cached item for
            // different request types with the same url
            this.requestCache[requestUrl][requestType] = [rule, refHost];
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
        // Bad-filter rules collection
        // https://kb.adguard.com/en/general/how-to-create-your-own-ad-filters#badfilter-modifier
        this.badFilterRules = {};

        // Filter that applies CSP rules
        // https://kb.adguard.com/en/general/how-to-create-your-own-ad-filters#csp-modifier
        this.cspFilter = new adguard.rules.CspFilter([], this.badFilterRules);

        // Filter that applies cookie rules
        // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/961
        this.cookieFilter = new adguard.rules.CookieFilter();

        // Filter that applies stealth rules
        // https://kb.adguard.com/en/general/how-to-create-your-own-ad-filters#stealth-modifier
        this.stealthFilter = new adguard.rules.UrlFilter([], this.badFilterRules);

        // Filter that applies replace rules
        // https://kb.adguard.com/en/general/how-to-create-your-own-ad-filters#replace-modifier
        this.replaceFilter = new adguard.rules.ReplaceFilter([], this.badFilterRules);

        // Filter that applies HTML filtering rules
        // https://kb.adguard.com/en/general/how-to-create-your-own-ad-filters#html-filtering-rules
        this.contentFilter = new adguard.rules.ContentFilter();

        // Rules count (includes all types of rules)
        this.rulesCount = 0;

        // Init small caches for url filtering rules
        this.urlBlockingCache = new RequestCache(this.requestCacheMaxSize);
        this.urlExceptionsCache = new RequestCache(this.requestCacheMaxSize);
    };

    RequestFilter.prototype = {

        /**
         * Cache capacity
         */
        requestCacheMaxSize: 1000,

        getRulesCount() {
            return adguard.application.getEngine().getRulesCount();
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
            const domain = adguard.utils.url.getHost(url);

            const cosmeticResult = adguard.application.getEngine().getCosmeticResult(domain, options);

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

            const collectingCosmeticRulesHits = adguard.webRequestService.isCollectingCosmeticRulesHits();
            if (collectingCosmeticRulesHits) {
                return {
                    css: adguard.cssService.buildStyleSheetHits(elemhideCss, injectCss),
                    extendedCss: adguard.cssService.buildStyleSheetHits(elemhideExtendedCss, injectExtendedCss),
                };
            }

            return {
                css: adguard.cssService.buildStyleSheet(elemhideCss, injectCss, true),
                extendedCss: adguard.cssService.buildStyleSheet(elemhideExtendedCss, injectExtendedCss, false),
            };
        },

        /**
         * Builds domain-specific JS injection for the specified page.
         * http://adguard.com/en/filterrules.html#javascriptInjection
         *
         * @param url Page URL
         * @param {boolean} debug enabled or disabled debug
         * @returns {{scriptSource: string, rule: string}[]} Javascript for the specified URL
         */
        getScriptsForUrl(url, debug) {
            const domain = adguard.utils.url.getHost(url);
            const cosmeticResult = adguard.application.getEngine().getCosmeticResult(domain, CosmeticOption.CosmeticOptionJS);

            // TODO: Pass debug
            return cosmeticResult.getScriptRules();
        },

        /**
         * TODO: Move to scripts-service
         *
         * Builds the final output string for the specified page.
         * Depending on the browser we either allow or forbid the new remote rules
         * (see how `scriptSource` is used).
         *
         * @param {string} url Page URL
         * @returns {string} Script to be applied
         */
        getScriptsStringForUrl(url, tab) {
            const debug = adguard.filteringLog && adguard.filteringLog.isOpen();
            const scriptRules = this.getScriptsForUrl(url, debug);

            const isFirefox = adguard.utils.browser.isFirefoxBrowser();
            const isOpera = adguard.utils.browser.isOperaBrowser();

            const selectedScriptRules = scriptRules.filter((scriptRule) => {
                // TODO: Performance
                const isLocal = adguard.rules.LocalScriptRulesService.isLocal(scriptRule.ruleText);

                if (isLocal) {
                    return true;
                }

                if (!isLocal) {
                    /**
                     * Note (!) (Firefox, Opera):
                     * In case of Firefox and Opera add-ons,
                     * JS filtering rules are hardcoded into add-on code.
                     * Look at LocalScriptRulesService.isLocal to learn more.
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
                    adguard.filteringLog.addScriptInjectionEvent(
                        tab,
                        url,
                        adguard.RequestTypes.DOCUMENT,
                        scriptRule
                    );
                });
            }

            const scriptsCode = selectedScriptRules.map(scriptRule => scriptRule.script).join('\r\n');

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
         * Searches for the whitelist rule for the specified pair (url/referrer)
         *
         * @param requestUrl  Request URL
         * @param referrer    Referrer
         * @param requestType Request type
         * @returns Filter rule found or null
         */
        findWhiteListRule(requestUrl, referrer, requestType) {
            const refHost = adguard.utils.url.getHost(referrer);
            const thirdParty = adguard.utils.url.isThirdPartyRequest(requestUrl, referrer);

            const cacheItem = this.urlExceptionsCache.searchRequestCache(requestUrl, refHost, requestType);

            if (cacheItem) {
                // Element with zero index is a filter rule found last time
                return cacheItem[0];
            }

            const rule = this._checkWhiteList(requestUrl, referrer, requestType, thirdParty);

            this.urlExceptionsCache.saveResultToCache(requestUrl, rule, refHost, requestType);
            return rule;
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
            const refHost = adguard.utils.url.getHost(referrer);
            const thirdParty = adguard.utils.url.isThirdPartyRequest(requestUrl, referrer);

            // Check if request is whitelisted with document wide rule
            // e.g. "@@||example.org^$stealth"
            let rule = this.stealthFilter.isFiltered(referrer, refHost, requestType, thirdParty);

            if (!rule) {
                // Check if request is whitelisted with third-party request
                // e.g. "@@||example.org^$domain=ya.ru,stealth"
                rule = this.stealthFilter.isFiltered(requestUrl, refHost, requestType, thirdParty);
            }

            return rule;
        },

        /**
         * Searches for the filter rule for the specified request.
         *
         * @param requestUrl            Request URL
         * @param documentUrl           Document URL
         * @param requestType           Request content type (one of UrlFilterRule.contentTypes)
         * @param documentWhitelistRule (optional) Document-level whitelist rule
         * @returns Rule found or null
         */
        findRuleForRequest(requestUrl, documentUrl, requestType, documentWhitelistRule) {
            const documentHost = adguard.utils.url.getHost(documentUrl);

            const cacheItem = this.urlBlockingCache.searchRequestCache(requestUrl, documentHost, requestType);
            if (cacheItem) {
                // Element with zero index is a filter rule found last time
                return cacheItem[0];
            }

            const rule = this._findRuleForRequest(requestUrl, documentUrl, requestType, documentWhitelistRule);

            this.urlBlockingCache.saveResultToCache(requestUrl, rule, documentHost, requestType);
            return rule;
        },

        /**
         * Searches for content rules for the specified domain
         * @param documentUrl Document URL
         * @returns Collection of content rules
         */
        getContentRulesForUrl(documentUrl) {
            const documentHost = adguard.utils.url.getHost(documentUrl);
            return this.contentFilter.getRulesForDomain(documentHost);
        },

        /**
         * Searches for elements in document that matches given content rules
         * @param doc Document
         * @param rules Content rules
         * @returns Matched elements
         */
        getMatchedElementsForContentRules(doc, rules) {
            return this.contentFilter.getMatchedElementsForRules(doc, rules);
        },

        /**
         * Searches for CSP rules for the specified request
         * @param requestUrl Request URL
         * @param documentUrl Document URL
         * @param requestType Request Type (DOCUMENT or SUBDOCUMENT)
         * @returns Collection of CSP rules for applying to the request or null
         */
        findCspRules(requestUrl, documentUrl, requestType) {
            const documentHost = adguard.utils.url.getHost(documentUrl);
            const thirdParty = adguard.utils.url.isThirdPartyRequest(requestUrl, documentUrl);
            return this.cspFilter.findCspRules(requestUrl, documentHost, thirdParty, requestType);
        },

        findReplaceRules(requestUrl, documentUrl, requestType) {
            const documentHost = adguard.utils.url.getHost(documentUrl);
            const thirdParty = adguard.utils.url.isThirdPartyRequest(requestUrl, documentUrl);

            return this.replaceFilter.findReplaceRules(requestUrl, documentHost, thirdParty, requestType);
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
            const documentHost = adguard.utils.url.getHost(documentUrl);
            const thirdParty = adguard.utils.url.isThirdPartyRequest(requestUrl, documentUrl);

            return this.cookieFilter.findCookieRules(requestUrl, documentHost, thirdParty, requestType);
        },

        /**
         * Checks if exception rule is present for the URL/Referrer pair
         *
         * @param requestUrl    Request URL
         * @param documentUrl   Document URL
         * @param requestType   Request content type (one of UrlFilterRule.contentTypes)
         * @param thirdParty    Is request third-party or not
         * @returns Filter rule found or null
         * @private
         */
        _checkWhiteList(requestUrl, documentUrl, requestType, thirdParty) {
            if (!requestUrl) {
                return null;
            }

            const request = new Request(requestUrl, documentUrl, this.transformRequestType(requestType));

            const result = adguard.application.getEngine().matchRequest(request);
            adguard.console.debug(result);

            const basicResult = result.getBasicResult();
            if (basicResult && basicResult.isWhitelist()) {
                return basicResult;
            }

            return null;
        },

        /**
         * TODO: Parse webrequest details type
         *
         * @param requestType
         * @return {number}
         */
        transformRequestType(requestType) {
            const contentTypes = adguard.RequestTypes;

            switch (requestType) {
                case contentTypes.DOCUMENT:
                    return RequestType.Document;
                case contentTypes.SUBDOCUMENT:
                    return RequestType.Subdocument;
                case contentTypes.STYLESHEET:
                    return RequestType.Stylesheet;
                case contentTypes.FONT:
                    return RequestType.Font;
                case contentTypes.IMAGE:
                    return RequestType.Image;
                case contentTypes.MEDIA:
                    return RequestType.Media;
                case contentTypes.SCRIPT:
                    return RequestType.Script;
                case contentTypes.XMLHTTPREQUEST:
                    return RequestType.XmlHttpRequest;
                case contentTypes.WEBSOCKET:
                    return RequestType.Websocket;
                case contentTypes.PING:
                    return RequestType.Ping;
                default:
                    return RequestType.Other;
            }
        },

        /**
         * Searches the rule for request.
         *
         * @param requestUrl    Request URL
         * @param documentUrl   Document URL
         * @param requestType   Request content type (one of UrlFilterRule.contentTypes)
         * @param documentWhiteListRule (optional) Document-level whitelist rule
         * @returns Filter rule found or null
         * @private
         */
        _findRuleForRequest(requestUrl, documentUrl, requestType, documentWhiteListRule) {
            adguard.console.debug('Filtering http request for url: {0}, document: {1}, requestType: {2}', requestUrl, documentUrl, requestType);

            const request = new Request(requestUrl, documentUrl, this.transformRequestType(requestType));

            const result = adguard.application.getEngine().matchRequest(request);
            adguard.console.debug(result);

            const ruleForRequest = result.getBasicResult();
            if (ruleForRequest) {
                adguard.console.debug(
                    'Rule {0} found for url: {1}, document: {2}, requestType: {3}',
                    ruleForRequest.ruleText,
                    requestUrl,
                    documentUrl,
                    requestType
                );
            }

            return ruleForRequest;
        },
    };

    adguard.RequestFilter = RequestFilter;
})(adguard);
