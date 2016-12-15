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

/* global SVGAnimatedString */

/**
 * Adguard rules constructor library
 */
var AdguardRulesConstructorLib = (function (api) {

    var CSS_RULE_MARK = '##';
    var RULE_OPTIONS_MARK = '$';

    var URLBLOCK_ATTRIBUTES = ["src", "data"];

    var linkHelper = document.createElement('a');

    /**
     * Escapes CSS
     * https://developer.mozilla.org/ru/docs/Web/API/CSS/escape
     */
    var escapeCss = (function () {

        if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
            return CSS.escape;
        }

		// Polyfill
		// https://github.com/mathiasbynens/CSS.escape/blob/master/css.escape.js
		return function (value) {

			var string = String(value);
			var length = string.length;
			var index = -1;
			var codeUnit;
			var result = '';
			var firstCodeUnit = string.charCodeAt(0);
			while (++index < length) {
				codeUnit = string.charCodeAt(index);
				// Note: there’s no need to special-case astral symbols, surrogate
				// pairs, or lone surrogates.

				// If the character is NULL (U+0000), then the REPLACEMENT CHARACTER
				// (U+FFFD).
				if (codeUnit === 0x0000) {
					result += '\uFFFD';
					continue;
				}

				if (
					// If the character is in the range [\1-\1F] (U+0001 to U+001F) or is
				// U+007F, […]
				(codeUnit >= 0x0001 && codeUnit <= 0x001F) || codeUnit === 0x007F ||
					// If the character is the first character and is in the range [0-9]
					// (U+0030 to U+0039), […]
				(index === 0 && codeUnit >= 0x0030 && codeUnit <= 0x0039) ||
					// If the character is the second character and is in the range [0-9]
					// (U+0030 to U+0039) and the first character is a `-` (U+002D), […]
				(
					index === 1 &&
					codeUnit >= 0x0030 && codeUnit <= 0x0039 &&
					firstCodeUnit === 0x002D
				)
				) {
					// https://drafts.csswg.org/cssom/#escape-a-character-as-code-point
					result += '\\' + codeUnit.toString(16) + ' ';
					continue;
				}

				if (
					// If the character is the first character and is a `-` (U+002D), and
				// there is no second character, […]
				index === 0 &&
				length === 1 &&
				codeUnit === 0x002D
				) {
					result += '\\' + string.charAt(index);
					continue;
				}

				// If the character is not handled by one of the above rules and is
				// greater than or equal to U+0080, is `-` (U+002D) or `_` (U+005F), or
				// is in one of the ranges [0-9] (U+0030 to U+0039), [A-Z] (U+0041 to
				// U+005A), or [a-z] (U+0061 to U+007A), […]
				if (
					codeUnit >= 0x0080 ||
					codeUnit === 0x002D ||
					codeUnit === 0x005F ||
					codeUnit >= 0x0030 && codeUnit <= 0x0039 ||
					codeUnit >= 0x0041 && codeUnit <= 0x005A ||
					codeUnit >= 0x0061 && codeUnit <= 0x007A
				) {
					// the character itself
					result += string.charAt(index);
					continue;
				}

				// Otherwise, the escaped character.
				// https://drafts.csswg.org/cssom/#escape-a-character
				result += '\\' + string.charAt(index);

			}
			return result;
		};

    })();

	/**
	 * Constructs css selector for element using tag name, id and classed, like: tagName#id.class1.class2
	 *
	 * @param element Element
	 * @param classList Override element classes (If classList is null, element classes will be used)
	 * @param excludeTagName Omit tag name in selector
	 * @param excludeId Omit element id in selector
	 * @returns {string}
	 */
    var makeDefaultCssFilter = function (element, classList, excludeTagName, excludeId) {
        var cssSelector = excludeTagName ? '' : element.tagName.toLowerCase();
        if (element.id && !excludeId) {
            cssSelector += '#' + escapeCss(element.id);
        }
        cssSelector += constructClassCssSelectorByAND(classList || element.classList);
        return cssSelector;
    };

	/**
	 * Constructs css selector for element using parent elements and nth-child (first-child, last-child) pseudo classes.
	 *
	 * @param element Element
	 * @param options Construct options. For example: {excludeTagName: false, excludeId: false, classList: []}
	 * @returns {string}
	 */
    var makeCssNthChildFilter = function (element, options) {

        options = options || {};

        var classList = options.classList;

        var excludeTagNameOverride = 'excludeTagName' in options;
        var excludeTagName = options.excludeTagName;

        var excludeIdOverride = 'excludeId' in options;
        var excludeId = options.excludeId;

        var path = [];
        var el = element;
        while (el.parentNode) {
            var nodeName = el && el.nodeName ? el.nodeName.toUpperCase() : "";
            if (nodeName === "BODY") {
                break;
            }
            if (el.id) {
				/**
				 * Be default we don't include tag name and classes to selector for element with id attribute
				 */
				var cssSelector = '';
                if (el === element) {
                    cssSelector = makeDefaultCssFilter(el, classList || [], excludeTagNameOverride ? excludeTagName : true, excludeIdOverride ? excludeId : false);
                } else {
                    cssSelector = makeDefaultCssFilter(el, [], true, false);
                }
                path.unshift(cssSelector);
                break;
            } else {
                var c = 1;
                for (var e = el; e.previousSibling; e = e.previousSibling) {
                    if (e.previousSibling.nodeType === 1) {
                        c++;
                    }
                }

                var cldCount = 0;
                for (var i = 0; el.parentNode && i < el.parentNode.childNodes.length; i++) {
                    cldCount += el.parentNode.childNodes[i].nodeType === 1 ? 1 : 0;
                }

                var ch;
                if (cldCount === 0 || cldCount === 1) {
                    ch = "";
                } else if (c === 1) {
                    ch = ":first-child";
                } else if (c === cldCount) {
                    ch = ":last-child";
                } else {
                    ch = ":nth-child(" + c + ")";
                }

				/**
				 * By default we include tag name and element classes to selector for element without id attribute
				 */
                if (el === element) {
                    var p = makeDefaultCssFilter(el, classList, excludeTagNameOverride ? excludeTagName : false, excludeId);
                    p += ch;
                    path.unshift(p);
                } else {
                    path.unshift(makeDefaultCssFilter(el, el.classList, false, false) + ch);
                }

                el = el.parentNode;
            }
        }
        return path.join(" > ");
    };

	/**
	 * Constructs element selector for matching elements that contain any of classes in original element
	 * For example <el class="cl1 cl2 cl3"></el> => .cl1, .cl2, .cl3
	 *
	 * @param element Element
	 * @param classList Override element classes (If classList is null, element classes will be used)
	 * @returns {string}
	 */
    var makeSimilarCssFilter = function (element, classList) {
        return constructClassCssSelectorByOR(classList || element.classList);
    };

	/**
	 * Creates css rule text
	 * @param element Element
	 * @param options Construct options. For example: {cssSelectorType: 'STRICT_FULL', excludeTagName: false, excludeId: false, classList: []}
	 * @returns {string}
	 */
    var constructCssRuleText = function (element, options) {

        if (!element) {
            return;
        }

        options = options || {};
        var cssSelectorType = options.cssSelectorType || 'STRICT_FULL';

        var selector;
        switch (cssSelectorType) {
            case 'STRICT_FULL':
                selector = makeCssNthChildFilter(element, options);
                break;
            case 'STRICT':
                selector = makeDefaultCssFilter(element, options.classList, options.excludeTagName, options.excludeId);
                break;
            case 'SIMILAR':
                selector = makeSimilarCssFilter(element, options.classList, true);
                break;
        }

        return selector ? CSS_RULE_MARK + selector : '';
    };

    var constructUrlBlockRuleText = function (element, urlBlockAttribute, oneDomain, domain) {

        if (!urlBlockAttribute) {
            return null;
        }

        var blockUrlRuleText = urlBlockAttribute.replace(/^http:\/\/(www\.)?/, "||");
        if (blockUrlRuleText.indexOf('.') === 0) {
            blockUrlRuleText = blockUrlRuleText.substring(1);
        }

        if (!oneDomain) {
            blockUrlRuleText = blockUrlRuleText + RULE_OPTIONS_MARK + "domain=" + domain;
        }

        return blockUrlRuleText;
    };

    var getUrlBlockAttribute = function (element) {
        if (!element || !element.getAttribute) {
            return null;
        }

        for (var i = 0; i < URLBLOCK_ATTRIBUTES.length; i++) {
            var attr = URLBLOCK_ATTRIBUTES[i];
            var value = element.getAttribute(attr);
            if (isValidUrl(value)) {
                return value;
            }
        }

        return null;
    };

    var haveUrlBlockParameter = function (element) {
        var value = getUrlBlockAttribute(element);
        return value && value !== '';
    };

    var haveClassAttribute = function (element) {
        return element.classList && element.classList.length > 0;
    };

    var haveIdAttribute = function (element) {
        return element.id && element.id.trim() != '';
    };

    var cropDomain = function (url) {
        var domain = getUrl(url).host;
        return domain.replace("www.", "").replace(/:\d+/, '');
    };

    var getUrl = function (url) {
        var pattern = "^(([^:/\\?#]+):)?(//(([^:/\\?#]*)(?::([^/\\?#]*))?))?([^\\?#]*)(\\?([^#]*))?(#(.*))?$";
        var rx = new RegExp(pattern);
        var parts = rx.exec(url);

        return {
            host: parts[4] || "",
            path: parts[7] || ""
        };
    };

    var isValidUrl = function(value) {
        if (value) {
            linkHelper.href = value;
            if (linkHelper.hostname) {
                return true;
            }
        }

        return false;
    };

    /**
     * Constructs css selector by combining classes by AND
     * @param classList
     * @returns {string}
     */
    var constructClassCssSelectorByAND = function (classList) {
        var selectors = [];
        if (classList) {
            for (var i = 0; i < classList.length; i++) {
                selectors.push('.' + escapeCss(classList[i]));
            }
        }
        return selectors.join('');
    };

    /**
     * Constructs css selector by combining classes by OR
     * @param classList
     * @returns {string}
     */
    var constructClassCssSelectorByOR = function (classList) {
        var selectors = [];
        if (classList) {
            for (var i = 0; i < classList.length; i++) {
                selectors.push('.' + escapeCss(classList[i]));
            }
        }
        return selectors.join(', ');
    };

    /**
     * Utility method
     *
     * @param element
     * @returns {string}
     */
    api.makeCssNthChildFilter = makeCssNthChildFilter;

    /**
     * Returns detailed element info
     *
     * @param element
     */
    api.getElementInfo = function (element) {

        return {
            tagName: element.tagName,
            classes: element.classList,
            attributes: element.attributes ? element.attributes : [],
            urlBlockAttributeValue: getUrlBlockAttribute(element),
            haveUrlBlockParameter: haveUrlBlockParameter(element),
            haveClassAttribute: haveClassAttribute(element),
            haveIdAttribute: haveIdAttribute(element)
        };
    };

    /**
     * Constructs css selector for specified rule
     *
     * @param ruleText rule text
     * @returns {string} css style selector
     */
    api.constructRuleCssSelector = function (ruleText) {
        if (!ruleText) {
            return null;
        }

        var index = ruleText.indexOf(CSS_RULE_MARK);
        var optionsIndex = ruleText.indexOf(RULE_OPTIONS_MARK);

        if (index >= 0) {
            return ruleText.substring(index + CSS_RULE_MARK.length, optionsIndex >= 0 ? optionsIndex : ruleText.length);
        }

        var s = ruleText.substring(0, optionsIndex);
        s = s.replace(/[\|]|[\^]/g, '');

        if (isValidUrl(s)) {
            return '[src*="' + s + '"]';
        }

        return null;
    };

    /**
     * Constructs adguard rule text from element node and specified options
     *
     * var options = {
	 *	urlBlockAttribute: url mask,
	 *	isBlockOneDomain: boolean,
	 *	url: url,
	 *  attributes: attributesSelectorText,
	 *  ruleType: (URL, CSS)
	 *  cssSelectorType: (STRICT_FULL, STRICT, SIMILAR),
	 *  excludeTagName: false, (Exclude element tag name from selector)
	 *  excludeId: false, (Exclude element identifier from selector)
	 *  classList: [] (Override element classes (If classList is null, element classes will be used))
	 * }
     *
     * @param element
     * @param options
     * @returns {*}
     */
    api.constructRuleText = function (element, options) {

        var croppedDomain = cropDomain(options.url);

        var ruleType = options.ruleType;

        if (ruleType === 'URL') {
            var blockUrlRuleText = constructUrlBlockRuleText(element, options.urlMask, options.isBlockOneDomain, croppedDomain);
            if (blockUrlRuleText) {
                return blockUrlRuleText;
            }
        }

        var result;

        if (ruleType === 'CSS') {

            result = constructCssRuleText(element, options);

            // Append html attributes to css selector
            if (options.attributes) {
                result = (result ? result : CSS_RULE_MARK + result) + options.attributes;
            }
        }

        if (!options.isBlockOneDomain) {
            result = croppedDomain + result;
        }

        return result;
    };

    return api;

})(AdguardRulesConstructorLib || {});