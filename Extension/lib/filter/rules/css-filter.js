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
     * This class manages CSS rules and builds styles to inject to pages.
     * ABP element hiding rules: http://adguard.com/en/filterrules.html#hideRules
     * CSS injection rules: http://adguard.com/en/filterrules.html#cssInjection
     */
    const CssFilter = function (rules) {
        this.commonCss = null;
        this.commonCssHits = null;
        this.commonRules = [];
        this.domainSensitiveRules = [];
        this.extendedCssRules = [];
        this.exceptionRules = [];
        this.dirty = false;

        if (rules) {
            for (let i = 0; i < rules.length; i += 1) {
                this.addRule(rules[i]);
            }
        }
    };

    // Bitmask to be used in CssFilter#_filterRules and Cssfilter#buildCss calls.
    const RETRIEVE_TRADITIONAL_CSS = CssFilter.RETRIEVE_TRADITIONAL_CSS = 1 << 0;
    const RETRIEVE_EXTCSS = CssFilter.RETRIEVE_EXTCSS = 1 << 1;
    const GENERIC_HIDE_APPLIED = CssFilter.GENERIC_HIDE_APPLIED = 1 << 2;
    const CSS_INJECTION_ONLY = CssFilter.CSS_INJECTION_ONLY = 1 << 3;

    CssFilter.prototype = {

        /**
         * Adds rule to CssFilter
         *
         * @param rule Rule to add
         */
        addRule(rule) {
            if (rule.whiteListRule) {
                this.exceptionRules.push(rule);
            } else if (rule.extendedCss) {
                this.extendedCssRules.push(rule);
            } else if (rule.isDomainSensitive()) {
                this.domainSensitiveRules.push(rule);
            } else {
                this.commonRules.push(rule);
            }

            this.dirty = true;
        },

        /**
         * Removes rule from the CssFilter
         *
         * @param rule Rule to remove
         */
        removeRule(rule) {
            const { ruleText } = rule;

            this.exceptionRules = this.exceptionRules.filter((r) => {
                return r.ruleText !== ruleText;
            });
            this.extendedCssRules = this.extendedCssRules.filter((r) => {
                return r.ruleText !== ruleText;
            });
            this.domainSensitiveRules = this.domainSensitiveRules.filter((r) => {
                return r.ruleText !== ruleText;
            });
            this.commonRules = this.commonRules.filter((r) => {
                return r.ruleText !== ruleText;
            });

            this._rollbackExceptionRule(rule);

            this.dirty = true;
        },

        /**
         * Returns the array of loaded rules
         */
        getRules() {
            return []
                .concat(this.commonRules)
                .concat(this.domainSensitiveRules)
                .concat(this.exceptionRules)
                .concat(this.extendedCssRules);
        },

        /**
         * An object with the information on the CSS and ExtendedCss stylesheets which
         * need to be injected into a web page.
         *
         * @typedef {Object} CssFilterBuildResult
         * @property {Array.<string>} css Regular CSS stylesheets
         * @property {Array.<string>} extendedCss ExtendedCSS stylesheets
         */

        /**
         * Builds CSS to be injected to the page.
         * This method builds CSS for element hiding rules only:
         * http://adguard.com/en/filterrules.html#hideRules
         *
         * @param domainName    Domain name
         * @param options       CssFilter Bitmask
         * @returns {CssFilterBuildResult} CSS and ExtCss stylesheets
         */
        buildCss(domainName, options) {
            if (typeof options === 'undefined') {
                options = RETRIEVE_TRADITIONAL_CSS + RETRIEVE_EXTCSS;
            }

            const cssInjectionOnly = (options & CSS_INJECTION_ONLY) === CSS_INJECTION_ONLY;
            const genericHide = (options & GENERIC_HIDE_APPLIED) === GENERIC_HIDE_APPLIED;
            const retrieveTraditionalCss = (options & RETRIEVE_TRADITIONAL_CSS) === RETRIEVE_TRADITIONAL_CSS;

            if (cssInjectionOnly) {
                this._rebuildBinding();
            } else {
                this._rebuild();
            }

            const filteredRules = this._filterRules(domainName, options);
            const stylesheets = this._createCssStylesheets(filteredRules);

            // ExtCss rules are not contained in commonRules
            if (!genericHide && retrieveTraditionalCss) {
                const commonCss = this._getCommonCss(cssInjectionOnly);
                Array.prototype.unshift.apply(stylesheets.css, commonCss);
            }

            return stylesheets;
        },

        /**
         * Builds CSS to be injected to the page.
         * If user has enabled "Send statistics for ad filters usage" option we build CSS with enabled hits stats.
         * In this case style contains "content" attribute with filter identifier and rule text.
         * Parsing this attributes shows us which rule has been used.
         *
         * @param domainName    Domain name
         * @param options CssFilter bitmask
         * @returns {CssFilterBuildResult} CSS and ExtCss stylesheets
         */
        buildCssHits(domainName, options) {
            this._rebuildHits();

            if (typeof options === 'undefined') {
                options = RETRIEVE_TRADITIONAL_CSS + RETRIEVE_EXTCSS;
            }

            const rules = this._filterRules(domainName, options);

            const genericHide = (options & GENERIC_HIDE_APPLIED) === GENERIC_HIDE_APPLIED;
            const retrieveTraditionalCss = (options & RETRIEVE_TRADITIONAL_CSS) === RETRIEVE_TRADITIONAL_CSS;

            const stylesheets = this._createCssStylesheetsHits(rules);
            if (!genericHide && retrieveTraditionalCss) {
                stylesheets.css = this._getCommonCssHits().concat(stylesheets.css);
            }

            return stylesheets;
        },

        /**
         * Filters rules with specified parameters
         *
         * @param domainName
         * @param options CssFilter bitmask
         * @returns {*}
         * @private
         */
        _filterRules(domainName, options) {
            let rules = [];

            const retrieveTraditionalCss = (options & RETRIEVE_TRADITIONAL_CSS) === RETRIEVE_TRADITIONAL_CSS;
            const retrieveExtCss = (options & RETRIEVE_EXTCSS) === RETRIEVE_EXTCSS;
            const genericHide = (options & GENERIC_HIDE_APPLIED) === GENERIC_HIDE_APPLIED;
            const cssInjectionOnly = (options & CSS_INJECTION_ONLY) === CSS_INJECTION_ONLY;

            if (!domainName) {
                return rules;
            }

            if (retrieveTraditionalCss && this.domainSensitiveRules !== null) {
                const filteredDomainSensitiveRules = this.domainSensitiveRules.filter((rule) => {
                    if (rule.isPermitted(domainName)) {
                        if (genericHide && rule.isGeneric()) {
                            return false;
                        }
                        if (cssInjectionOnly && !rule.isInjectRule) {
                            return false;
                        }
                        return true;
                    }
                    return false;
                });
                rules = rules.concat(filteredDomainSensitiveRules);
            }

            if (retrieveExtCss && this.extendedCssRules !== null) {
                const filteredExtendedCssRules = this.extendedCssRules.filter((rule) => {
                    if (rule.isPermitted(domainName)) {
                        if (genericHide && rule.isGeneric()) {
                            return false;
                        }
                        return true;
                    }
                    return false;
                });
                rules = rules.concat(filteredExtendedCssRules);
            }

            return rules;
        },

        /**
         * Creates separated stylesheet for css and extended css rules.
         *
         * @param rules
         * @returns {{css: (*|*[]), extendedCss: (*|*[])}}
         * @private
         */
        _createCssStylesheets(rules) {
            const extendedCssRules = rules.filter((rule) => {
                return rule.extendedCss;
            });

            const cssRules = rules.filter((rule) => {
                return !rule.extendedCss;
            });

            return {
                css: this._buildCssByRules(cssRules),
                extendedCss: this._buildCssByRules(extendedCssRules),
            };
        },

        /**
         * Creates separated stylesheet for css and extended css rules.
         *
         * @param rules
         * @returns {{css: (*|List), extendedCss: (*|List)}}
         * @private
         */
        _createCssStylesheetsHits(rules) {
            const extendedCssRules = rules.filter((rule) => {
                return rule.extendedCss;
            });

            const cssRules = rules.filter((rule) => {
                return !rule.extendedCss;
            });

            return {
                css: this._buildCssByRulesHits(cssRules),
                extendedCss: this._buildCssByRulesHits(extendedCssRules),
            };
        },

        /**
         * Rebuilds CSS stylesheets if CssFilter is "dirty" (has some changes which are not applied yet).
         *
         * @private
         */
        _rebuild() {
            if (!this.dirty) {
                return;
            }
            this._applyExceptionRules();
            this.commonCss = this._buildCssByRules(this.commonRules);
            this.commonCssHits = null;
            this.dirty = false;
        },

        /**
         * Rebuilds CSS with hits stylesheet if CssFilter is "dirty" (has some changes which are not applied yet).
         *
         * If user has enabled "Send statistics for ad filters usage" option we build CSS with enabled hits stats.
         *
         * @private
         */
        _rebuildHits() {
            if (!this.dirty) {
                return;
            }
            this._applyExceptionRules();
            this.commonCssHits = this._buildCssByRulesHits(this.commonRules);
            this.commonCss = null;
            this.dirty = false;
        },

        /**
         * Rebuilds CSS filter.
         *
         * This method is used in Firefox if user has enabled "Send statistics for ad filters usage" option.
         * In this case we don't need commonCss and commonCssHits strings.
         * We just register browser-wide stylesheet which is stored in file.
         *
         * @private
         */
        _rebuildBinding() {
            if (!this.dirty) {
                return;
            }
            this._applyExceptionRules();
            this.commonCss = null;
            this.commonCssHits = null;
            this.dirty = false;
        },

        /**
         * Applies rules from exceptions map to rule lists
         * @private
         * @param rulesList
         * @param exceptionRulesMap
         */
        applyExceptionsToRules(rulesList, exceptionRulesMap) {
            const resultRulesList = [];
            for (let i = 0; i < rulesList.length; i += 1) {
                const rule = rulesList[i];
                const exceptionRules = exceptionRulesMap[rule.cssSelector];
                if (exceptionRules) {
                    let updatedRule = rule;
                    for (let j = 0; j < exceptionRules.length; j += 1) {
                        updatedRule = this._applyExceptionRule(updatedRule, exceptionRules[j]);
                        if (!updatedRule) {
                            break;
                        }
                    }
                    if (updatedRule) {
                        resultRulesList.push(updatedRule);
                    }
                } else {
                    resultRulesList.push(rule);
                }
            }

            return resultRulesList;
        },
        /**
         * Applies exception rules
         *
         * Read here for details:
         * http://adguard.com/en/filterrules.html#hideRulesExceptions
         * http://adguard.com/en/filterrules.html#cssInjectionExceptions
         * @private
         */
        _applyExceptionRules() {
            const exceptionRulesMap = this._arrayToMap(this.exceptionRules, 'cssSelector');

            this.domainSensitiveRules = this.applyExceptionsToRules(
                this.domainSensitiveRules,
                exceptionRulesMap
            );

            this.extendedCssRules = this.applyExceptionsToRules(
                this.extendedCssRules,
                exceptionRulesMap
            );

            const newDomainSensitiveRules = [];

            for (let i = 0; i < this.commonRules.length; i += 1) {
                const rule = this.commonRules[i];
                const exceptionRules = exceptionRulesMap[rule.cssSelector];
                if (exceptionRules) {
                    let updatedRule = rule;
                    for (let j = 0; j < exceptionRules.length; j += 1) {
                        updatedRule = this._applyExceptionRule(updatedRule, exceptionRules[j]);
                        if (!updatedRule) {
                            break;
                        }
                    }
                    if (updatedRule) {
                        this.commonRules.splice(i, 1, updatedRule);
                        if (updatedRule.isDomainSensitive()) {
                            // Rule has become domain sensitive.
                            // We should remove it from common rules and add to domain sensitive.
                            newDomainSensitiveRules.push(updatedRule);
                        }
                    } else {
                        this.commonRules.splice(i, 1);
                    }
                }
            }

            const newDomainSensitiveRulesMap = this._arrayToMap(newDomainSensitiveRules, 'ruleText');

            this.domainSensitiveRules = this.domainSensitiveRules.concat(newDomainSensitiveRules);
            // Remove new domain sensitive rules from common rules
            this.commonRules = this.commonRules.filter((el) => {
                return !(el.ruleText in newDomainSensitiveRulesMap);
            });
        },

        /**
         * Applies exception rule to the specified common rule.
         * Common means that this rule does not have $domain option.
         *
         * @param commonRule - Rule object
         * @param exceptionRule - Exception rule object
         * @returns {object | null} - updated rule or null if rule was excluded by generic allowlist rule e.g. "#@#h1"
         * @private
         */
        _applyExceptionRule(commonRule, exceptionRule) {
            if (commonRule.cssSelector !== exceptionRule.cssSelector) {
                return commonRule;
            }

            if (exceptionRule.isGeneric()) {
                return null;
            }

            const permittedDomains = exceptionRule.getPermittedDomains();
            if (permittedDomains && permittedDomains.length > 0) {
                commonRule.addRestrictedDomains(permittedDomains);
                return commonRule;
            }

            return commonRule;
        },

        /**
         * Getter for commonCss field.
         * Lazy-initializes commonCss field if needed.
         *
         * @param {boolean} cssInjectOnly
         * @returns Common CSS stylesheet content
         * @private
         */
        _getCommonCss(cssInjectOnly = false) {
            if (cssInjectOnly) {
                const injectRules = this.commonRules.filter(rule => rule.isInjectRule);
                return this._buildCssByRules(injectRules);
            }

            if (this.commonCss === null || this.commonCss.length === 0) {
                this.commonCss = this._buildCssByRules(this.commonRules);
            }
            return this.commonCss;
        },

        /**
         * Getter for commonCssHits field.
         * Lazy-initializes commonCssHits field if needed.
         *
         * @private
         */
        _getCommonCssHits() {
            if (this.commonCssHits === null || this.commonCssHits.length === 0) {
                this.commonCssHits = this._buildCssByRulesHits(this.commonRules);
            }
            return this.commonCssHits;
        },

        /**
         * @deprecated (we rebuild request filter every time rule is added)
         * Rolls back exception rule (used if this exception rule is removed from the user filter)
         *
         * @param exceptionRule Exception rule to roll back
         * @private
         */
        _rollbackExceptionRule(exceptionRule) {
            if (!exceptionRule.whiteListRule) {
                return;
            }

            const newCommonRules = [];
            let i; let
                rule;

            for (i = 0; i < this.domainSensitiveRules.length; i += 1) {
                rule = this.domainSensitiveRules[i];
                if (rule.cssSelector === exceptionRule.cssSelector) {
                    rule.removeRestrictedDomains(exceptionRule.getPermittedDomains());
                    if (!rule.isDomainSensitive()) {
                        // Rule has become common.
                        // We should remove it from domain sensitive rules and add to common.
                        newCommonRules.push(rule);
                    }
                }
            }

            for (i = 0; i < this.extendedCssRules.length; i += 1) {
                rule = this.extendedCssRules[i];
                if (rule.cssSelector === exceptionRule.cssSelector) {
                    rule.removeRestrictedDomains(exceptionRule.getPermittedDomains());
                }
            }

            this.commonRules = this.commonRules.concat(newCommonRules);

            // Remove new common rules from  domain sensitive rules
            const newCommonRulesMap = this._arrayToMap(newCommonRules, 'ruleText');
            this.domainSensitiveRules = this.domainSensitiveRules.filter((el) => {
                return !(el.ruleText in newCommonRulesMap);
            });
        },

        /**
         * Builds CSS to be injected
         *
         * @param rules     List of rules
         * @returns {Array<string>} of CSS stylesheets
         * @private
         */
        _buildCssByRules(rules) {
            const CSS_SELECTORS_PER_LINE = 50;
            const ELEMHIDE_CSS_STYLE = ' { display: none!important; }\r\n';

            let selectorsCount = 0;
            const elemHideSb = [];
            const cssSb = [];

            for (let i = 0; i < rules.length; i += 1) {
                const rule = rules[i];

                if (rule.isInjectRule) {
                    cssSb.push(this._getRuleCssSelector(rule));
                } else {
                    elemHideSb.push(this._getRuleCssSelector(rule));
                    ++selectorsCount;
                    if (selectorsCount % CSS_SELECTORS_PER_LINE === 0 || rule.extendedCss) {
                        elemHideSb.push(ELEMHIDE_CSS_STYLE);
                    } else {
                        elemHideSb.push(', ');
                    }
                }
            }

            if (elemHideSb.length > 0) {
                // Last element should always be a style (it will replace either a comma or the same style)
                elemHideSb[elemHideSb.length - 1] = ELEMHIDE_CSS_STYLE;
            }

            const styles = [];
            const elemHideStyle = elemHideSb.join('');
            const cssStyle = cssSb.join('\r\n');

            if (elemHideStyle) {
                styles.push(elemHideStyle);
            }

            if (cssStyle) {
                styles.push(cssStyle);
            }

            return styles;
        },

        /**
         * Patch rule selector adding adguard mark and rule info in the content attribute
         * Example:
         * .selector { color: red } -> .selector { color: red, content: 'adguard{filterId};{ruleText} !important;}
         * @param rule
         * @returns {String}
         */
        _addMarkerToInjectRule(rule) {
            const INJECT_HIT_START = " content: 'adguard";
            const HIT_SEP = encodeURIComponent(';');
            const HIT_END = "' !important;}\r\n";

            const result = [];
            const ruleText = this._getRuleCssSelector(rule);
            // if rule text has content attribute we don't add rule marker
            const contentAttributeRegex = /[{;"(]\s*content\s*:/gi;
            if (contentAttributeRegex.test(ruleText)) {
                return ruleText;
            }
            // remove closing brace
            const ruleTextWithoutCloseBrace = ruleText.slice(0, -1).trim();
            // check semicolon
            const ruleTextWithSemicolon = adguard.utils.strings.endsWith(ruleTextWithoutCloseBrace, ';')
                ? ruleTextWithoutCloseBrace
                : `${ruleTextWithoutCloseBrace};`;
            result.push(ruleTextWithSemicolon);
            result.push(INJECT_HIT_START);
            result.push(rule.filterId);
            result.push(HIT_SEP);
            result.push(api.FilterRule.escapeRule(rule.ruleText));
            result.push(HIT_END);
            return result.join('');
        },

        /**
         * Patch rule selector adding adguard mark rule info in the content attribute
         * Example:
         * .selector -> .selector { content: 'adguard{filterId};{ruleText} !important;}
         * @param rule
         * @returns {String}
         */
        _addMarkerToElemhideRule(rule) {
            const ELEMHIDE_HIT_START = " { display: none!important; content: 'adguard";
            const HIT_SEP = encodeURIComponent(';');
            const HIT_END = "' !important;}\r\n";

            const result = [];
            result.push(this._getRuleCssSelector(rule));
            result.push(ELEMHIDE_HIT_START);
            result.push(rule.filterId);
            result.push(HIT_SEP);
            result.push(api.FilterRule.escapeRule(rule.ruleText));
            result.push(HIT_END);
            return result.join('');
        },

        /**
         * Builds CSS with content style to be injected.
         * This method is used if user has enabled "Send statistics for ad filters usage" option and/or
         * if filtering log window is open
         * Parsing css 'content' attribute allows us to track rule hits.
         *
         * @param rules List of rules
         * @returns List of CSS stylesheets
         * @private
         */
        _buildCssByRulesHits(rules) {
            const styles = [];
            for (let i = 0; i < rules.length; i += 1) {
                const rule = rules[i];
                if (rule.isInjectRule) {
                    styles.push(this._addMarkerToInjectRule(rule));
                } else {
                    styles.push(this._addMarkerToElemhideRule(rule));
                }
            }
            return styles;
        },

        _getRuleCssSelector(rule) {
            return rule.cssSelector;
        },

        _arrayToMap(array, prop) {
            const map = Object.create(null);
            for (let i = 0; i < array.length; i += 1) {
                const el = array[i];
                const property = el[prop];
                if (!(property in map)) {
                    map[property] = [];
                }
                map[property].push(el);
            }
            return map;
        },
    };

    api.CssFilter = CssFilter;
})(adguard, adguard.rules);
