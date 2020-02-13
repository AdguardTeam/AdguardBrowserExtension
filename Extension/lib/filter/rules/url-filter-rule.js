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

    const ESCAPE_CHARACTER = '\\';

    /**
     * Searches for domain name in rule text and transforms it to punycode if needed.
     *
     * @param ruleText Rule text
     * @returns Transformed rule text
     */
    function getAsciiDomainRule(ruleText) {
        try {
            if (/^[\x00-\x7F]+$/.test(ruleText)) {
                return ruleText;
            }

            const domain = parseRuleDomain(ruleText, true);
            if (!domain) {
                return '';
            }

            // In case of one domain
            return adguard.utils.strings.replaceAll(ruleText, domain, adguard.utils.url.toPunyCode(domain));
        } catch (ex) {
            adguard.console.error('Error getAsciiDomainRule from {0}, cause {1}', ruleText, ex);
            return '';
        }
    }

    /**
     * Searches for domain name in rule text.
     *
     * @param ruleText Rule text
     * @param parseOptions Flag to parse rule options
     * @returns string domain name
     */
    function parseRuleDomain(ruleText, parseOptions) {
        try {
            let i;
            const startsWith = ['http://www.', 'https://www.', 'http://', 'https://', '||', '//'];
            const contains = ['/', '^'];
            let startIndex = parseOptions ? -1 : 0;

            for (i = 0; i < startsWith.length; i++) {
                const start = startsWith[i];
                if (adguard.utils.strings.startWith(ruleText, start)) {
                    startIndex = start.length;
                    break;
                }
            }

            if (parseOptions) {
                // exclusive for domain
                const exceptRule = 'domain=';
                const domainIndex = ruleText.indexOf(exceptRule);
                if (domainIndex > -1 && ruleText.indexOf('$') > -1) {
                    startIndex = domainIndex + exceptRule.length;
                }

                if (startIndex === -1) {
                    // Domain is not found in rule options, so we continue a normal way
                    startIndex = 0;
                }
            }

            let symbolIndex = -1;
            for (i = 0; i < contains.length; i++) {
                const contain = contains[i];
                const index = ruleText.indexOf(contain, startIndex);
                if (index >= 0) {
                    symbolIndex = index;
                    break;
                }
            }

            return symbolIndex === -1 ? ruleText.substring(startIndex) : ruleText.substring(startIndex, symbolIndex);
        } catch (ex) {
            adguard.console.error('Error parsing domain from {0}, cause {1}', ruleText, ex);
            return null;
        }
    }

    /**
     * Searches for the shortcut of this url mask.
     * Shortcut is the longest part of the mask without special characters:
     * *,^,|. If not found anything with the length greater or equal to 8 characters -
     * shortcut is not used.
     *
     * @param urlmask
     * @returns {string}
     */
    function findShortcut(urlmask) {
        let longest = '';
        const parts = urlmask.split(/[*^|]/);
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            if (part.length > longest.length) {
                longest = part;
            }
        }

        return longest ? longest.toLowerCase() : null;
    }

    /**
     * Extracts a shortcut from a regexp rule.
     *
     * @param {string} ruleText rule text
     * @returns {string} shortcut or null if it's not possible to extract it
     */
    function extractRegexpShortcut(ruleText) {
        // Get the regexp text
        const match = ruleText.match(/\/(.*)\/(\$.*)?/);
        if (!match || match.length < 2) {
            return null;
        }

        let reText = match[1];

        const specialCharacter = '...';

        if (reText.indexOf('?') !== -1) {
            // Do not mess with complex expressions which use lookahead
            // And with those using ? special character: https://github.com/AdguardTeam/AdguardBrowserExtension/issues/978
            return null;
        }

        // (Dirty) prepend specialCharacter for the following replace calls to work properly
        reText = specialCharacter + reText;

        // Strip all types of brackets
        reText = reText.replace(/[^\\]\(.*[^\\]\)/, specialCharacter);
        reText = reText.replace(/[^\\]\[.*[^\\]\]/, specialCharacter);
        reText = reText.replace(/[^\\]\{.*[^\\]\}/, specialCharacter);

        // Strip some special characters
        reText = reText.replace(/[^\\]\\[a-zA-Z]/, specialCharacter);

        // Split by special characters
        const parts = reText.split(/[\\^$*+?.()|[\]{}]/);
        let token = '';
        let iParts = parts.length;
        while (iParts--) {
            const part = parts[iParts];
            if (part.length > token.length) {
                token = part;
            }
        }

        return token ? token.toLowerCase() : null;
    }

    /**
     * Parse rule text
     * @param ruleText
     * @returns {{urlRuleText: *, options: *, whiteListRule: *}}
     * @private
     */
    function parseRuleText(ruleText) {
        let urlRuleText = ruleText;
        let whiteListRule = null;
        let options = null;

        let startIndex = 0;

        if (adguard.utils.strings.startWith(urlRuleText, api.FilterRule.MASK_WHITE_LIST)) {
            startIndex = api.FilterRule.MASK_WHITE_LIST.length;
            urlRuleText = urlRuleText.substring(startIndex);
            whiteListRule = true;
        }

        let parseOptions = true;
        /**
         * https://github.com/AdguardTeam/AdguardBrowserExtension/issues/517
         * regexp rule may contain dollar sign which also is options delimiter
         */
        // Added check for replacement rule, because maybe problem with rules for example /.*/$replace=/hello/bug/

        if (adguard.utils.strings.startWith(urlRuleText, api.UrlFilterRule.MASK_REGEX_RULE)
            && adguard.utils.strings.endsWith(urlRuleText, api.UrlFilterRule.MASK_REGEX_RULE)
            && !adguard.utils.strings.contains(urlRuleText, `${api.UrlFilterRule.REPLACE_OPTION}=`)) {
            parseOptions = false;
        }

        if (parseOptions) {
            let foundEscaped = false;
            // Start looking from the prev to the last symbol
            // If dollar sign is the last symbol - we simply ignore it.
            for (let i = (ruleText.length - 2); i >= startIndex; i--) {
                const c = ruleText.charAt(i);
                if (c === UrlFilterRule.OPTIONS_DELIMITER) {
                    if (i > 0 && ruleText.charAt(i - 1) === ESCAPE_CHARACTER) {
                        foundEscaped = true;
                    } else {
                        urlRuleText = ruleText.substring(startIndex, i);
                        options = ruleText.substring(i + 1);

                        if (foundEscaped) {
                            // Find and replace escaped options delimiter
                            const search = api.SimpleRegex.escapeRegExp(ESCAPE_CHARACTER + UrlFilterRule.OPTIONS_DELIMITER);
                            const regexp = new RegExp(search, 'g');
                            options = options.replace(regexp, UrlFilterRule.OPTIONS_DELIMITER);
                        }

                        // Options delimiter was found, doing nothing
                        break;
                    }
                }
            }
        }

        // Transform to punycode
        urlRuleText = getAsciiDomainRule(urlRuleText);

        return {
            urlRuleText,
            options,
            whiteListRule,
        };
    }

    /**
     * Validates CSP rule
     * @param rule Rule with $CSP modifier
     */
    function validateCspRule(rule) {
        /**
         * https://github.com/AdguardTeam/AdguardBrowserExtension/issues/685
         * CSP directive may be empty in case of whitelist rule, it means to disable all $csp rules matching the whitelist rule
         */
        if (!rule.whiteListRule && !rule.cspDirective) {
            throw new Error('Invalid $CSP rule: CSP directive must not be empty');
        }

        if (rule.cspDirective) {
            /**
             * https://github.com/AdguardTeam/AdguardBrowserExtension/issues/685#issue-228287090
             * Forbids report-to and report-uri directives
             */
            const cspDirective = rule.cspDirective.toLowerCase();
            if (cspDirective.indexOf('report-') >= 0) {
                throw new Error(`Forbidden CSP directive: ${cspDirective}`);
            }
        }
    }

    /**
     * Represents a $replace modifier value.
     * <p/>
     * Learn more about this modifier syntax here:
     * https://github.com/AdguardTeam/AdguardForWindows/issues/591
     */
    function ReplaceOption(option) {
        if (!option) {
            return {
                optionText: '',
            };
        }

        const parts = adguard.utils.strings.splitByDelimiterWithEscapeCharacter(option, '/', ESCAPE_CHARACTER, true);

        if (parts.length < 2 || parts.length > 3) {
            throw `Cannot parse ${option}`;
        }

        let modifiers = (parts[2] || '');
        if (modifiers.indexOf('g') < 0) {
            modifiers += 'g';
        }

        const pattern = new RegExp(parts[0], modifiers);
        const replacement = parts[1];

        const apply = input => input.replace(pattern, replacement);

        return {
            apply,
            optionText: option,
        };
    }

    function RedirectOption(option) {
        const getRedirectUrl = () => adguard.rules.RedirectFilterService.buildRedirectUrl(option);
        return { getRedirectUrl, redirectTitle: option };
    }

    /**
     * @typedef CookieOption
     * @type {object}
     * @property {RegExp} regex If not null this is a regex used to match cookie names
     * @property {string} cookieName An exact cookie name used to match cookies by name
     * @property {string} sameSite If not null, this is a Same-Site value to be forced for a matching cookie
     * @property {number} maxAge If not null, this is a cookie's maximum age to be enforced
     */

    /**
     * Represents a $cookie modifier option value.
     *
     * Learn more about it here:
     * https://github.com/AdguardTeam/AdguardBrowserExtension/issues/961
     *
     * @param {string} option Option string value
     * @see {@link CookieOption}
     * @constructor
     */
    function CookieOption(option) {
        // Save the source text of the option modifier
        this.option = option || '';

        // Initialize properties with null
        this.regex = null;
        this.cookieName = null;
        this.sameSite = null;
        this.maxAge = null;

        // Parse cookie name/regex
        const parts = this.option.split(/;/);
        const cookieName = parts[0];
        if (adguard.utils.strings.startWith(cookieName, '/') && adguard.utils.strings.endsWith(cookieName, '/')) {
            const pattern = cookieName.substring(1, cookieName.length - 1);

            // Save regex to be used further for matching cookies
            this.regex = new RegExp(pattern);
        } else {
            // Match by cookie name
            this.cookieName = cookieName;
        }

        // Parse other cookie options
        if (parts.length > 1) {
            for (let i = 1; i < parts.length; i += 1) {
                const nameValue = parts[i].split('=');
                const optionName = nameValue[0];
                const optionValue = nameValue[1];

                if (optionName === UrlFilterRule.cookieOptions.MAX_AGE) {
                    this.maxAge = parseInt(optionValue);
                } else if (optionName === UrlFilterRule.cookieOptions.SAME_SITE) {
                    this.sameSite = optionValue;
                } else {
                    throw `Unknown $cookie option: ${optionName}`;
                }
            }
        }

        /**
         * Checks if cookie with the specified name matches this option
         *
         * @param {string} name Cookie name
         * @return {boolean} true if it does
         */
        this.matches = function (name) {
            if (!name) {
                return false;
            }

            if (this.regex) {
                return this.regex.test(name);
            } if (this.cookieName) {
                return this.cookieName === name;
            }
            // Empty regex and cookieName means that we must match all cookies
            return true;
        };

        /**
         * Checks if cookie rule has an empty $cookie option
         * @return {boolean} True if $cookie option is empty
         */
        this.isEmpty = function () {
            return !this.regex && !this.cookieName;
        };
    }

    /**
     * Check if the specified options mask contains the given option
     * @param options Options
     * @param option Option
     */
    function containsOption(options, option) {
        return options !== null
            && (options & option) === option;
    }

    /**
     * Rule for blocking requests to URLs.
     * Read here for details:
     * http://adguard.com/en/filterrules.html#baseRules
     */
    var UrlFilterRule = function (rule, filterId) {
        api.FilterRule.call(this, rule, filterId);

        // Url shortcut
        this.shortcut = null;
        // Content type masks
        this.permittedContentType = UrlFilterRule.contentTypes.ALL;
        this.restrictedContentType = 0;
        // Rule options
        this.enabledOptions = null;
        this.disabledOptions = null;

        // Parse rule text
        const parseResult = parseRuleText(rule);

        // Exception rule flag
        if (parseResult.whiteListRule) {
            this.whiteListRule = true;
        }

        // Load options
        if (parseResult.options) {
            this._loadOptions(parseResult.options);
        }

        const { urlRuleText } = parseResult;

        this.isRegexRule = adguard.utils.strings.startWith(urlRuleText, UrlFilterRule.MASK_REGEX_RULE)
            && adguard.utils.strings.endsWith(urlRuleText, UrlFilterRule.MASK_REGEX_RULE)
            || urlRuleText === ''
            || urlRuleText === UrlFilterRule.MASK_ANY_SYMBOL;

        if (this.isRegexRule) {
            this.urlRegExpSource = urlRuleText.substring(UrlFilterRule.MASK_REGEX_RULE.length, urlRuleText.length - UrlFilterRule.MASK_REGEX_RULE.length);

            // Pre compile regex rules
            const regexp = this.getUrlRegExp();
            if (!regexp) {
                throw Error('Illegal regexp rule');
            }

            // Except cookie rules, they have their own atmosphere
            if (!this.isCookieRule()
                && UrlFilterRule.ANY_URL_REGEX === regexp && !this.hasPermittedDomains()) {
                // Rule matches everything and does not have any domain restriction
                throw Error(`Too wide basic rule: ${urlRuleText}`);
            }

            // Extract shortcut from regexp rule
            this.shortcut = extractRegexpShortcut(urlRuleText);
        } else {
            // Searching for the rule shortcut
            this.shortcut = findShortcut(urlRuleText);
        }

        if (this.isCspRule()) {
            validateCspRule(this);
        }
    };

    UrlFilterRule.prototype = Object.create(api.FilterRule.prototype);

    // Lazy regexp source create
    UrlFilterRule.prototype.getUrlRegExpSource = function () {
        if (!this.urlRegExpSource) {
            // parse rule text
            const parseResult = parseRuleText(this.ruleText);
            // Creating regex source
            this.urlRegExpSource = api.SimpleRegex.createRegexText(parseResult.urlRuleText);
        }
        return this.urlRegExpSource;
    };

    UrlFilterRule.prototype.addStealthActions = function (actions) {
        this.stealthActions = actions;
    };

    /**
     * $replace modifier.
     * Learn more about this modifier syntax here:
     * https://github.com/AdguardTeam/AdguardForWindows/issues/591
     *
     * @return Parsed $replace modifier
     */
    UrlFilterRule.prototype.getReplace = function () {
        return this.replaceOption;
    };

    /**
     * $redirect modifier
     * Learn more about this modifier syntax here:
     * https://github.com/AdguardTeam/AdguardBrowserExtension/issues/1367
     *
     * @returns parsed $redirect modifier
     */
    UrlFilterRule.prototype.getRedirect = function () {
        return this.redirectOption;
    };

    /**
     * $cookie modifier
     * @return {CookieOption} Parsed $cookie modifier
     */
    UrlFilterRule.prototype.getCookieOption = function () {
        return this.cookieOption;
    };

    // Lazy regexp creation
    UrlFilterRule.prototype.getUrlRegExp = function () {
        // check already compiled but not successful
        if (this.wrongUrlRegExp) {
            return null;
        }

        if (!this.urlRegExp) {
            const urlRegExpSource = this.getUrlRegExpSource();
            try {
                if (!urlRegExpSource || UrlFilterRule.MASK_ANY_SYMBOL === urlRegExpSource) {
                    // Match any symbol
                    this.urlRegExp = UrlFilterRule.ANY_URL_REGEX;
                } else {
                    this.urlRegExp = new RegExp(urlRegExpSource, this.isMatchCase() ? '' : 'i');
                }

                delete this.urlRegExpSource;
            } catch (ex) {
                // malformed regexp
                adguard.console.error('Error create regexp from {0}', urlRegExpSource);
                this.wrongUrlRegExp = true;
                return null;
            }
        }

        return this.urlRegExp;
    };

    /**
     * Checks if url is for any url
     * @returns {boolean}
     */
    UrlFilterRule.prototype.isAnyUrl = function () {
        return this.shortcut === null
            && this.getUrlRegExp() === UrlFilterRule.ANY_URL_REGEX;
    };

    /**
     * There are two exceptions for domain permitting in url blocking rules.
     * White list rules must fire when request has no referrer.
     * Also rules without third-party option should fire.
     *
     * @param domainName
     * @returns {*}
     */
    UrlFilterRule.prototype.isPermitted = function (domainName) {
        if (!domainName) {
            const hasPermittedDomains = this.hasPermittedDomains();

            // For white list rules to fire when request has no referrer
            if (this.whiteListRule && !hasPermittedDomains) {
                return true;
            }

            // Also firing rules when there's no constraint on ThirdParty-FirstParty type
            if (!this.isCheckThirdParty() && !hasPermittedDomains) {
                return true;
            }
        }

        return api.FilterRule.prototype.isPermitted.call(this, domainName);
    };

    /**
     * Checks if this rule matches specified request
     *
     * @param requestUrl            Request url
     * @param thirdParty            true if request is third-party
     * @param requestType           Request type (one of adguard.RequestTypes)
     * @return {boolean} true if request url matches this rule
     */
    UrlFilterRule.prototype.isFiltered = function (requestUrl, thirdParty, requestType) {
        if (this.isOptionEnabled(UrlFilterRule.options.THIRD_PARTY) && !thirdParty) {
            // Rule is with $third-party modifier but request is not third party
            return false;
        }

        if (this.isOptionDisabled(UrlFilterRule.options.THIRD_PARTY) && thirdParty) {
            // Match only requests with a Referer header.
            // Rule is with $~third-party modifier but request is third party
            return false;
        }

        if (!this.checkContentType(requestType)) {
            return false;
        }

        // Shortcut is always in lower case
        if (this.shortcut !== null && requestUrl.toLowerCase().indexOf(this.shortcut) === -1) {
            return false;
        }

        const regexp = this.getUrlRegExp();
        if (!regexp) {
            // malformed regexp rule
            return false;
        }
        return regexp.test(requestUrl);
    };

    /**
     * Checks if request matches rule's content type constraints
     *
     * @param contentType Request type
     * @return true if request matches this content type
     */
    UrlFilterRule.prototype.checkContentType = function (contentType) {
        const contentTypeMask = UrlFilterRule.contentTypes[contentType];
        if (!contentTypeMask) {
            throw new Error(`Unsupported content type ${contentType}`);
        }
        return this.checkContentTypeMask(contentTypeMask);
    };

    /**
     * Checks if request matches rule's content type constraints
     *
     * @param contentTypeMask Request content types mask
     * @return true if request matches this content type
     */
    UrlFilterRule.prototype.checkContentTypeMask = function (contentTypeMask) {
        if (this.permittedContentType === UrlFilterRule.contentTypes.ALL
            && this.restrictedContentType === 0) {
            // Rule does not contain any constraint
            return true;
        }

        // Checking that either all content types are permitted or request content type
        // is in the permitted list
        const matchesPermitted = this.permittedContentType === UrlFilterRule.contentTypes.ALL
            || (this.permittedContentType & contentTypeMask) !== 0;

        // Checking that either no content types are restricted or request content type
        // is not in the restricted list
        const notMatchesRestricted = this.restrictedContentType === 0
            || (this.restrictedContentType & contentTypeMask) === 0;

        return matchesPermitted && notMatchesRestricted;
    };

    /**
     * Checks if specified option is enabled
     *
     * @param option Option to check
     * @return true if enabled
     */
    UrlFilterRule.prototype.isOptionEnabled = function (option) {
        return containsOption(this.enabledOptions, option);
    };

    /**
     * Checks if specified option is disabled
     *
     * @param option Option to check
     * @return true if disabled
     */
    UrlFilterRule.prototype.isOptionDisabled = function (option) {
        return containsOption(this.disabledOptions, option);
    };

    /**
     * Returns true if this rule can be applied to DOCUMENT only.
     * Examples: $popup, $elemhide and such.
     * Such rules have higher priority than common rules.
     *
     * @return true for document-level rules
     */
    UrlFilterRule.prototype.isDocumentLevel = function () {
        return this.documentLevelRule;
    };

    /**
     * True if this filter should check if request is third- or first-party.
     *
     * @return True if we should check third party property
     */
    UrlFilterRule.prototype.isCheckThirdParty = function () {
        return this.isOptionEnabled(UrlFilterRule.options.THIRD_PARTY)
            || this.isOptionDisabled(UrlFilterRule.options.THIRD_PARTY);
    };

    /**
     * If true - filter is only applied to requests from
     * a different origin that the currently viewed page.
     *
     * @return If true - filter third-party requests only
     */
    UrlFilterRule.prototype.isThirdParty = function () {
        if (this.isOptionEnabled(UrlFilterRule.options.THIRD_PARTY)) {
            return true;
        }
        if (this.isOptionDisabled(UrlFilterRule.options.THIRD_PARTY)) {
            return false;
        }
        return false;
    };

    /**
     * If true -- CssFilter cannot be applied to page
     *
     * @return true if CssFilter cannot be applied to page
     */
    UrlFilterRule.prototype.isElemhide = function () {
        return this.isOptionEnabled(UrlFilterRule.options.ELEMHIDE);
    };

    /**
     * Does not inject adguard javascript to page
     *
     * @return If true - we do not inject adguard js to page matching this rule
     */
    UrlFilterRule.prototype.isJsInject = function () {
        return this.isOptionEnabled(UrlFilterRule.options.JSINJECT);
    };

    /**
     * If true -- ContentFilter rules cannot be applied to page matching this rule.
     *
     * @return true if ContentFilter should not be applied to page matching this rule.
     */
    UrlFilterRule.prototype.isContent = function () {
        return this.isOptionEnabled(UrlFilterRule.options.CONTENT);
    };

    /**
     * Checks if the specified rule contains all document level options
     * @returns If true - contains $jsinject, $elemhide and $urlblock options
     */
    UrlFilterRule.prototype.isDocumentWhiteList = function () {
        return this.isOptionEnabled(UrlFilterRule.options.DOCUMENT_WHITELIST);
    };

    /**
     * If true - do not apply generic UrlFilter rules to the web page.
     *
     * @return true if generic url rules should not be applied.
     */
    UrlFilterRule.prototype.isGenericBlock = function () {
        return this.isOptionEnabled(UrlFilterRule.options.GENERICBLOCK);
    };

    /**
     * If true - do not apply generic CSS rules to the web page.
     *
     * @return true if generic CSS rules should not be applied.
     */
    UrlFilterRule.prototype.isGenericHide = function () {
        return this.isOptionEnabled(UrlFilterRule.options.GENERICHIDE);
    };

    /**
     * This attribute is only for exception rules. If true - do not use
     * url blocking rules for urls where referrer satisfies this rule.
     *
     * @return If true - do not block requests originated from the page matching this rule.
     */
    UrlFilterRule.prototype.isUrlBlock = function () {
        return this.isOptionEnabled(UrlFilterRule.options.URLBLOCK);
    };

    /**
     * If rule is case sensitive returns true
     *
     * @return true if rule is case sensitive
     */
    UrlFilterRule.prototype.isMatchCase = function () {
        return this.isOptionEnabled(UrlFilterRule.options.MATCH_CASE);
    };

    /**
     * If BlockPopups is true, than window should be closed
     *
     * @return true if window should be closed
     */
    UrlFilterRule.prototype.isBlockPopups = function () {
        return this.isOptionEnabled(UrlFilterRule.options.BLOCK_POPUPS);
    };

    /**
     * @returns true if this rule is csp
     */
    UrlFilterRule.prototype.isCspRule = function () {
        return this.isOptionEnabled(UrlFilterRule.options.CSP_RULE);
    };

    /**
     * @returns true if this rule is cookie
     */
    UrlFilterRule.prototype.isCookieRule = function () {
        return this.isOptionEnabled(UrlFilterRule.options.COOKIE_RULE);
    };

    /**
     * @returns true if this rule is redirect rule
     */
    UrlFilterRule.prototype.isRedirectRule = function () {
        return this.isOptionEnabled(UrlFilterRule.options.REDIRECT);
    };

    UrlFilterRule.prototype.isDocumentRule = function () {
        return this.isOptionEnabled(UrlFilterRule.options.DOCUMENT);
    };

    /**
     * @returns true if this rule is stealth
     */
    UrlFilterRule.prototype.isStealthRule = function () {
        return this.isOptionEnabled(UrlFilterRule.options.STEALTH);
    };

    /**
     * If rule is bad-filter returns true
     */
    UrlFilterRule.prototype.isBadFilter = function () {
        return this.badFilter != null;
    };

    /**
     * If rule is replace rule
     * @returns {Boolean}
     */
    UrlFilterRule.prototype.isReplaceRule = function () {
        return this.isOptionEnabled(UrlFilterRule.options.REPLACE);
    };

    /**
     * we recognize rules with $extension modifier, but
     * ignore them when create RequestFilter
     */
    UrlFilterRule.prototype.isIgnored = function () {
        return this.isOptionEnabled(UrlFilterRule.options.EXTENSION);
    };

    /**
     * Function gets options name, checks if there are alternative variants of this name
     * and returns it if found. If not found returns same name.
     * @param {string} optionName
     * @returns {string} options names in array
     */
    const checkAndReplaceIfAlias = (optionName) => {
        const OPTION_ALIASES_MAP = {
            'FIRST-PARTY': api.FilterRule.NOT_MARK + UrlFilterRule.THIRD_PARTY_OPTION,
            'XHR': UrlFilterRule.XMLHTTPREQUEST_OPTION,
            'POPUNDER': UrlFilterRule.POPUP_OPTION,
            '1P': api.FilterRule.NOT_MARK + UrlFilterRule.THIRD_PARTY_OPTION,
            '3P': UrlFilterRule.THIRD_PARTY_OPTION,
            'CSS': UrlFilterRule.STYLESHEET_OPTION,
            'FRAME': UrlFilterRule.SUBDOCUMENT_OPTION,
        };

        const upperCaseOptionName = optionName.toUpperCase();

        return OPTION_ALIASES_MAP[upperCaseOptionName] || optionName;
    };

    /**
     * Extracts options and their values from string
     * @param options
     * @returns {{optionName: string, optionValue: string}[]}
     */
    const extractOptionsAndValues = (options) => {
        const optionsParts = adguard.utils.strings.splitByDelimiterWithEscapeCharacter(
            options,
            api.FilterRule.COMA_DELIMITER,
            ESCAPE_CHARACTER,
            false
        );

        return optionsParts.reduce((acc, optionPart) => {
            const valueIndex = optionPart.indexOf(api.FilterRule.EQUAL);
            let optionName = valueIndex >= 0 ? optionPart.substr(0, valueIndex) : optionPart;
            const optionValue = valueIndex >= 0 ? optionPart.substr(valueIndex + 1) : '';
            optionName = checkAndReplaceIfAlias(optionName);

            acc.push({ optionName, optionValue });

            return acc;
        }, []);
    };

    /**
     * Loads rule options
     * @param options Options string
     * @private
     */
    UrlFilterRule.prototype._loadOptions = function (options) {
        const optionsParts = extractOptionsAndValues(options);

        for (let i = 0; i < optionsParts.length; i += 1) {
            // eslint-disable-next-line prefer-const
            let { optionName, optionValue } = optionsParts[i];

            switch (optionName) {
                case UrlFilterRule.DOMAIN_OPTION:
                    if (optionValue) {
                        // Load domain option
                        this.loadDomains(optionValue);
                    }
                    break;
                case UrlFilterRule.THIRD_PARTY_OPTION:
                    this._setUrlFilterRuleOption(UrlFilterRule.options.THIRD_PARTY, true);
                    break;
                case api.FilterRule.NOT_MARK + UrlFilterRule.THIRD_PARTY_OPTION:
                    this._setUrlFilterRuleOption(UrlFilterRule.options.THIRD_PARTY, false);
                    break;
                case UrlFilterRule.MATCH_CASE_OPTION:
                    this._setUrlFilterRuleOption(UrlFilterRule.options.MATCH_CASE, true);
                    break;
                case UrlFilterRule.IMPORTANT_OPTION:
                    this.isImportant = true;
                    break;
                case api.FilterRule.NOT_MARK + UrlFilterRule.IMPORTANT_OPTION:
                    this.isImportant = false;
                    break;
                case UrlFilterRule.ELEMHIDE_OPTION:
                    this._setUrlFilterRuleOption(UrlFilterRule.options.ELEMHIDE, true);
                    break;
                case UrlFilterRule.GENERICHIDE_OPTION:
                    this._setUrlFilterRuleOption(UrlFilterRule.options.GENERICHIDE, true);
                    break;
                case UrlFilterRule.JSINJECT_OPTION:
                    this._setUrlFilterRuleOption(UrlFilterRule.options.JSINJECT, true);
                    break;
                case UrlFilterRule.CONTENT_OPTION:
                    this._setUrlFilterRuleOption(UrlFilterRule.options.CONTENT, true);
                    break;
                case UrlFilterRule.URLBLOCK_OPTION:
                    this._setUrlFilterRuleOption(UrlFilterRule.options.URLBLOCK, true);
                    break;
                case UrlFilterRule.GENERICBLOCK_OPTION:
                    this._setUrlFilterRuleOption(UrlFilterRule.options.GENERICBLOCK, true);
                    break;
                case UrlFilterRule.DOCUMENT_OPTION:
                    this._setUrlFilterRuleOption(UrlFilterRule.options.DOCUMENT_WHITELIST, true);
                    this._setUrlFilterRuleOption(UrlFilterRule.options.DOCUMENT, true);
                    break;
                case UrlFilterRule.POPUP_OPTION:
                    this._setUrlFilterRuleOption(UrlFilterRule.options.BLOCK_POPUPS, true);
                    break;
                case UrlFilterRule.EXTENSION_OPTION:
                    this._setUrlFilterRuleOption(UrlFilterRule.options.EXTENSION, true);
                    break;
                case UrlFilterRule.CSP_OPTION:
                    this._setUrlFilterRuleOption(UrlFilterRule.options.CSP_RULE, true);
                    this.cspDirective = optionValue;
                    break;
                case UrlFilterRule.COOKIE_OPTION:
                    this._setUrlFilterRuleOption(UrlFilterRule.options.COOKIE_RULE, true);
                    this.cookieOption = new CookieOption(optionValue);
                    break;
                case UrlFilterRule.REDIRECT_OPTION: {
                    // In case if redirect source doesn't exists, throw error;
                    const redirectSource = adguard.rules.RedirectFilterService.hasRedirect(optionValue);
                    if (!redirectSource) {
                        throw new Error(`Unknown redirect source title: ${optionValue}`);
                    }
                    this._setUrlFilterRuleOption(UrlFilterRule.options.REDIRECT, true);
                    this.redirectOption = new RedirectOption(optionValue);
                    break;
                }
                case UrlFilterRule.REPLACE_OPTION:
                    // In case of .features or .features.responseContentFilteringSupported are not defined
                    const responseContentFilteringSupported = adguard.prefs.features
                        && adguard.prefs.features.responseContentFilteringSupported;
                    if (!responseContentFilteringSupported) {
                        throw new Error('Unknown option: REPLACE');
                    }
                    this._setUrlFilterRuleOption(UrlFilterRule.options.REPLACE, true);
                    this.replaceOption = new ReplaceOption(optionValue);
                    break;
                case UrlFilterRule.BADFILTER_OPTION:
                    this.badFilter = this.ruleText
                        .replace(UrlFilterRule.OPTIONS_DELIMITER + UrlFilterRule.BADFILTER_OPTION + api.FilterRule.COMA_DELIMITER, UrlFilterRule.OPTIONS_DELIMITER)
                        .replace(api.FilterRule.COMA_DELIMITER + UrlFilterRule.BADFILTER_OPTION, '')
                        .replace(UrlFilterRule.OPTIONS_DELIMITER + UrlFilterRule.BADFILTER_OPTION, '');
                    break;
                case UrlFilterRule.STEALTH_OPTION:
                    this._setUrlFilterRuleOption(UrlFilterRule.options.STEALTH, true);
                    break;
                default:
                    optionName = optionName.toUpperCase();

                    if (optionName in UrlFilterRule.contentTypes) {
                        this._appendPermittedContentType(UrlFilterRule.contentTypes[optionName]);
                    } else if (optionName[0] === api.FilterRule.NOT_MARK && optionName.substring(1) in UrlFilterRule.contentTypes) {
                        this._appendRestrictedContentType(UrlFilterRule.contentTypes[optionName.substring(1)]);
                    } else if (optionName in UrlFilterRule.ignoreOptions) {
                        // Ignore others
                    } else {
                        throw `Unknown option: ${optionName}`;
                    }
            }
        }

        /**
         * Rules of this types can be applied to documents only
         * for whitelist rules: $jsinject, $elemhide, $urlblock, $genericblock,
         * $generichide and $content
         * for url blocking: $popup
         */
        if (this.isOptionEnabled(UrlFilterRule.options.JSINJECT)
            || this.isOptionEnabled(UrlFilterRule.options.ELEMHIDE)
            || this.isOptionEnabled(UrlFilterRule.options.CONTENT)
            || this.isOptionEnabled(UrlFilterRule.options.URLBLOCK)
            || this.isOptionEnabled(UrlFilterRule.options.BLOCK_POPUPS)
            || this.isOptionEnabled(UrlFilterRule.options.GENERICBLOCK)
            || this.isOptionEnabled(UrlFilterRule.options.GENERICHIDE)) {
            this.permittedContentType = UrlFilterRule.contentTypes.DOCUMENT;
            this.documentLevelRule = true;
        }
    };

    /**
     * Appends new content type value to permitted list
     * (depending on the current permitted content types)
     *
     * @param contentType Content type to append
     */
    UrlFilterRule.prototype._appendPermittedContentType = function (contentType) {
        if (this.permittedContentType === UrlFilterRule.contentTypes.ALL) {
            this.permittedContentType = contentType;
        } else {
            this.permittedContentType |= contentType;
        }
    };

    /**
     * Appends new content type to restricted list
     * (depending on the current restricted content types)
     *
     * @param contentType Content type to append
     */
    UrlFilterRule.prototype._appendRestrictedContentType = function (contentType) {
        if (this.restrictedContentType === 0) {
            this.restrictedContentType = contentType;
        } else {
            this.restrictedContentType |= contentType;
        }
    };

    /**
     * Sets UrlFilterRuleOption
     *
     * @param option  Option
     * @param enabled Enabled or not
     */
    UrlFilterRule.prototype._setUrlFilterRuleOption = function (option, enabled) {
        if (enabled) {
            if (!this.whiteListRule && containsOption(UrlFilterRule.options.WHITELIST_OPTIONS, option)) {
                throw new Error(`${option} cannot be applied to this type of rule`);
            }

            if (this.enabledOptions === null) {
                this.enabledOptions = option;
            } else {
                this.enabledOptions |= option;
            }
        } else if (this.disabledOptions === null) {
            this.disabledOptions = option;
        } else {
            this.disabledOptions |= option;
        }
    };

    UrlFilterRule.OPTIONS_DELIMITER = '$';
    UrlFilterRule.DOMAIN_OPTION = 'domain';
    UrlFilterRule.THIRD_PARTY_OPTION = 'third-party';
    UrlFilterRule.MATCH_CASE_OPTION = 'match-case';
    UrlFilterRule.DOCUMENT_OPTION = 'document';
    UrlFilterRule.ELEMHIDE_OPTION = 'elemhide';
    UrlFilterRule.GENERICHIDE_OPTION = 'generichide';
    UrlFilterRule.URLBLOCK_OPTION = 'urlblock';
    UrlFilterRule.GENERICBLOCK_OPTION = 'genericblock';
    UrlFilterRule.JSINJECT_OPTION = 'jsinject';
    UrlFilterRule.CONTENT_OPTION = 'content';
    UrlFilterRule.POPUP_OPTION = 'popup';
    UrlFilterRule.IMPORTANT_OPTION = 'important';
    UrlFilterRule.MASK_REGEX_RULE = '/';
    UrlFilterRule.MASK_ANY_SYMBOL = '*';
    UrlFilterRule.ANY_URL_REGEX = /.*/;
    UrlFilterRule.EMPTY_OPTION = 'empty';
    // Extension doesn't support replace rules, $replace option is here only for correct parsing
    UrlFilterRule.REPLACE_OPTION = 'replace';
    // Extension doesn't support extension rules, $extension option is here only for correct parsing
    UrlFilterRule.EXTENSION_OPTION = 'extension';
    UrlFilterRule.CSP_OPTION = 'csp';
    UrlFilterRule.COOKIE_OPTION = 'cookie';
    UrlFilterRule.BADFILTER_OPTION = 'badfilter';
    UrlFilterRule.STEALTH_OPTION = 'stealth';
    UrlFilterRule.REDIRECT_OPTION = 'redirect';
    UrlFilterRule.XMLHTTPREQUEST_OPTION = 'xmlhttprequest';
    UrlFilterRule.STYLESHEET_OPTION = 'stylesheet';
    UrlFilterRule.SUBDOCUMENT_OPTION = 'subdocument';
    UrlFilterRule.PING_OPTION = 'ping';

    UrlFilterRule.contentTypes = {
        OTHER: 1 << 0,
        SCRIPT: 1 << 1,
        IMAGE: 1 << 2,
        STYLESHEET: 1 << 3,
        OBJECT: 1 << 4,
        SUBDOCUMENT: 1 << 5,
        XMLHTTPREQUEST: 1 << 6,
        MEDIA: 1 << 7,
        FONT: 1 << 8,
        WEBSOCKET: 1 << 9,
        WEBRTC: 1 << 10,
        DOCUMENT: 1 << 11,
        PING: 1 << 12,
    };

    UrlFilterRule.contentTypes.ALL = 0;
    for (const key in UrlFilterRule.contentTypes) {
        if (UrlFilterRule.contentTypes.hasOwnProperty(key)) {
            UrlFilterRule.contentTypes.ALL |= UrlFilterRule.contentTypes[key];
        }
    }

    /**
     * $cookie options that can be used in the cookie rule.
     *
     * See here for the details:
     * https://github.com/AdguardTeam/AdguardBrowserExtension/issues/961
     */
    UrlFilterRule.cookieOptions = {
        MAX_AGE: 'maxAge',
        SAME_SITE: 'sameSite',
    };

    UrlFilterRule.options = {
        /**
         * $elemhide modifier.
         * it makes sense to use this parameter for exceptions only.
         * It prohibits element hiding rules on pages affected by the current rule.
         * Element hiding rules will be described below.
         */
        ELEMHIDE: 1 << 0,

        /**
         * limitation on third-party and own requests.
         * If the third-party parameter is used, the rule is applied only to requests
         * coming from external sources. Similarly, ~third-party restricts the rule
         * to requests from the same source that the page comes from. Let’s use an example.
         * The ||domain.com$third-party rule is applied to all sites, except domain.com
         * itself. If we rewrite it as ||domain.com$~third-party, it will be applied
         * only to domain.com, but will not work on other sites.
         */
        THIRD_PARTY: 1 << 1,

        /**
         * If this option is enabled, Adguard won't apply generic CSS rules to the web page.
         */
        GENERICHIDE: 1 << 2,

        /**
         * If this option is enabled, Adguard won't apply generic UrlFilter rules to the web page.
         */
        GENERICBLOCK: 1 << 3,

        /**
         * it makes sense to use this parameter for exceptions only.
         * It prohibits the injection of javascript code to web pages.
         * Javascript code is added for blocking banners by size and for
         * the proper operation of Adguard Assistant
         */
        JSINJECT: 1 << 4,

        /**
         * It makes sense to use this parameter for exceptions only.
         * It prohibits the blocking of requests from pages
         * affected by the current rule.
         *
         * This attribute is only for exception rules. If true - do not use urlblocking rules
         * for urls where referrer satisfies this rule.
         */
        URLBLOCK: 1 << 5,

        /**
         * it makes sense to use this parameter for exceptions only.
         * It prohibits HTML filtration rules on pages affected by the current rule.
         * HTML filtration rules will be described below.
         */
        CONTENT: 1 << 6,

        /**
         * For any address matching a&nbsp;blocking rule with this option
         * Adguard will try to&nbsp;automatically close the browser tab.
         */
        BLOCK_POPUPS: 1 << 7,

        /**
         * defines a rule applied only to addresses with exact letter case matches.
         * For example, /BannerAd.gif$match-case will block http://example.com/BannerAd.gif,
         * but not http://example.com/bannerad.gif.
         * By default, the letter case is not matched.
         */
        MATCH_CASE: 1 << 8,

        /**
         * defines a CSP rule
         * For example, ||xpanama.net^$third-party,csp=connect-src 'none'
         */
        CSP_RULE: 1 << 9,

        /**
         * defines a Cookie rule
         * For example, ||example.com^$third-party,cookie=c_user
         */
        COOKIE_RULE: 1 << 10,

        /**
         * defines rules with $extension modifier
         * for example, @@||example.org^$extension
         */
        EXTENSION: 1 << 11,

        /**
         * defines rules with $replace modifier
         * for example, "||example.org^$replace=/replace-me/replacement/i"
         */
        REPLACE: 1 << 12,

        /**
         * defines rules with $stealth modifier
         * for example, "@@||example.com^$stealth"
         */
        STEALTH: 1 << 13,

        /**
         * defines rules with $redirect modifier
         * for example, "||example.com/someadd.js^$redirect=noopjs"
         */
        REDIRECT: 1 << 14,

        /**
         * defines rules with $document modifier
         * for example, "||example.org$document"
         */
        DOCUMENT: 1 << 15,
    };

    /**
     * These options can be applied to whitelist rules only
     */
    UrlFilterRule.options.WHITELIST_OPTIONS = UrlFilterRule.options.ELEMHIDE
        | UrlFilterRule.options.JSINJECT
        | UrlFilterRule.options.CONTENT
        | UrlFilterRule.options.GENERICHIDE
        | UrlFilterRule.options.GENERICBLOCK
        | UrlFilterRule.options.STEALTH;

    /**
     * These options define a document whitelisted rule
     */
    UrlFilterRule.options.DOCUMENT_WHITELIST = UrlFilterRule.options.ELEMHIDE
        | UrlFilterRule.options.URLBLOCK
        | UrlFilterRule.options.JSINJECT
        | UrlFilterRule.options.CONTENT;

    UrlFilterRule.ignoreOptions = {
        // Deprecated modifiers
        'BACKGROUND': true,
        '~BACKGROUND': true,
        // Unused modifiers
        'COLLAPSE': true,
        '~COLLAPSE': true,
        '~DOCUMENT': true,
        'EXTENSION': true,
        '~EXTENSION': true,
    };

    api.UrlFilterRule = UrlFilterRule;
})(adguard, adguard.rules);
