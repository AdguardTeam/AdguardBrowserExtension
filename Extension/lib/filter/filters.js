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

/**
 * Initializing required libraries for this file.
 * require method is overridden in Chrome extension (port/require.js).
 */
var UrlFilter = require('filter/rules/url-filter').UrlFilter;
var CssFilter = require('filter/rules/css-filter').CssFilter;
var CssFilterRule = require('filter/rules/css-filter-rule').CssFilterRule;
var ScriptFilter = require('filter/rules/script-filter').ScriptFilter;
var ScriptFilterRule = require('filter/rules/script-filter-rule').ScriptFilterRule;
var UrlFilterRule = require('filter/rules/url-filter-rule').UrlFilterRule;
var SafebrowsingFilter = require('filter/safebrowsing-filter').SafebrowsingFilter;
var Log = require('utils/log').Log;
var UrlUtils = require('utils/url').UrlUtils;
var StringUtils = require('utils/common').StringUtils;
var Prefs = require('prefs').Prefs;
var userSettings = require('utils/user-settings').userSettings;

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
    requestCacheMaxSize: 500,

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
        if (rule == null || !rule.ruleText) {
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
        if (rule == null) {
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
     * Builds CSS for the specified web page.
     * Only element hiding rules are used to build this CSS:
     * http://adguard.com/en/filterrules.html#hideRules
     *
     * @param url Page URL
     * @returns CSS ready to be injected
     */
    getSelectorsForUrl: function (url) {
        var domain = UrlUtils.getDomainName(url);
        if (userSettings.collectHitsCount()) {
            // If user has enabled "Send statistics for ad filters usage" option we build CSS with enabled hits stats.
            // In this case style contains "background-image" to the unique URL.
            // Tracking requests to this URL shows us which rule has been used.
            // NOTE: For Firefox we use another way, look at "getCssForStyleSheet" method.
            var appId = Prefs.appId;
            return this.cssFilter.buildCssHits(domain, appId);
        } else {
            return this.cssFilter.buildCss(domain);
        }
    },

    /**
     * Builds CSS for the specified web page.
     * Only CSS injection rules used to build this CSS:
     * http://adguard.com/en/filterrules.html#cssInjection
     *
     * @param url Page URL
     * @returns CSS ready to be injected.
     */
    getInjectedSelectorsForUrl: function (url) {
        var domain = UrlUtils.getDomainName(url);
        return this.cssFilter.buildInjectCss(domain);
    },

    /**
     * This method is used in Firefox extension only.
     * If user has enabled "Send statistics for ad filters usage" option we change the way of applying CSS rules.
     * In this case we register browser-wide stylesheet using StyleService.registerSheet.
     *
     * @returns Stylesheet
     */
    getCssForStyleSheet: function () {
        return this.cssFilter.buildCssForStyleSheet();
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
     * @param requestUrl    Request URL
     * @param referrer      Referrer
     * @param requestType   Request content type (one of UrlFilterRule.contentTypes)
     * @returns Rule found or null
     */
    findRuleForRequest: function (requestUrl, referrer, requestType) {

        var refHost = UrlUtils.getHost(referrer);
        var thirdParty = UrlUtils.isThirdPartyRequest(requestUrl, referrer);

        var cacheItem = this._searchRequestCache(requestUrl, refHost, requestType);

        if (cacheItem) {
            // Element with zero index is a filter rule found last time
            return cacheItem[0];
        }

        var rule = this._innerFilterHttpRequest(requestUrl, referrer, refHost, requestType, thirdParty);

        this._saveResultToCache(requestUrl, rule, refHost, requestType);
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
     * @param refHost       Referrer host
     * @param requestType   Request content type (one of UrlFilterRule.contentTypes)
     * @param thirdParty    Is request third-party or not
     * @returns Filter rule found or null
     * @private
     */
    _checkWhiteList: function (requestUrl, refHost, requestType, thirdParty) {
        if (this.urlWhiteFilter == null || StringUtils.isEmpty(requestUrl)) {
            return null;
        }
        return this.urlWhiteFilter.isFiltered(requestUrl, refHost, requestType, thirdParty);
    },

    /**
     * Checks if there is a rule blocking this request
     *
     * @param requestUrl    Request URL
     * @param referrer      Referrer
     * @param requestType   Request content type (one of UrlFilterRule.contentTypes)
     * @param thirdParty    Is request third-party or not
     * @returns Filter rule found or null
     * @private
     */
    _checkUrlBlockingList: function (requestUrl, referrer, requestType, thirdParty) {
        if (this.urlBlockingFilter == null || StringUtils.isEmpty(requestUrl)) {
            return null;
        }
        return this.urlBlockingFilter.isFiltered(requestUrl, referrer, requestType, thirdParty);
    },

    /**
     * Filters HTTP request.
     *
     * @param requestUrl    Request URL
     * @param referrer      Referrer
     * @param refHost       Referrer host
     * @param requestType   Request content type (one of UrlFilterRule.contentTypes)
     * @param thirdParty    Is request third-party or not
     * @returns Filter rule found or null
     * @private
     */
    _innerFilterHttpRequest: function (requestUrl, referrer, refHost, requestType, thirdParty) {

        Log.debug("Filtering http request for url: {0}, referrer: {1}, requestType: {2}", requestUrl, refHost, requestType);

        var urlWhiteRule = this._checkWhiteList(requestUrl, refHost, requestType, thirdParty);
        if (urlWhiteRule != null) {
            Log.debug("White list rule found {0} for url: {1} referrer: {2}, requestType: {3}", urlWhiteRule.ruleText, requestUrl, refHost, requestType);
            return urlWhiteRule;
        }

        var referrerWhiteRule = this._checkWhiteList(referrer, refHost, "URLBLOCK", thirdParty);
        if (referrerWhiteRule != null) {
            Log.debug("White list rule {0} found for referrer: {1}", referrerWhiteRule.ruleText, referrer);
            return referrerWhiteRule;
        }

        var rule = this._checkUrlBlockingList(requestUrl, refHost, requestType, thirdParty);
        if (rule != null) {
            Log.debug("Black list rule {0} found for url: {1}, referrer: {2}, requestType: {3}", rule.ruleText, requestUrl, refHost, requestType);
        }

        return rule;
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
        if (this.requestCacheSize == 0) {
            return;
        }

        this.requestCache = Object.create(null);
        this.requestCacheSize = 0;
    }
};