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
/* global require, exports */
/**
 * Safari content blocking format rules converter.
 */
var CONVERTER_VERSION = '1.3.22';
// Max number of CSS selectors per rule (look at _compactCssRules function)
var MAX_SELECTORS_PER_WIDE_RULE = 250;
var ANY_URL_TEMPLATES = ['||*', '', '*'];
var URL_FILTER_ANY_URL = ".*";
// Improved regular expression instead of UrlFilterRule.REGEXP_START_URL
var URL_FILTER_REGEXP_START_URL = "^https?://([^/]*\\.)?";
// Simplified separator (to fix an issue with $ restriction - it can be only in the end of regexp)
var URL_FILTER_REGEXP_SEPARATOR = "[/:&?]?";

var SimpleRegex = require('filter/rules/simple-regex').SimpleRegex;
var FilterRule = require('filter/rules/base-filter-rule').FilterRule; // jshint ignore:line
var FilterRuleBuilder = require('filter/rules/filter-rule-builder').FilterRuleBuilder;
var CssFilterRule = require('filter/rules/css-filter-rule').CssFilterRule;
var UrlFilterRule = require('filter/rules/url-filter-rule').UrlFilterRule;
var ScriptFilterRule = require('filter/rules/script-filter-rule').ScriptFilterRule;
var StringUtils = require('utils/common').StringUtils;
var Log = require('utils/log').Log;
var UrlUtils = require('utils/url').UrlUtils;

