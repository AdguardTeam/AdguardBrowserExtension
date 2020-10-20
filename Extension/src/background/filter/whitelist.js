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
import { settings } from '../settings/user-settings';
import { localStorage } from '../storage';
import { listeners } from '../notifier';
import { log } from '../utils/log';
import { lazyGet, lazyGetClear } from '../utils/lazy';

export const whitelist = (() => {
    const WHITE_LIST_DOMAINS_LS_PROP = 'white-list-domains';
    const BLOCK_LIST_DOMAINS_LS_PROP = 'block-list-domains';

    // eslint-disable-next-line max-len
    const allowAllWhitelistRule = new TSUrlFilter.NetworkRule('@@whitelist-all$document', utils.filters.WHITE_LIST_FILTER_ID);

    /**
     * Returns whitelist mode
     * In default mode filtration is enabled for all sites
     * In inverted model filtration is disabled for all sites
     */
    function isDefaultWhitelistMode() {
        return settings.isDefaultWhitelistMode();
    }

    /**
     * Read domains and initialize filters lazy
     */
    const whitelistDomainsHolder = {
        get domains() {
            return lazyGet(whitelistDomainsHolder, 'domains', () => {
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
            return lazyGet(blockListDomainsHolder, 'domains', () => {
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

    function notifyWhitelistUpdated() {
        listeners.notifyListeners(listeners.UPDATE_WHITELIST_FILTER_RULES);
    }

    /**
     * Create whitelist rule from input text
     * @param domain Domain
     * @returns {*}
     * @private
     */
    function createWhitelistRule(domain) {
        if (utils.strings.isEmpty(domain)) {
            return null;
        }

        return new TSUrlFilter.NetworkRule(`@@//${domain}$document`, utils.filters.WHITE_LIST_FILTER_ID);
    }

    /**
     * Adds domain to array of whitelist domains
     * @param domain
     */
    function addDomainToWhitelist(domain) {
        if (!domain) {
            return;
        }
        if (isDefaultWhitelistMode()) {
            whitelistDomainsHolder.add(domain);
        } else {
            blockListDomainsHolder.add(domain);
        }
    }

    /**
     * Remove domain form whitelist domains
     * @param domain
     */
    function removeDomainFromWhitelist(domain) {
        if (!domain) {
            return;
        }
        if (isDefaultWhitelistMode()) {
            utils.collections.removeAll(whitelistDomainsHolder.domains, domain);
        } else {
            utils.collections.removeAll(blockListDomainsHolder.domains, domain);
        }
    }

    /**
     * Remove domain from whitelist
     * @param domain
     */
    function removeFromWhitelist(domain) {
        removeDomainFromWhitelist(domain);
        saveDomainsToLocalStorage();
        notifyWhitelistUpdated();
    }

    /**
     * Save domains to local storage
     */
    function saveDomainsToLocalStorage() {
        localStorage.setItem(WHITE_LIST_DOMAINS_LS_PROP,
            JSON.stringify(whitelistDomainsHolder.domains));
        localStorage.setItem(BLOCK_LIST_DOMAINS_LS_PROP,
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
            const json = localStorage.getItem(prop);
            if (json) {
                domains = JSON.parse(json);
            }
        } catch (ex) {
            log.error('Error retrieve whitelist domains {0}, cause {1}', prop, ex);
        }
        return domains;
    }

    /**
     * Adds domain to whitelist
     * @param domain
     */
    function addToWhitelist(domain) {
        if (utils.strings.isEmpty(domain)) {
            return;
        }

        addDomainToWhitelist(domain);
        saveDomainsToLocalStorage();
        notifyWhitelistUpdated();
    }

    /**
     * Search for whitelist rule by url.
     */
    const findWhitelistRule = function (url) {
        if (!url) {
            return null;
        }

        const host = utils.url.getHost(url);

        if (isDefaultWhitelistMode()) {
            if (whitelistDomainsHolder.includes(host)) {
                return createWhitelistRule(host);
            }

            return null;
        }

        if (blockListDomainsHolder.includes(host)) {
            // filtering is enabled on this website
            return null;
        }

        return allowAllWhitelistRule;
    };

    /**
     * Changes whitelist mode
     * @param defaultMode
     */
    const changeDefaultWhitelistMode = function (defaultMode) {
        settings.changeDefaultWhitelistMode(defaultMode);
        notifyWhitelistUpdated();
    };

    /**
     * Stop (or start in case of inverted mode) filtration for url
     * @param url
     */
    const whitelistUrl = function (url) {
        const domain = utils.url.getHost(url);
        if (isDefaultWhitelistMode()) {
            addToWhitelist(domain);
        } else {
            removeFromWhitelist(domain);
        }
    };

    /**
     * Start (or stop in case of inverted mode) filtration for url
     * @param url
     */
    const unWhitelistUrl = function (url) {
        const domain = utils.url.getHost(url);
        if (isDefaultWhitelistMode()) {
            removeFromWhitelist(domain);
        } else {
            addToWhitelist(domain);
        }
    };

    /**
     * Updates domains in whitelist
     * @param domains
     */
    const updateWhitelistDomains = function (domains) {
        domains = domains || [];
        if (isDefaultWhitelistMode()) {
            clearWhitelisted();
            addWhitelisted(domains);
        } else {
            clearBlockListed();
            addBlockListed(domains);
        }
        notifyWhitelistUpdated();
    };

    /**
     * Add domains to whitelist
     * @param domains
     */
    var addWhitelisted = function (domains) {
        if (!domains) {
            return;
        }
        for (let i = 0; i < domains.length; i++) {
            const domain = domains[i];
            whitelistDomainsHolder.add(domain);
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
    var clearWhitelisted = function () {
        localStorage.removeItem(WHITE_LIST_DOMAINS_LS_PROP);
        lazyGetClear(whitelistDomainsHolder, 'domains');
    };

    /**
     * Clear blocklisted only
     */
    var clearBlockListed = function () {
        localStorage.removeItem(BLOCK_LIST_DOMAINS_LS_PROP);
        lazyGetClear(blockListDomainsHolder, 'domains');
    };

    /**
     * Configures whitelist service
     * @param whitelist Whitelist domains
     * @param blocklist Blocklist domains
     * @param whitelistMode Whitelist mode
     */
    const configure = function (whitelist, blocklist, whitelistMode) {
        clearWhitelisted();
        clearBlockListed();
        addWhitelisted(whitelist || []);
        addBlockListed(blocklist || []);
        settings.changeDefaultWhitelistMode(whitelistMode);
        notifyWhitelistUpdated();
    };

    /**
     * Returns the array of whitelist domains
     */
    const getWhitelistDomains = function () {
        if (isDefaultWhitelistMode()) {
            return whitelistDomainsHolder.domains;
        }
        return blockListDomainsHolder.domains;
    };

    /**
     * Returns the array of whitelisted domains
     */
    const getWhitelistedDomains = function () {
        return whitelistDomainsHolder.domains;
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
        lazyGetClear(whitelistDomainsHolder, 'domains');
        lazyGetClear(blockListDomainsHolder, 'domains');
    };

    return {

        init,
        configure,

        getWhitelistDomains,
        getWhitelistedDomains,
        getBlockListedDomains,
        updateWhitelistDomains,

        findWhitelistRule,

        whitelistUrl,
        unWhitelistUrl,

        isDefaultMode: isDefaultWhitelistMode,
        changeDefaultWhitelistMode,
    };
})();
