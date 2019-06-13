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

/* global adguard, Redirects */

(function (adguard, api) {
    'use strict';

    let redirects = {};

    /**
     * Filter for redirect filter rules
     * https://github.com/AdguardTeam/AdguardBrowserExtension/issues/1367
     */
    function RedirectFilter(rules) {
        const redirectWhiteFilter = new api.UrlFilterRuleLookupTable();
        const redirectBlockFilter = new api.UrlFilterRuleLookupTable();

        /**
         * Add rule to filter
         * @param rule Rule object
         */
        function addRule(rule) {
            if (rule.whiteListRule) {
                redirectWhiteFilter.addRule(rule);
            } else {
                redirectBlockFilter.addRule(rule);
            }
        }

        /**
         * Add rules to filter
         * @param rules Collection of rules
         */
        function addRules(rules) {
            rules.forEach((rule) => {
                addRule(rule);
            });
        }

        /**
         * Removes from filter
         * @param rule Rule to remove
         */
        function removeRule(rule) {
            if (rule.whiteListRule) {
                redirectWhiteFilter.removeRule(rule);
            } else {
                redirectBlockFilter.removeRule(rule);
            }
        }

        /**
         * All rules in filter
         *
         * @returns {*|Array.<T>|string|Buffer}
         */
        function getRules() {
            const rules = redirectBlockFilter.getRules();
            return rules.concat(redirectWhiteFilter.getRules());
        }

        /**
         * Searches for rules matching specified request.
         *
         * @param url           URL
         * @param documentHost  Document Host
         * @param thirdParty    true if request is third-party
         * @param requestType   Request content type
         * @returns             Matching rules
         */
        function findRedirectRules(url, documentHost, thirdParty, requestType, genericRulesAllowed) {
            const blockRules = redirectBlockFilter.findRule(
                url,
                documentHost,
                thirdParty,
                requestType,
                genericRulesAllowed
            );
            if (!blockRules || blockRules.length === 0) {
                return null;
            }

            const whiteRules = redirectWhiteFilter.findRules(
                url,
                documentHost,
                thirdParty,
                requestType,
                genericRulesAllowed
            );

            // TODO [maximtop] improve whitelist rules search
            if (!whiteRules || whiteRules.length === 0) {
                return blockRules;
            }
        }

        if (rules) {
            addRules(rules);
        }

        return {
            addRules,
            addRule,
            removeRule,
            getRules,
            findRedirectRules,
        };
    }

    const RedirectFilterService = (function RedirectFilterService() {
        function setRedirectSources(rawYaml) {
            redirects = new Redirects(rawYaml);
        }

        function buildRedirectUrl(rule) {
            if (!(rule && rule.redirect)) {
                return null;
            }

            const { redirect } = rule;
            let contentType = redirects.getContentType(redirect);
            let content = redirects.getContent(redirect);
            // if contentType does not include "base64" string we convert it to base64
            const base64 = 'base64';
            if (!contentType.includes(base64)) {
                content = window.btoa(content);
                contentType = `${contentType};${base64}`;
            }

            // FIXME [maximtop]
            //  - check that all redirect sources work as expected
            return `data:${contentType},${content}`;
        }

        return {
            setRedirectSources,
            buildRedirectUrl,
        };
    })();


    api.RedirectFilter = RedirectFilter;
    api.RedirectFilterService = RedirectFilterService;
})(adguard, adguard.rules);
