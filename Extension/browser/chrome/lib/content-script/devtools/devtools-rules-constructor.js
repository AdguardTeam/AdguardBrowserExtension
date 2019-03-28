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
 * DevTools rules constructor helper
 */
var DevToolsRulesConstructor = (function () { // jshint ignore:line

    var CSS_RULE_MARK = '##';
    var RULE_OPTIONS_MARK = '$';

    var URLBLOCK_ATTRIBUTES = ['src', 'data'];

    var linkHelper = document.createElement('a');

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
            cssSelector += '#' + CSS.escape(element.id);
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
            var nodeName = el && el.nodeName ? el.nodeName.toUpperCase() : '';
            if (nodeName === 'BODY' && path.length === 0) {
                const bodySelector = makeDefaultCssFilter(el, classList, excludeTagNameOverride ? excludeTagName : false, excludeId)
                path.unshift(bodySelector);
                break;
            }
            if (nodeName === 'BODY') {
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
                    ch = '';
                } else if (c === 1) {
                    ch = ':first-child';
                } else if (c === cldCount) {
                    ch = ':last-child';
                } else {
                    ch = ':nth-child(' + c + ')';
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
        return path.join(' > ');
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
                selectors.push('.' + CSS.escape(classList[i]));
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
                selectors.push('.' + CSS.escape(classList[i]));
            }
        }
        return selectors.join(', ');
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

    var isValidUrl = function (value) {
        if (value) {
            linkHelper.href = value;
            if (linkHelper.hostname) {
                return true;
            }
        }

        return false;
    };

    var haveUrlBlockParameter = function (element) {
        var value = getUrlBlockAttribute(element);
        return value && value !== '';
    };

    var haveClassAttribute = function (element) {
        return element.classList && element.classList.length > 0;
    };

    var haveIdAttribute = function (element) {
        return element.id && element.id.trim() !== '';
    };

    var cropDomain = function (url) {
        var domain = getUrl(url).host;
        return domain.replace('www.', '').replace(/:\d+/, '');
    };

    var getUrl = function (url) {
        var pattern = '^(([^:/\\?#]+):)?(//(([^:/\\?#]*)(?::([^/\\?#]*))?))?([^\\?#]*)(\\?([^#]*))?(#(.*))?$';
        var rx = new RegExp(pattern);
        var parts = rx.exec(url);

        return {
            host: parts[4] || '',
            path: parts[7] || '',
        };
    };

    var constructUrlBlockRuleText = function (element, urlBlockAttribute, oneDomain, domain) {

        if (!urlBlockAttribute) {
            return null;
        }

        var blockUrlRuleText = urlBlockAttribute.replace(/^http:\/\/(www\.)?/, '||');
        if (blockUrlRuleText.indexOf('.') === 0) {
            blockUrlRuleText = blockUrlRuleText.substring(1);
        }

        if (!oneDomain) {
            blockUrlRuleText = blockUrlRuleText + RULE_OPTIONS_MARK + 'domain=' + domain;
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

    // Public API
    var api = {};

    /**
     * Returns detailed element info
     *
     * @param element
     */
    api.getElementInfo = function (element) {

        // Convert attributes to array
        var attributes = [];
        var elementAttributes = element.attributes;
        if (elementAttributes) {
            for (var i = 0; i < elementAttributes.length; i++) {
                var attr = elementAttributes[i];
                attributes.push({
                    name: attr.name,
                    value: attr.value,
                });
            }
        }

        return {
            tagName: element.tagName,
            attributes: attributes,
            urlBlockAttributeValue: getUrlBlockAttribute(element),
            haveUrlBlockParameter: haveUrlBlockParameter(element),
            haveClassAttribute: haveClassAttribute(element),
            haveIdAttribute: haveIdAttribute(element),
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
     *  urlBlockAttribute: url mask,
     *  isBlockOneDomain: boolean,
     *  url: url,
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

})();
