/**
 * This file is part of Adguard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * Adguard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Adguard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Adguard Browser Extension. If not, see <http://www.gnu.org/licenses/>.
 */

import * as TSUrlFilter from '@adguard/tsurlfilter';
import { engine } from './engine';
import { utils } from '../utils/common';
import { RequestTypes } from '../utils/request-types';
import { filteringLog } from './filtering-log';
import { localScriptRulesService } from './rules/local-script-rules';
import { cssService } from './services/css-service';
import { webRequestService } from './request-blocking';
import { browserUtils } from '../utils/browser-utils';

export const RequestFilter = (() => {
    /**
     * Request filter is main class which applies filter rules.
     *
     * @type {Function}
     */
    const RequestFilter = function () {};

    RequestFilter.prototype = {

        getRulesCount() {
            return engine.getRulesCount();
        },

        /**
         * An object with the information on the CSS and ExtendedCss stylesheets which
         * need to be injected into a web page.
         *
         * @typedef {Object} SelectorsData
         * @property {Array.<string>} css Regular CSS stylesheets
         * @property {Array.<string>} extendedCss ExtendedCSS stylesheets
         * @property {boolean} cssHitsCounterEnabled If true - collecting CSS rules hits stats
         * is enabled
         */

        /**
         * Builds CSS for the specified web page.
         * http://adguard.com/en/filterrules.html#hideRules
         *
         * @param {string} url Page URL
         * @param {number} options bitmask
         * @param {boolean} ignoreTraditionalCss flag
         * @param {boolean} ignoreExtCss flag
         * @returns {*} CSS and ExtCss data for the webpage
         */
        getSelectorsForUrl(url, options, ignoreTraditionalCss, ignoreExtCss) {
            const cosmeticResult = engine.getCosmeticResult(url, options);

            const elemhideCss = [...cosmeticResult.elementHiding.generic, ...cosmeticResult.elementHiding.specific];
            const injectCss = [...cosmeticResult.CSS.generic, ...cosmeticResult.CSS.specific];

            const elemhideExtCss = [
                ...cosmeticResult.elementHiding.genericExtCss,
                ...cosmeticResult.elementHiding.specificExtCss,
            ];
            const injectExtCss = [
                ...cosmeticResult.CSS.genericExtCss,
                ...cosmeticResult.CSS.specificExtCss,
            ];

            const collectingCosmeticRulesHits = webRequestService.isCollectingCosmeticRulesHits();
            if (collectingCosmeticRulesHits) {
                const styles = !ignoreTraditionalCss ? cssService.buildStyleSheetHits(elemhideCss, injectCss) : [];
                const extStyles = !ignoreExtCss ? cssService.buildStyleSheetHits(elemhideExtCss, injectExtCss) : [];
                return {
                    css: styles,
                    extendedCss: extStyles,
                };
            }

            const styles = !ignoreTraditionalCss ? cssService.buildStyleSheet(elemhideCss, injectCss, true) : [];
            const extStyles = !ignoreExtCss ? cssService.buildStyleSheet(elemhideExtCss, injectExtCss, false) : [];
            return {
                css: styles,
                extendedCss: extStyles,
            };
        },

        /**
         * Builds domain-specific JS injection for the specified page.
         * http://adguard.com/en/filterrules.html#javascriptInjection
         *
         * @param url Page URL
         * @param cosmeticOptions bitmask
         * @returns {CosmeticRule[]} Javascript for the specified URL
         */
        getScriptsForUrl(url, cosmeticOptions) {
            const cosmeticResult = engine.getCosmeticResult(url, cosmeticOptions);

            return cosmeticResult.getScriptRules();
        },

        /**
         * Builds the final output string for the specified page.
         * Depending on the browser we either allow or forbid the new remote rules
         * grep "localScriptRulesService" for details about script source
         *
         * @param {string} url Page URL
         * @param {Object} tab tab
         * @param cosmeticOptions bitmask
         * @returns {string} Script to be applied
         */
        getScriptsStringForUrl(url, tab, cosmeticOptions) {
            const debug = filteringLog && filteringLog.isOpen();
            const scriptRules = this.getScriptsForUrl(url, cosmeticOptions);

            const isFirefox = browserUtils.isFirefoxBrowser();

            const selectedScriptRules = scriptRules.filter((scriptRule) => {
                // Scriptlets should not be excluded for remote filters
                if (scriptRule.isScriptlet) {
                    return true;
                }

                // User rules should not be excluded from remote filters
                if (scriptRule.filterListId === utils.filters.USER_FILTER_ID) {
                    return true;
                }

                const isLocal = localScriptRulesService.isLocal(scriptRule.getText());

                if (isLocal) {
                    return true;
                }

                /* @if !remoteScripts */
                /**
                 * Note (!) (Firefox):
                 * In case of Firefox add-ons
                 * JS filtering rules are hardcoded into add-on code.
                 * Look at localScriptRulesService.isLocal to learn more.
                 * Commented instructions are preprocessed during compilation by webpack
                 */
                if (!isLocal && isFirefox) {
                    return false;
                }
                /* @endif */

                return true;
            });

            if (debug) {
                selectedScriptRules.forEach((scriptRule) => {
                    if (!scriptRule.isGeneric()) {
                        filteringLog.addScriptInjectionEvent({
                            tab,
                            frameUrl: url,
                            requestType: RequestTypes.DOCUMENT,
                            rule: scriptRule,
                            timestamp: Date.now(),
                        });
                    }
                });
            }

            const scripts = selectedScriptRules.map(scriptRule => scriptRule.getScript(debug));

            // remove repeating scripts
            const scriptsCode = [...new Set(scripts)].join('\r\n');

            return `
            (function () {
                try {
                    ${scriptsCode}
                } catch (ex) {
                    console.error('Error executing AG js: ' + ex);
                }
            })();
            `;
        },

        /**
         * Gets or creates matching result
         *
         * @param {MatchQuery} matchQuery - {@link MatchQuery}
         */
        getMatchingResult(matchQuery) {
            const result = engine.matchRequest(matchQuery);

            if (!result) {
                return new TSUrlFilter.MatchingResult([], null);
            }

            return result;
        },

        /**
         * Searches for the allowlist rule for the specified pair (url/referrer)
         *
         * @param {MatchQuery} matchQuery - {@link MatchQuery}
         *
         * @returns NetworkRule found or null
         */
        findAllowlistRule(matchQuery) {
            const result = this.getMatchingResult(matchQuery);

            const basicResult = result.getBasicResult();
            if (basicResult && basicResult.isAllowlist()) {
                return basicResult;
            }

            return null;
        },

        findDocumentRule(documentUrl) {
            return engine.matchFrame(documentUrl);
        },

        /**
         * Searches for stealth allowlist rule for the specified pair (url/referrer)
         *
         * @param {MatchQuery} matchQuery - {@link MatchQuery}
         *
         * @returns NetworkRule found or null
         */
        findStealthAllowlistRule(matchQuery) {
            const result = this.getMatchingResult(matchQuery);
            return result.stealthRule;
        },

        /**
         * Searches for the filter rule for the specified request.
         *
         * @param {MatchQuery} matchQuery - {@link MatchQuery}
         * @returns NetworkRule found or null
         */
        findRuleForRequest(matchQuery) {
            const result = this.getMatchingResult(matchQuery);
            return result.getBasicResult();
        },

        /**
         * Searches for content rules for the specified domain
         *
         * @param documentUrl Document URL
         * @returns CosmeticRule[] of content rules
         */
        getContentRulesForUrl(documentUrl) {
            // eslint-disable-next-line max-len
            const cosmeticResult = engine.getCosmeticResult(documentUrl, TSUrlFilter.CosmeticOption.CosmeticOptionHtml);

            return cosmeticResult.Html.getRules();
        },

        /**
         * Searches for CSP rules for the specified request
         *
         * @param {MatchQuery} matchQuery - {@link MatchQuery}
         * @returns NetworkRule[] of CSP rules for applying to the request or null
         */
        findCspRules(matchQuery) {
            const result = this.getMatchingResult(matchQuery);
            return result.getCspRules();
        },

        /**
         * Searches for replace modifier rules
         *
         * @param {MatchQuery} matchQuery - {@link MatchQuery}
         * @returns NetworkRule[] matching
         */
        findReplaceRules(matchQuery) {
            const result = this.getMatchingResult(matchQuery);
            return result.getReplaceRules();
        },

        /**
         * Searches for cookie rules matching specified request.
         *
         * @param {MatchQuery} matchQuery - {@link MatchQuery}
         * @returns NetworkRule[] matching
         */
        findCookieRules(matchQuery) {
            const result = this.getMatchingResult(matchQuery);
            return result.getCookieRules();
        },
    };

    return RequestFilter;
})();
