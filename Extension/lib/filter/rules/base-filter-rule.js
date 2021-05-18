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
     * Base class for all filter rules
     */
    const FilterRule = function (text, filterId) {
        this.ruleText = text;
        this.filterId = filterId;
    };

    FilterRule.prototype = {

        /**
         * Loads $domain option.
         * http://adguard.com/en/filterrules.html#hideRulesDomainRestrictions
         * http://adguard.com/en/filterrules.html#advanced
         *
         * @param domains List of domains. Examples: "example.com|test.com" or "example.com,test.com"
         */
        loadDomains(domains) {
            if (adguard.utils.strings.isEmpty(domains)) {
                return;
            }

            let permittedDomains = null;
            let restrictedDomains = null;

            const parts = domains.split(/[,|]/);

            for (let i = 0; i < parts.length; i += 1) {
                const domain = parts[i];
                let domainName;
                if (domain.trim().length === 0) {
                    // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/1242
                    throw `Error load $domain options from "${domains}", because after split one of them is empty`;
                }
                if (adguard.utils.strings.startWith(domain, '~')) {
                    domainName = adguard.utils.url.toPunyCode(domain.substring(1).trim());
                    if (!adguard.utils.strings.isEmpty(domainName)) {
                        if (restrictedDomains === null) {
                            restrictedDomains = [];
                        }
                        restrictedDomains.push(domainName);
                    }
                } else {
                    domainName = adguard.utils.url.toPunyCode(domain.trim());
                    if (!adguard.utils.strings.isEmpty(domainName)) {
                        if (permittedDomains === null) {
                            permittedDomains = [];
                        }
                        permittedDomains.push(domainName);
                    }
                }
            }

            this.setPermittedDomains(permittedDomains);
            this.setRestrictedDomains(restrictedDomains);
        },

        getPermittedDomains() {
            if (this.permittedDomain) {
                return [this.permittedDomain];
            }
            return this.permittedDomains;
        },

        getRestrictedDomains() {
            if (this.restrictedDomain) {
                return [this.restrictedDomain];
            }
            return this.restrictedDomains;
        },

        setPermittedDomains(permittedDomains) {
            if (!permittedDomains || permittedDomains.length === 0) {
                delete this.permittedDomain;
                delete this.permittedDomains;
                return;
            }
            if (permittedDomains.length > 1) {
                this.permittedDomains = permittedDomains;
                delete this.permittedDomain;
            } else {
                this.permittedDomain = permittedDomains[0];
                delete this.permittedDomains;
            }
        },

        setRestrictedDomains(restrictedDomains) {
            if (!restrictedDomains || restrictedDomains.length === 0) {
                delete this.restrictedDomain;
                delete this.restrictedDomains;
                return;
            }
            if (restrictedDomains.length > 1) {
                this.restrictedDomains = restrictedDomains;
                delete this.restrictedDomain;
            } else {
                this.restrictedDomain = restrictedDomains[0];
                delete this.restrictedDomains;
            }
        },

        /**
         * Checks if rule is domain-sensitive
         * @returns boolean true if $domain option is present. Otherwise false.
         */
        isDomainSensitive() {
            return this.hasRestrictedDomains() || this.hasPermittedDomains();
        },

        /**
         * Checks whether this rule is generic or domain specific
         * @returns boolean true if rule is generic, otherwise false
         */
        isGeneric() {
            if (!this.hasPermittedDomains()) {
                return true;
            }
            return this.getPermittedDomains().some(domain => domain === FilterRule.WILDCARD_MARK);
        },

        /**
         * @returns boolean true if rule has permitted domains
         */
        hasPermittedDomains() {
            return (this.permittedDomain || (this.permittedDomains && this.permittedDomains.length > 0));
        },

        /**
         * @returns boolean true if rule has restricted domains
         */
        hasRestrictedDomains() {
            return (this.restrictedDomain
                || (this.restrictedDomains && this.restrictedDomains.length > 0));
        },

        isRestricted(domainName) {
            if (!domainName) { return false; }
            const restrictedDomains = this.getRestrictedDomains();
            if (restrictedDomains) {
                return adguard.utils.url.isDomainOrSubDomainOfAny(
                    domainName,
                    restrictedDomains
                );
            }
            return false;
        },

        /**
         * Checks if rule could be applied to the specified domain name
         *
         * @param domainName Domain name
         * @returns boolean true if rule is permitted
         */
        isPermitted(domainName) {
            if (!domainName) { return false; }

            if (this.isRestricted(domainName)) {
                return false;
            }

            const permittedDomains = this.getPermittedDomains();
            if (permittedDomains) {
                return adguard.utils.url.isDomainOrSubDomainOfAny(
                    domainName,
                    permittedDomains
                );
            }

            return true;
        },

        /**
         * Checks if rule is domain specific for provided domain
         * @param {string} domainName
         * @return {boolean}
         */
        isDomainSpecific(domainName) {
            if (!domainName) {
                return false;
            }
            const permitted = this.getPermittedDomains() || [];
            const restricted = this.getRestrictedDomains() || [];

            return adguard.utils.url.isDomainOrSubDomainOfAny(
                domainName,
                [...permitted, ...restricted]
            );
        },

        /**
         * Adds restricted domains
         *
         * @param domains List of domains
         */
        addRestrictedDomains(domains) {
            if (!domains || !domains.length) {
                return;
            }
            let restrictedDomains = this.getRestrictedDomains();
            restrictedDomains = adguard.utils.collections.removeDuplicates((restrictedDomains || []).concat(domains));
            this.setRestrictedDomains(restrictedDomains);
        },

        /**
         * Removes restricted domains
         *
         * @param domains List of domains
         */
        removeRestrictedDomains(domains) {
            if (domains) {
                const restrictedDomains = this.getRestrictedDomains();
                for (let i = 0; i < domains.length; i++) {
                    adguard.utils.collections.remove(restrictedDomains, domains[i]);
                }
                this.setRestrictedDomains(restrictedDomains);
            }
        },
    };

    var stringUtils = adguard.utils.strings;

    /**
     * Finds CSS rule marker in the rule text
     *
     * @param ruleText        rule text to check
     * @param markers         a list of markers to check (IMPORTANT: sorted by length desc)
     * @param firstMarkerChar first character of the marker we're looking for
     * @return rule marker found
     */
    FilterRule.findRuleMarker = function (ruleText, markers, firstMarkerChar) {
        const startIndex = ruleText.indexOf(firstMarkerChar);
        if (startIndex === -1) {
            return null;
        }

        for (let i = 0; i < markers.length; i += 1) {
            const marker = markers[i];
            if (stringUtils.startsAtIndexWith(ruleText, startIndex, marker)) {
                return marker;
            }
        }

        return null;
    };

    /**
     * urlencodes rule text.
     * We need this function because of this issue:
     * https://github.com/AdguardTeam/AdguardBrowserExtension/issues/34
     * and
     * https://github.com/AdguardTeam/AdguardBrowserExtension/issues/1079
     */
    FilterRule.escapeRule = function (ruleText) {
        return encodeURIComponent(ruleText)
            .replace(/['()]/g, match => ({ "'": '%27', '(': '%28', ')': '%29' }[match]));
    };

    FilterRule.PARAMETER_START = '[';
    FilterRule.PARAMETER_END = ']';
    FilterRule.MASK_WHITE_LIST = '@@';
    FilterRule.MASK_CSS_RULE = '##';
    FilterRule.MASK_CSS_EXCEPTION_RULE = '#@#';
    FilterRule.MASK_CSS_INJECT_RULE = '#$#';
    FilterRule.MASK_CSS_EXCEPTION_INJECT_RULE = '#@$#';
    FilterRule.MASK_CSS_EXTENDED_CSS_RULE = '#?#';
    FilterRule.MASK_CSS_EXCEPTION_EXTENDED_CSS_RULE = '#@?#';
    FilterRule.MASK_CSS_INJECT_EXTENDED_CSS_RULE = '#$?#';
    FilterRule.MASK_CSS_EXCEPTION_INJECT_EXTENDED_CSS_RULE = '#@$?#';
    FilterRule.MASK_SCRIPT_RULE = '#%#';
    FilterRule.MASK_SCRIPT_EXCEPTION_RULE = '#@%#';
    FilterRule.MASK_CONTENT_RULE = '$$';
    FilterRule.MASK_CONTENT_EXCEPTION_RULE = '$@$';
    FilterRule.MASK_BANNER_RULE = '++';
    FilterRule.MASK_CONFIGURATION_RULE = '~~';
    FilterRule.COMMENT = '!';
    FilterRule.EQUAL = '=';
    FilterRule.COMA_DELIMITER = ',';
    FilterRule.LINE_DELIMITER = '|';
    FilterRule.NOT_MARK = '~';
    FilterRule.WILDCARD_MARK = '*';

    api.FilterRule = FilterRule;
})(adguard, adguard.rules);
