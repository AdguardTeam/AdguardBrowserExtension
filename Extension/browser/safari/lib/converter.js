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

/**
 * Converts URLs in the AdGuard format to the format supported by Safari
 * https://webkit.org/blog/3476/content-blockers-first-look/
 */
var SafariContentBlockerConverter = (function () {

    /**
     * Safari content blocking format rules converter.
     */
    var CONVERTER_VERSION = '2.0.3';
    // Max number of CSS selectors per rule (look at compactCssRules function)
    var MAX_SELECTORS_PER_WIDE_RULE = 250;

    /**
     * It's important to mention why do we need these regular expression.
     * The thing is that on iOS it is crucial to use regexes as simple as possible.
     * Otherwise, Safari takes too much memory on compiling a content blocker, and iOS simply kills the process.
     * 
     * Angry users are here:
     * https://github.com/AdguardTeam/AdguardForiOS/issues/550
     */

    var ANY_URL_TEMPLATES = ['||*', '', '*', '|*'];
    var URL_FILTER_ANY_URL = "^[htpsw]+:\\/\\/";
    var URL_FILTER_WS_ANY_URL = "^wss?:\\/\\/";
    /**
     * Using .* for the css-display-none rules trigger.url-filter.
     * Please note, that this is important to use ".*" for this kind of rules, otherwise performance is degraded:
     * https://github.com/AdguardTeam/AdguardForiOS/issues/662
     */
    var URL_FILTER_CSS_RULES = ".*";
    /** 
     * Improved regular expression instead of UrlFilterRule.REGEXP_START_URL (||)
     * Please note, that this regular expression matches only ONE level of subdomains
     * Using ([a-z0-9-.]+\\.)? instead increases memory usage by 10Mb
     */
    var URL_FILTER_REGEXP_START_URL = URL_FILTER_ANY_URL + "([a-z0-9-]+\\.)?";
    /** Simplified separator (to fix an issue with $ restriction - it can be only in the end of regexp) */
    var URL_FILTER_REGEXP_SEPARATOR = "[/:&?]?";

    var AGRuleConverter = (function () {

        var parseDomains = function (rule, included, excluded) {
            var domain, domains, iDomains;

            if (rule.permittedDomain) {
                domain = adguard.utils.url.toPunyCode(rule.permittedDomain.toLowerCase());
                included.push(domain);
            } else if (rule.permittedDomains) {
                domains = rule.permittedDomains;
                iDomains = domains.length;

                while (iDomains--) {
                    if (domains[iDomains] !== "") {
                        domain = domains[iDomains];
                        domain = adguard.utils.url.toPunyCode(domain.toLowerCase());
                        included.push(domain);
                    }
                }
            }

            if (rule.restrictedDomain) {
                domain = adguard.utils.url.toPunyCode(rule.restrictedDomain.toLowerCase());
                excluded.push(domain);
            } else if (rule.restrictedDomains) {
                domains = rule.restrictedDomains;
                iDomains = domains.length;
                while (iDomains--) {
                    domain = domains[iDomains];
                    if (domain) {
                        domain = adguard.utils.url.toPunyCode(domain.toLowerCase());
                        excluded.push(domain);
                    }
                }
            }
        };

        /**
         * Adds load-type specification
         */
        var addThirdParty = function (trigger, rule) {
            if (rule.isCheckThirdParty()) {
                trigger["load-type"] = rule.isThirdParty() ? ["third-party"] : ["first-party"];
            }
        };

        var addMatchCase = function (trigger, rule) {
            if (rule.isMatchCase()) {
                trigger["url-filter-is-case-sensitive"] = true;
            }
        };

        var writeDomainOptions = function (included, excluded, trigger) {
            if (included.length > 0 && excluded.length > 0) {
                throw new Error('Safari does not support both permitted and restricted domains');
            }

            if (included.length > 0) {
                trigger["if-domain"] = included;
            }
            if (excluded.length > 0) {
                trigger["unless-domain"] = excluded;
            }
        };

        var addDomainOptions = function (trigger, rule) {
            var included = [];
            var excluded = [];
            parseDomains(rule, included, excluded);
            writeDomainOptions(included, excluded, trigger);
        };

        var setWhiteList = function (rule, result) {
            if (rule.whiteListRule && rule.whiteListRule === true) {
                result.action.type = "ignore-previous-rules";
            }
        };

        var hasContentType = function (rule, contentType) {
            return rule.checkContentTypeMask(contentType);
        };

        var isContentType = function (rule, contentType) {
            return rule.permittedContentType === contentType;
        };

        var isSingleOption = function (rule, option) {
            return rule.enabledOptions === option;
        };

        var addResourceType = function (rule, result) {
            var types = [];

            var contentTypes = adguard.rules.UrlFilterRule.contentTypes;

            if (rule.permittedContentType === contentTypes.ALL &&
                rule.restrictedContentType === 0) {
                // Safari does not support all other default content types, like subdocument etc.
                // So we can use default safari content types instead.
                return;
            }
            if (hasContentType(rule, contentTypes.IMAGE)) {
                types.push("image");
            }
            if (hasContentType(rule, contentTypes.STYLESHEET)) {
                types.push("style-sheet");
            }
            if (hasContentType(rule, contentTypes.SCRIPT)) {
                types.push("script");
            }
            if (hasContentType(rule, contentTypes.MEDIA)) {
                types.push("media");
            }
            if (hasContentType(rule, contentTypes.XMLHTTPREQUEST) ||
                hasContentType(rule, contentTypes.OTHER) ||
                hasContentType(rule, contentTypes.WEBSOCKET)) {
                types.push("raw");
            }
            if (hasContentType(rule, contentTypes.FONT)) {
                types.push("font");
            }
            if (hasContentType(rule, contentTypes.SUBDOCUMENT)) {
                types.push("document");
            }
            if (rule.isBlockPopups()) {
                // Ignore other in case of $popup modifier
                types = ["popup"];
            }

            // Not supported modificators
            if (isContentType(rule, contentTypes.OBJECT)) {
                throw new Error('$object content type is not yet supported');
            }
            if (isContentType(rule, contentTypes.OBJECT_SUBREQUEST)) {
                throw new Error('$object_subrequest content type is not yet supported');
            }
            if (isContentType(rule, contentTypes.WEBRTC)) {
                throw new Error('$webrtc content type is not yet supported');
            }
            if (isSingleOption(rule, adguard.rules.UrlFilterRule.options.JSINJECT)) {
                throw new Error('$jsinject rules are ignored.');
            }
            if (rule.getReplace()) {
                throw new Error('$replace rules are ignored.');
            }

            if (types.length > 0) {
                result.trigger["resource-type"] = types;
            }

            //TODO: Add restricted content types?
        };

        /**
         * Creates a regular expression that will be used in the trigger["url-filter"].
         * This method transforms
         * 
         * @param {*} filter UrlFilterRule object
         */
        var createUrlFilterString = function (filter) {
            var urlRuleText = filter.getUrlRuleText();
            var isWebSocket = (filter.permittedContentType === adguard.rules.UrlFilterRule.contentTypes.WEBSOCKET);

            // Use a single standard regex for rules that are supposed to match every URL 
            if (ANY_URL_TEMPLATES.indexOf(urlRuleText) >= 0) {
                return isWebSocket ? URL_FILTER_WS_ANY_URL : URL_FILTER_ANY_URL;
            }

            if (filter.isRegexRule && filter.urlRegExp) {
                return filter.urlRegExp.source;
            }

            var urlRegExpSource = filter.getUrlRegExpSource();

            if (!urlRegExpSource) {
                // Rule with empty regexp
                return URL_FILTER_ANY_URL;
            }

            // Prepending WebSocket protocol to resolve this:
            // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/957
            if (isWebSocket &&
                urlRegExpSource.indexOf("^") !== 0 &&
                urlRegExpSource.indexOf("ws") !== 0) {
                return URL_FILTER_WS_ANY_URL + ".*" + urlRegExpSource;
            }

            return urlRegExpSource;
        };

        var parseRuleDomain = function (ruleText) {
            try {
                var i;
                var startsWith = ["http://www.", "https://www.", "http://", "https://", "||", "//"];
                var contains = ["/", "^"];
                var startIndex = 0;

                for (i = 0; i < startsWith.length; i++) {
                    var start = startsWith[i];
                    if (adguard.utils.strings.startWith(ruleText, start)) {
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

                if (startIndex === -1) {
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

                var domain = symbolIndex === -1 ? ruleText.substring(startIndex) : ruleText.substring(startIndex, symbolIndex);
                var path = symbolIndex === -1 ? null : ruleText.substring(symbolIndex);

                if (!/^[a-zA-Z0-9][a-zA-Z0-9-.]*[a-zA-Z0-9]\.[a-zA-Z-]{2,}$/.test(domain)) {
                    // Not a valid domain name, ignore it
                    return null;
                }

                return {
                    domain: adguard.utils.url.toPunyCode(domain).toLowerCase(),
                    path: path
                };

            } catch (ex) {
                adguard.console.error("Error parsing domain from {0}, cause {1}", ruleText, ex);
                return null;
            }
        };

        var convertCssFilterRule = function (rule) {

            if (rule.isInjectRule && rule.isInjectRule === true) {
                // There is no way to convert these rules to safari format
                throw new Error("CSS-injection rule " + rule.ruleText + " cannot be converted");
            }

            if (rule.extendedCss) {
                throw new Error("Extended CSS rule " + rule.ruleText + " cannot be converted");
            }

            var result = {
                trigger: {
                    "url-filter": URL_FILTER_CSS_RULES
                    // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/153#issuecomment-263067779
                    //,"resource-type": [ "document" ]
                },
                action: {
                    type: "css-display-none",
                    selector: rule.cssSelector
                }
            };

            setWhiteList(rule, result);
            addDomainOptions(result.trigger, rule);

            return result;
        };

        var convertScriptRule = function (rule) {
            // There is no way to convert these rules to safari format
            throw new Error("Script-injection rule " + rule.ruleText + " cannot be converted");
        };

        /**
         * Validates url blocking rule and discards rules considered dangerous or invalid.
         */
        var validateUrlBlockingRule = function (rule) {

            if (rule.action.type === "block" &&
                rule.trigger["resource-type"] &&
                rule.trigger["resource-type"].indexOf("document") >= 0 &&
                !rule.trigger["if-domain"] &&
                (!rule.trigger["load-type"] || rule.trigger["load-type"].indexOf("third-party") === -1)) {
                // Due to https://github.com/AdguardTeam/AdguardBrowserExtension/issues/145
                throw new Error("Document blocking rules are allowed only along with third-party or if-domain modifiers");
            }
        };

        var checkWhiteListExceptions = function (rule, result) {

            function isDocumentRule(r) {
                return r.isDocumentWhiteList();
            }

            function isUrlBlockRule(r) {
                return isSingleOption(r, adguard.rules.UrlFilterRule.options.URLBLOCK) ||
                    isSingleOption(r, adguard.rules.UrlFilterRule.options.GENERICBLOCK);
            }

            function isCssExceptionRule(r) {
                return isSingleOption(r, adguard.rules.UrlFilterRule.options.GENERICHIDE) ||
                    isSingleOption(r, adguard.rules.UrlFilterRule.options.ELEMHIDE);
            }

            if (rule.whiteListRule && rule.whiteListRule === true) {

                var documentRule = isDocumentRule(rule);

                if (documentRule || isUrlBlockRule(rule) || isCssExceptionRule(rule)) {
                    if (documentRule) {
                        //http://jira.performix.ru/browse/AG-8715
                        delete result.trigger["resource-type"];
                    }

                    var parseDomainResult = parseRuleDomain(rule.getUrlRuleText());

                    if (parseDomainResult !== null &&
                        parseDomainResult.path !== null &&
                        parseDomainResult.path !== "^" &&
                        parseDomainResult.path !== "/") {
                        // http://jira.performix.ru/browse/AG-8664
                        adguard.console.debug('Whitelist special warning for rule: ' + rule.ruleText);

                        return;
                    }

                    if (parseDomainResult === null || parseDomainResult.domain === null) {
                        adguard.console.debug('Error parse domain from rule: ' + rule.ruleText);
                        return;
                    }

                    var domain = parseDomainResult.domain;

                    var included = [];
                    var excluded = [];

                    included.push(domain);
                    writeDomainOptions(included, excluded, result.trigger);

                    result.trigger["url-filter"] = URL_FILTER_ANY_URL;
                    delete result.trigger["resource-type"];
                }
            }
        };

        var validateRegExp = function (regExp) {
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
        };

        var convertUrlFilterRule = function (rule) {

            if (rule.isCspRule()) {
                // CSP rules are not supported
                throw new Error("CSP rules are not supported");
            }

            var urlFilter = createUrlFilterString(rule);

            validateRegExp(urlFilter);

            var result = {
                trigger: {
                    "url-filter": urlFilter
                },
                action: {
                    type: "block"
                }
            };

            setWhiteList(rule, result);
            addResourceType(rule, result);
            addThirdParty(result.trigger, rule);
            addMatchCase(result.trigger, rule);
            addDomainOptions(result.trigger, rule);

            // Check whitelist exceptions
            checkWhiteListExceptions(rule, result);

            // Validate the rule
            validateUrlBlockingRule(result);

            return result;
        };

        // Expose AGRuleConverter API
        return {
            convertCssFilterRule: convertCssFilterRule,
            convertScriptRule: convertScriptRule,
            convertUrlFilterRule: convertUrlFilterRule,
            isSingleOption: isSingleOption
        }
    })();

    /**
     * Add converter version message
     *
     * @private
     */
    var printVersionMessage = function () {
        adguard.console.info('Safari Content Blocker Converter v' + CONVERTER_VERSION);
    };

    /**
     * Converts ruleText string to Safari format
     * Used in iOS.
     *
     * @param ruleText string
     * @param errors array
     * @returns {*}
     */
    var convertLine = function (ruleText, errors) {
        try {
            return convertAGRuleToCB(parseAGRule(ruleText, errors));
        } catch (ex) {
            var message = 'Error converting rule from: ' + ruleText + ' cause:\n' + ex;
            message = ruleText + '\r\n' + message + '\r\n';
            adguard.console.debug(message);

            if (errors) {
                errors.push(message);
            }

            return null;
        }
    };

    /**
     * Creates AG rule form text
     *
     * @param ruleText
     * @param errors
     */
    var parseAGRule = function (ruleText, errors) {
        try {
            if (ruleText === null ||
                ruleText === '' ||
                ruleText.indexOf('!') === 0 ||
                ruleText.indexOf(' ') === 0 ||
                ruleText.indexOf(' - ') > 0) {
                return null;
            }

            var agRule = adguard.rules.builder.createRule(ruleText);
            if (agRule === null) {
                throw new Error('Cannot create rule from: ' + ruleText);
            }

            return agRule;
        } catch (ex) {
            var message = 'Error creating rule from: ' + ruleText + ' cause:\n' + ex;
            message = ruleText + '\r\n' + message + '\r\n';
            adguard.console.debug(message);

            if (errors) {
                errors.push(message);
            }

            return null;
        }
    };

    /**
     * Converts rule to Safari format
     *
     * @param rule AG rule object
     * @returns {*}
     */
    var convertAGRuleToCB = function (rule) {
        if (rule === null) {
            throw new Error('Invalid argument rule');
        }

        var result;
        if (rule instanceof adguard.rules.CssFilterRule) {
            result = AGRuleConverter.convertCssFilterRule(rule);
        } else if (rule instanceof adguard.rules.ScriptFilterRule) {
            result = AGRuleConverter.convertScriptRule(rule);
        } else if (rule instanceof adguard.rules.UrlFilterRule) {
            result = AGRuleConverter.convertUrlFilterRule(rule);
        } else {
            throw new Error('Rule is not supported: ' + rule);
        }

        return result;
    };

    /**
     * Converts rule to Safari format
     *
     * @param rule AG rule object
     * @param errors array
     * @returns {*}
     */
    var convertAGRule = function (rule, errors) {
        try {
            return convertAGRuleToCB(rule);
        } catch (ex) {
            var message = 'Error converting rule from: ' +
                ((rule && rule.ruleText) ? rule.ruleText : rule) +
                ' cause:\n' + ex + '\r\n';
            adguard.console.debug(message);

            if (errors) {
                errors.push(message);
            }

            return null;
        }
    };

    /**
     * Converts array to map object
     *
     * @param array
     * @param prop
     * @param prop2
     * @returns {null}
     * @private
     */
    var arrayToMap = function (array, prop, prop2) {
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
    };

    /**
     * Updates if-domain and unless-domain fields.
     * Adds wildcard to every rule
     *
     * @private
     */
    var applyDomainWildcards = function (rules) {
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
    };

    /**
     * Apply css exceptions
     * http://jira.performix.ru/browse/AG-8710
     *
     * @param cssBlocking
     * @param cssExceptions
     * @private
     */
    var applyCssExceptions = function (cssBlocking, cssExceptions) {
        adguard.console.info('Applying ' + cssExceptions.length + ' css exceptions');

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

        var rulesMap = arrayToMap(cssBlocking, 'action', 'selector');
        var exceptionRulesMap = arrayToMap(cssExceptions, 'action', 'selector');

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
                adguard.console.debug('Safari does not support permitted and restricted domains in one rule');
                adguard.console.debug(JSON.stringify(r));
                exceptionsErrorsCount++;
            } else {
                result.push(r);
            }
        });

        adguard.console.info('Css exceptions applied: ' + exceptionsAppliedCount);
        adguard.console.info('Css exceptions errors: ' + exceptionsErrorsCount);
        return result;
    };

    /**
     * Compacts wide CSS rules
     * @param unsorted css elemhide rules
     * @return an object with two properties: cssBlockingWide and cssBlockingDomainSensitive
     */
    var compactCssRules = function (cssBlocking) {
        adguard.console.info('Trying to compact ' + cssBlocking.length + ' elemhide rules');

        var cssBlockingWide = [];
        var cssBlockingDomainSensitive = [];
        var cssBlockingGenericDomainSensitive = [];

        var wideSelectors = [];
        var addWideRule = function () {
            if (!wideSelectors.length) {
                // Nothing to add
                return;
            }

            var rule = {
                trigger: {
                    "url-filter": URL_FILTER_CSS_RULES
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

        adguard.console.info('Compacted result: wide=' + cssBlockingWide.length + ' domainSensitive=' + cssBlockingDomainSensitive.length);
        return {
            cssBlockingWide: cssBlockingWide,
            cssBlockingDomainSensitive: cssBlockingDomainSensitive,
            cssBlockingGenericDomainSensitive: cssBlockingGenericDomainSensitive
        };
    };

    /**
     * Converts array of rules to JSON
     *
     * @param rules array of strings or AG rules objects
     * @param optimize if true - ignore slow rules
     * @return content blocker object with converted rules grouped by type
     */
    var convertLines = function (rules, optimize) {
        adguard.console.info('Converting ' + rules.length + ' rules. Optimize=' + optimize);

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
            // $important url blocking rules
            important: [],
            // $important url blocking exceptions
            importantExceptions: [],
            // Document url blocking exceptions
            documentExceptions: [],
            // Errors
            errors: []
        };

        // Elemhide rules (##)
        var cssBlocking = [];

        // Elemhide exceptions (#@#)
        var cssExceptions = [];

        // $badfilter rules
        var badFilterExceptions = [];

        var agRules = [];
        for (var j = 0; j < rules.length; j++) {
            var rule;

            if (rules[j] !== null && rules[j].ruleText) {
                rule = rules[j];
            } else {
                rule = parseAGRule(rules[j], contentBlocker.errors);
            }

            if (rule) {
                if (rule.isBadFilter && rule.isBadFilter()) {
                    badFilterExceptions.push(rule.badFilter);
                } else {
                    agRules.push(rule);
                }
            }
        }

        for (var i = 0, len = agRules.length; i < len; i++) {
            var agRule = agRules[i];
            if (badFilterExceptions.indexOf(agRule.ruleText) >= 0) {
                // Removed with bad-filter
                adguard.console.info('Rule ' + agRule.ruleText + ' removed with a $badfilter modifier');
                continue;
            }

            var item = convertAGRule(agRules[i], contentBlocker.errors);

            if (item !== null && item !== '') {
                if (item.action === null || item.action === '') {
                    continue;
                }

                if (item.action.type === 'block') {
                    // Url blocking rules
                    if (agRule.isImportant) {
                        contentBlocker.important.push(item);
                    } else {
                        contentBlocker.urlBlocking.push(item);
                    }
                } else if (item.action.type === 'css-display-none') {
                    cssBlocking.push(item);
                } else if (item.action.type === 'ignore-previous-rules' &&
                    (item.action.selector && item.action.selector !== '')) {
                    // #@# rules
                    cssExceptions.push(item);
                } else if (item.action.type === 'ignore-previous-rules' &&
                    AGRuleConverter.isSingleOption(agRule, adguard.rules.UrlFilterRule.options.GENERICHIDE)) {
                    contentBlocker.cssBlockingGenericHideExceptions.push(item);
                } else if (item.action.type === 'ignore-previous-rules' &&
                    AGRuleConverter.isSingleOption(agRule, adguard.rules.UrlFilterRule.options.ELEMHIDE)) {
                    // elemhide rules
                    contentBlocker.cssElemhide.push(item);
                } else {
                    // other exceptions
                    if (agRule.isImportant) {
                        contentBlocker.importantExceptions.push(item);
                    } else if (agRule.isDocumentWhiteList()) {
                        contentBlocker.documentExceptions.push(item);
                    } else {
                        contentBlocker.other.push(item);
                    }
                }
            }
        }

        // Applying CSS exceptions
        cssBlocking = applyCssExceptions(cssBlocking, cssExceptions);
        var cssCompact = compactCssRules(cssBlocking);
        if (!optimize) {
            contentBlocker.cssBlockingWide = cssCompact.cssBlockingWide;
        }
        contentBlocker.cssBlockingGenericDomainSensitive = cssCompact.cssBlockingGenericDomainSensitive;
        contentBlocker.cssBlockingDomainSensitive = cssCompact.cssBlockingDomainSensitive;

        var convertedCount = rules.length - contentBlocker.errors.length;
        var message = 'Rules converted: ' + convertedCount + ' (' + contentBlocker.errors.length + ' errors)';
        message += '\nBasic rules: ' + contentBlocker.urlBlocking.length;
        message += '\nBasic important rules: ' + contentBlocker.important.length;
        message += '\nElemhide rules (wide): ' + contentBlocker.cssBlockingWide.length;
        message += '\nElemhide rules (generic domain sensitive): ' + contentBlocker.cssBlockingGenericDomainSensitive.length;
        message += '\nExceptions Elemhide (wide): ' + contentBlocker.cssBlockingGenericHideExceptions.length;
        message += '\nElemhide rules (domain-sensitive): ' + contentBlocker.cssBlockingDomainSensitive.length;
        message += '\nExceptions (elemhide): ' + contentBlocker.cssElemhide.length;
        message += '\nExceptions (important): ' + contentBlocker.importantExceptions.length;
        message += '\nExceptions (document): ' + contentBlocker.documentExceptions.length;
        message += '\nExceptions (other): ' + contentBlocker.other.length;
        adguard.console.info(message);

        return contentBlocker;
    };

    var createConversionResult = function (contentBlocker, limit) {
        var overLimit = false;
        var converted = [];
        converted = converted.concat(contentBlocker.cssBlockingWide);
        converted = converted.concat(contentBlocker.cssBlockingGenericDomainSensitive);
        converted = converted.concat(contentBlocker.cssBlockingGenericHideExceptions);
        converted = converted.concat(contentBlocker.cssBlockingDomainSensitive);
        converted = converted.concat(contentBlocker.cssElemhide);
        converted = converted.concat(contentBlocker.urlBlocking);
        converted = converted.concat(contentBlocker.other);
        converted = converted.concat(contentBlocker.important);
        converted = converted.concat(contentBlocker.importantExceptions);
        converted = converted.concat(contentBlocker.documentExceptions);

        var convertedLength = converted.length;

        if (limit && limit > 0 && converted.length > limit) {
            var message = '' + limit + ' limit is achieved. Next rules will be ignored.';
            contentBlocker.errors.push(message);
            adguard.console.error(message);
            overLimit = true;
            converted = converted.slice(0, limit);
        }

        applyDomainWildcards(converted);
        adguard.console.info('Content blocker length: ' + converted.length);

        var result = {
            totalConvertedCount: convertedLength,
            convertedCount: converted.length,
            errorsCount: contentBlocker.errors.length,
            overLimit: overLimit,
            converted: JSON.stringify(converted, null, "\t")
        };

        return result;
    };

    /**
     * Converts array of rule texts or AG rules to JSON
     *
     * @param rules array of strings
     * @param limit over that limit rules will be ignored
     * @param optimize if true - "wide" rules will be ignored
     */
    var convertArray = function (rules, limit, optimize) {
        printVersionMessage();

        // Temporarily change the configuration in order to generate more effective regular expressions
        var regexConfiguration = adguard.rules.SimpleRegex.regexConfiguration;
        var prevRegexStartUrl = regexConfiguration.regexStartUrl;
        var prevRegexSeparator = regexConfiguration.regexSeparator;

        try {
            regexConfiguration.regexStartUrl = URL_FILTER_REGEXP_START_URL;
            regexConfiguration.regexSeparator = URL_FILTER_REGEXP_SEPARATOR;

            if (rules === null) {
                adguard.console.error('Invalid argument rules');
                return null;
            }

            if (rules.length === 0) {
                adguard.console.info('No rules presented for convertation');
                return null;
            }

            var contentBlocker = convertLines(rules, !!optimize);
            return createConversionResult(contentBlocker, limit);
        } finally {
            // Restore the regex configuration
            regexConfiguration.regexStartUrl = prevRegexStartUrl;
            regexConfiguration.regexSeparator = prevRegexSeparator;
        }
    };

    // Expose SafariContentBlockerConverter API
    return {
        convertArray: convertArray
    }
})();