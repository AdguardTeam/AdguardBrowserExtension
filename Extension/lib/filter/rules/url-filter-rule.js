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
/* global require,exports */
/**
 * Initializing required libraries for this file.
 * require method is overridden in Chrome extension (port/require.js).
 */
var Prefs = require('../../../lib/prefs').Prefs;
var StringUtils = require('../../../lib/utils/common').StringUtils;
var FilterRule = require('../../../lib/filter/rules/base-filter-rule').FilterRule;
var Log = require('../../../lib/utils/log').Log;
var UrlUtils = require('../../../lib/utils/url').UrlUtils;
var SimpleRegex = require('../../../lib/filter/rules/simple-regex').SimpleRegex;

/**
 * Rule for blocking requests to URLs.
 * Read here for details:
 * http://adguard.com/en/filterrules.html#baseRules
 */
var UrlFilterRule = exports.UrlFilterRule = function (rule, filterId) {

    FilterRule.call(this, rule, filterId);

    // Url shortcut
    this.shortcut = null;
    // Content type masks
    this.permittedContentType = UrlFilterRule.contentTypes.ALL;
    this.restrictedContentType = 0;

    // Parse rule text
    var parseResult = parseRuleText(rule);
    // Load options
    if (parseResult.options) {
        this._loadOptions(parseResult.options);
    }

    // Exception rule flag
    if (parseResult.whiteListRule) {
        this.whiteListRule = true;
    }

    var urlRuleText = parseResult.urlRuleText;
    this.urlRuleText = urlRuleText;

    var isRegexRule = StringUtils.startWith(urlRuleText, UrlFilterRule.MASK_REGEX_RULE)
        && StringUtils.endWith(urlRuleText, UrlFilterRule.MASK_REGEX_RULE)
        || urlRuleText == ''
        || urlRuleText == UrlFilterRule.MASK_ANY_SYMBOL;

    if (isRegexRule) {
        this.urlRegExpSource = urlRuleText.substring(UrlFilterRule.MASK_REGEX_RULE.length, urlRuleText.length - UrlFilterRule.MASK_REGEX_RULE.length);
        // Pre compile regex rules
        var regexp = this.getUrlRegExp();
        if (!regexp) {
            throw 'Illegal regexp rule';
        }

        if (UrlFilterRule.REGEXP_ANY_SYMBOL == regexp && !this.hasPermittedDomains()) {
            // Rule matches everything and does not have any domain restriction
            throw ("Too wide basic rule: " + this.urlRuleText);
        }

        // Extract shortcut from regexp rule
        this.shortcut = extractRegexpShortcut(urlRuleText);
    } else {
        // Searching for shortcut
        this.shortcut = findShortcut(urlRuleText);
    }
};

UrlFilterRule.prototype = Object.create(FilterRule.prototype);

// Lazy regexp source create
UrlFilterRule.prototype.getUrlRegExpSource = function () {
    if (!this.urlRegExpSource) {
        //parse rule text
        var parseResult = parseRuleText(this.ruleText);
        // Creating regex source
        this.urlRegExpSource = SimpleRegex.createRegexText(parseResult.urlRuleText);
    }
    return this.urlRegExpSource;
};

// Lazy regexp creation
UrlFilterRule.prototype.getUrlRegExp = function () {
    //check already compiled but not successful
    if (this.wrongUrlRegExp) {
        return null;
    }

    if (!this.urlRegExp) {
        var urlRegExpSource = this.getUrlRegExpSource();
        try {
            if (!urlRegExpSource || UrlFilterRule.MASK_ANY_SYMBOL == urlRegExpSource) {
                // Match any symbol
                this.urlRegExp = new RegExp(UrlFilterRule.REGEXP_ANY_SYMBOL);
            } else {
                this.urlRegExp = new RegExp(urlRegExpSource, this.matchCase ? "" : "i");
            }

            delete this.urlRegExpSource;
        } catch (ex) {
            //malformed regexp
            Log.error('Error create regexp from {0}', urlRegExpSource);
            this.wrongUrlRegExp = true;
            return null;
        }
    }

    return this.urlRegExp;
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

    if (StringUtils.isEmpty(domainName)) {
        var hasPermittedDomains = this.hasPermittedDomains();

        // For white list rules to fire when request has no referrer
        if (this.whiteListRule && !hasPermittedDomains) {
            return true;
        }

        // Also firing rules when there's no constraint on ThirdParty-FirstParty type
        if (!this.checkThirdParty && !hasPermittedDomains) {
            return true;
        }
    }

    return FilterRule.prototype.isPermitted.call(this, domainName);
};