exports.SafariContentBlockerConverter = {

    AGRuleConverter: {

        _parseDomains: function (rule, included, excluded) {
            var domain, domains, iDomains;

            if (rule.permittedDomain) {
                domain = UrlUtils.toPunyCode(rule.permittedDomain.toLowerCase());
                included.push(domain);
            } else if (rule.permittedDomains) {
                domains = rule.permittedDomains;
                iDomains = domains.length;

                while (iDomains--) {
                    if (domains[iDomains] !== "") {
                        domain = domains[iDomains];
                        domain = UrlUtils.toPunyCode(domain.toLowerCase());
                        included.push(domain);
                    }
                }
            }

            if (rule.restrictedDomain) {
                domain = UrlUtils.toPunyCode(rule.restrictedDomain.toLowerCase());
                excluded.push(domain);
            } else if (rule.restrictedDomains) {
                domains = rule.restrictedDomains;
                iDomains = domains.length;
                while (iDomains--) {
                    domain = domains[iDomains];
                    if (domain) {
                        domain = UrlUtils.toPunyCode(domain.toLowerCase());
                        excluded.push(domain);
                    }
                }
            }

        },

        /**
         * Adds load-type specification
         */
        _addThirdParty: function (trigger, rule) {
            if (rule.checkThirdParty) {
                trigger["load-type"] = rule.isThirdParty ? ["third-party"] : ["first-party"];
            }
        },

        _addMatchCase: function (trigger, rule) {
            if (rule.matchCase !== null && rule.matchCase) {
                trigger["url-filter-is-case-sensitive"] = true;
            }
        },

        _writeDomainOptions: function (included, excluded, trigger) {
            if (included.length > 0 && excluded.length > 0) {
                throw new Error('Safari does not support both permitted and restricted domains');
            }

            if (included.length > 0) {
                trigger["if-domain"] = included;
            }
            if (excluded.length > 0) {
                trigger["unless-domain"] = excluded;
            }
        },

        _addDomainOptions: function (trigger, rule) {
            var included = [];
            var excluded = [];
            this._parseDomains(rule, included, excluded);
            this._writeDomainOptions(included, excluded, trigger);
        },

        _setWhiteList: function (rule, result) {
            if (rule.whiteListRule && rule.whiteListRule === true) {
                result.action.type = "ignore-previous-rules";
            }
        },

        _hasContentType: function(rule, contentType) {
            return (rule.permittedContentType & contentType) && // jshint ignore:line
                !(rule.restrictedContentType & contentType); // jshint ignore:line
        },

        _isContentType: function(rule, contentType) {
            return rule.permittedContentType == contentType;
        },

        _addResourceType: function (rule, result) {
            var types = [];

            if (this._isContentType(rule, UrlFilterRule.contentTypes.ALL) &&
                rule.restrictedContentType === 0) {
                // Safari does not support all other default content types, like subdocument etc.
                // So we can use default safari content types instead.
                return;
            }
            if (this._hasContentType(rule, UrlFilterRule.contentTypes.IMAGE)) {
                types.push("image");                
            }
            if (this._hasContentType(rule, UrlFilterRule.contentTypes.STYLESHEET)) {
                types.push("style-sheet");                
            }
            if (this._hasContentType(rule, UrlFilterRule.contentTypes.SCRIPT)) {
                types.push("script");                
            }
            if (this._hasContentType(rule, UrlFilterRule.contentTypes.MEDIA)) {
                types.push("media");                
            }
            if (this._hasContentType(rule, UrlFilterRule.contentTypes.XMLHTTPREQUEST) ||
                this._hasContentType(rule, UrlFilterRule.contentTypes.OTHER) ||
                this._hasContentType(rule, UrlFilterRule.contentTypes.WEBSOCKET)) {
                types.push("raw");
            }
            if (this._hasContentType(rule, UrlFilterRule.contentTypes.FONT)) {
                types.push("font");                
            }
            if (this._hasContentType(rule, UrlFilterRule.contentTypes.SUBDOCUMENT)) {
                types.push("document");
            }
            if (this._hasContentType(rule, UrlFilterRule.contentTypes.POPUP)) {
                // Ignore other in case of $popup modifier
                types = [ "popup" ];
            }

            // Not supported modificators
            if (this._isContentType(rule, UrlFilterRule.contentTypes.OBJECT)) {
                throw new Error('Object content type is not yet supported');
            }
            if (this._isContentType(rule, UrlFilterRule.contentTypes['OBJECT-SUBREQUEST'])) {
                throw new Error('Object_subrequest content type is not yet supported');
            }

            if (this._isContentType(rule, UrlFilterRule.contentTypes.JSINJECT)) {
                throw new Error('$jsinject rules are ignored.');
            }

            if (types.length > 0) {
                result.trigger["resource-type"] = types;
            }

            //TODO: Add restricted content types?
        },

        _createUrlFilterString: function (filter) {
            if (ANY_URL_TEMPLATES.indexOf(filter.getUrlRuleText()) >= 0) {
                return URL_FILTER_ANY_URL;
            }

            if (filter.isRegexRule && filter.urlRegExp) {
                return filter.urlRegExp.source;
            }

            var urlRegExpSource = filter.getUrlRegExpSource();
            if (urlRegExpSource) {
                return urlRegExpSource;
            }

            // Rule with empty regexp
            return URL_FILTER_ANY_URL;
        },

        _parseRuleDomain: function (ruleText) {
            try {
                var i;
                var startsWith = ["http://www.", "https://www.", "http://", "https://", "||", "//"];
                var contains = ["/", "^"];
                var startIndex = 0;

                for (i = 0; i < startsWith.length; i++) {
                    var start = startsWith[i];
                    if (StringUtils.startWith(ruleText, start)) {
                        startIndex = start.length;
                        break;
                    }
                }

                //exclusive for domain
                var exceptRule = "domain=";
                var domainIndex = ruleText.indexOf(exceptRule);
                if (domainIndex > -1 && ruleText.indexOf("$") > -1) {
                    startIndex = domainIndex + exceptRule.length;
                }

                if (startIndex == -1) {
                    return null;
                }

                var symbolIndex = -1;
                for (i = 0; i < contains.length; i++) {
                    var contain = contains[i];
                    var index = ruleText.indexOf(contain, startIndex);
                    if (index >= 0) {
                        symbolIndex = index;
                        break;
                    }
                }

                var domain = symbolIndex == -1 ? ruleText.substring(startIndex) : ruleText.substring(startIndex, symbolIndex);
                var path = symbolIndex == -1 ? null : ruleText.substring(symbolIndex);
                
                if (!/^[a-zA-Z0-9][a-zA-Z0-9-.]*[a-zA-Z0-9]\.[a-zA-Z-]{2,}$/.test(domain)) {
                    // Not a valid domain name, ignore it
                    return null;
                }

                return {
                    domain: UrlUtils.toPunyCode(domain),
                    path: path
                };

            } catch (ex) {
                Log.error("Error parsing domain from {0}, cause {1}", ruleText, ex);
                return null;
            }
        },

        convertCssFilterRule: function (rule) {

            if (rule.isInjectRule && rule.isInjectRule === true) {
                // There is no way to convert these rules to safari format
                throw new Error("CSS-injection rule " + rule.ruleText + " cannot be converted");
            }

            if (rule.extendedCss) {
                throw new Error("Extended CSS rule " + rule.ruleText + " cannot be converted");
            }

            var result = {
                trigger: {
                    "url-filter": URL_FILTER_ANY_URL
                    // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/153#issuecomment-263067779
                    //,"resource-type": [ "document" ]
                },
                action: {
                    type: "css-display-none",
                    selector: rule.cssSelector
                }
            };

            this._setWhiteList(rule, result);
            this._addThirdParty(result.trigger, rule);
            this._addMatchCase(result.trigger, rule);
            this._addDomainOptions(result.trigger, rule);

            return result;
        },

        convertScriptRule: function (rule) {
            // There is no way to convert these rules to safari format
            throw new Error("Script-injection rule " + rule.ruleText + " cannot be converted");
        },
        
        /**
         * Validates url blocking rule and discards rules considered dangerous or invalid.
         */
        _validateUrlBlockingRule: function(rule) {
            
            if (rule.action.type == "block" &&
                rule.trigger["resource-type"] &&
                rule.trigger["resource-type"].indexOf("document") >= 0 &&
                !rule.trigger["if-domain"] &&
                (!rule.trigger["load-type"] || rule.trigger["load-type"].indexOf("third-party") == -1)) {
                // Due to https://github.com/AdguardTeam/AdguardBrowserExtension/issues/145
                throw new Error("Document blocking rules are allowed only along with third-party or if-domain modifiers");        
            }
        },

        _checkWhiteListExceptions: function (rule, result) {
            var self = this;
            function isDocumentRule(r) {
                return self._isContentType(r, UrlFilterRule.contentTypes.DOCUMENT);
            }

            function isUrlBlockRule(r) {
                return self._isContentType(r, UrlFilterRule.contentTypes.URLBLOCK) ||
                    self._isContentType(r, UrlFilterRule.contentTypes.GENERICBLOCK) ||
                    self._isContentType(r, UrlFilterRule.contentTypes.GENERICHIDE);
            }

            if (rule.whiteListRule && rule.whiteListRule === true) {
                
                var documentRule = isDocumentRule(rule); 
                
                if (documentRule || isUrlBlockRule(rule)) {
                    if (documentRule) {
                        //http://jira.performix.ru/browse/AG-8715
                        delete result.trigger["resource-type"];
                    }

                    if (this._isContentType(rule, UrlFilterRule.contentTypes.GENERICHIDE)) {
                        result.trigger["resource-type"] = ['document'];
                    } else {
                        delete result.trigger["resource-type"];
                    }

                    var parseDomainResult = this._parseRuleDomain(rule.urlRuleText);

                    if (parseDomainResult !== null && 
                        parseDomainResult.path !== null &&
                        parseDomainResult.path != "^" &&
                        parseDomainResult.path != "/") {
                        // http://jira.performix.ru/browse/AG-8664
                        Log.debug('Whitelist special warning for rule: ' + rule.ruleText);

                        return;
                    }

                    if (parseDomainResult === null || parseDomainResult.domain === null) {
                        Log.debug('Error parse domain from rule: ' + rule.ruleText);
                        return;
                    }

                    var domain = parseDomainResult.domain;

                    var included = [];
                    var excluded = [];

                    included.push(domain);
                    this._writeDomainOptions(included, excluded, result.trigger);

                    result.trigger["url-filter"] = URL_FILTER_ANY_URL;

                } else if (this._hasContentType(rule, UrlFilterRule.contentTypes.ELEMHIDE)) {  // jshint ignore:line
                    result.trigger["resource-type"] = ['document'];
                }
            }
        },

        _validateRegExp: function (regExp) {
            // Safari doesn't support {digit} in regular expressions
            if (regExp.match(/\{[0-9,]+\}/g)) {
                throw new Error("Safari doesn't support '{digit}' in regular expressions");
            }

            // Safari doesn't support | in regular expressions
            if (regExp.match(/[^\\]+\|+\S*/g)) {
                throw new Error("Safari doesn't support '|' in regular expressions");
            }

            // Safari doesn't support non-ASCII characters in regular expressions
            if (regExp.match(/[^\x00-\x7F]/g)) {
                throw new Error("Safari doesn't support non-ASCII characters in regular expressions");
            }

            // Safari doesn't support negative lookahead (?!...) in regular expressions
            if (regExp.match(/\(\?!.*\)/g)) {
                throw new Error("Safari doesn't support negative lookahead in regular expressions");
            }


            // Safari doesn't support metacharacters in regular expressions
            if (regExp.match(/[^\\]\\[bBdDfnrsStvwW]/g)) {
                throw new Error("Safari doesn't support metacharacters in regular expressions");
            }
        },

        convertUrlFilterRule: function (rule) {

            var urlFilter = this._createUrlFilterString(rule);

            // Redefine some of regular expressions
            urlFilter = StringUtils.replaceAll(urlFilter, SimpleRegex.regexConfiguration.regexStartUrl, URL_FILTER_REGEXP_START_URL);
            urlFilter = StringUtils.replaceAll(urlFilter, SimpleRegex.regexConfiguration.regexSeparator, URL_FILTER_REGEXP_SEPARATOR);

            this._validateRegExp(urlFilter);

            var result = {
                trigger: {
                    "url-filter": urlFilter
                },
                action: {
                    type: "block"
                }
            };

            this._setWhiteList(rule, result);
            this._addResourceType(rule, result);
            this._addThirdParty(result.trigger, rule);
            this._addMatchCase(result.trigger, rule);
            this._addDomainOptions(result.trigger, rule);

            // Check whitelist exceptions
            this._checkWhiteListExceptions(rule, result);
            
            // Validate the rule
            this._validateUrlBlockingRule(result);

            return result;
        }
    },

    /**
     * Add converter version message
     *
     * @private
     */
    _addVersionMessage: function () {
        Log.info('Safari Content Blocker Converter v' + CONVERTER_VERSION);
    },

    /**
     * Converts ruleText string to Safari format
     *
     * @param ruleText string
     * @param errors array
     * @returns {*}
     */
    convertLine: function (ruleText, errors) {
        try {
            if (ruleText === null || ruleText === '' || 
                ruleText.indexOf('!') === 0 || ruleText.indexOf(' ') === 0 ||
                ruleText.indexOf(' - ') > 0) {
                return null;
            }

            var agRule = FilterRuleBuilder.createRule(ruleText);
            if (agRule === null) {
                throw new Error('Cannot create rule from: ' + ruleText);
            }

            return this._convertAGRule(agRule);

        } catch (ex) {
            var message = 'Error converting rule from: ' + ruleText + ' cause:\n' + ex;
            message = ruleText + '\r\n' + message + '\r\n';
            Log.debug(message);

            if (errors) {
                errors.push(message);
            }

            return null;
        }
    },

    /**
     * Converts rule to Safari format
     *
     * @param rule AG rule object
     * @returns {*}
     */
    _convertAGRule: function (rule) {
        if (rule === null) {
            throw new Error('Invalid argument rule');
        }

        var result;
        if (rule instanceof CssFilterRule) {
            result = this.AGRuleConverter.convertCssFilterRule(rule);
        } else if (rule instanceof ScriptFilterRule) {
            result = this.AGRuleConverter.convertScriptRule(rule);
        } else if (rule instanceof UrlFilterRule) {
            result = this.AGRuleConverter.convertUrlFilterRule(rule);
        } else {
            throw new Error('Rule is not supported: ' + rule);
        }

        return result;
    },

    /**
     * Converts rule to Safari format
     *
     * @param rule AG rule object
     * @param errors array
     * @returns {*}
     */
    convertAGRule: function (rule, errors) {
        try {
            return this._convertAGRule(rule);
        } catch (ex) {          
            var message = 'Error converting rule from: ' + 
                (rule.ruleText ? rule.ruleText : rule) + 
                ' cause:\n' + ex + '\r\n';
            Log.debug(message);

            if (errors) {
                errors.push(message);
            }

            return null;
        }
    },

    /**
     * Converts array to map object
     *
     * @param array
     * @param prop
     * @param prop2
     * @returns {null}
     * @private
     */
    _arrayToMap: function (array, prop, prop2) {
        var map = Object.create(null);
        for (var i = 0; i < array.length; i++) {
            var el = array[i];
            var property = el[prop][prop2];
            if (!(property in map)) {
                map[property] = [];
            }
            map[property].push(el);
        }
        return map;
    },

    /**
     * Updates if-domain and unless-domain fields.
     * Adds wildcard to every rule
     *
     * @private
     */
    _applyDomainWildcards: function (rules) {
        var addWildcard = function (array) {
            if (!array || !array.length) {
                return;
            }

            for (var i = 0; i < array.length; i++) {
                array[i] = "*" + array[i];
            }
        };

        rules.forEach(function (rule) {
            if (rule.trigger) {
                addWildcard(rule.trigger["if-domain"]);
                addWildcard(rule.trigger["unless-domain"]);
            }
        });
    },

    /**
     * Apply css exceptions
     * http://jira.performix.ru/browse/AG-8710
     *
     * @param cssBlocking
     * @param cssExceptions
     * @private
     */
    _applyCssExceptions: function (cssBlocking, cssExceptions) {
        Log.info('Applying ' + cssExceptions.length + ' css exceptions');

        /**
         * Adds exception domain to the specified rule.
         * First it checks if rule has if-domain restriction.
         * If so - it may be that domain is redundant.
         */
        var pushExceptionDomain = function (domain, rule) {
            var permittedDomains = rule.trigger["if-domain"];
            if (permittedDomains && permittedDomains.length) {

                // First check that domain is not redundant
                var applicable = permittedDomains.some(function (permitted) {
                    return domain.indexOf(permitted) >= 0;
                });

                if (!applicable) {
                    return;
                }
            }

            var ruleRestrictedDomains = rule.trigger["unless-domain"];
            if (!ruleRestrictedDomains) {
                ruleRestrictedDomains = [];
                rule.trigger["unless-domain"] = ruleRestrictedDomains;
            }

            ruleRestrictedDomains.push(domain);
        };

        var rulesMap = this._arrayToMap(cssBlocking, 'action', 'selector');
        var exceptionRulesMap = this._arrayToMap(cssExceptions, 'action', 'selector');

        var exceptionsAppliedCount = 0;
        var exceptionsErrorsCount = 0;

        var selectorRules, selectorExceptions;
        var iterator = function (exc) {
            selectorRules.forEach(function (rule) {
                var exceptionDomains = exc.trigger['if-domain'];
                if (exceptionDomains && exceptionDomains.length > 0) {
                    exceptionDomains.forEach(function (domain) {
                        pushExceptionDomain(domain, rule);
                    });
                }
            });

            exceptionsAppliedCount++;
        };

        for (var selector in exceptionRulesMap) { // jshint ignore:line
            selectorRules = rulesMap[selector];
            selectorExceptions = exceptionRulesMap[selector];

            if (selectorRules && selectorExceptions) {
                selectorExceptions.forEach(iterator);
            }
        }

        var result = [];
        cssBlocking.forEach(function (r) {
            if (r.trigger["if-domain"] && (r.trigger["if-domain"].length > 0) && 
                r.trigger["unless-domain"] && (r.trigger["unless-domain"].length > 0)) {
                Log.debug('Safari does not support permitted and restricted domains in one rule');
                Log.debug(JSON.stringify(r));
                exceptionsErrorsCount++;
            } else {
                result.push(r);
            }
        });

        Log.info('Css exceptions applied: ' + exceptionsAppliedCount);
        Log.info('Css exceptions errors: ' + exceptionsErrorsCount);
        return result;
    },

    /**
     * Compacts wide CSS rules
     * @param unsorted css elemhide rules
     * @return an object with two properties: cssBlockingWide and cssBlockingDomainSensitive
     */
    _compactCssRules: function(cssBlocking) {
        Log.info('Trying to compact ' + cssBlocking.length + ' elemhide rules');

        var cssBlockingWide = [];
        var cssBlockingDomainSensitive = [];
        var cssBlockingGenericDomainSensitive = [];

        var wideSelectors = [];
        var addWideRule = function() {
            if (!wideSelectors.length) {
                // Nothing to add
                return;
            }

            var rule = {
                trigger: {
                    "url-filter": URL_FILTER_ANY_URL
                    // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/153#issuecomment-263067779
                    //,"resource-type": [ "document" ]
                },
                action: {
                    type: "css-display-none",
                    selector: wideSelectors.join(', ')
                }
            };
            cssBlockingWide.push(rule);
        };

        for (var i = 0; i < cssBlocking.length; i++) {

            var rule = cssBlocking[i];
            if (rule.trigger['if-domain']) {
                cssBlockingDomainSensitive.push(rule);
            } else if (rule.trigger['unless-domain']) {
                cssBlockingGenericDomainSensitive.push(rule);
            } else {
                wideSelectors.push(rule.action.selector);
                if (wideSelectors.length >= MAX_SELECTORS_PER_WIDE_RULE) {
                    addWideRule();
                    wideSelectors = [];
                }
            }
        }
        addWideRule();

        Log.info('Compacted result: wide=' + cssBlockingWide.length + ' domainSensitive=' + cssBlockingDomainSensitive.length);
        return {
            cssBlockingWide: cssBlockingWide,
            cssBlockingDomainSensitive: cssBlockingDomainSensitive,
            cssBlockingGenericDomainSensitive: cssBlockingGenericDomainSensitive
        };
    },

    /**
     * Converts array of rules to JSON
     *
     * @param rules array of strings or AG rules objects
     * @param optimize if true - ignore slow rules
     * @return content blocker object with converted rules grouped by type
     */
    _convertLines: function (rules, optimize) {
        Log.info('Converting ' + rules.length + ' rules. Optimize=' + optimize);

        var contentBlocker = {
            // Elemhide rules (##) - wide generic rules
            cssBlockingWide: [],
            // Elemhide rules (##) - generic domain sensitive
            cssBlockingGenericDomainSensitive: [],
            // Generic hide exceptions
            cssBlockingGenericHideExceptions: [],
            // Elemhide rules (##) with domain restrictions
            cssBlockingDomainSensitive: [],
            // Elemhide exceptions ($elemhide)
            cssElemhide: [],
            // Url blocking rules
            urlBlocking: [],
            // Other exceptions
            other: [],
            // Errors
            errors: []
        };

        // Elemhide rules (##)
        var cssBlocking = [];

        // Elemhide exceptions (#@#)
        var cssExceptions = [];

        for (var i = 0, len = rules.length; i < len; i++) {
            var item;
            var ruleText;
            if (rules[i] !== null && rules[i].ruleText) {
                item = this.convertAGRule(rules[i], contentBlocker.errors);
                ruleText = rules[i].ruleText;
            } else {
                item = this.convertLine(rules[i], contentBlocker.errors);
                ruleText = rules[i];
            }

            if (item !== null && item !== '') {
                if (item.action === null || item.action === '') {
                    continue;
                }

                if (item.action.type == 'block') {
                    contentBlocker.urlBlocking.push(item);
                } else if (item.action.type == 'css-display-none') {
                    cssBlocking.push(item);
                } else if (item.action.type == 'ignore-previous-rules' && 
                    (item.action.selector && item.action.selector !== '')) {
                    // #@# rules
                    cssExceptions.push(item);
                } else if (item.action.type == 'ignore-previous-rules' && 
                    (ruleText && ruleText.indexOf('generichide') > 0)) {
                    contentBlocker.cssBlockingGenericHideExceptions.push(item);
                } else if (item.action.type == 'ignore-previous-rules' && 
                        (item.trigger["resource-type"] && 
                        item.trigger["resource-type"].length > 0 &&
                        item.trigger["resource-type"][0] == 'document')) {
                    // elemhide rules
                    contentBlocker.cssElemhide.push(item);
                } else {
                    contentBlocker.other.push(item);
                }
            }
        }

        // Applying CSS exceptions
        cssBlocking = this._applyCssExceptions(cssBlocking, cssExceptions);
        var cssCompact = this._compactCssRules(cssBlocking);
        if (!optimize) {
            contentBlocker.cssBlockingWide = cssCompact.cssBlockingWide;
        }
        contentBlocker.cssBlockingGenericDomainSensitive = cssCompact.cssBlockingGenericDomainSensitive;
        contentBlocker.cssBlockingDomainSensitive = cssCompact.cssBlockingDomainSensitive;

        var convertedCount = rules.length - contentBlocker.errors.length;
        var message = 'Rules converted: ' + convertedCount + ' (' + contentBlocker.errors.length + ' errors)';
        message += '\nBasic rules: ' + contentBlocker.urlBlocking.length;
        message += '\nElemhide rules (wide): ' + contentBlocker.cssBlockingWide.length;
        message += '\nElemhide rules (generic domain sensitive): ' + contentBlocker.cssBlockingGenericDomainSensitive.length;
        message += '\nExceptions Elemhide (wide): ' + contentBlocker.cssBlockingGenericHideExceptions.length;
        message += '\nElemhide rules (domain-sensitive): ' + contentBlocker.cssBlockingDomainSensitive.length;
        message += '\nExceptions (elemhide): ' + contentBlocker.cssElemhide.length;
        message += '\nExceptions (other): ' + contentBlocker.other.length;
        Log.info(message);

        return contentBlocker;
    },

    _createConversionResult: function (contentBlocker, limit) {
        var overLimit = false;
        var converted = [];
        converted = converted.concat(contentBlocker.cssBlockingWide);
        converted = converted.concat(contentBlocker.cssBlockingGenericDomainSensitive);
        converted = converted.concat(contentBlocker.cssBlockingGenericHideExceptions);
        converted = converted.concat(contentBlocker.cssBlockingDomainSensitive);
        converted = converted.concat(contentBlocker.cssElemhide);
        converted = converted.concat(contentBlocker.urlBlocking);
        converted = converted.concat(contentBlocker.other);

        var convertedLength = converted.length;
        
        if (limit && limit > 0 && converted.length > limit) {
            var message = '' + limit + ' limit is achieved. Next rules will be ignored.';
            contentBlocker.errors.push(message);
            Log.error(message);
            overLimit = true;
            converted = converted.slice(0, limit);
        }

        this._applyDomainWildcards(converted);
        Log.info('Content blocker length: ' + converted.length);

        var result = {
            totalConvertedCount: convertedLength,
            convertedCount: converted.length,
            errorsCount: contentBlocker.errors.length,
            overLimit: overLimit,
            converted: JSON.stringify(converted, null, "\t")
        };

        return result;
    },

    /**
     * Converts array of rule texts or AG rules to JSON
     *
     * @param rules array of strings
     * @param limit over that limit rules will be ignored
     * @param optimize if true - "wide" rules will be ignored
     */
    convertArray: function (rules, limit, optimize) {
        this._addVersionMessage();

        if (rules === null) {
            Log.error('Invalid argument rules');
            return null;
        }

        if (rules.length === 0) {
            Log.info('No rules presented for convertation');
            return null;
        }

        var contentBlocker = this._convertLines(rules, !!optimize);
        return this._createConversionResult(contentBlocker, limit);
    }
};
