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
/* global require, exports */

/**
 * Initializing required libraries for this file.
 * require method is overridden in Chrome extension (port/require.js).
 */
var UrlFilter = require('../../lib/filter/rules/url-filter').UrlFilter;
var CssFilter = require('../../lib/filter/rules/css-filter').CssFilter;
var CssFilterRule = require('../../lib/filter/rules/css-filter-rule').CssFilterRule;
var ScriptFilter = require('../../lib/filter/rules/script-filter').ScriptFilter;
var ScriptFilterRule = require('../../lib/filter/rules/script-filter-rule').ScriptFilterRule;
var UrlFilterRule = require('../../lib/filter/rules/url-filter-rule').UrlFilterRule;
var SafebrowsingFilter = require('../../lib/filter/safebrowsing-filter').SafebrowsingFilter;
var Log = require('../../lib/utils/log').Log;
var UrlUtils = require('../../lib/utils/url').UrlUtils;
var StringUtils = require('../../lib/utils/common').StringUtils;
var Prefs = require('../../lib/prefs').Prefs;
var userSettings = require('../../lib/utils/user-settings').userSettings;

/**
 * Request filter is main class which applies filter rules.
 *
 * @type {Function}
 */
var RequestFilter = exports.RequestFilter = function () {

    // Filter that applies URL blocking rules
    // Basic rules: http://adguard.com/en/filterrules.html#baseRules
    this.urlBlockingFilter = new UrlFilter();

    // Filter that applies whitelist rules
    // Exception rules: http://adguard.com/en/filterrules.html#exclusionRules
    this.urlWhiteFilter = new UrlFilter();

    // Filter that applies CSS rules
    // ABP element hiding rules: http://adguard.com/en/filterrules.html#hideRules
    // CSS injection rules http://adguard.com/en/filterrules.html#cssInjection
    this.cssFilter = new CssFilter();

    // Filter that applies JS rules
    // JS injection rules: http://adguard.com/en/filterrules.html#javascriptInjection
    this.scriptFilter = new ScriptFilter();

    // Safebrowsing filter: http://adguard.com/en/how-malware-blocked.html#extension
    this.safebrowsingFilter = new SafebrowsingFilter();

    // Rules count (includes all types of rules)
    this.rulesCount = 0;

    // Init small cache for url filtering rules
    this.requestCache = Object.create(null);
    this.requestCacheSize = 0;
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
            Log.error("FilterRule must not be null");
            return;
        }
        if (rule instanceof UrlFilterRule) {
            if (rule.whiteListRule) {
                this.urlWhiteFilter.addRule(rule);
            } else {
                this.urlBlockingFilter.addRule(rule);
            }
        } else if (rule instanceof CssFilterRule) {
            this.cssFilter.addRule(rule);
        } else if (rule instanceof ScriptFilterRule) {
            this.scriptFilter.addRule(rule);
        }
        this.rulesCount++;
        this._clearRequestCache();
    },

    /**
     * Removes rule from the RequestFilter.
     * Rule is removed from one of underlying filters depending on the rule type.
     *
     * @param rule Rule to be removed
     */
    removeRule: function (rule) {
        if (rule === null) {
            Log.error("FilterRule must not be null");
            return;
        }
        if (rule instanceof UrlFilterRule) {
            if (rule.whiteListRule) {
                this.urlWhiteFilter.removeRule(rule);
            } else {
                this.urlBlockingFilter.removeRule(rule);
            }
        } else if (rule instanceof CssFilterRule) {
            this.cssFilter.removeRule(rule);
        } else if (rule instanceof ScriptFilterRule) {
            this.scriptFilter.removeRule(rule);
        }
        this.rulesCount--;
        this._clearRequestCache();
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
        var domain = UrlUtils.getDomainName(url);
        if (Prefs.collectHitsCountEnabled && userSettings.collectHitsCount()) {
            // If user has enabled "Send statistics for ad filters usage" option we build CSS with enabled hits stats.
            // In this case style contains "background-image" to the unique URL.
            // Tracking requests to this URL shows us which rule has been used.
            // NOTE: For Firefox we use another way, look at "getCssForStyleSheet" method.
            var hitPrefix = Prefs.hitPrefix;
            return this.cssFilter.buildCssHits(domain, hitPrefix, genericHide);
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
        var domain = UrlUtils.getDomainName(url);
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
        var domain = UrlUtils.toPunyCode(UrlUtils.getDomainName(url));
        return this.scriptFilter.buildScript(domain);
    },

    /**
     * Clears RequestFilter
     */
    clearRules: function () {
        this.urlWhiteFilter.clearRules();
        this.urlBlockingFilter.clearRules();
        this.cssFilter.clearRules();
        this._clearRequestCache();
    },

    /**
     * Searches for the whitelist rule for the specified pair (url/referrer)
     *
     * @param requestUrl  Request URL
     * @param referrer    Referrer
     * @param requestType        Exception rule modifier (either DOCUMENT or ELEMHIDE or JSINJECT)
     * @returns Filter rule found or null
     */
    findWhiteListRule: function (requestUrl, referrer, requestType) {

        var refHost = UrlUtils.getHost(referrer);
        var thirdParty = UrlUtils.isThirdPartyRequest(requestUrl, referrer);

        var cacheItem = this._searchRequestCache(requestUrl, refHost, requestType);

        if (cacheItem) {
            // Element with zero index is a filter rule found last time
            return cacheItem[0];
        }

        var rule = this._checkWhiteList(requestUrl, refHost, requestType, thirdParty);

        this._saveResultToCache(requestUrl, rule, refHost, requestType);
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

        var documentHost = UrlUtils.getHost(documentUrl);
        var thirdParty = UrlUtils.isThirdPartyRequest(requestUrl, documentUrl);

        var cacheItem = this._searchRequestCache(requestUrl, documentHost, requestType);

        if (cacheItem) {
            // Element with zero index is a filter rule found last time
            return cacheItem[0];
        }

        var rule = this._findRuleForRequest(requestUrl, documentHost, requestType, thirdParty, documentWhitelistRule);

        this._saveResultToCache(requestUrl, rule, documentHost, requestType);
        return rule;
    },

    /**
     * Adds URL to trusted sites (this URL will be ignored by safebrowsing filter)
     *
     * @param url Url to add
     */
    addToSafebrowsingTrusted: function (url) {
        this.safebrowsingFilter.addToSafebrowsingTrusted(url);
    },

    /**
     * Checks URL with safebrowsing filter.
     * http://adguard.com/en/how-malware-blocked.html#extension
     *
     * @param requestUrl Request URL
     * @param referrerUrl Referrer URL
     * @param safebrowsingCallback Called when check has been finished
     * @param incognitoTab Tab incognito mode
     */
    checkSafebrowsingFilter: function (requestUrl, referrerUrl, safebrowsingCallback, incognitoTab) {

        if (!userSettings.getSafebrowsingInfo().enabled) {
            return;
        }

        Log.debug("Checking safebrowsing filter for {0}", requestUrl);

        var callback = function (sbList) {

            if (!sbList) {
                Log.debug("No safebrowsing rule found");
                return;
            }
            Log.debug("Following safebrowsing filter has been fired: {0}", sbList);
            if (!incognitoTab && userSettings.getSafebrowsingInfo().sendStats) {
                this.safebrowsingFilter.trackSafebrowsingStats(requestUrl);
            }
            safebrowsingCallback(this.safebrowsingFilter.getErrorPageURL(requestUrl, referrerUrl, sbList));

        }.bind(this);

        this.safebrowsingFilter.lookupUrlWithCallback(requestUrl, callback);
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
        if (this.urlWhiteFilter === null || StringUtils.isEmpty(requestUrl)) {
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
        if (this.urlBlockingFilter === null || StringUtils.isEmpty(requestUrl)) {
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

        Log.debug("Filtering http request for url: {0}, document: {1}, requestType: {2}", requestUrl, documentHost, requestType);

        // STEP 1: Looking for exception rule, which could be applied to the current request

        // Checks white list for a rule for this RequestUrl. If something is found - returning it.
        var urlWhiteListRule = this._checkWhiteList(requestUrl, documentHost, requestType, thirdParty);

        // If UrlBlock is set - than we should not use UrlBlockingFilter against this request.
        // Now check if document rule has $genericblock or $urlblock modifier
        var genericRulesAllowed = documentWhiteListRule == null || !documentWhiteListRule.checkContentType("GENERICBLOCK");
        var urlRulesAllowed = documentWhiteListRule == null || !documentWhiteListRule.checkContentType("URLBLOCK");

        // STEP 2: Looking for blocking rule, which could be applied to the current request

        // Look for blocking rules
        var blockingRule = this._checkUrlBlockingList(requestUrl, documentHost, requestType, thirdParty, genericRulesAllowed);

        // STEP 3: Analyze results, first - basic exception rule

        if (urlWhiteListRule != null &&
            // Please note, that if blocking rule has $important modifier, it could
            // overcome existing exception rule
            (urlWhiteListRule.isImportant || blockingRule == null || !blockingRule.isImportant)) {
            Log.debug("White list rule found {0} for url: {1} document: {2}, requestType: {3}", urlWhiteListRule.ruleText, requestUrl, documentHost, requestType);
            return urlWhiteListRule;
        }

        if (!genericRulesAllowed || !urlRulesAllowed) {
            Log.debug("White list rule {0} found for document: {1}", documentWhiteListRule.ruleText, documentHost);
        }

        if (!urlRulesAllowed) {
            // URL whitelisted
            return documentWhiteListRule;
        }

        if (blockingRule != null) {
            Log.debug("Black list rule {0} found for url: {1}, document: {2}, requestType: {3}", blockingRule.ruleText, requestUrl, documentHost, requestType);
        }

        return blockingRule;
    },

    /**
     * Searches for cached filter rule
     *
     * @param requestUrl Request url
     * @param refHost Referrer host
     * @param requestType Request type
     * @private
     */
    _searchRequestCache: function (requestUrl, refHost, requestType) {
        var cacheItem = this.requestCache[requestUrl];
        if (cacheItem && cacheItem[1] === refHost && cacheItem[2] === requestType) {
            return cacheItem;
        }

        return null;
    },

    /**
     * Saves resulting filtering rule to requestCache
     *
     * @param requestUrl Request url
     * @param rule Rule found
     * @param refHost Referrer host
     * @param requestType Request type
     * @private
     */
    _saveResultToCache: function (requestUrl, rule, refHost, requestType) {
        if (this.requestCacheSize > this.requestCacheMaxSize) {
            this._clearRequestCache();
        }
        this.requestCache[requestUrl] = [rule, refHost, requestType];
        this.requestCacheSize++;
    },

    /**
     * Clears request cache
     * @private
     */
    _clearRequestCache: function () {
        if (this.requestCacheSize === 0) {
            return;
        }

        this.requestCache = Object.create(null);
        this.requestCacheSize = 0;
    }
};