/**
 * Checks if this rule matches specified request
 *
 * @param requestUrl            Request url
 * @param thirdParty            true if request is third-party
 * @param requestContentType    Request content type (UrlFilterRule.contentTypes)
 * @return true if request url matches this rule
 */
UrlFilterRule.prototype.isFiltered = function (requestUrl, thirdParty, requestContentType) {

    if (this.checkThirdParty) {
        if (this.isThirdParty != thirdParty) {
            return false;
        }
    }

    if (this.shortcut !== null && !StringUtils.containsIgnoreCase(requestUrl, this.shortcut)) {
        return false;
    }

    if (!this.checkContentType(requestContentType)) {
        return false;
    }

    var regexp = this.getUrlRegExp();
    if (!regexp) {
        //malformed regexp rule
        return false;
    }
    return regexp.test(requestUrl);
};

/**
 * Checks if specified content type has intersection with rule's content types.
 *
 * @param contentType Request content type (UrlFilterRule.contentTypes)
 */
UrlFilterRule.prototype.checkContentType = function (contentType) {
    var contentTypeMask = UrlFilterRule.contentTypes[contentType];
    if ((this.permittedContentType & contentTypeMask) == 0) {
        //not in permitted list - skip this rule
        return false;
    }

    if (this.restrictedContentType !== 0 && (this.restrictedContentType & contentTypeMask) == contentTypeMask) {
        //in restricted list - skip this rule
        return false;
    }

    return true;
};

/**
 * Checks if specified content type is included in the rule content type.
 *
 * @param contentType Request content type (UrlFilterRule.contentTypes)
 */
UrlFilterRule.prototype.checkContentTypeIncluded = function (contentType) {
    var contentTypeMask = UrlFilterRule.contentTypes[contentType];
    if ((this.permittedContentType & contentTypeMask) == contentTypeMask) {
        if (this.restrictedContentType !== 0 && (this.restrictedContentType & contentTypeMask) == contentTypeMask) {
            //in restricted list - skip this rule
            return false;
        }

        return true;
    }

    return false;
};

/**
 * Loads rule options
 *
 * @param options Options string
 * @private
 */
UrlFilterRule.prototype._loadOptions = function (options) {

    var optionsParts = options.split(FilterRule.COMA_DELIMITER);

    var permittedContentType = 0;
    var restrictedContentType = 0;
    for (var i = 0; i < optionsParts.length; i++) {
        var option = optionsParts[i];
        var optionsKeyValue = option.split(FilterRule.EQUAL);
        var optionName = optionsKeyValue[0];

        switch (optionName) {
            case UrlFilterRule.DOMAIN_OPTION:
                if (optionsKeyValue.length > 1) {
                    var domains = optionsKeyValue[1];
                    if (optionsKeyValue.length > 2) {
                        domains = optionsKeyValue.slice(1).join(FilterRule.EQUAL);
                    }
                    // Load domain option
                    this.loadDomains(domains);
                }
                break;
            case UrlFilterRule.THIRD_PARTY_OPTION:
                // True if this filter should check if request is third- or first-party
                this.checkThirdParty = true;
                // If true filter is only apply to requests from a different origin than the currently viewed page
                this.isThirdParty = true;
                break;
            case FilterRule.NOT_MARK + UrlFilterRule.THIRD_PARTY_OPTION:
                this.checkThirdParty = true;
                this.isThirdParty = false;
                break;
            case UrlFilterRule.MATCH_CASE_OPTION:
                //If true - regex is matching case
                this.matchCase = true;
                break;
            case UrlFilterRule.IMPORTANT_OPTION:
                this.isImportant = true;
                break;
            case UrlFilterRule.NOT_MARK + UrlFilterRule.IMPORTANT_OPTION:
                this.isImportant = false;
                break;
            case UrlFilterRule.ELEMHIDE_OPTION:
                permittedContentType |= UrlFilterRule.contentTypes.ELEMHIDE;
                break;
            case UrlFilterRule.GENERICHIDE_OPTION:
                permittedContentType |= UrlFilterRule.contentTypes.GENERICHIDE;
                break;
            case UrlFilterRule.JSINJECT_OPTION:
                permittedContentType |= UrlFilterRule.contentTypes.JSINJECT;
                break;
            case UrlFilterRule.URLBLOCK_OPTION:
                permittedContentType |= UrlFilterRule.contentTypes.URLBLOCK;
                break;
            case UrlFilterRule.GENERICBLOCK_OPTION:
                permittedContentType |= UrlFilterRule.contentTypes.GENERICBLOCK;
                break;
            case UrlFilterRule.DOCUMENT_OPTION:
                permittedContentType |= UrlFilterRule.contentTypes.DOCUMENT;
                break;
            case UrlFilterRule.POPUP_OPTION:
                permittedContentType |= UrlFilterRule.contentTypes.POPUP;
                break;
            default:
                optionName = optionName.toUpperCase();
                if (optionName in UrlFilterRule.contentTypes) {
                    permittedContentType |= UrlFilterRule.contentTypes[optionName];
                } else if (optionName[0] == FilterRule.NOT_MARK && optionName.substring(1) in UrlFilterRule.contentTypes) {
                    restrictedContentType |= UrlFilterRule.contentTypes[optionName.substring(1)];
                } else if (optionName in UrlFilterRule.ignoreOptions) {
                    //ignore
                } else {
                    throw 'Unknown option: ' + optionName;
                }
        }
    }

    if (permittedContentType > 0) {
        this.permittedContentType = permittedContentType;
    }
    if (restrictedContentType > 0) {
        this.restrictedContentType = restrictedContentType;
    }
};

