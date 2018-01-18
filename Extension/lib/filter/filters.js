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
    var RequestCache = function (requestCacheMaxSize) {

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
            var cacheItem = this.requestCache[requestUrl];
            if (!cacheItem) {
                return null;
            }

            var c = cacheItem[requestType];
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
                this.requestCacheSize++;
            }

            //Two-levels gives us an ability to not to override cached item for different request types with the same url
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
    var RequestFilter = function () {

        // Filter that applies URL blocking rules
        // Basic rules: http://adguard.com/en/filterrules.html#baseRules
        this.urlBlockingFilter = new adguard.rules.UrlFilter();

        // Filter that applies whitelist rules
        // Exception rules: http://adguard.com/en/filterrules.html#exclusionRules
        this.urlWhiteFilter = new adguard.rules.UrlFilter();

        // Bad-filter rules collection
        // TODO: add link
        this.badFilterRules = {};

        // Filter that applies CSS rules
        // ABP element hiding rules: http://adguard.com/en/filterrules.html#hideRules
        // CSS injection rules http://adguard.com/en/filterrules.html#cssInjection
        this.cssFilter = new adguard.rules.CssFilter();

        // Filter that applies JS rules
        // JS injection rules: http://adguard.com/en/filterrules.html#javascriptInjection
        this.scriptFilter = new adguard.rules.ScriptFilter();

        // Filter that applies CSP rules
        // CSP rules: TODO: add link
        this.cspFilter = new adguard.rules.CspFilter();


        // Filter that applies Content rules
        // Content filtration rules: http://adguard.com/en/filterrules.html#html-filtering-rules
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

        /**
         * Adds rules to the request filter
         *
         * @param rules List of rules to add
         */
        addRules: function (rules) {
            if (!rules) {
                return;
            }
            for (var i = 0; i < rules.length; i++) {
                this.addRule(rules[i]);
            }
        },

        /**
         * Adds rule to the request filter.
         * Rule is added to one of underlying filter objects depending on the rule type.
         *
         * @param rule     Rule to add. Rule should be an object of
         *                 one of these classes: UrlFilterRule, CssFilterRule, ScriptFilterRule
         */
        addRule: function (rule) {
            if (rule === null || !rule.ruleText) {
                adguard.console.error("FilterRule must not be null");
                return;
            }

            if (rule instanceof adguard.rules.UrlFilterRule) {
                if (rule.isCspRule()) {
                    this.cspFilter.addRule(rule);
                } else {
                    if (rule.isBadFilter()) {
                        this.badFilterRules[rule.badFilter] = rule;
                    } else if (rule.whiteListRule) {
                        this.urlWhiteFilter.addRule(rule);
                    } else {
                        this.urlBlockingFilter.addRule(rule);
                    }
                }
            } else if (rule instanceof adguard.rules.CssFilterRule) {
                this.cssFilter.addRule(rule);
            } else if (rule instanceof adguard.rules.ScriptFilterRule) {
                this.scriptFilter.addRule(rule);
            } else if (rule instanceof adguard.rules.ContentFilterRule) {
                this.contentFilter.addRule(rule);
            }

            this.rulesCount++;
            this.urlBlockingCache.clearRequestCache();
            this.urlExceptionsCache.clearRequestCache();
        },

        /**
         * Removes rule from the RequestFilter.
         * Rule is removed from one of underlying filters depending on the rule type.
         *
         * @param rule Rule to be removed
         */
        removeRule: function (rule) {
            if (rule === null) {
                adguard.console.error("FilterRule must not be null");
                return;
            }
            if (rule instanceof adguard.rules.UrlFilterRule) {
                if (rule.isCspRule()) {
                    this.cspFilter.removeRule(rule);
                } else {
                    if (rule.isBadFilter()) {
                        delete this.badFilterRules[rule.badFilter];
                    } else if (rule.whiteListRule) {
                        this.urlWhiteFilter.removeRule(rule);
                    } else {
                        this.urlBlockingFilter.removeRule(rule);
                    }
                }
            } else if (rule instanceof adguard.rules.CssFilterRule) {
                this.cssFilter.removeRule(rule);
            } else if (rule instanceof adguard.rules.ScriptFilterRule) {
                this.scriptFilter.removeRule(rule);
            } else if (rule instanceof adguard.rules.ContentFilterRule) {
                this.contentFilter.removeRule(rule);
            }
            this.rulesCount--;
            this.urlBlockingCache.clearRequestCache();
            this.urlExceptionsCache.clearRequestCache();
        },

        /**
         * Returns the array of loaded rules
         */
        getRules: function () {
            var result = [];

            result = result.concat(this.urlWhiteFilter.getRules());
            result = result.concat(this.urlBlockingFilter.getRules());
            result = result.concat(this.cssFilter.getRules());
            result = result.concat(this.scriptFilter.getRules());
            result = result.concat(this.cspFilter.getRules());

            for (var badFilter in this.badFilterRules) {
                result.push(this.badFilterRules[badFilter]);
            }

            return result;
        },

        /**
         * Builds CSS for the specified web page.
         * Only element hiding rules are used to build this CSS:
         * http://adguard.com/en/filterrules.html#hideRules
         *
         * @param url Page URL
         * @param genericHide flag to hide common rules
         * @returns CSS ready to be injected
         */
        getSelectorsForUrl: function (url, genericHide) {
            var domain = adguard.utils.url.getHost(url);
            if (adguard.prefs.collectHitsCountEnabled && adguard.settings.collectHitsCount()) {
                // If user has enabled "Send statistics for ad filters usage" option we build CSS with enabled hits stats.
                // In this case style contains "content" with filter identifier and rule text.
                var selectors = this.cssFilter.buildCssHits(domain, genericHide);
                selectors.cssHitsCounterEnabled = true;
                return selectors;
            } else {
                return this.cssFilter.buildCss(domain, genericHide);
            }
        },

        /**
         * Builds CSS for the specified web page.
         * Only CSS injection rules used to build this CSS:
         * http://adguard.com/en/filterrules.html#cssInjection
         *
         * @param url Page URL
         * @param genericHide flag to hide common rules
         * @returns CSS ready to be injected.
         */
        getInjectedSelectorsForUrl: function (url, genericHide) {
            var domain = adguard.utils.url.getHost(url);
            return this.cssFilter.buildInjectCss(domain, genericHide);
        },

        /**
         * Builds domain-specific JS injection for the specified page.
         * http://adguard.com/en/filterrules.html#javascriptInjection
         *
         * @param url Page URL
         * @returns Javascript
         */
        getScriptsForUrl: function (url) {
            var domain = adguard.utils.url.getHost(url);
            return this.scriptFilter.buildScript(domain);
        },

        /**
         * Clears RequestFilter
         */
        clearRules: function () {
            this.urlWhiteFilter.clearRules();
            this.urlBlockingFilter.clearRules();
            this.cssFilter.clearRules();
            this.contentFilter.clearRules();
            this.urlBlockingCache.clearRequestCache();
            this.urlExceptionsCache.clearRequestCache();
            this.badFilterRules = {};
        },

        /**
         * Checks if the rule is in bad filter exceptions
         *
         * @param rule
         * @returns {*}
         */
        _checkBadFilterExceptions: function (rule) {
            if (rule && rule instanceof adguard.rules.UrlFilterRule) {
                if (rule.ruleText in this.badFilterRules) {
                    // Removed with bad-filter rule
                    return null;
                }
            }

            return rule;
        },

        /**
         * Searches for the whitelist rule for the specified pair (url/referrer)
         *
         * @param requestUrl  Request URL
         * @param referrer    Referrer
         * @param requestType Request type
         * @returns Filter rule found or null
         */
        findWhiteListRule: function (requestUrl, referrer, requestType) {

            var refHost = adguard.utils.url.getHost(referrer);
            var thirdParty = adguard.utils.url.isThirdPartyRequest(requestUrl, referrer);

            var cacheItem = this.urlExceptionsCache.searchRequestCache(requestUrl, refHost, requestType);

            if (cacheItem) {
                // Element with zero index is a filter rule found last time
                return cacheItem[0];
            }

            var rule = this._checkWhiteList(requestUrl, refHost, requestType, thirdParty);
            rule = this._checkBadFilterExceptions(rule);

            this.urlExceptionsCache.saveResultToCache(requestUrl, rule, refHost, requestType);
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
        findRuleForRequest: function (requestUrl, documentUrl, requestType, documentWhitelistRule) {

            var documentHost = adguard.utils.url.getHost(documentUrl);
            var thirdParty = adguard.utils.url.isThirdPartyRequest(requestUrl, documentUrl);

            var cacheItem = this.urlBlockingCache.searchRequestCache(requestUrl, documentHost, requestType);

            if (cacheItem) {
                // Element with zero index is a filter rule found last time
                return cacheItem[0];
            }

            var rule = this._findRuleForRequest(requestUrl, documentHost, requestType, thirdParty, documentWhitelistRule);
            rule = this._checkBadFilterExceptions(rule);

            this.urlBlockingCache.saveResultToCache(requestUrl, rule, documentHost, requestType);
            return rule;
        },

        /**
         * Searches for content rules for the specified domain
         * @param documentUrl Document URL
         * @returns Collection of content rules
         */
        getContentRulesForUrl: function (documentUrl) {
            var documentHost = adguard.utils.url.getHost(documentUrl);
            return this.contentFilter.getRulesForDomain(documentHost);
        },

        /**
         * Searches for elements in document that matches given content rules
         * @param doc Document
         * @param rules Content rules
         * @returns Matched elements
         */
        getMatchedElementsForContentRules: function (doc, rules) {
            return this.contentFilter.getMatchedElementsForRules(doc, rules);
        },

        /**
         * Searches for CSP rules for the specified request
         * @param requestUrl Request URL
         * @param documentUrl Document URL
         * @param requestType Request Type (DOCUMENT or SUBDOCUMENT)
         * @returns Collection of CSP rules for applying to the request or null
         */
        findCspRules: function (requestUrl, documentUrl, requestType) {

            var documentHost = adguard.utils.url.getHost(documentUrl);
            var thirdParty = adguard.utils.url.isThirdPartyRequest(requestUrl, documentUrl);

            return this.cspFilter.findCspRules(requestUrl, documentHost, thirdParty, requestType);
        },

        /**
         * Checks if exception rule is present for the URL/Referrer pair
         *
         * @param requestUrl    Request URL
         * @param documentHost  Document URL host
         * @param requestType   Request content type (one of UrlFilterRule.contentTypes)
         * @param thirdParty    Is request third-party or not
         * @returns Filter rule found or null
         * @private
         */
        _checkWhiteList: function (requestUrl, documentHost, requestType, thirdParty) {
            if (this.urlWhiteFilter === null || !requestUrl) {
                return null;
            }
            return this.urlWhiteFilter.isFiltered(requestUrl, documentHost, requestType, thirdParty);
        },

        /**
         * Checks if there is a rule blocking this request
         *
         * @param requestUrl    Request URL
         * @param refHost       Referrer host
         * @param requestType   Request content type (one of UrlFilterRule.contentTypes)
         * @param thirdParty    Is request third-party or not
         * @param genericRulesAllowed    Is generic rules allowed
         * @returns Filter rule found or null
         * @private
         */
        _checkUrlBlockingList: function (requestUrl, refHost, requestType, thirdParty, genericRulesAllowed) {
            if (this.urlBlockingFilter === null || !requestUrl) {
                return null;
            }

            return this.urlBlockingFilter.isFiltered(requestUrl, refHost, requestType, thirdParty, !genericRulesAllowed);
        },

        /**
         * Searches the rule for request.
         *
         * @param requestUrl    Request URL
         * @param documentHost  Document host
         * @param requestType   Request content type (one of UrlFilterRule.contentTypes)
         * @param thirdParty    Is request third-party or not
         * @param documentWhiteListRule (optional) Document-level whitelist rule
         * @returns Filter rule found or null
         * @private
         */
        _findRuleForRequest: function (requestUrl, documentHost, requestType, thirdParty, documentWhiteListRule) {

            adguard.console.debug("Filtering http request for url: {0}, document: {1}, requestType: {2}", requestUrl, documentHost, requestType);

            // STEP 1: Looking for exception rule, which could be applied to the current request

            // Checks white list for a rule for this RequestUrl. If something is found - returning it.
            var urlWhiteListRule = this._checkWhiteList(requestUrl, documentHost, requestType, thirdParty);
            urlWhiteListRule = this._checkBadFilterExceptions(urlWhiteListRule);

            // If UrlBlock is set - than we should not use UrlBlockingFilter against this request.
            // Now check if document rule has $genericblock or $urlblock modifier
            var genericRulesAllowed = !documentWhiteListRule || !documentWhiteListRule.isGenericBlock();
            var urlRulesAllowed = !documentWhiteListRule || !documentWhiteListRule.isUrlBlock();

            // STEP 2: Looking for blocking rule, which could be applied to the current request

            // Look for blocking rules
            var blockingRule = this._checkUrlBlockingList(requestUrl, documentHost, requestType, thirdParty, genericRulesAllowed);

            // STEP 3: Analyze results, first - basic exception rule

            if (urlWhiteListRule &&
                // Please note, that if blocking rule has $important modifier, it could
                // overcome existing exception rule
                (urlWhiteListRule.isImportant || !blockingRule || !blockingRule.isImportant)) {
                adguard.console.debug("White list rule found {0} for url: {1} document: {2}, requestType: {3}", urlWhiteListRule.ruleText, requestUrl, documentHost, requestType);
                return urlWhiteListRule;
            }

            if (!genericRulesAllowed || !urlRulesAllowed) {
                adguard.console.debug("White list rule {0} found for document: {1}", documentWhiteListRule.ruleText, documentHost);
            }

            if (!urlRulesAllowed) {
                // URL whitelisted
                return documentWhiteListRule;
            }

            if (blockingRule) {
                adguard.console.debug("Black list rule {0} found for url: {1}, document: {2}, requestType: {3}", blockingRule.ruleText, requestUrl, documentHost, requestType);
            }

            return blockingRule;
        }
    };

    adguard.RequestFilter = RequestFilter;

})(adguard);
