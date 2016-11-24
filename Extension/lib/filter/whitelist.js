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

/* global Log, StringUtils, CollectionUtils, AntiBannerFiltersId, UrlUtils, RequestTypes, EventNotifier, EventNotifierTypes */

adguard.whitelist = (function () {


    var WHITE_LIST_DOMAINS_LS_PROP = 'white-list-domains';
    var BLOCK_LIST_DOMAINS_LS_PROP = 'block-list-domains';

    var allowAllWhiteListRule = new adguard.rules.UrlFilterRule('@@whitelist-all$document', AntiBannerFiltersId.WHITE_LIST_FILTER_ID);

    var defaultWhiteListMode = adguard.settings.isDefaultWhiteListMode();

    var whiteListFilter = new adguard.rules.UrlFilter();
    var blockListFilter = new adguard.rules.UrlFilter();

    var whiteListDomains = [];
    var blockListDomains = [];

    /**
     * Create whitelist rule from input text
     * @param domain Domain
     * @returns {*}
     * @private
     */
    function createWhiteListRule(domain) {
        if (StringUtils.isEmpty(domain)) {
            return null;
        }
        return adguard.rules.builder.createRule("@@//" + domain + "$document", AntiBannerFiltersId.WHITE_LIST_FILTER_ID);
    }

    /**
     * Adds domain to array of whitelist domains
     * @param domain
     */
    function addDomainToWhiteList(domain) {
        if (!domain) {
            return;
        }
        if (defaultWhiteListMode) {
            if (whiteListDomains.indexOf(domain) < 0) {
                whiteListDomains.push(domain);
            }
        } else {
            if (blockListDomains.indexOf(domain) < 0) {
                blockListDomains.push(domain);
            }
        }
    }

    /**
     * Remove domain form whitelist domains
     * @param domain
     */
    function removeDomainFromWhiteList(domain) {
        if (!domain) {
            return;
        }
        if (defaultWhiteListMode) {
            CollectionUtils.removeAll(whiteListDomains, domain);
        } else {
            CollectionUtils.removeAll(blockListDomains, domain);
        }
    }

    /**
     * Save domains to local storage
     */
    function saveDomainsToLocalStorage() {
        adguard.localStorage.setItem(WHITE_LIST_DOMAINS_LS_PROP, JSON.stringify(whiteListDomains));
        adguard.localStorage.setItem(BLOCK_LIST_DOMAINS_LS_PROP, JSON.stringify(blockListDomains));
    }

    /**
     * Retrieve domains from local storage
     * @param prop
     * @returns {Array}
     */
    function getDomainsFromLocalStorage(prop) {
        var domains = [];
        try {
            var json = adguard.localStorage.getItem(prop);
            if (json) {
                domains = JSON.parse(json);
            }
        } catch (ex) {
            Log.error("Error retrieve whitelist domains {0}, cause {1}", prop, ex);
        }
        return domains;
    }

    /**
     * Initialize whitelist service
     */
    function initWhiteListFilters() {

        // Reading from local storage
        whiteListDomains = getDomainsFromLocalStorage(WHITE_LIST_DOMAINS_LS_PROP);
        blockListDomains = getDomainsFromLocalStorage(BLOCK_LIST_DOMAINS_LS_PROP);

        var i, rule;
        for (i = 0; i < whiteListDomains.length; i++) {
            rule = createWhiteListRule(whiteListDomains[i]);
            if (rule) {
                whiteListFilter.addRule(rule);
            }
        }
        for (i = 0; i < blockListDomains.length; i++) {
            rule = createWhiteListRule(blockListDomains[i]);
            if (rule) {
                blockListFilter.addRule(rule);
            }
        }
    }

    /**
     * Adds domain to whitelist
     * @param domain
     */
    function addToWhiteList(domain) {
        var rule = createWhiteListRule(domain);
        if (rule) {
            if (defaultWhiteListMode) {
                whiteListFilter.addRule(rule);
            } else {
                blockListFilter.addRule(rule);
            }
            addDomainToWhiteList(domain);
            saveDomainsToLocalStorage();
        }
    }

    /**
     * Search for whitelist rule by url.
     */
    var findWhiteListRule = function (url) {

        if (StringUtils.isEmpty(url)) {
            return null;
        }

        var host = UrlUtils.getHost(url);

        if (defaultWhiteListMode) {
            return whiteListFilter.isFiltered(url, host, RequestTypes.DOCUMENT, false);
        } else {
            var rule = blockListFilter.isFiltered(url, host, RequestTypes.DOCUMENT, false);
            if (rule) {
                //filtering is enabled on this website
                return null;
            } else {
                return allowAllWhiteListRule;
            }
        }
    };

    /**
     * Returns whitelist mode
     * In default mode filtration is enabled for all sites
     * In inverted model filtration is disabled for all sites
     */
    var isDefaultMode = function () {
        return defaultWhiteListMode;
    };

    /**
     * Changes whitelist mode
     * @param defaultMode
     */
    var changeDefaultWhiteListMode = function (defaultMode) {
        defaultWhiteListMode = defaultMode;
        adguard.settings.changeDefaultWhiteListMode(defaultMode);
        EventNotifier.notifyListeners(EventNotifierTypes.UPDATE_WHITELIST_FILTER_RULES);
    };

    /**
     * Stop (or start in case of inverted mode) filtration for url
     * @param url
     */
    var whiteListUrl = function (url) {
        var domain = UrlUtils.getHost(url);
        if (defaultWhiteListMode) {
            addToWhiteList(domain);
        } else {
            removeFromWhiteList(domain);
        }
        EventNotifier.notifyListeners(EventNotifierTypes.UPDATE_WHITELIST_FILTER_RULES);
    };

    /**
     * Start (or stop in case of inverted mode) filtration for url
     * @param url
     */
    var unWhiteListUrl = function (url) {
        var domain = UrlUtils.getHost(url);
        if (defaultWhiteListMode) {
            removeFromWhiteList(domain);
        } else {
            addToWhiteList(domain);
        }
        EventNotifier.notifyListeners(EventNotifierTypes.UPDATE_WHITELIST_FILTER_RULES);
    };

    /**
     * Add domains to whitelist
     * @param domains
     */
    var addToWhiteListArray = function (domains) {
        if (!domains) {
            return;
        }
        var rules = [];
        for (var i = 0; i < domains.length; i++) {
            var domain = domains[i];
            var rule = createWhiteListRule(domain);
            if (rule) {
                rules.push(rule);
                if (defaultWhiteListMode) {
                    whiteListFilter.addRule(rule);
                } else {
                    blockListFilter.addRule(rule);
                }
                addDomainToWhiteList(domain);
            }
        }
        saveDomainsToLocalStorage();
        EventNotifier.notifyListeners(EventNotifierTypes.UPDATE_WHITELIST_FILTER_RULES);
    };

    /**
     * Remove domain from whitelist
     * @param domain
     */
    var removeFromWhiteList = function (domain) {
        var rule = createWhiteListRule(domain);
        if (rule) {
            if (defaultWhiteListMode) {
                whiteListFilter.removeRule(rule);
            } else {
                blockListFilter.removeRule(rule);
            }
        }
        removeDomainFromWhiteList(domain);
        saveDomainsToLocalStorage();
        EventNotifier.notifyListeners(EventNotifierTypes.UPDATE_WHITELIST_FILTER_RULES);
    };

    /**
     * Clear whitelist
     */
    var clearWhiteList = function () {
        if (defaultWhiteListMode) {
            whiteListDomains = [];
            whiteListFilter = new adguard.rules.UrlFilter();
        } else {
            blockListDomains = [];
            blockListFilter = new adguard.rules.UrlFilter();
        }
        saveDomainsToLocalStorage();
        EventNotifier.notifyListeners(EventNotifierTypes.UPDATE_WHITELIST_FILTER_RULES);
    };

    /**
     * Returns the array of whitelist domains
     */
    var getWhiteListDomains = function () {
        if (defaultWhiteListMode) {
            return whiteListDomains;
        } else {
            return blockListDomains;
        }
    };

    /**
     * Returns the array of loaded rules
     */
    var getRules = function () {
        //TODO: blockListFilter

        return whiteListFilter.getRules();
    };

    initWhiteListFilters();

    return {

        getRules: getRules,
        getWhiteListDomains: getWhiteListDomains,

        findWhiteListRule: findWhiteListRule,

        whiteListUrl: whiteListUrl,
        unWhiteListUrl: unWhiteListUrl,

        addToWhiteListArray: addToWhiteListArray,

        removeFromWhiteList: removeFromWhiteList,
        clearWhiteList: clearWhiteList,

        isDefaultMode: isDefaultMode,
        changeDefaultWhiteListMode: changeDefaultWhiteListMode
    };

})();