UrlFilterRule.OPTIONS_DELIMITER = "$";
UrlFilterRule.DOMAIN_OPTION = "domain";
UrlFilterRule.THIRD_PARTY_OPTION = "third-party";
UrlFilterRule.MATCH_CASE_OPTION = "match-case";
UrlFilterRule.DOCUMENT_OPTION = "document";
UrlFilterRule.ELEMHIDE_OPTION = "elemhide";
UrlFilterRule.GENERICHIDE_OPTION = "generichide";
UrlFilterRule.URLBLOCK_OPTION = "urlblock";
UrlFilterRule.GENERICBLOCK_OPTION = "genericblock";
UrlFilterRule.JSINJECT_OPTION = "jsinject";
UrlFilterRule.POPUP_OPTION = "popup";
UrlFilterRule.IMPORTANT_OPTION = "important";
UrlFilterRule.MASK_REGEX_RULE = "/";
UrlFilterRule.MASK_ANY_SYMBOL = "*";
UrlFilterRule.REGEXP_ANY_SYMBOL = ".*";

UrlFilterRule.contentTypes = {

    OTHER: 1 << 0,
    SCRIPT: 1 << 1,
    IMAGE: 1 << 2,
    STYLESHEET: 1 << 3,
    OBJECT: 1 << 4,
    SUBDOCUMENT: 1 << 5,
    XMLHTTPREQUEST: 1 << 6,
    'OBJECT-SUBREQUEST': 1 << 7,
    MEDIA: 1 << 8,
    FONT: 1 << 9,
    WEBSOCKET: 1 << 10,

    ELEMHIDE: 1 << 20,      //CssFilter cannot be applied to page
    URLBLOCK: 1 << 21,      //This attribute is only for exception rules. If true - do not use urlblocking rules for urls where referrer satisfies this rule.
    JSINJECT: 1 << 22,      //Does not inject javascript rules to page
    POPUP: 1 << 23,         //check block popups
    GENERICHIDE: 1 << 24,   //CssFilter generic rules cannot be applied to page
    GENERICBLOCK: 1 << 25,  //UrlFilter generic rules cannot be applied to page
    IMPORTANT: 1 << 26      //Important rules cannot be applied to page
};

// https://code.google.com/p/chromium/issues/detail?id=410382
if (Prefs.platform === 'chromium' || Prefs.platform == 'webkit') {
    UrlFilterRule.contentTypes['OBJECT-SUBREQUEST'] = UrlFilterRule.contentTypes.OBJECT;
}

UrlFilterRule.ignoreOptions = {
    // Deprecated modifiers
    'BACKGROUND': true,
    '~BACKGROUND': true,
    // Unused modifiers
    'COLLAPSE': true,
    '~COLLAPSE': true,
    '~DOCUMENT': true,
    // Process as a common url-blocking rule
    'EMPTY': true,
    // http://adguard.com/en/filterrules.html#advanced
    'CONTENT': true
};

UrlFilterRule.contentTypes.DOCUMENT = UrlFilterRule.contentTypes.ELEMHIDE | UrlFilterRule.contentTypes.URLBLOCK | UrlFilterRule.contentTypes.JSINJECT;
UrlFilterRule.contentTypes.DOCUMENT_LEVEL_EXCEPTIONS = UrlFilterRule.contentTypes.DOCUMENT | UrlFilterRule.contentTypes.GENERICHIDE | UrlFilterRule.contentTypes.GENERICBLOCK;

