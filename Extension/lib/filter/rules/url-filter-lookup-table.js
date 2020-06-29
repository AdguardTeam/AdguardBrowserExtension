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

(function (adguard, api) {
    'use strict';

    /**
     * Checks if rule filters request
     *
     * @param rule                Rule
     * @param url                 Request url
     * @param referrerHost        Referrer host
     * @param thirdParty          Is request third-party or not
     * @param requestType         Request type
     * @param genericRulesAllowed If true - generic rules are allowed
     * @param badFilterRules      Link to the badFilterRules
     * @return {Boolean}          If rule should filter this request
     */
    function isFiltered(rule, url, referrerHost, thirdParty, requestType, genericRulesAllowed, badFilterRules) {
        if (badFilterRules) {
            // if rule was converted we should lookup for converted rule text in the badFilterRules table
            if (rule.convertedRuleText && badFilterRules[rule.convertedRuleText]) {
                return false;
            }
            if (badFilterRules[rule.ruleText]) {
                return false;
            }
        }

        if (!genericRulesAllowed && rule.isGeneric()) {
            return false;
        }

        if (!rule.hasPermittedDomains()) {
            return rule.isFiltered(url, thirdParty, requestType)
                && rule.isPermitted(referrerHost);
        }

        if (requestType !== adguard.RequestTypes.DOCUMENT
            && requestType !== adguard.RequestTypes.SUBDOCUMENT) {
            return rule.isFiltered(url, thirdParty, requestType)
                && rule.isPermitted(referrerHost);
        }

        let isPermitted = rule.isPermitted(referrerHost);
        if (rule.isAnyUrl()) {
            // if rules dont have domain patterns and have $domain modifier
            // we should check rules with request urls hosts
            isPermitted = rule.isPermitted(adguard.utils.url.getHost(url));
            thirdParty = false;
        } else {
            // for DOCUMENT and SUBDOCUMENT requests
            // rules with request urls hosts are permitted as well
            isPermitted = isPermitted || rule.isPermitted(adguard.utils.url.getHost(url));
        }

        return rule.isFiltered(url, thirdParty, requestType) && isPermitted;
    }

    /**
     * Returns rules priority considering the following chain
     * (whitelist + $important) > $important > whitelist > $redirect > basic rules
     * @param rule
     * @returns {number}
     */
    const getPriority = (rule) => {
        if (rule.isImportant && rule.whiteListRule) {
            return 4;
        }
        if (rule.isImportant) {
            return 3;
        }
        if (rule.whiteListRule) {
            return 2;
        }
        if (rule.isRedirectRule()) {
            return 1;
        }
        return 0;
    };

    /**
     * Compare rules by priorities
     * if ruleA has higher or equal priority returns ruleA else returns ruleB
     * view getPriority function
     * @param ruleA
     * @param ruleB
     * @returns {object} rule with higher priority
     */
    function isHigherPriority(ruleA, ruleB) {
        const priorityA = getPriority(ruleA);
        const priorityB = getPriority(ruleB);
        return priorityA >= priorityB ? ruleA : ruleB;
    }

    /**
     * Checks url against collection of rules
     *
     * @param rules               Rules to check
     * @param url                 Request url
     * @param referrerHost        Request referrer host
     * @param thirdParty          Is request third-party or not
     * @param requestType         Request type
     * @param genericRulesAllowed If true - generic rules are allowed
     * @param badFilterRules      Link to the bad rules
     * @return Collection of matching rules
     */
    function filterRules(rules, url, referrerHost, thirdParty, requestType, genericRulesAllowed, badFilterRules) {
        let result = null;

        if (requestType === adguard.RequestTypes.DOCUMENT) {
            // Looking for document level rules
            for (let i = 0; i < rules.length; i += 1) {
                const rule = rules[i];
                if (rule.isDocumentLevel()
                    && isFiltered(
                        rule,
                        url,
                        referrerHost,
                        thirdParty,
                        requestType,
                        genericRulesAllowed,
                        badFilterRules
                    )) {
                    if (!result) {
                        result = [];
                    }
                    result.push(rule);
                }
            }
        }

        for (let i = 0; i < rules.length; i += 1) {
            const rule = rules[i];
            if (isFiltered(
                rule,
                url,
                referrerHost,
                thirdParty,
                requestType,
                genericRulesAllowed,
                badFilterRules
            )) {
                if (!result) {
                    result = [];
                }
                result.push(rule);
            }
        }

        return result;
    }

    /**
     * Iterates through matching rules and returns the first one with higher priority
     * @param rules Rules to check
     * @param url URL
     * @param referrerHost Referrer Host
     * @param thirdParty Is third-party request?
     * @param requestType Request type
     * @param genericRulesAllowed If true - generic rules are allowed
     * @param badFilterRules Link to the badFilterRules
     */
    function findFirstRule(rules, url, referrerHost, thirdParty, requestType, genericRulesAllowed, badFilterRules) {
        const matchingRules = filterRules(
            rules,
            url,
            referrerHost,
            thirdParty,
            requestType,
            genericRulesAllowed,
            badFilterRules
        );

        if (!matchingRules) {
            return null;
        }

        return matchingRules.reduce(isHigherPriority);
    }

    /**
     * Find all matching rules
     * @param rules Rules to check
     * @param url URL
     * @param referrerHost Referrer Host
     * @param thirdParty Is third-party request?
     * @param requestType Request type
     * @param genericRulesAllowed If true - generic rules are allowed
     * @param badFilterRules Link to the badFilterRules
     */
    function findAllRules(rules, url, referrerHost, thirdParty, requestType, genericRulesAllowed, badFilterRules) {
        return filterRules(rules, url, referrerHost, thirdParty, requestType, genericRulesAllowed, badFilterRules);
    }

    /**
     * Special lookup table
     */
    const UrlFilterRuleLookupTable = function () {
        this.shortcutsLookupTable = new api.ShortcutsLookupTable();
        this.domainsLookupTable = new api.DomainsLookupTable();
        this.rulesWithoutShortcuts = [];
    };

    UrlFilterRuleLookupTable.prototype = {
        /**
         * Adds rule to the table
         *
         * @param rule Rule to add
         */
        addRule(rule) {
            if (!this.shortcutsLookupTable.addRule(rule)) {
                if (!this.domainsLookupTable.addRule(rule)) {
                    this.rulesWithoutShortcuts.push(rule);
                }
            }
        },

        /**
         * Removes rule from the table
         *
         * @param rule Rule to remove
         */
        removeRule(rule) {
            this.shortcutsLookupTable.removeRule(rule);
            this.domainsLookupTable.removeRule(rule);
            adguard.utils.collections.removeRule(this.rulesWithoutShortcuts, rule);
        },

        /**
         * Clears rules
         */
        clearRules() {
            this.shortcutsLookupTable.clearRules();
            this.domainsLookupTable.clearRules();
            this.rulesWithoutShortcuts = [];
        },

        getRules() {
            let rules = [];

            rules = rules.concat(this.rulesWithoutShortcuts);
            rules = rules.concat(this.shortcutsLookupTable.getRules());
            rules = rules.concat(this.domainsLookupTable.getRules());

            return rules;
        },

        /**
         * Concat arrays with necessary checks
         *
         * @param rules
         * @param toAdd
         * @return {*|WordArray|Array|Buffer|any[]|string}
         */
        concatRules(rules, toAdd) {
            if (toAdd && toAdd.length > 0) {
                return rules.concat(toAdd);
            }

            return rules;
        },

        /**
         * Returns filtering rule if request is filtered or NULL if nothing found
         *
         * @param url                 Url to check
         * @param documentHost        Request document host
         * @param thirdParty          Is request third-party or not
         * @param requestType         Request type
         * @param genericRulesAllowed If true - generic rules are allowed
         * @param badFilterRules      Link to the bad filters
         * @return {object} First matching rule or null if no match found
         */
        findRule(url, documentHost, thirdParty, requestType, genericRulesAllowed, badFilterRules) {
            if (!url) {
                return null;
            }

            const urlLowerCase = url.toLowerCase();
            let matchedRules = [];

            // Check against rules with shortcuts
            let rules = this.shortcutsLookupTable.lookupRules(urlLowerCase);
            matchedRules = this.concatRules(matchedRules, rules);

            let hostToCheck = documentHost;
            // if document host is null, get host from url
            // thus we can find rules and check them using domain restriction later
            // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/1474
            if (hostToCheck === null) {
                hostToCheck = adguard.utils.url.getHost(url);
            } else if (requestType === adguard.RequestTypes.DOCUMENT) {
                // In case DOCUMENT request type look up rules for request url host
                // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/1534
                rules = this.domainsLookupTable.lookupRules(adguard.utils.url.getHost(url));
                matchedRules = this.concatRules(matchedRules, rules);
            }

            // Check against rules with domains
            rules = this.domainsLookupTable.lookupRules(hostToCheck);
            matchedRules = this.concatRules(matchedRules, rules);

            // Check against rules without shortcuts
            matchedRules = this.concatRules(matchedRules, this.rulesWithoutShortcuts);

            if (matchedRules.length > 0) {
                const rule = findFirstRule(
                    matchedRules,
                    url,
                    documentHost,
                    thirdParty,
                    requestType,
                    genericRulesAllowed,
                    badFilterRules
                );
                if (rule) {
                    return rule;
                }
            }

            return null;
        },

        /**
         * Returns filtering rules that match the passed parameters
         *
         * @param url                 Url to check
         * @param documentHost        Request document host
         * @param thirdParty          Is request third-party or not
         * @param requestType         Request type
         * @param badFilterRules      object with collection of bad filters
         * @return All matching rules or null if no match found
         */
        findRules(url, documentHost, thirdParty, requestType, badFilterRules) {
            if (!url) {
                return null;
            }

            let allRules = [];

            const urlLowerCase = url.toLowerCase();
            let rules = this.shortcutsLookupTable.lookupRules(urlLowerCase);
            if (rules) {
                allRules = allRules.concat(rules);
            }

            // if document host is null, get host from url
            // thus we can find rules and check this rules using domain restriction later
            // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/1474
            if (documentHost === null) {
                const urlHost = adguard.utils.url.getHost(url);
                rules = this.domainsLookupTable.lookupRules(urlHost);
                if (rules && rules.length > 0) {
                    allRules = allRules.concat(rules);
                }
            }

            rules = this.domainsLookupTable.lookupRules(documentHost);
            if (rules) {
                allRules = allRules.concat(rules);
            }

            allRules = allRules.concat(this.rulesWithoutShortcuts);

            if (allRules && allRules.length > 0) {
                return findAllRules(allRules, url, documentHost, thirdParty, requestType, true, badFilterRules);
            }

            return null;
        },
    };

    api.UrlFilterRuleLookupTable = UrlFilterRuleLookupTable;
})(adguard, adguard.rules);
