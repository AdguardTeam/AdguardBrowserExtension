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
        function findRedirectRules(url, documentHost, thirdParty, requestType) {
            const blockRules = redirectBlockFilter.findRule(
                url,
                documentHost,
                thirdParty,
                requestType,
                true
            );
            if (!blockRules || blockRules.length === 0) {
                return null;
            }

            const whiteRules = redirectWhiteFilter.findRules(
                url,
                documentHost,
                thirdParty,
                requestType
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

        function getSourceContent(rule) {
            if (rule && rule.redirect) {
                return redirects.getContent(rule.redirect);
            }
            return null;
        }

        function buildRedirectUrl(rule) {
            if (rule && rule.redirect) {
                const { redirect } = rule;
                const contentType = redirects.getContentType(redirect);
                const content = redirects.getContent(redirect);
                // FIXME [maximtop]
                //  - if contentType doesn't contain base64 then convert content to base64 string
                //  - check that all redirect sources work as expected
                return `data:${contentType},${content}`;
            }
            return null;
        }

        function getRedirectUrl(requestId) {
            const requestContext = adguard.requestContextStorage.get(requestId);
            if (!requestContext) {
                return false;
            }

            const {
                tab,
                requestUrl,
                referrerUrl,
                requestType,
            } = requestContext;

            const redirectRule = adguard.webRequestService.getRedirectRules(
                tab,
                requestUrl,
                referrerUrl,
                requestType
            );

            if (!redirectRule) {
                return null;
            }
            const redirectUrl = buildRedirectUrl(redirectRule);
            if (redirectUrl) {
                return redirectUrl;
            }
            return null;
        }

        return {
            setRedirectSources,
            getSource: getSourceContent,
            getRedirectUrl,
        };
    })();


    api.RedirectFilter = RedirectFilter;
    api.RedirectFilterService = RedirectFilterService;
})(adguard, adguard.rules);
