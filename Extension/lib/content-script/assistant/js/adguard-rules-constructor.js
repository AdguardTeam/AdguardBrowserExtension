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
 * Adguard rules constructor library
 */
var AdguardRulesConstructorLib = (function (api) {

    var CSS_RULE_MARK = '##';
    var RULE_OPTIONS_MARK = '$';

    var URLBLOCK_ATTRIBUTES = ["src", "data"];

    var linkHelper = document.createElement('a');


    var makeCssNthChildFilter = function (element, classesSelector, excludeTagName, excludeId) {
        var path = [];
        var el = element;
        while (el.parentNode) {
            var nodeName = el && el.nodeName ? el.nodeName.toUpperCase() : "";
            if (nodeName == "BODY") {
                break;
            }
            if (el.id) {
                var s = '';
                if (el == element) {
                    s += excludeTagName == false ? el.tagName.toLowerCase() : '';
                    s += (!classesSelector && classesSelector != '') ? '' : classesSelector;
                }

                if (el != element || !excludeId) {
                    var id = el.id.split(':').join('\\:');//case of colon in id. Need to escape
                    if (el.id.indexOf('.') > -1) {
                        s += '[id="' + id + '"]';
                    } else {
                        s += '#' + id;
                    }
                }

                path.unshift(s);
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
                    cldCount += el.parentNode.childNodes[i].nodeType == 1 ? 1 : 0;
                }

                var ch;
                if (cldCount == 0 || cldCount == 1) {
                    ch = "";
                } else if (c == 1) {
                    ch = ":first-child";
                } else if (c == cldCount) {
                    ch = ":last-child";
                } else {
                    ch = ":nth-child(" + c + ")";
                }

                var className = el.className;
                if (className) {
                    if (className.indexOf('.') > 0) {
                        className = '[class="' + className + '"]';
                    } else {
                        className = className.trim().replace(/\s+(?= )/g, ''); //delete more than one space between classes;
                        className = '.' + className.replace(/\s/g, ".");
                    }
                } else {
                    className = '';
                }

                if (el == element) {
                    var p = excludeTagName ? '' : el.tagName.toLowerCase();
                    p += (!classesSelector && classesSelector != '') ? className : classesSelector;
                    p += ch;
                    path.unshift(p);
                } else {
                    path.unshift(el.tagName.toLowerCase() + className + ch);
                }

                el = el.parentNode;
            }
        }
        return path.join(" > ");
    };

    var createRuleText = function (element, classesSelector, excludeTagName, excludeId) {
        if (!element) {
            return;
        }

        var selector = makeCssNthChildFilter(element, classesSelector, excludeTagName, excludeId);
        return selector ? CSS_RULE_MARK + selector : "";
    };

    var createSimilarElementSelector = function (element) {
        if (!element) {
            return "";
        }

        var className = element.className;
        if (!className) {
            return "";
        }

        return '.' + className.trim().replace(/\s+/g, ', .');
    };

    var createSimilarRuleText = function (element, classesSelector, includeTagName) {
        var selector = classesSelector;
        if (!selector && selector != '') {
            selector = createSimilarElementSelector(element);
        }

        if (selector) {
            selector = selector.replace(', .', '.');
        }

        if (includeTagName) {
            selector = element.tagName.toLowerCase() + selector;
        }

        return selector ? CSS_RULE_MARK + selector : "";
    };

    var constructUrlBlockRuleText = function (element, urlBlockAttribute, oneDomain, domain) {
        if (!urlBlockAttribute || urlBlockAttribute == '') {
            return null;
        }

        var blockUrlRuleText = urlBlockAttribute.replace(/^http:\/\/(www\.)?/, "||");
        if (blockUrlRuleText.indexOf('.') == 0) {
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
        return value && value != '';
    };

    var haveClassAttribute = function (element) {
        var className = element.className;
        return className && className.trim() != '';
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
            haveClassAttribute: haveClassAttribute(element)
        }
    };

    /**
     * Constructs css selector for element
     *
     * @param element
     * @param isBlockSimilar
     */
    api.constructCssSelector = function (element, isBlockSimilar) {
        if (isBlockSimilar) {
            var selector = createSimilarElementSelector(element);
            if (selector) {
                return selector;
            }
        }

        return makeCssNthChildFilter(element);
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
		 *  isBlockByUrl: boolean,
		 *	urlBlockAttribute: url mask,
		 *	isBlockSimilar : boolean,
		 *	isBlockOneDomain: boolean,
		 *	url: url,
		 *  attributes: attributesSelectorText
		 * }
     *
     * @param element
     * @param options
     * @returns {*}
     */
    api.constructRuleText = function (element, options) {
        var croppedDomain = cropDomain(options.url);

        if (options.isBlockByUrl) {
            var blockUrlRuleText = constructUrlBlockRuleText(element, options.urlMask, options.isBlockOneDomain, croppedDomain);
            if (blockUrlRuleText) {
                return blockUrlRuleText;
            }
        }

        var result;
        if (options.isBlockSimilar) {
            result = createSimilarRuleText(element, options.classesSelector, options.excludeTagName == false);
        } else {
            result = createRuleText(element, options.classesSelector, options.excludeTagName, options.excludeId);
        }

        if (!options.isBlockByUrl && options.attributes) {
            result = (result ? result : CSS_RULE_MARK + result) + options.attributes;
        }

        if (!options.isBlockOneDomain) {
            result = croppedDomain + result;
        }

        return result;
    };

    return api;

})(AdguardRulesConstructorLib || {});