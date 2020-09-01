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
import { utils } from '../utils/common';
import { adguard } from '../adguard';

export const whitelist = (() => {
    const WHITE_LIST_DOMAINS_LS_PROP = 'white-list-domains';
    const BLOCK_LIST_DOMAINS_LS_PROP = 'block-list-domains';

    // eslint-disable-next-line max-len
    const allowAllWhiteListRule = new TSUrlFilter.NetworkRule('@@whitelist-all$document', utils.filters.WHITE_LIST_FILTER_ID);

    /**
     * Returns whitelist mode
     * In default mode filtration is enabled for all sites
     * In inverted model filtration is disabled for all sites
     */
    function isDefaultWhiteListMode() {
        return adguard.settings.isDefaultWhiteListMode();
    }

    /**
     * Read domains and initialize filters lazy
     */
    const whiteListDomainsHolder = {
        get domains() {
            return adguard.lazyGet(whiteListDomainsHolder, 'domains', () => {
                return getDomainsFromLocalStorage(WHITE_LIST_DOMAINS_LS_PROP);
            });
        },
        add(domain) {
            if (this.domains.indexOf(domain) < 0) {
                this.domains.push(domain);
            }
        },
        includes(domain) {
            return this.domains.indexOf(domain) >= 0;
        },
    };

    const blockListDomainsHolder = {
        get domains() {
            return adguard.lazyGet(blockListDomainsHolder, 'domains', () => {
                return getDomainsFromLocalStorage(BLOCK_LIST_DOMAINS_LS_PROP);
            });
        },
        add(domain) {
            if (this.domains.indexOf(domain) < 0) {
                this.domains.push(domain);
            }
        },
        includes(domain) {
            return this.domains.indexOf(domain) >= 0;
        },
    };

    function notifyWhiteListUpdated() {
        adguard.listeners.notifyListeners(adguard.listeners.UPDATE_WHITELIST_FILTER_RULES);
    }

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

        return new TSUrlFilter.NetworkRule(`@@//${domain}$document`, adguard.utils.filters.WHITE_LIST_FILTER_ID);
    }

    /**
     * Adds domain to array of whitelist domains
     * @param domain
     */
    function addDomainToWhiteList(domain) {
        if (!domain) {
            return;
        }
        if (isDefaultWhiteListMode()) {
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
        if (isDefaultWhiteListMode()) {
            adguard.utils.collections.removeAll(whiteListDomainsHolder.domains, domain);
        } else {
            adguard.utils.collections.removeAll(blockListDomainsHolder.domains, domain);
        }
    }

    /**
     * Remove domain from whitelist
     * @param domain
     */
    function removeFromWhiteList(domain) {
        removeDomainFromWhiteList(domain);
        saveDomainsToLocalStorage();
        notifyWhiteListUpdated();
    }

    /**
     * Save domains to local storage
     */
    function saveDomainsToLocalStorage() {
        adguard.localStorage.setItem(WHITE_LIST_DOMAINS_LS_PROP,
            JSON.stringify(whiteListDomainsHolder.domains));
        adguard.localStorage.setItem(BLOCK_LIST_DOMAINS_LS_PROP,
            JSON.stringify(blockListDomainsHolder.domains));
    }

    /**
     * Retrieve domains from local storage
     * @param prop
     * @returns {Array}
     */
    function getDomainsFromLocalStorage(prop) {
        let domains = [];
        try {
            const json = adguard.localStorage.getItem(prop);
            if (json) {
                domains = JSON.parse(json);
            }
        } catch (ex) {
            adguard.console.error('Error retrieve whitelist domains {0}, cause {1}', prop, ex);
        }
        return domains;
    }

    /**
     * Adds domain to whitelist
     * @param domain
     */
    function addToWhiteList(domain) {
        if (adguard.utils.strings.isEmpty(domain)) {
            return;
        }

        addDomainToWhiteList(domain);
        saveDomainsToLocalStorage();
        notifyWhiteListUpdated();
    }

    /**
     * Search for whitelist rule by url.
     */
    const findWhiteListRule = function (url) {
        if (!url) {
            return null;
        }

        const host = adguard.utils.url.getHost(url);

        if (isDefaultWhiteListMode()) {
            if (whiteListDomainsHolder.includes(host)) {
                return createWhiteListRule(host);
            }

            return null;
        }

        if (blockListDomainsHolder.includes(host)) {
            // filtering is enabled on this website
            return null;
        }

        return allowAllWhiteListRule;
    };

    /**
     * Changes whitelist mode
     * @param defaultMode
     */
    const changeDefaultWhiteListMode = function (defaultMode) {
        adguard.settings.changeDefaultWhiteListMode(defaultMode);
        notifyWhiteListUpdated();
    };

    /**
     * Stop (or start in case of inverted mode) filtration for url
     * @param url
     */
    const whiteListUrl = function (url) {
        const domain = adguard.utils.url.getHost(url);
        if (isDefaultWhiteListMode()) {
            addToWhiteList(domain);
        } else {
            removeFromWhiteList(domain);
        }
    };

    /**
     * Start (or stop in case of inverted mode) filtration for url
     * @param url
     */
    const unWhiteListUrl = function (url) {
        const domain = adguard.utils.url.getHost(url);
        if (isDefaultWhiteListMode()) {
            removeFromWhiteList(domain);
        } else {
            addToWhiteList(domain);
        }
    };

    /**
     * Updates domains in whitelist
     * @param domains
     */
    const updateWhiteListDomains = function (domains) {
        domains = domains || [];
        if (isDefaultWhiteListMode()) {
            clearWhiteListed();
            addWhiteListed(domains);
        } else {
            clearBlockListed();
            addBlockListed(domains);
        }
        notifyWhiteListUpdated();
    };

    /**
     * Add domains to whitelist
     * @param domains
     */
    var addWhiteListed = function (domains) {
        if (!domains) {
            return;
        }
        for (let i = 0; i < domains.length; i++) {
            const domain = domains[i];
            whiteListDomainsHolder.add(domain);
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
        for (let i = 0; i < domains.length; i++) {
            const domain = domains[i];
            blockListDomainsHolder.add(domain);
        }
        saveDomainsToLocalStorage();
    };

    /**
     * Clear whitelisted only
     */
    var clearWhiteListed = function () {
        adguard.localStorage.removeItem(WHITE_LIST_DOMAINS_LS_PROP);
        adguard.lazyGetClear(whiteListDomainsHolder, 'domains');
    };

    /**
     * Clear blocklisted only
     */
    var clearBlockListed = function () {
        adguard.localStorage.removeItem(BLOCK_LIST_DOMAINS_LS_PROP);
        adguard.lazyGetClear(blockListDomainsHolder, 'domains');
    };

    /**
     * Configures whitelist service
     * @param whitelist Whitelist domains
     * @param blocklist Blocklist domains
     * @param whiteListMode Whitelist mode
     */
    const configure = function (whitelist, blocklist, whiteListMode) {
        clearWhiteListed();
        clearBlockListed();
        addWhiteListed(whitelist || []);
        addBlockListed(blocklist || []);
        adguard.settings.changeDefaultWhiteListMode(whiteListMode);
        notifyWhiteListUpdated();
    };

    /**
     * Returns the array of whitelist domains
     */
    const getWhiteListDomains = function () {
        if (isDefaultWhiteListMode()) {
            return whiteListDomainsHolder.domains;
        }
        return blockListDomainsHolder.domains;
    };

    /**
     * Returns the array of whitelisted domains
     */
    const getWhiteListedDomains = function () {
        return whiteListDomainsHolder.domains;
    };

    /**
     * Returns the array of blocklisted domains, inverted mode
     */
    const getBlockListedDomains = function () {
        return blockListDomainsHolder.domains;
    };

    /**
     * Initializes whitelist filter
     */
    const init = function () {
        /**
         * Access to whitelist/blacklist domains before the proper initialization of localStorage leads to wrong caching of its values
         * To prevent it we should clear cached values
         * https://github.com/AdguardTeam/AdguardBrowserExtension/issues/933
         */
        adguard.lazyGetClear(whiteListDomainsHolder, 'domains');
        adguard.lazyGetClear(blockListDomainsHolder, 'domains');
    };

    return {

        init,
        configure,

        getWhiteListDomains,
        getWhiteListedDomains,
        getBlockListedDomains,
        updateWhiteListDomains,

        findWhiteListRule,

        whiteListUrl,
        unWhiteListUrl,

        isDefaultMode: isDefaultWhiteListMode,
        changeDefaultWhiteListMode,
    };
})();

// TODO remove when all modules will be imported
adguard.whitelist = whitelist;