UrlFilterRule.contentTypes.ALL = 0;
UrlFilterRule.contentTypes.ALL |= UrlFilterRule.contentTypes.OTHER;
UrlFilterRule.contentTypes.ALL |= UrlFilterRule.contentTypes.SCRIPT;
UrlFilterRule.contentTypes.ALL |= UrlFilterRule.contentTypes.IMAGE;
UrlFilterRule.contentTypes.ALL |= UrlFilterRule.contentTypes.STYLESHEET;
UrlFilterRule.contentTypes.ALL |= UrlFilterRule.contentTypes.OBJECT;
UrlFilterRule.contentTypes.ALL |= UrlFilterRule.contentTypes.SUBDOCUMENT;
UrlFilterRule.contentTypes.ALL |= UrlFilterRule.contentTypes.XMLHTTPREQUEST;
UrlFilterRule.contentTypes.ALL |= UrlFilterRule.contentTypes['OBJECT-SUBREQUEST'];
UrlFilterRule.contentTypes.ALL |= UrlFilterRule.contentTypes.MEDIA;
UrlFilterRule.contentTypes.ALL |= UrlFilterRule.contentTypes.FONT;
UrlFilterRule.contentTypes.ALL |= UrlFilterRule.contentTypes.WEBSOCKET;

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

        var domain = parseRuleDomain(ruleText, true);
        if (!domain) {
            return "";
        }

        //In case of one domain
        return StringUtils.replaceAll(ruleText, domain, UrlUtils.toPunyCode(domain));
    } catch (ex) {
        Log.error("Error getAsciiDomainRule from {0}, cause {1}", ruleText, ex);
        return "";
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
        var i;
        var startsWith = ["http://www.", "https://www.", "http://", "https://", "||", "//"];
        var contains = ["/", "^"];
        var startIndex = parseOptions ? -1 : 0;

        for (i = 0; i < startsWith.length; i++) {
            var start = startsWith[i];
            if (StringUtils.startWith(ruleText, start)) {
                startIndex = start.length;
                break;
            }
        }

        if (parseOptions) {
            //exclusive for domain
            var exceptRule = "domain=";
            var domainIndex = ruleText.indexOf(exceptRule);
            if (domainIndex > -1 && ruleText.indexOf("$") > -1) {
                startIndex = domainIndex + exceptRule.length;
            }

            if (startIndex == -1) {
                //Domain is not found in rule options, so we continue a normal way
                startIndex = 0;
            }
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

        return symbolIndex == -1 ? ruleText.substring(startIndex) : ruleText.substring(startIndex, symbolIndex);
    } catch (ex) {
        Log.error("Error parsing domain from {0}, cause {1}", ruleText, ex);
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
    var longest = "";
    var parts = urlmask.split(/[*^|]/);
    for (var i = 0; i < parts.length; i++) {
        var part = parts[i];
        if (part.length > longest.length) {
            longest = part;
        }
    }
    return longest.toLowerCase();
}

/**
 * Extracts a shortcut from a regexp rule.
 *
 * @param ruleText
 * @returns {*}
 */
function extractRegexpShortcut(ruleText) {

    // Get the regexp text
    var match = ruleText.match(/\/(.*)\/(\$.*)?/);
    if (!match || match.length < 2) {
        return null;
    }

    var reText = match[1];

    var specialCharacter = "...";

    if (reText.indexOf('(?') >= 0 || reText.indexOf('(!?') >= 0) {
        // Do not mess with complex expressions which use lookahead
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
    var parts = reText.split(/[\\^$*+?.()|[\]{}]/);
    var token = "";
    var iParts = parts.length;
    while (iParts--) {
        var part = parts[iParts];
        if (part.length > token.length) {
            token = part;
        }
    }

    return token;
}

/**
 * Parse rule text
 * @param ruleText
 * @returns {{urlRuleText: *, options: *, whiteListRule: *}}
 * @private
 */
function parseRuleText(ruleText) {

    var urlRuleText = ruleText;
    var whiteListRule = null;
    var options = null;

    if (StringUtils.startWith(urlRuleText, FilterRule.MASK_WHITE_LIST)) {
        urlRuleText = urlRuleText.substring(FilterRule.MASK_WHITE_LIST.length);
        whiteListRule = true;
    }

    var optionsIndex = urlRuleText.lastIndexOf(UrlFilterRule.OPTIONS_DELIMITER);
    if (optionsIndex >= 0) {
        var optionsBase = urlRuleText;
        urlRuleText = urlRuleText.substring(0, optionsIndex);
        options = optionsBase.substring(optionsIndex + 1);
    }

    // Transform to punycode
    urlRuleText = getAsciiDomainRule(urlRuleText);

    return {
        urlRuleText: urlRuleText,
        options: options,
        whiteListRule: whiteListRule
    };
}