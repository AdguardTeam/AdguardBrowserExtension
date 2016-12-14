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

var Utils = require('../../lib/utils/browser-utils').Utils;
var StringUtils = require('../../lib/utils/common').StringUtils;
var UrlUtils = require('../../lib/utils/url').UrlUtils;
var CollectionUtils = require('../../lib/utils/common').CollectionUtils;
var AntiBannerFiltersId = require('../../lib/utils/common').AntiBannerFiltersId;
var RequestTypes = require('../../lib/utils/common').RequestTypes;
var LS = require('../../lib/utils/local-storage').LS;
var userSettings = require('../../lib/utils/user-settings').userSettings;

var FilterRule = require('../../lib/filter/rules/base-filter-rule').FilterRule;
var UrlFilterRule = require('../../lib/filter/rules/url-filter-rule').UrlFilterRule;
var FilterRuleBuilder = require('../../lib/filter/rules/filter-rule-builder').FilterRuleBuilder;
var UrlFilter = require('../../lib/filter/rules/url-filter').UrlFilter;

var allowAllWhiteListRule = new UrlFilterRule('@@whitelist-all$document', AntiBannerFiltersId.WHITE_LIST_FILTER_ID);

var WhiteListService = function () {

    this.defaultWhiteListMode = userSettings.isDefaultWhiteListMode();

    this.whiteListFilter = new UrlFilter();
    this.blockListFilter = new UrlFilter();

    this.whiteListDomains = [];
    this.blockListDomains = [];
};

WhiteListService.prototype = {

    WHITE_LIST_DOMAINS_LS_PROP: 'white-list-domains',
    BLOCK_LIST_DOMAINS_LS_PROP: 'block-list-domains',

    initWhiteListFilters: function () {

        //reading from local storage
        this.whiteListDomains = this._getDomainsFromLS(this.WHITE_LIST_DOMAINS_LS_PROP);
        this.blockListDomains = this._getDomainsFromLS(this.BLOCK_LIST_DOMAINS_LS_PROP);

        var i, rule;
        for (i = 0; i < this.whiteListDomains.length; i++) {
            rule = this._createWhiteListRule(this.whiteListDomains[i]);
            if (rule) {
                this.whiteListFilter.addRule(rule);
            }
        }
        for (i = 0; i < this.blockListDomains.length; i++) {
            rule = this._createWhiteListRule(this.blockListDomains[i]);
            if (rule) {
                this.blockListFilter.addRule(rule);
            }
        }
    },

    findWhiteListRule: function (url) {

        if (StringUtils.isEmpty(url)) {
            return null;
        }

        var host = UrlUtils.getHost(url);

        if (this.defaultWhiteListMode) {
            return this.whiteListFilter.isFiltered(url, host, RequestTypes.DOCUMENT, false);
        } else {
            var rule = this.blockListFilter.isFiltered(url, host, RequestTypes.DOCUMENT, false);
            if (rule) {
                //filtering is enabled on this website
                return null;
            } else {
                return allowAllWhiteListRule;
            }
        }
    },

    isDefaultMode: function () {
        return this.defaultWhiteListMode;
    },

    changeDefaultWhiteListMode: function (defaultWhiteListMode) {
        this.defaultWhiteListMode = defaultWhiteListMode;
        userSettings.changeDefaultWhiteListMode(defaultWhiteListMode);
    },

    getWhiteList: function () {
        if (this.defaultWhiteListMode) {
            return this.whiteListDomains;
        } else {
            return this.blockListDomains;
        }
    },

    whiteListUrl: function (url) {
        var domain = UrlUtils.getHost(url);
        if (this.defaultWhiteListMode) {
            this.addToWhiteList(domain);
        } else {
            this.removeFromWhiteList(domain);
        }
    },

    unWhiteListUrl: function (url) {
        var domain = UrlUtils.getHost(url);
        if (this.defaultWhiteListMode) {
            this.removeFromWhiteList(domain);
        } else {
            this.addToWhiteList(domain);
        }
    },

    addToWhiteList: function (domain) {
        var rule = this._createWhiteListRule(domain);
        if (rule) {
            if (this.defaultWhiteListMode) {
                this.whiteListFilter.addRule(rule);
            } else {
                this.blockListFilter.addRule(rule);
            }
            this._addToArray(domain);
            this._saveToLS();
        }
    },

    addToWhiteListArray: function (domains) {
        if (!domains) {
            return;
        }
        var rules = [];
        for (var i = 0; i < domains.length; i++) {
            var domain = domains[i];
            var rule = this._createWhiteListRule(domain);
            if (rule) {
                rules.push(rule);
                if (this.defaultWhiteListMode) {
                    this.whiteListFilter.addRule(rule);
                } else {
                    this.blockListFilter.addRule(rule);
                }
                this._addToArray(domain);
            }
        }
        this._saveToLS();
    },

    removeFromWhiteList: function (domain) {
        var rule = this._createWhiteListRule(domain);
        if (rule) {
            if (this.defaultWhiteListMode) {
                this.whiteListFilter.removeRule(rule);
            } else {
                this.blockListFilter.removeRule(rule);
            }
        }
        this._removeFromArray(domain);
        this._saveToLS();
    },

    clearWhiteList: function () {
        if (this.defaultWhiteListMode) {
            this.whiteListDomains = [];
            this.whiteListFilter = new UrlFilter();
        } else {
            this.blockListDomains = [];
            this.blockListFilter = new UrlFilter();
        }
        this._saveToLS();
    },

    /**
     * Returns the array of loaded rules
     */
    getRules: function () {
        //TODO: blockListFilter

        return this.whiteListFilter.getRules();
    },

    /**
     * Create whitelist rule from input text
     * @param domain Domain
     * @returns {*}
     * @private
     */
    _createWhiteListRule: function (domain) {
        if (StringUtils.isEmpty(domain)) {
            return null;
        }
        return FilterRuleBuilder.createRule("@@//" + domain + "$document", AntiBannerFiltersId.WHITE_LIST_FILTER_ID);
    },

    _addToArray: function (domain) {
        if (!domain) {
            return;
        }
        if (this.defaultWhiteListMode && this.whiteListDomains.indexOf(domain) < 0) {
            this.whiteListDomains.push(domain);
        } else if (this.blockListDomains.indexOf(domain) < 0) {
            this.blockListDomains.push(domain);
        }
    },

    _removeFromArray: function (domain) {
        if (!domain) {
            return;
        }
        if (this.defaultWhiteListMode) {
            CollectionUtils.removeAll(this.whiteListDomains, domain);
        } else {
            CollectionUtils.removeAll(this.blockListDomains, domain);
        }
    },

    _saveToLS: function () {
        LS.setItem(this.WHITE_LIST_DOMAINS_LS_PROP, JSON.stringify(this.whiteListDomains));
        LS.setItem(this.BLOCK_LIST_DOMAINS_LS_PROP, JSON.stringify(this.blockListDomains));
    },

    _getDomainsFromLS: function (prop) {
        var domains = [];
        try {
            var json = LS.getItem(prop);
            if (json) {
                domains = JSON.parse(json);
            }
        } catch (ex) {

        }
        return domains;
    }
};

exports.whiteListService = new WhiteListService();