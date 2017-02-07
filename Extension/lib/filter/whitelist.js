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

adguard.whitelist = (function (adguard) {

    var WHITE_LIST_DOMAINS_LS_PROP = 'white-list-domains';
    var BLOCK_LIST_DOMAINS_LS_PROP = 'block-list-domains';

    var allowAllWhiteListRule = new adguard.rules.UrlFilterRule('@@whitelist-all$document', adguard.utils.filters.WHITE_LIST_FILTER_ID);

    var defaultWhiteListMode = adguard.settings.isDefaultWhiteListMode();

    var whiteListFilter = new adguard.rules.UrlFilter();
    var blockListFilter = new adguard.rules.UrlFilter();

    /**
     * Read domains and initialize filters lazy
     */
    var whiteListDomainsHolder = {
        get domains() {
            return adguard.lazyGet(whiteListDomainsHolder, 'domains', function () {
                // Reading from local storage
                var domains = getDomainsFromLocalStorage(WHITE_LIST_DOMAINS_LS_PROP);
                for (var i = 0; i < domains.length; i++) {
                    var rule = createWhiteListRule(domains[i]);
                    if (rule) {
                        whiteListFilter.addRule(rule);
                    }
                }
                return domains;
            });
        },
        add: function (domain) {
            if (this.domains.indexOf(domain) < 0) {
                this.domains.push(domain);
            }
        }
    };
    var blockListDomainsHolder = {
        get domains() {
            return adguard.lazyGet(blockListDomainsHolder, 'domains', function () {
                // Reading from local storage
                var domains = getDomainsFromLocalStorage(BLOCK_LIST_DOMAINS_LS_PROP);
                for (var i = 0; i < domains.length; i++) {
                    var rule = createWhiteListRule(domains[i]);
                    if (rule) {
                        blockListFilter.addRule(rule);
                    }
                }
                return domains;
            });
        },
        add: function (domain) {
            if (this.domains.indexOf(domain) < 0) {
                this.domains.push(domain);
            }
        }
    };

    /**
     * Create whitelist rule from input text
     * @param domain Domain
     * @returns {*}
     * @private
     */
    function createWhiteListRule(domain) {
        if (adguard.utils.strings.isEmpty(domain)) {
            return null;
        }
        return adguard.rules.builder.createRule("@@//" + domain + "$document", adguard.utils.filters.WHITE_LIST_FILTER_ID);
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
            whiteListDomainsHolder.add(domain);
        } else {
            blockListDomainsHolder.add(domain);
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
            adguard.utils.collections.removeAll(whiteListDomainsHolder.domains, domain);
        } else {
            adguard.utils.collections.removeAll(blockListDomainsHolder.domains, domain);
        }
    }

    /**
     * Save domains to local storage
     */
    function saveDomainsToLocalStorage() {
        adguard.localStorage.setItem(WHITE_LIST_DOMAINS_LS_PROP, JSON.stringify(whiteListDomainsHolder.domains));
        adguard.localStorage.setItem(BLOCK_LIST_DOMAINS_LS_PROP, JSON.stringify(blockListDomainsHolder.domains));
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
            adguard.console.error("Error retrieve whitelist domains {0}, cause {1}", prop, ex);
        }
        return domains;
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

        if (adguard.utils.strings.isEmpty(url)) {
            return null;
        }

        var host = adguard.utils.url.getHost(url);

        if (defaultWhiteListMode) {
            return whiteListFilter.isFiltered(url, host, adguard.RequestTypes.DOCUMENT, false);
        } else {
            var rule = blockListFilter.isFiltered(url, host, adguard.RequestTypes.DOCUMENT, false);
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
        adguard.listeners.notifyListeners(adguard.listeners.UPDATE_WHITELIST_FILTER_RULES);
    };

    /**
     * Stop (or start in case of inverted mode) filtration for url
     * @param url
     */
    var whiteListUrl = function (url) {
        var domain = adguard.utils.url.getHost(url);
        if (defaultWhiteListMode) {
            addToWhiteList(domain);
        } else {
            removeFromWhiteList(domain);
        }
        adguard.listeners.notifyListeners(adguard.listeners.UPDATE_WHITELIST_FILTER_RULES);
    };

    /**
     * Start (or stop in case of inverted mode) filtration for url
     * @param url
     */
    var unWhiteListUrl = function (url) {
        var domain = adguard.utils.url.getHost(url);
        if (defaultWhiteListMode) {
            removeFromWhiteList(domain);
        } else {
            addToWhiteList(domain);
        }
        adguard.listeners.notifyListeners(adguard.listeners.UPDATE_WHITELIST_FILTER_RULES);
    };

    /**
     * Add domains to whitelist
     * @param domains
     */
    var addToWhiteListArray = function (domains) {
        if (!domains) {
            return;
        }

        if (defaultWhiteListMode) {
            addWhiteListed(domains);
        } else {
            addBlockListed(domains);
        }

        adguard.listeners.notifyListeners(adguard.listeners.UPDATE_WHITELIST_FILTER_RULES);
    };

    /**
     * Add domains to whitelist
     * @param domains
     */
    var addWhiteListed = function (domains) {
        if (!domains) {
            return;
        }
        var rules = [];
        for (var i = 0; i < domains.length; i++) {
            var domain = domains[i];
            var rule = createWhiteListRule(domain);
            if (rule) {
                rules.push(rule);
                whiteListFilter.addRule(rule);
                addDomainToWhiteList(domain);
            }
        }
        saveDomainsToLocalStorage();
    };

    /**
     * Add domains to blocklist
     * @param domains
     */
    var addBlockListed = function (domains) {
        if (!domains) {
            return;
        }
        var rules = [];
        for (var i = 0; i < domains.length; i++) {
            var domain = domains[i];
            var rule = createWhiteListRule(domain);
            if (rule) {
                rules.push(rule);
                blockListFilter.addRule(rule);
                addDomainToWhiteList(domain);
            }
        }
        saveDomainsToLocalStorage();
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
        adguard.listeners.notifyListeners(adguard.listeners.UPDATE_WHITELIST_FILTER_RULES);
    };

    /**
     * Clear whitelist current mode
     */
    var clearWhiteList = function () {
        if (defaultWhiteListMode) {
            clearWhiteListed();
        } else {
            clearBlockListed();
        }

        adguard.listeners.notifyListeners(adguard.listeners.UPDATE_WHITELIST_FILTER_RULES);
    };

    /**
     * Clear whitelisted only
     */
    var clearWhiteListed = function () {
        adguard.localStorage.removeItem(WHITE_LIST_DOMAINS_LS_PROP);
        adguard.lazyGetClear(whiteListDomainsHolder, 'domains');
        whiteListFilter = new adguard.rules.UrlFilter();
    };

    /**
     * Clear blocklisted only
     */
    var clearBlockListed = function () {
        adguard.localStorage.removeItem(BLOCK_LIST_DOMAINS_LS_PROP);
        adguard.lazyGetClear(blockListDomainsHolder, 'domains');
        blockListFilter = new adguard.rules.UrlFilter();
    };

    /**
     * Returns the array of whitelist domains
     */
    var getWhiteListDomains = function () {
        if (defaultWhiteListMode) {
            return whiteListDomainsHolder.domains;
        } else {
            return blockListDomainsHolder.domains;
        }
    };

    /**
     * Returns the array of whitelisted domains
     */
    var getWhiteListedDomains = function () {
        return whiteListDomainsHolder.domains;
    };

    /**
     * Returns the array of blocklisted domains, inverted mode
     */
    var getBlockListedDomains = function () {
        return blockListDomainsHolder.domains;
    };

    /**
     * Returns the array of loaded rules
     */
    var getRules = function () {
        //TODO: blockListFilter

        return whiteListFilter.getRules();
    };

    return {

        getRules: getRules,
        getWhiteListDomains: getWhiteListDomains,

        getWhiteListedDomains: getWhiteListedDomains,
        getBlockListedDomains: getBlockListedDomains,

        findWhiteListRule: findWhiteListRule,

        whiteListUrl: whiteListUrl,
        unWhiteListUrl: unWhiteListUrl,

        addToWhiteListArray: addToWhiteListArray,
        addWhiteListed: addWhiteListed,
        addBlockListed: addBlockListed,

        removeFromWhiteList: removeFromWhiteList,
        clearWhiteList: clearWhiteList,
        clearWhiteListed: clearWhiteListed,
        clearBlockListed: clearBlockListed,

        isDefaultMode: isDefaultMode,
        changeDefaultWhiteListMode: changeDefaultWhiteListMode
    };

})(adguard);

