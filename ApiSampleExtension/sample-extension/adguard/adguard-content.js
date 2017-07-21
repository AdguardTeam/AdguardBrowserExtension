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

(function (window, undefined) {

/*! https://mths.be/cssescape v1.5.1 by @mathias | MIT license */
(function (root) {

    if (root.CSS && root.CSS.escape) {
        return root.CSS.escape;
    }

    // https://drafts.csswg.org/cssom/#serialize-an-identifier
    var cssEscape = function (value) {
        if (arguments.length === 0) {
            throw new TypeError('`CSS.escape` requires an argument.');
        }
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

    // Create new CSS object in global scope.
    // Changing the property of object that already presents in global scope has no effect (in Safari)
    root.CSS = {
        escape: cssEscape
    };

})(this);

/* global CSS */

/**
 * Object that collapses or hides DOM elements and able to roll it back.
 */
var ElementCollapser = (function() { // jshint ignore:line

    var collapserStyleId = "adguard-collapse-styles";
    var hiddenElements = [];

    /**
     * Gets full DOM path to the specified element
     */
    var getDomPath = function (el) {
        var stack = [];
        var stackEscaped = [];
        while (el.parentNode !== null) {
            var sibCount = 0;
            var sibIndex = 0;
            // get sibling indexes
            for (var i = 0; i < el.parentNode.childNodes.length; i++) {
                var sib = el.parentNode.childNodes[i];
                if (sib.nodeName == el.nodeName) {
                    if (sib === el) {
                        sibIndex = sibCount;
                    }
                    sibCount++;
                }
            }

            //https://github.com/AdguardTeam/AdguardBrowserExtension/issues/373
            var nodeName = el.nodeName.toLowerCase();
            var nodeNameEscaped = nodeName.replace(/[^a-zA-Z0-9]/g, '\\$&');
            if (sibCount > 1) {
                stack.unshift(nodeName + ':nth-of-type(' + (sibIndex + 1) + ')');
                stackEscaped.unshift(nodeNameEscaped + ':nth-of-type(' + (sibIndex + 1) + ')');
            } else {
                stack.unshift(nodeName);
                stackEscaped.unshift(nodeNameEscaped);
            }
            el = el.parentNode;
        }

        //Remove heading html
        //https://github.com/AdguardTeam/AdguardBrowserExtension/issues/400
        if (stack.length > 1 && stack[0] == 'html' && stack[1] == 'body') {
            stack.splice(0, 1);
            stackEscaped.splice(0, 1);
        }

        return {
            selectorText: stack.join(' > '),
            selectorTextEscaped: stackEscaped.join(' > ')
        };
    };

    /**
     * Applies CSS stylesheets
     * Special characters should be escaped in selector text
     * https://github.com/AdguardTeam/AdguardBrowserExtension/issues/373
     *
     * @param rule css rule
     * @param shadowRoot
     */
    var applyCss = function (rule, shadowRoot) {
        var styleElement = getStyleElement(shadowRoot);
        if (!styleElement) {
            styleElement = document.createElement("style");
            styleElement.id = collapserStyleId;
            styleElement.setAttribute("type", "text/css");

            if (shadowRoot) {
                shadowRoot.appendChild(styleElement);
            } else {
                (document.head || document.documentElement).appendChild(styleElement);
            }
        }

        styleElement.sheet.insertRule(prepareSelector(rule, !!shadowRoot), styleElement.sheet.cssRules.length);
    };

    /**
     * Adds "selectorText { display:none!important; }" style
     *
     * @param selectorText
     * @param cssText optional
     * @param shadowRoot optional
     */
    var hideBySelector = function(selectorText, cssText, shadowRoot) {
        var rule = selectorText + '{' + (cssText || "display: none!important;") + '}';
        applyCss(rule, shadowRoot);
    };

    /**
     * Adds "selectorText { display:none!important; }" style
     *
     * @param shadowRoot optional
     */
    var hideBySelectorAndTagName = function(selectorText, tagName, shadowRoot) {
        if (tagName === "frame" || tagName === "iframe") {
            // Use specific style for frames due to these issues:
            // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/346
            // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/355
            // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/347
            // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/733
            hideBySelector(selectorText, "visibility: hidden!important; height: 0px!important; min-height: 0px!important;", shadowRoot);
        } else {
            hideBySelector(selectorText, null, shadowRoot);
        }
    };

    /**
     * Unhides elements which were previously hidden by the specified selector
     */
    var unhideBySelector = function(selectorText, shadowRoot, selectorTextEscaped) {
        var styleElement = getStyleElement(shadowRoot);
        if (!styleElement || !styleElement.sheet) {
            return;
        }
        var iLength = styleElement.sheet.cssRules.length;
        while (iLength--) {
            var cssRule = styleElement.sheet.cssRules[iLength];
            // Returns escaped selector in FF and unescaped in Chrome
            if (cssRule.selectorText == prepareSelector(selectorText, !!shadowRoot)
                || cssRule.selectorText == prepareSelector(selectorTextEscaped, !!shadowRoot)) {
                styleElement.sheet.deleteRule(iLength);
            }
        }

        if (styleElement.sheet.cssRules.length === 0) {
            // Schedule empty stylesheet removal
            setTimeout(function() {
                // Double check stylesheet size
                if (styleElement.parentNode && styleElement.sheet && styleElement.sheet.cssRules.length === 0) {
                    styleElement.parentNode.removeChild(styleElement);
                }
            }, 500);
        }
    };

    /**
     * Searches for the specified elements in the hiddenElements collection
     * and returns the first occurence.
     */
    var findHiddenElement = function(element) {
        var iLength = hiddenElements.length;
        while (iLength--) {
            var hiddenElement = hiddenElements[iLength];
            if (hiddenElement.node === element) {
                return hiddenElement;
            }
        }
        return null;
    };

    /**
     * Hides specified element
     *
     * @param shadowRoot optional
     */
    var hideElement = function(element, shadowRoot) {
        var domPath = getDomPath(element);
        var selectorText = domPath.selectorText;
        var selectorTextEscaped = domPath.selectorTextEscaped;
        // First check if we have hidden it already
        var hiddenElement = findHiddenElement(element);
        if (hiddenElement && hiddenElement.selectorText === selectorText) {
            // Nothing changed, we should do nothing
            return;
        }

        var tagName = element.tagName.toLowerCase();
        hideBySelectorAndTagName(selectorTextEscaped, tagName, shadowRoot);

        if (hiddenElement) {
            // Remove redundant selector and save the new one
            unhideBySelector(hiddenElement.selectorText, shadowRoot, hiddenElement.selectorTextEscaped);
            hiddenElement.selectorText = selectorText;
            hiddenElement.selectorTextEscaped = selectorTextEscaped;
        } else {
            hiddenElement = {
                node: element,
                selectorText: selectorText,
                selectorTextEscaped: selectorTextEscaped
            };
            hiddenElements.push(hiddenElement);
        }
    };

    /**
     * Unhides specified element
     */
    var unhideElement = function(element, shadowRoot) {
        var iLength = hiddenElements.length;
        while (iLength--) {
            var hiddenElement = hiddenElements[iLength];
            if (hiddenElement.node === element) {
                unhideBySelector(hiddenElement.selectorText, shadowRoot, hiddenElement.selectorTextEscaped);
                hiddenElements.splice(iLength, 1);
            }
        }
    };

    /**
     * Creates selector for specified tagName and src attribute
     */
    var createSelectorForSrcAttr = function(srcAttrValue, tagName) {
        return tagName + '[src="'+ CSS.escape(srcAttrValue) + '"]';
    };

    /**
     * Finds style containing dom element
     *
     * @param shadowRoot
     * @returns {Element} or null
     */
    var getStyleElement = function(shadowRoot) {
        if (shadowRoot) {
            var el = shadowRoot.querySelector('#' + collapserStyleId);
            if (el) {
                return el;
            }
        }

        return document.getElementById(collapserStyleId);
    };

    /**
     * Prepares selector or rule text
     *
     * @param selector
     * @param useShadowDom
     * @returns {*}
     */
    var prepareSelector = function (selector, useShadowDom) {
        return useShadowDom ? '::content ' + selector : selector;
    };

    /**
     * Clears priority for specified styles
     *
     * @param element element affected
     * @param styles array of style names
     */
    var clearElStylesPriority = function(element, styles) {
        var elementStyle = element.style;

        styles.forEach(function (prop) {
            var elCssPriority = elementStyle.getPropertyPriority(prop);
            if (elCssPriority && elCssPriority.toLowerCase() === 'important') {
                var elCssValue = elementStyle.getPropertyValue(prop);
                elementStyle.setProperty(prop, elCssValue, null);
            }
        });
    };

    /**
     * Collapses specified element.
     *
     * @param element Element to collapse
     * @param elementUrl Element's source url
     * @param shadowRoot optional
     */
    var collapseElement = function(element, elementUrl, shadowRoot) {
        
        var tagName = element.tagName.toLowerCase();

        if (elementUrl) {
            
            // Check that element still has the same "src" attribute
            // If it has changed, we do not need to collapse it anymore
            if (element.src == elementUrl) {
                // To not to keep track of changing src for elements, we are going to collapse it with a CSS rule
                // But we take element url, cause current source could be already modified
                // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/408
                var srcAttribute = element.getAttribute('src');
                var srcSelector = createSelectorForSrcAttr(srcAttribute, tagName);
                hideBySelectorAndTagName(srcSelector, tagName, shadowRoot);

                // Remove important priority from element style
                // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/733
                clearElStylesPriority(element, ['display', 'visibility', 'height', 'min-height']);
            }

            // Do not process it further in any case
            return;
        }

        var cssProperty = "display";
        var cssValue = "none";
        var cssPriority = "important";

        if (tagName == "frame") {
            cssProperty = "visibility";
            cssValue = "hidden";
        }

        var elementStyle = element.style;
        var elCssValue = elementStyle.getPropertyValue(cssProperty);
        var elCssPriority = elementStyle.getPropertyPriority(cssProperty);

        // <input type="image"> elements try to load their image again
        // when the "display" CSS property is set. So we have to check
        // that it isn't already collapsed to avoid an infinite recursion.
        if (elCssValue != cssValue || elCssPriority != cssPriority) {
            elementStyle.setProperty(cssProperty, cssValue, cssPriority);
        }
    };

    return {
        /**
         * Collapses specified element using inline style
         *
         * @param element Element to collapse
         * @param elementUrl Element's source url
         * @param shadowRoot optional shadow root element
         */
        collapseElement: collapseElement,

        /**
         * Hides specified element
         *
         * @param element Element to hide
         * @param shadowRoot optional shadow root element
         */
        hideElement: hideElement,

        /**
         * Removes the style used to hide the specified element
         *
         * @param element Element to unhide
         * @param shadowRoot optional shadow root element
         */
        unhideElement: unhideElement,

        /**
         * Adds "selectorText { display:none!important; }" style
         *
         * @param selectorText CSS selector
         * @param cssText (optional) Overrides style used for hiding
         * @param shadowRoot optional shadow root element
         */
        hideBySelector: hideBySelector,

        /**
         * Unhides elements which were previously hidden by the specified selector
         *
         * @param selectorText CSS selector
         * @param shadowRoot optional shadow root element
         */
        unhideBySelector: unhideBySelector
    };
})();

/*! extended-css - v1.0.6 - 2016-10-19
* https://github.com/AdguardTeam/ExtendedCss
* Copyright (c) 2016 ; Licensed Apache License 2.0 */
var ExtendedCss = (function(window) {
/**
 * Very simple and lightweight CSS parser.
 * <br/>
 * Please note, that it does not support any complex things like media queries and such.
 * <br/>
 * <b>Example:</b>
 * <pre>
 *      var cssText = '.wrapper, .container { background:url('about:blank'); display: none!important; }';
 *      var cssObject = CssParser.parseCss(cssText);
 * </pre>
 * <b>Result:</b>
 * <pre>
 *      [
 *          {
 *              selectors: '.wrapper, .container',
 *              style: {
 *                  background: "url('about:blank')",
 *                  display: "none!important"
 *              }
 *          }
 *      ]
 * </pre>
 */
var CssParser = (function() { // jshint ignore:line

    /**
     * Transforms style text into a plain JS object.
     * 
     * Example:
     * <pre>"background:url('about:blank'); display: none!important;"<pre>
     * will be transformed into
     * <pre>
     * {
     *     background: "url('about:blank')",
     *     display: "none!important"
     * }
     * </pre>
     * 
     */
    var parseStyle = function(styleText) {
        var result = Object.create(null);

        // Splits style by the ';' character
        var re = /([^:;]+?):([^;]+?);/g;
        // Add ';' to the end just to match the regexp
        styleText = styleText + ";";

        var match;
        while((match = re.exec(styleText)) !== null) {
            var name = match[1].trim();
            var value = match[2].trim();
            result[name] = value;
        }
        return result;
    };

    /**
     * Does the actual parsing
     */
    var parseCss = function(cssText) {
        if (!cssText) {
            throw 'CssParser: empty cssText parameter';
        }

        var result = [];
        
        // Splits stylesheet into "selector { style }" pairs
        var re = /(.*?){(.*?)}/g;
        var match;
        while((match = re.exec(cssText)) !== null) {
            var obj = Object.create(null);

            obj.selectors = match[1].trim();
            var styleText = match[2].trim();
            obj.style = parseStyle(styleText);
            result.push(obj);
        }

        return result;        
    };

    // EXPOSE
    return {
        parseCss: parseCss,
        parseStyle: parseStyle
    };
})();
/**
 * Helper class that uses either MutationObserver or DOMNode* events to keep an eye on DOM changes
 * <br/>
 * Two public methods:
 * <br/>
 * <pre>observe</pre> starts observing the DOM changes
 * <pre>dispose</pre> stops doing it
 */
var DomObserver = (function() { // jshint ignore:line

    var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
    var eventListenerSupported = window.addEventListener;
    var domMutationObserver;

    /**
     * Sets up a MutationObserver which protects attributes from changes
     * 
     * @param node          DOM node
     * @param attributeName Name of the attribute you want to have protected
     * @returns Mutation observer used to protect attribute or null if there's nothing to protect
     */
    var protectAttribute = function(node, attributeName) {

        if (!MutationObserver) {
            return null;
        }

        /**
         * Restores previous attribute value
         */
        var protectionFunction = function(mutations, observer) {
            if (!mutations.length) {
                return;
            }

            var target = mutations[0].target;
            observer.disconnect();
            var iMutations = mutations.length;
            while (iMutations--) {
                var mutation = mutations[iMutations];
                if (mutation.attributeName === attributeName) {
                    target.setAttribute(mutation.attributeName, mutation.oldValue);
                }
            }

            observer.observe(target, {
                attributes: true, 
                attributeOldValue: true,
                attributeFilter: [ attributeName ]
            });
        };

        var protectionObserver = new MutationObserver(protectionFunction);
        protectionObserver.observe(node, {
            attributes: true, 
            attributeOldValue: true,
            attributeFilter: [ attributeName ]
        });
        
        return protectionObserver;
    };

    /**
     * Observes changes to DOM nodes
     * 
     * @param callback Callback method to be called when anything has changed
     */
    var observeDom = function(callback) {
        if (!document.body) {
            // Do nothing if there is no body
            return;
        }

        if (MutationObserver) {
            domMutationObserver = new MutationObserver(function(mutations) {
                if (mutations && mutations.length) {
                    callback();
                }
            });
            domMutationObserver.observe(document.body, { 
                childList: true,
                subtree: true,
                attributes: false
            });
        } else if (eventListenerSupported) {
            document.addEventListener('DOMNodeInserted', callback, false);
            document.addEventListener('DOMNodeRemoved', callback, false);
        }
    };

    /**
     * Disconnects DOM observer
     */
    var disconnectDom = function(callback) {
        if (domMutationObserver) {
            domMutationObserver.disconnect();
        } else if (eventListenerSupported) {
            document.removeEventListener('DOMNodeInserted', callback, false);
            document.removeEventListener('DOMNodeRemoved', callback, false);
        }
    };

    // EXPOSE
    return {
        observeDom: function(callback) {
            if (!document.body) {
                document.addEventListener('DOMContentLoaded', function() {
                    observeDom(callback);
                });
            } else {
                observeDom(callback);
            }
        },
        disconnectDom: disconnectDom,
        protectAttribute: protectAttribute 
    };
})();
/**
 * Helper class for creating regular expression from a simple wildcard-syntax used in basic filters
 */
var SimpleRegex = (function() { // jshint ignore:line

    // Constants
    var regexConfiguration = {
        maskStartUrl: "||",
        maskPipe: "|",
        maskSeparator: "^",
        maskAnySymbol: "*",

        regexAnySymbol: ".*",
        regexSeparator: "([^ a-zA-Z0-9.%]|$)",
        regexStartUrl: "^(http|https|ws|wss)://([a-z0-9-_.]+\\.)?",
        regexStartString: "^",
        regexEndString: "$"
    };

    // https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/regexp
    // should be escaped . * + ? ^ $ { } ( ) | [ ] / \
    // except of * | ^
    var specials = [
        '.', '+', '?', '$', '{', '}', '(', ')', '[', ']', '\\', '/'
    ];
    var specialsRegex = new RegExp('[' + specials.join('\\') + ']', 'g');

    /**
     * Escapes regular expression string
     */
    var escapeRegExp = function (str) {
        return str.replace(specialsRegex, "\\$&");
    };

    /**
     * Checks if string "str" starts with the specified "prefix"
     */
    var startsWith = function (str, prefix) {
        return str && str.indexOf(prefix) === 0;
    };

    /**
     * Checks if string "str" ends with the specified "postfix" 
     */
    var endsWith = function (str, postfix) {
        if (!str || !postfix) {
            return false;
        }
        
        if (str.endsWith) {
            return str.endsWith(postfix);
        }
        var t = String(postfix);
        var index = str.lastIndexOf(t);
        return index >= 0 && index === str.length - t.length;
    };  

    /**
     * Replaces all occurencies of a string "find" with "replace" str;
     */
    var replaceAll = function (str, find, replace) {
        if (!str) {
            return str;
        }
        return str.split(find).join(replace);
    };

  

    /**
     * Creates regex
     */
    var createRegexText = function(str) {
        var regex = escapeRegExp(str);

        if (startsWith(regex, regexConfiguration.maskStartUrl)) {
            regex = regex.substring(0, regexConfiguration.maskStartUrl.length) + 
                replaceAll(regex.substring(regexConfiguration.maskStartUrl.length, regex.length - 1), "\|", "\\|") +
                regex.substring(regex.length - 1);
        } else if (startsWith(regex, regexConfiguration.maskPipe)){
            regex = regex.substring(0, regexConfiguration.maskPipe.length) +
                replaceAll(regex.substring(regexConfiguration.maskPipe.length, regex.length - 1), "\|", "\\|") +
                regex.substring(regex.length - 1);
        } else {
            regex = replaceAll(regex.substring(0, regex.length - 1), "\|", "\\|") + 
                regex.substring(regex.length - 1);
        }

        // Replacing special url masks
        regex = replaceAll(regex, regexConfiguration.maskAnySymbol, regexConfiguration.regexAnySymbol);
        regex = replaceAll(regex, regexConfiguration.maskSeparator, regexConfiguration.regexSeparator);

        if (startsWith(regex, regexConfiguration.maskStartUrl)) {
            regex = regexConfiguration.regexStartUrl + regex.substring(regexConfiguration.maskStartUrl.length);
        } else if (startsWith(regex, regexConfiguration.maskPipe)) {
            regex = regexConfiguration.regexStartString + regex.substring(regexConfiguration.maskPipe.length);
        }
        if (endsWith(regex, regexConfiguration.maskPipe)) {
            regex = regex.substring(0, regex.length - 1) + regexConfiguration.regexEndString;
        }

        return regex;        
    };

    // EXPOSE
    return {
        // Function for creating regex
        createRegexText: createRegexText,
        
        // Configuration used for the transformation
        regexConfiguration: regexConfiguration
    };
})();
/*!
 * Sizzle CSS Selector Engine v2.3.4-pre
 * https://sizzlejs.com/
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license
 * http://jquery.org/license
 *
 * Date: 2016-08-08
 */

/**
 * PATCHED: 
 * 
 * Patch #1:
 * Do not expose Sizzle to the global scope
 * 
 * Patch #2:
 * Added Sizzle.compile call to :has pseudo definition:
 * 		"has": markFunction(function( selector ) {
 *			if (typeof selector === "string") {
 *				Sizzle.compile(selector);
 *			}
 *			return function( elem ) {
 *				return Sizzle( selector, elem ).length > 0;
 *			};
 *		}),
 */

/**
 * Sizzle selector library.
 */
var Sizzle = (function( window ) {

var i,
	support,
	Expr,
	getText,
	isXML,
	tokenize,
	compile,
	select,
	outermostContext,
	sortInput,
	hasDuplicate,

	// Local document vars
	setDocument,
	document,
	docElem,
	documentIsHTML,
	rbuggyQSA,
	rbuggyMatches,
	matches,
	contains,

	// Instance-specific data
	expando = "sizzle" + 1 * new Date(),
	preferredDoc = window.document,
	dirruns = 0,
	done = 0,
	classCache = createCache(),
	tokenCache = createCache(),
	compilerCache = createCache(),
	sortOrder = function( a, b ) {
		if ( a === b ) {
			hasDuplicate = true;
		}
		return 0;
	},

	// Instance methods
	hasOwn = ({}).hasOwnProperty,
	arr = [],
	pop = arr.pop,
	push_native = arr.push,
	push = arr.push,
	slice = arr.slice,
	// Use a stripped-down indexOf as it's faster than native
	// https://jsperf.com/thor-indexof-vs-for/5
	indexOf = function( list, elem ) {
		var i = 0,
			len = list.length;
		for ( ; i < len; i++ ) {
			if ( list[i] === elem ) {
				return i;
			}
		}
		return -1;
	},

	booleans = "checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped",

	// Regular expressions

	// http://www.w3.org/TR/css3-selectors/#whitespace
	whitespace = "[\\x20\\t\\r\\n\\f]",

	// http://www.w3.org/TR/CSS21/syndata.html#value-def-identifier
	identifier = "(?:\\\\.|[\\w-]|[^\0-\\xa0])+",

	// Attribute selectors: http://www.w3.org/TR/selectors/#attribute-selectors
	attributes = "\\[" + whitespace + "*(" + identifier + ")(?:" + whitespace +
		// Operator (capture 2)
		"*([*^$|!~]?=)" + whitespace +
		// "Attribute values must be CSS identifiers [capture 5] or strings [capture 3 or capture 4]"
		"*(?:'((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\"|(" + identifier + "))|)" + whitespace +
		"*\\]",

	pseudos = ":(" + identifier + ")(?:\\((" +
		// To reduce the number of selectors needing tokenize in the preFilter, prefer arguments:
		// 1. quoted (capture 3; capture 4 or capture 5)
		"('((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\")|" +
		// 2. simple (capture 6)
		"((?:\\\\.|[^\\\\()[\\]]|" + attributes + ")*)|" +
		// 3. anything else (capture 2)
		".*" +
		")\\)|)",

	// Leading and non-escaped trailing whitespace, capturing some non-whitespace characters preceding the latter
	rwhitespace = new RegExp( whitespace + "+", "g" ),
	rtrim = new RegExp( "^" + whitespace + "+|((?:^|[^\\\\])(?:\\\\.)*)" + whitespace + "+$", "g" ),

	rcomma = new RegExp( "^" + whitespace + "*," + whitespace + "*" ),
	rcombinators = new RegExp( "^" + whitespace + "*([>+~]|" + whitespace + ")" + whitespace + "*" ),

	rattributeQuotes = new RegExp( "=" + whitespace + "*([^\\]'\"]*?)" + whitespace + "*\\]", "g" ),

	rpseudo = new RegExp( pseudos ),
	ridentifier = new RegExp( "^" + identifier + "$" ),

	matchExpr = {
		"ID": new RegExp( "^#(" + identifier + ")" ),
		"CLASS": new RegExp( "^\\.(" + identifier + ")" ),
		"TAG": new RegExp( "^(" + identifier + "|[*])" ),
		"ATTR": new RegExp( "^" + attributes ),
		"PSEUDO": new RegExp( "^" + pseudos ),
		"CHILD": new RegExp( "^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\(" + whitespace +
			"*(even|odd|(([+-]|)(\\d*)n|)" + whitespace + "*(?:([+-]|)" + whitespace +
			"*(\\d+)|))" + whitespace + "*\\)|)", "i" ),
		"bool": new RegExp( "^(?:" + booleans + ")$", "i" ),
		// For use in libraries implementing .is()
		// We use this for POS matching in `select`
		"needsContext": new RegExp( "^" + whitespace + "*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\(" +
			whitespace + "*((?:-\\d)?\\d*)" + whitespace + "*\\)|)(?=[^-]|$)", "i" )
	},

	rinputs = /^(?:input|select|textarea|button)$/i,
	rheader = /^h\d$/i,

	rnative = /^[^{]+\{\s*\[native \w/,

	// Easily-parseable/retrievable ID or TAG or CLASS selectors
	rquickExpr = /^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,

	rsibling = /[+~]/,

	// CSS escapes
	// http://www.w3.org/TR/CSS21/syndata.html#escaped-characters
	runescape = new RegExp( "\\\\([\\da-f]{1,6}" + whitespace + "?|(" + whitespace + ")|.)", "ig" ),
	funescape = function( _, escaped, escapedWhitespace ) {
		var high = "0x" + escaped - 0x10000;
		// NaN means non-codepoint
		// Support: Firefox<24
		// Workaround erroneous numeric interpretation of +"0x"
		return high !== high || escapedWhitespace ?
			escaped :
			high < 0 ?
				// BMP codepoint
				String.fromCharCode( high + 0x10000 ) :
				// Supplemental Plane codepoint (surrogate pair)
				String.fromCharCode( high >> 10 | 0xD800, high & 0x3FF | 0xDC00 );
	},

	// CSS string/identifier serialization
	// https://drafts.csswg.org/cssom/#common-serializing-idioms
	rcssescape = /([\0-\x1f\x7f]|^-?\d)|^-$|[^\0-\x1f\x7f-\uFFFF\w-]/g,
	fcssescape = function( ch, asCodePoint ) {
		if ( asCodePoint ) {

			// U+0000 NULL becomes U+FFFD REPLACEMENT CHARACTER
			if ( ch === "\0" ) {
				return "\uFFFD";
			}

			// Control characters and (dependent upon position) numbers get escaped as code points
			return ch.slice( 0, -1 ) + "\\" + ch.charCodeAt( ch.length - 1 ).toString( 16 ) + " ";
		}

		// Other potentially-special ASCII characters get backslash-escaped
		return "\\" + ch;
	},

	// Used for iframes
	// See setDocument()
	// Removing the function wrapper causes a "Permission Denied"
	// error in IE
	unloadHandler = function() {
		setDocument();
	},

	disabledAncestor = addCombinator(
		function( elem ) {
			return elem.disabled === true && ("form" in elem || "label" in elem);
		},
		{ dir: "parentNode", next: "legend" }
	);

// Optimize for push.apply( _, NodeList )
try {
	push.apply(
		(arr = slice.call( preferredDoc.childNodes )),
		preferredDoc.childNodes
	);
	// Support: Android<4.0
	// Detect silently failing push.apply
	arr[ preferredDoc.childNodes.length ].nodeType;
} catch ( e ) {
	push = { apply: arr.length ?

		// Leverage slice if possible
		function( target, els ) {
			push_native.apply( target, slice.call(els) );
		} :

		// Support: IE<9
		// Otherwise append directly
		function( target, els ) {
			var j = target.length,
				i = 0;
			// Can't trust NodeList.length
			while ( (target[j++] = els[i++]) ) {}
			target.length = j - 1;
		}
	};
}

function Sizzle( selector, context, results, seed ) {
	var m, i, elem, nid, match, groups, newSelector,
		newContext = context && context.ownerDocument,

		// nodeType defaults to 9, since context defaults to document
		nodeType = context ? context.nodeType : 9;

	results = results || [];

	// Return early from calls with invalid selector or context
	if ( typeof selector !== "string" || !selector ||
		nodeType !== 1 && nodeType !== 9 && nodeType !== 11 ) {

		return results;
	}

	// Try to shortcut find operations (as opposed to filters) in HTML documents
	if ( !seed ) {

		if ( ( context ? context.ownerDocument || context : preferredDoc ) !== document ) {
			setDocument( context );
		}
		context = context || document;

		if ( documentIsHTML ) {

			// If the selector is sufficiently simple, try using a "get*By*" DOM method
			// (excepting DocumentFragment context, where the methods don't exist)
			if ( nodeType !== 11 && (match = rquickExpr.exec( selector )) ) {

				// ID selector
				if ( (m = match[1]) ) {

					// Document context
					if ( nodeType === 9 ) {
						if ( (elem = context.getElementById( m )) ) {

							// Support: IE, Opera, Webkit
							// TODO: identify versions
							// getElementById can match elements by name instead of ID
							if ( elem.id === m ) {
								results.push( elem );
								return results;
							}
						} else {
							return results;
						}

					// Element context
					} else {

						// Support: IE, Opera, Webkit
						// TODO: identify versions
						// getElementById can match elements by name instead of ID
						if ( newContext && (elem = newContext.getElementById( m )) &&
							contains( context, elem ) &&
							elem.id === m ) {

							results.push( elem );
							return results;
						}
					}

				// Type selector
				} else if ( match[2] ) {
					push.apply( results, context.getElementsByTagName( selector ) );
					return results;

				// Class selector
				} else if ( (m = match[3]) && support.getElementsByClassName &&
					context.getElementsByClassName ) {

					push.apply( results, context.getElementsByClassName( m ) );
					return results;
				}
			}

			// Take advantage of querySelectorAll
			if ( support.qsa &&
				!compilerCache[ selector + " " ] &&
				(!rbuggyQSA || !rbuggyQSA.test( selector )) ) {

				if ( nodeType !== 1 ) {
					newContext = context;
					newSelector = selector;

				// qSA looks outside Element context, which is not what we want
				// Thanks to Andrew Dupont for this workaround technique
				// Support: IE <=8
				// Exclude object elements
				} else if ( context.nodeName.toLowerCase() !== "object" ) {

					// Capture the context ID, setting it first if necessary
					if ( (nid = context.getAttribute( "id" )) ) {
						nid = nid.replace( rcssescape, fcssescape );
					} else {
						context.setAttribute( "id", (nid = expando) );
					}

					// Prefix every selector in the list
					groups = tokenize( selector );
					i = groups.length;
					while ( i-- ) {
						groups[i] = "#" + nid + " " + toSelector( groups[i] );
					}
					newSelector = groups.join( "," );

					// Expand context for sibling selectors
					newContext = rsibling.test( selector ) && testContext( context.parentNode ) ||
						context;
				}

				if ( newSelector ) {
					try {
						push.apply( results,
							newContext.querySelectorAll( newSelector )
						);
						return results;
					} catch ( qsaError ) {
					} finally {
						if ( nid === expando ) {
							context.removeAttribute( "id" );
						}
					}
				}
			}
		}
	}

	// All others
	return select( selector.replace( rtrim, "$1" ), context, results, seed );
}

/**
 * Create key-value caches of limited size
 * @returns {function(string, object)} Returns the Object data after storing it on itself with
 *	property name the (space-suffixed) string and (if the cache is larger than Expr.cacheLength)
 *	deleting the oldest entry
 */
function createCache() {
	var keys = [];

	function cache( key, value ) {
		// Use (key + " ") to avoid collision with native prototype properties (see Issue #157)
		if ( keys.push( key + " " ) > Expr.cacheLength ) {
			// Only keep the most recent entries
			delete cache[ keys.shift() ];
		}
		return (cache[ key + " " ] = value);
	}
	return cache;
}

/**
 * Mark a function for special use by Sizzle
 * @param {Function} fn The function to mark
 */
function markFunction( fn ) {
	fn[ expando ] = true;
	return fn;
}

/**
 * Support testing using an element
 * @param {Function} fn Passed the created element and returns a boolean result
 */
function assert( fn ) {
	var el = document.createElement("fieldset");

	try {
		return !!fn( el );
	} catch (e) {
		return false;
	} finally {
		// Remove from its parent by default
		if ( el.parentNode ) {
			el.parentNode.removeChild( el );
		}
		// release memory in IE
		el = null;
	}
}

/**
 * Adds the same handler for all of the specified attrs
 * @param {String} attrs Pipe-separated list of attributes
 * @param {Function} handler The method that will be applied
 */
function addHandle( attrs, handler ) {
	var arr = attrs.split("|"),
		i = arr.length;

	while ( i-- ) {
		Expr.attrHandle[ arr[i] ] = handler;
	}
}

/**
 * Checks document order of two siblings
 * @param {Element} a
 * @param {Element} b
 * @returns {Number} Returns less than 0 if a precedes b, greater than 0 if a follows b
 */
function siblingCheck( a, b ) {
	var cur = b && a,
		diff = cur && a.nodeType === 1 && b.nodeType === 1 &&
			a.sourceIndex - b.sourceIndex;

	// Use IE sourceIndex if available on both nodes
	if ( diff ) {
		return diff;
	}

	// Check if b follows a
	if ( cur ) {
		while ( (cur = cur.nextSibling) ) {
			if ( cur === b ) {
				return -1;
			}
		}
	}

	return a ? 1 : -1;
}

/**
 * Returns a function to use in pseudos for input types
 * @param {String} type
 */
function createInputPseudo( type ) {
	return function( elem ) {
		var name = elem.nodeName.toLowerCase();
		return name === "input" && elem.type === type;
	};
}

/**
 * Returns a function to use in pseudos for buttons
 * @param {String} type
 */
function createButtonPseudo( type ) {
	return function( elem ) {
		var name = elem.nodeName.toLowerCase();
		return (name === "input" || name === "button") && elem.type === type;
	};
}

/**
 * Returns a function to use in pseudos for :enabled/:disabled
 * @param {Boolean} disabled true for :disabled; false for :enabled
 */
function createDisabledPseudo( disabled ) {

	// Known :disabled false positives: fieldset[disabled] > legend:nth-of-type(n+2) :can-disable
	return function( elem ) {

		// Only certain elements can match :enabled or :disabled
		// https://html.spec.whatwg.org/multipage/scripting.html#selector-enabled
		// https://html.spec.whatwg.org/multipage/scripting.html#selector-disabled
		if ( "form" in elem ) {

			// Check for inherited disabledness on relevant non-disabled elements:
			// * listed form-associated elements in a disabled fieldset
			//   https://html.spec.whatwg.org/multipage/forms.html#category-listed
			//   https://html.spec.whatwg.org/multipage/forms.html#concept-fe-disabled
			// * option elements in a disabled optgroup
			//   https://html.spec.whatwg.org/multipage/forms.html#concept-option-disabled
			// All such elements have a "form" property.
			if ( elem.parentNode && elem.disabled === false ) {

				// Option elements defer to a parent optgroup if present
				if ( "label" in elem ) {
					if ( "label" in elem.parentNode ) {
						return elem.parentNode.disabled === disabled;
					} else {
						return elem.disabled === disabled;
					}
				}

				// Support: IE 6 - 11
				// Use the isDisabled shortcut property to check for disabled fieldset ancestors
				return elem.isDisabled === disabled ||

					// Where there is no isDisabled, check manually
					/* jshint -W018 */
					elem.isDisabled !== !disabled &&
						disabledAncestor( elem ) === disabled;
			}

			return elem.disabled === disabled;

		// Try to winnow out elements that can't be disabled before trusting the disabled property.
		// Some victims get caught in our net (label, legend, menu, track), but it shouldn't
		// even exist on them, let alone have a boolean value.
		} else if ( "label" in elem ) {
			return elem.disabled === disabled;
		}

		// Remaining elements are neither :enabled nor :disabled
		return false;
	};
}

/**
 * Returns a function to use in pseudos for positionals
 * @param {Function} fn
 */
function createPositionalPseudo( fn ) {
	return markFunction(function( argument ) {
		argument = +argument;
		return markFunction(function( seed, matches ) {
			var j,
				matchIndexes = fn( [], seed.length, argument ),
				i = matchIndexes.length;

			// Match elements found at the specified indexes
			while ( i-- ) {
				if ( seed[ (j = matchIndexes[i]) ] ) {
					seed[j] = !(matches[j] = seed[j]);
				}
			}
		});
	});
}

/**
 * Checks a node for validity as a Sizzle context
 * @param {Element|Object=} context
 * @returns {Element|Object|Boolean} The input node if acceptable, otherwise a falsy value
 */
function testContext( context ) {
	return context && typeof context.getElementsByTagName !== "undefined" && context;
}

// Expose support vars for convenience
support = Sizzle.support = {};

/**
 * Detects XML nodes
 * @param {Element|Object} elem An element or a document
 * @returns {Boolean} True iff elem is a non-HTML XML node
 */
isXML = Sizzle.isXML = function( elem ) {
	// documentElement is verified for cases where it doesn't yet exist
	// (such as loading iframes in IE - #4833)
	var documentElement = elem && (elem.ownerDocument || elem).documentElement;
	return documentElement ? documentElement.nodeName !== "HTML" : false;
};

/**
 * Sets document-related variables once based on the current document
 * @param {Element|Object} [doc] An element or document object to use to set the document
 * @returns {Object} Returns the current document
 */
setDocument = Sizzle.setDocument = function( node ) {
	var hasCompare, subWindow,
		doc = node ? node.ownerDocument || node : preferredDoc;

	// Return early if doc is invalid or already selected
	if ( doc === document || doc.nodeType !== 9 || !doc.documentElement ) {
		return document;
	}

	// Update global variables
	document = doc;
	docElem = document.documentElement;
	documentIsHTML = !isXML( document );

	// Support: IE 9-11, Edge
	// Accessing iframe documents after unload throws "permission denied" errors (jQuery #13936)
	if ( preferredDoc !== document &&
		(subWindow = document.defaultView) && subWindow.top !== subWindow ) {

		// Support: IE 11, Edge
		if ( subWindow.addEventListener ) {
			subWindow.addEventListener( "unload", unloadHandler, false );

		// Support: IE 9 - 10 only
		} else if ( subWindow.attachEvent ) {
			subWindow.attachEvent( "onunload", unloadHandler );
		}
	}

	/* Attributes
	---------------------------------------------------------------------- */

	// Support: IE<8
	// Verify that getAttribute really returns attributes and not properties
	// (excepting IE8 booleans)
	support.attributes = assert(function( el ) {
		el.className = "i";
		return !el.getAttribute("className");
	});

	/* getElement(s)By*
	---------------------------------------------------------------------- */

	// Check if getElementsByTagName("*") returns only elements
	support.getElementsByTagName = assert(function( el ) {
		el.appendChild( document.createComment("") );
		return !el.getElementsByTagName("*").length;
	});

	// Support: IE<9
	support.getElementsByClassName = rnative.test( document.getElementsByClassName );

	// Support: IE<10
	// Check if getElementById returns elements by name
	// The broken getElementById methods don't pick up programmatically-set names,
	// so use a roundabout getElementsByName test
	support.getById = assert(function( el ) {
		docElem.appendChild( el ).id = expando;
		return !document.getElementsByName || !document.getElementsByName( expando ).length;
	});

	// ID filter and find
	if ( support.getById ) {
		Expr.filter["ID"] = function( id ) {
			var attrId = id.replace( runescape, funescape );
			return function( elem ) {
				return elem.getAttribute("id") === attrId;
			};
		};
		Expr.find["ID"] = function( id, context ) {
			if ( typeof context.getElementById !== "undefined" && documentIsHTML ) {
				var elem = context.getElementById( id );
				return elem ? [ elem ] : [];
			}
		};
	} else {
		Expr.filter["ID"] =  function( id ) {
			var attrId = id.replace( runescape, funescape );
			return function( elem ) {
				var node = typeof elem.getAttributeNode !== "undefined" &&
					elem.getAttributeNode("id");
				return node && node.value === attrId;
			};
		};

		// Support: IE 6 - 7 only
		// getElementById is not reliable as a find shortcut
		Expr.find["ID"] = function( id, context ) {
			if ( typeof context.getElementById !== "undefined" && documentIsHTML ) {
				var node, i, elems,
					elem = context.getElementById( id );

				if ( elem ) {

					// Verify the id attribute
					node = elem.getAttributeNode("id");
					if ( node && node.value === id ) {
						return [ elem ];
					}

					// Fall back on getElementsByName
					elems = context.getElementsByName( id );
					i = 0;
					while ( (elem = elems[i++]) ) {
						node = elem.getAttributeNode("id");
						if ( node && node.value === id ) {
							return [ elem ];
						}
					}
				}

				return [];
			}
		};
	}

	// Tag
	Expr.find["TAG"] = support.getElementsByTagName ?
		function( tag, context ) {
			if ( typeof context.getElementsByTagName !== "undefined" ) {
				return context.getElementsByTagName( tag );

			// DocumentFragment nodes don't have gEBTN
			} else if ( support.qsa ) {
				return context.querySelectorAll( tag );
			}
		} :

		function( tag, context ) {
			var elem,
				tmp = [],
				i = 0,
				// By happy coincidence, a (broken) gEBTN appears on DocumentFragment nodes too
				results = context.getElementsByTagName( tag );

			// Filter out possible comments
			if ( tag === "*" ) {
				while ( (elem = results[i++]) ) {
					if ( elem.nodeType === 1 ) {
						tmp.push( elem );
					}
				}

				return tmp;
			}
			return results;
		};

	// Class
	Expr.find["CLASS"] = support.getElementsByClassName && function( className, context ) {
		if ( typeof context.getElementsByClassName !== "undefined" && documentIsHTML ) {
			return context.getElementsByClassName( className );
		}
	};

	/* QSA/matchesSelector
	---------------------------------------------------------------------- */

	// QSA and matchesSelector support

	// matchesSelector(:active) reports false when true (IE9/Opera 11.5)
	rbuggyMatches = [];

	// qSa(:focus) reports false when true (Chrome 21)
	// We allow this because of a bug in IE8/9 that throws an error
	// whenever `document.activeElement` is accessed on an iframe
	// So, we allow :focus to pass through QSA all the time to avoid the IE error
	// See https://bugs.jquery.com/ticket/13378
	rbuggyQSA = [];

	if ( (support.qsa = rnative.test( document.querySelectorAll )) ) {
		// Build QSA regex
		// Regex strategy adopted from Diego Perini
		assert(function( el ) {
			// Select is set to empty string on purpose
			// This is to test IE's treatment of not explicitly
			// setting a boolean content attribute,
			// since its presence should be enough
			// https://bugs.jquery.com/ticket/12359
			docElem.appendChild( el ).innerHTML = "<a id='" + expando + "'></a>" +
				"<select id='" + expando + "-\r\\' msallowcapture=''>" +
				"<option selected=''></option></select>";

			// Support: IE8, Opera 11-12.16
			// Nothing should be selected when empty strings follow ^= or $= or *=
			// The test attribute must be unknown in Opera but "safe" for WinRT
			// https://msdn.microsoft.com/en-us/library/ie/hh465388.aspx#attribute_section
			if ( el.querySelectorAll("[msallowcapture^='']").length ) {
				rbuggyQSA.push( "[*^$]=" + whitespace + "*(?:''|\"\")" );
			}

			// Support: IE8
			// Boolean attributes and "value" are not treated correctly
			if ( !el.querySelectorAll("[selected]").length ) {
				rbuggyQSA.push( "\\[" + whitespace + "*(?:value|" + booleans + ")" );
			}

			// Support: Chrome<29, Android<4.4, Safari<7.0+, iOS<7.0+, PhantomJS<1.9.8+
			if ( !el.querySelectorAll( "[id~=" + expando + "-]" ).length ) {
				rbuggyQSA.push("~=");
			}

			// Webkit/Opera - :checked should return selected option elements
			// http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
			// IE8 throws error here and will not see later tests
			if ( !el.querySelectorAll(":checked").length ) {
				rbuggyQSA.push(":checked");
			}

			// Support: Safari 8+, iOS 8+
			// https://bugs.webkit.org/show_bug.cgi?id=136851
			// In-page `selector#id sibling-combinator selector` fails
			if ( !el.querySelectorAll( "a#" + expando + "+*" ).length ) {
				rbuggyQSA.push(".#.+[+~]");
			}
		});

		assert(function( el ) {
			el.innerHTML = "<a href='' disabled='disabled'></a>" +
				"<select disabled='disabled'><option/></select>";

			// Support: Windows 8 Native Apps
			// The type and name attributes are restricted during .innerHTML assignment
			var input = document.createElement("input");
			input.setAttribute( "type", "hidden" );
			el.appendChild( input ).setAttribute( "name", "D" );

			// Support: IE8
			// Enforce case-sensitivity of name attribute
			if ( el.querySelectorAll("[name=d]").length ) {
				rbuggyQSA.push( "name" + whitespace + "*[*^$|!~]?=" );
			}

			// FF 3.5 - :enabled/:disabled and hidden elements (hidden elements are still enabled)
			// IE8 throws error here and will not see later tests
			if ( el.querySelectorAll(":enabled").length !== 2 ) {
				rbuggyQSA.push( ":enabled", ":disabled" );
			}

			// Support: IE9-11+
			// IE's :disabled selector does not pick up the children of disabled fieldsets
			docElem.appendChild( el ).disabled = true;
			if ( el.querySelectorAll(":disabled").length !== 2 ) {
				rbuggyQSA.push( ":enabled", ":disabled" );
			}

			// Opera 10-11 does not throw on post-comma invalid pseudos
			el.querySelectorAll("*,:x");
			rbuggyQSA.push(",.*:");
		});
	}

	if ( (support.matchesSelector = rnative.test( (matches = docElem.matches ||
		docElem.webkitMatchesSelector ||
		docElem.mozMatchesSelector ||
		docElem.oMatchesSelector ||
		docElem.msMatchesSelector) )) ) {

		assert(function( el ) {
			// Check to see if it's possible to do matchesSelector
			// on a disconnected node (IE 9)
			support.disconnectedMatch = matches.call( el, "*" );

			// This should fail with an exception
			// Gecko does not error, returns false instead
			matches.call( el, "[s!='']:x" );
			rbuggyMatches.push( "!=", pseudos );
		});
	}

	rbuggyQSA = rbuggyQSA.length && new RegExp( rbuggyQSA.join("|") );
	rbuggyMatches = rbuggyMatches.length && new RegExp( rbuggyMatches.join("|") );

	/* Contains
	---------------------------------------------------------------------- */
	hasCompare = rnative.test( docElem.compareDocumentPosition );

	// Element contains another
	// Purposefully self-exclusive
	// As in, an element does not contain itself
	contains = hasCompare || rnative.test( docElem.contains ) ?
		function( a, b ) {
			var adown = a.nodeType === 9 ? a.documentElement : a,
				bup = b && b.parentNode;
			return a === bup || !!( bup && bup.nodeType === 1 && (
				adown.contains ?
					adown.contains( bup ) :
					a.compareDocumentPosition && a.compareDocumentPosition( bup ) & 16
			));
		} :
		function( a, b ) {
			if ( b ) {
				while ( (b = b.parentNode) ) {
					if ( b === a ) {
						return true;
					}
				}
			}
			return false;
		};

	/* Sorting
	---------------------------------------------------------------------- */

	// Document order sorting
	sortOrder = hasCompare ?
	function( a, b ) {

		// Flag for duplicate removal
		if ( a === b ) {
			hasDuplicate = true;
			return 0;
		}

		// Sort on method existence if only one input has compareDocumentPosition
		var compare = !a.compareDocumentPosition - !b.compareDocumentPosition;
		if ( compare ) {
			return compare;
		}

		// Calculate position if both inputs belong to the same document
		compare = ( a.ownerDocument || a ) === ( b.ownerDocument || b ) ?
			a.compareDocumentPosition( b ) :

			// Otherwise we know they are disconnected
			1;

		// Disconnected nodes
		if ( compare & 1 ||
			(!support.sortDetached && b.compareDocumentPosition( a ) === compare) ) {

			// Choose the first element that is related to our preferred document
			if ( a === document || a.ownerDocument === preferredDoc && contains(preferredDoc, a) ) {
				return -1;
			}
			if ( b === document || b.ownerDocument === preferredDoc && contains(preferredDoc, b) ) {
				return 1;
			}

			// Maintain original order
			return sortInput ?
				( indexOf( sortInput, a ) - indexOf( sortInput, b ) ) :
				0;
		}

		return compare & 4 ? -1 : 1;
	} :
	function( a, b ) {
		// Exit early if the nodes are identical
		if ( a === b ) {
			hasDuplicate = true;
			return 0;
		}

		var cur,
			i = 0,
			aup = a.parentNode,
			bup = b.parentNode,
			ap = [ a ],
			bp = [ b ];

		// Parentless nodes are either documents or disconnected
		if ( !aup || !bup ) {
			return a === document ? -1 :
				b === document ? 1 :
				aup ? -1 :
				bup ? 1 :
				sortInput ?
				( indexOf( sortInput, a ) - indexOf( sortInput, b ) ) :
				0;

		// If the nodes are siblings, we can do a quick check
		} else if ( aup === bup ) {
			return siblingCheck( a, b );
		}

		// Otherwise we need full lists of their ancestors for comparison
		cur = a;
		while ( (cur = cur.parentNode) ) {
			ap.unshift( cur );
		}
		cur = b;
		while ( (cur = cur.parentNode) ) {
			bp.unshift( cur );
		}

		// Walk down the tree looking for a discrepancy
		while ( ap[i] === bp[i] ) {
			i++;
		}

		return i ?
			// Do a sibling check if the nodes have a common ancestor
			siblingCheck( ap[i], bp[i] ) :

			// Otherwise nodes in our document sort first
			ap[i] === preferredDoc ? -1 :
			bp[i] === preferredDoc ? 1 :
			0;
	};

	return document;
};

Sizzle.matches = function( expr, elements ) {
	return Sizzle( expr, null, null, elements );
};

Sizzle.matchesSelector = function( elem, expr ) {
	// Set document vars if needed
	if ( ( elem.ownerDocument || elem ) !== document ) {
		setDocument( elem );
	}

	// Make sure that attribute selectors are quoted
	expr = expr.replace( rattributeQuotes, "='$1']" );

	if ( support.matchesSelector && documentIsHTML &&
		!compilerCache[ expr + " " ] &&
		( !rbuggyMatches || !rbuggyMatches.test( expr ) ) &&
		( !rbuggyQSA     || !rbuggyQSA.test( expr ) ) ) {

		try {
			var ret = matches.call( elem, expr );

			// IE 9's matchesSelector returns false on disconnected nodes
			if ( ret || support.disconnectedMatch ||
					// As well, disconnected nodes are said to be in a document
					// fragment in IE 9
					elem.document && elem.document.nodeType !== 11 ) {
				return ret;
			}
		} catch (e) {}
	}

	return Sizzle( expr, document, null, [ elem ] ).length > 0;
};

Sizzle.contains = function( context, elem ) {
	// Set document vars if needed
	if ( ( context.ownerDocument || context ) !== document ) {
		setDocument( context );
	}
	return contains( context, elem );
};

Sizzle.attr = function( elem, name ) {
	// Set document vars if needed
	if ( ( elem.ownerDocument || elem ) !== document ) {
		setDocument( elem );
	}

	var fn = Expr.attrHandle[ name.toLowerCase() ],
		// Don't get fooled by Object.prototype properties (jQuery #13807)
		val = fn && hasOwn.call( Expr.attrHandle, name.toLowerCase() ) ?
			fn( elem, name, !documentIsHTML ) :
			undefined;

	return val !== undefined ?
		val :
		support.attributes || !documentIsHTML ?
			elem.getAttribute( name ) :
			(val = elem.getAttributeNode(name)) && val.specified ?
				val.value :
				null;
};

Sizzle.escape = function( sel ) {
	return (sel + "").replace( rcssescape, fcssescape );
};

Sizzle.error = function( msg ) {
	throw new Error( "Syntax error, unrecognized expression: " + msg );
};

/**
 * Document sorting and removing duplicates
 * @param {ArrayLike} results
 */
Sizzle.uniqueSort = function( results ) {
	var elem,
		duplicates = [],
		j = 0,
		i = 0;

	// Unless we *know* we can detect duplicates, assume their presence
	hasDuplicate = !support.detectDuplicates;
	sortInput = !support.sortStable && results.slice( 0 );
	results.sort( sortOrder );

	if ( hasDuplicate ) {
		while ( (elem = results[i++]) ) {
			if ( elem === results[ i ] ) {
				j = duplicates.push( i );
			}
		}
		while ( j-- ) {
			results.splice( duplicates[ j ], 1 );
		}
	}

	// Clear input after sorting to release objects
	// See https://github.com/jquery/sizzle/pull/225
	sortInput = null;

	return results;
};

/**
 * Utility function for retrieving the text value of an array of DOM nodes
 * @param {Array|Element} elem
 */
getText = Sizzle.getText = function( elem ) {
	var node,
		ret = "",
		i = 0,
		nodeType = elem.nodeType;

	if ( !nodeType ) {
		// If no nodeType, this is expected to be an array
		while ( (node = elem[i++]) ) {
			// Do not traverse comment nodes
			ret += getText( node );
		}
	} else if ( nodeType === 1 || nodeType === 9 || nodeType === 11 ) {
		// Use textContent for elements
		// innerText usage removed for consistency of new lines (jQuery #11153)
		if ( typeof elem.textContent === "string" ) {
			return elem.textContent;
		} else {
			// Traverse its children
			for ( elem = elem.firstChild; elem; elem = elem.nextSibling ) {
				ret += getText( elem );
			}
		}
	} else if ( nodeType === 3 || nodeType === 4 ) {
		return elem.nodeValue;
	}
	// Do not include comment or processing instruction nodes

	return ret;
};

Expr = Sizzle.selectors = {

	// Can be adjusted by the user
	cacheLength: 50,

	createPseudo: markFunction,

	match: matchExpr,

	attrHandle: {},

	find: {},

	relative: {
		">": { dir: "parentNode", first: true },
		" ": { dir: "parentNode" },
		"+": { dir: "previousSibling", first: true },
		"~": { dir: "previousSibling" }
	},

	preFilter: {
		"ATTR": function( match ) {
			match[1] = match[1].replace( runescape, funescape );

			// Move the given value to match[3] whether quoted or unquoted
			match[3] = ( match[3] || match[4] || match[5] || "" ).replace( runescape, funescape );

			if ( match[2] === "~=" ) {
				match[3] = " " + match[3] + " ";
			}

			return match.slice( 0, 4 );
		},

		"CHILD": function( match ) {
			/* matches from matchExpr["CHILD"]
				1 type (only|nth|...)
				2 what (child|of-type)
				3 argument (even|odd|\d*|\d*n([+-]\d+)?|...)
				4 xn-component of xn+y argument ([+-]?\d*n|)
				5 sign of xn-component
				6 x of xn-component
				7 sign of y-component
				8 y of y-component
			*/
			match[1] = match[1].toLowerCase();

			if ( match[1].slice( 0, 3 ) === "nth" ) {
				// nth-* requires argument
				if ( !match[3] ) {
					Sizzle.error( match[0] );
				}

				// numeric x and y parameters for Expr.filter.CHILD
				// remember that false/true cast respectively to 0/1
				match[4] = +( match[4] ? match[5] + (match[6] || 1) : 2 * ( match[3] === "even" || match[3] === "odd" ) );
				match[5] = +( ( match[7] + match[8] ) || match[3] === "odd" );

			// other types prohibit arguments
			} else if ( match[3] ) {
				Sizzle.error( match[0] );
			}

			return match;
		},

		"PSEUDO": function( match ) {
			var excess,
				unquoted = !match[6] && match[2];

			if ( matchExpr["CHILD"].test( match[0] ) ) {
				return null;
			}

			// Accept quoted arguments as-is
			if ( match[3] ) {
				match[2] = match[4] || match[5] || "";

			// Strip excess characters from unquoted arguments
			} else if ( unquoted && rpseudo.test( unquoted ) &&
				// Get excess from tokenize (recursively)
				(excess = tokenize( unquoted, true )) &&
				// advance to the next closing parenthesis
				(excess = unquoted.indexOf( ")", unquoted.length - excess ) - unquoted.length) ) {

				// excess is a negative index
				match[0] = match[0].slice( 0, excess );
				match[2] = unquoted.slice( 0, excess );
			}

			// Return only captures needed by the pseudo filter method (type and argument)
			return match.slice( 0, 3 );
		}
	},

	filter: {

		"TAG": function( nodeNameSelector ) {
			var nodeName = nodeNameSelector.replace( runescape, funescape ).toLowerCase();
			return nodeNameSelector === "*" ?
				function() { return true; } :
				function( elem ) {
					return elem.nodeName && elem.nodeName.toLowerCase() === nodeName;
				};
		},

		"CLASS": function( className ) {
			var pattern = classCache[ className + " " ];

			return pattern ||
				(pattern = new RegExp( "(^|" + whitespace + ")" + className + "(" + whitespace + "|$)" )) &&
				classCache( className, function( elem ) {
					return pattern.test( typeof elem.className === "string" && elem.className || typeof elem.getAttribute !== "undefined" && elem.getAttribute("class") || "" );
				});
		},

		"ATTR": function( name, operator, check ) {
			return function( elem ) {
				var result = Sizzle.attr( elem, name );

				if ( result == null ) {
					return operator === "!=";
				}
				if ( !operator ) {
					return true;
				}

				result += "";

				return operator === "=" ? result === check :
					operator === "!=" ? result !== check :
					operator === "^=" ? check && result.indexOf( check ) === 0 :
					operator === "*=" ? check && result.indexOf( check ) > -1 :
					operator === "$=" ? check && result.slice( -check.length ) === check :
					operator === "~=" ? ( " " + result.replace( rwhitespace, " " ) + " " ).indexOf( check ) > -1 :
					operator === "|=" ? result === check || result.slice( 0, check.length + 1 ) === check + "-" :
					false;
			};
		},

		"CHILD": function( type, what, argument, first, last ) {
			var simple = type.slice( 0, 3 ) !== "nth",
				forward = type.slice( -4 ) !== "last",
				ofType = what === "of-type";

			return first === 1 && last === 0 ?

				// Shortcut for :nth-*(n)
				function( elem ) {
					return !!elem.parentNode;
				} :

				function( elem, context, xml ) {
					var cache, uniqueCache, outerCache, node, nodeIndex, start,
						dir = simple !== forward ? "nextSibling" : "previousSibling",
						parent = elem.parentNode,
						name = ofType && elem.nodeName.toLowerCase(),
						useCache = !xml && !ofType,
						diff = false;

					if ( parent ) {

						// :(first|last|only)-(child|of-type)
						if ( simple ) {
							while ( dir ) {
								node = elem;
								while ( (node = node[ dir ]) ) {
									if ( ofType ?
										node.nodeName.toLowerCase() === name :
										node.nodeType === 1 ) {

										return false;
									}
								}
								// Reverse direction for :only-* (if we haven't yet done so)
								start = dir = type === "only" && !start && "nextSibling";
							}
							return true;
						}

						start = [ forward ? parent.firstChild : parent.lastChild ];

						// non-xml :nth-child(...) stores cache data on `parent`
						if ( forward && useCache ) {

							// Seek `elem` from a previously-cached index

							// ...in a gzip-friendly way
							node = parent;
							outerCache = node[ expando ] || (node[ expando ] = {});

							// Support: IE <9 only
							// Defend against cloned attroperties (jQuery gh-1709)
							uniqueCache = outerCache[ node.uniqueID ] ||
								(outerCache[ node.uniqueID ] = {});

							cache = uniqueCache[ type ] || [];
							nodeIndex = cache[ 0 ] === dirruns && cache[ 1 ];
							diff = nodeIndex && cache[ 2 ];
							node = nodeIndex && parent.childNodes[ nodeIndex ];

							while ( (node = ++nodeIndex && node && node[ dir ] ||

								// Fallback to seeking `elem` from the start
								(diff = nodeIndex = 0) || start.pop()) ) {

								// When found, cache indexes on `parent` and break
								if ( node.nodeType === 1 && ++diff && node === elem ) {
									uniqueCache[ type ] = [ dirruns, nodeIndex, diff ];
									break;
								}
							}

						} else {
							// Use previously-cached element index if available
							if ( useCache ) {
								// ...in a gzip-friendly way
								node = elem;
								outerCache = node[ expando ] || (node[ expando ] = {});

								// Support: IE <9 only
								// Defend against cloned attroperties (jQuery gh-1709)
								uniqueCache = outerCache[ node.uniqueID ] ||
									(outerCache[ node.uniqueID ] = {});

								cache = uniqueCache[ type ] || [];
								nodeIndex = cache[ 0 ] === dirruns && cache[ 1 ];
								diff = nodeIndex;
							}

							// xml :nth-child(...)
							// or :nth-last-child(...) or :nth(-last)?-of-type(...)
							if ( diff === false ) {
								// Use the same loop as above to seek `elem` from the start
								while ( (node = ++nodeIndex && node && node[ dir ] ||
									(diff = nodeIndex = 0) || start.pop()) ) {

									if ( ( ofType ?
										node.nodeName.toLowerCase() === name :
										node.nodeType === 1 ) &&
										++diff ) {

										// Cache the index of each encountered element
										if ( useCache ) {
											outerCache = node[ expando ] || (node[ expando ] = {});

											// Support: IE <9 only
											// Defend against cloned attroperties (jQuery gh-1709)
											uniqueCache = outerCache[ node.uniqueID ] ||
												(outerCache[ node.uniqueID ] = {});

											uniqueCache[ type ] = [ dirruns, diff ];
										}

										if ( node === elem ) {
											break;
										}
									}
								}
							}
						}

						// Incorporate the offset, then check against cycle size
						diff -= last;
						return diff === first || ( diff % first === 0 && diff / first >= 0 );
					}
				};
		},

		"PSEUDO": function( pseudo, argument ) {
			// pseudo-class names are case-insensitive
			// http://www.w3.org/TR/selectors/#pseudo-classes
			// Prioritize by case sensitivity in case custom pseudos are added with uppercase letters
			// Remember that setFilters inherits from pseudos
			var args,
				fn = Expr.pseudos[ pseudo ] || Expr.setFilters[ pseudo.toLowerCase() ] ||
					Sizzle.error( "unsupported pseudo: " + pseudo );

			// The user may use createPseudo to indicate that
			// arguments are needed to create the filter function
			// just as Sizzle does
			if ( fn[ expando ] ) {
				return fn( argument );
			}

			// But maintain support for old signatures
			if ( fn.length > 1 ) {
				args = [ pseudo, pseudo, "", argument ];
				return Expr.setFilters.hasOwnProperty( pseudo.toLowerCase() ) ?
					markFunction(function( seed, matches ) {
						var idx,
							matched = fn( seed, argument ),
							i = matched.length;
						while ( i-- ) {
							idx = indexOf( seed, matched[i] );
							seed[ idx ] = !( matches[ idx ] = matched[i] );
						}
					}) :
					function( elem ) {
						return fn( elem, 0, args );
					};
			}

			return fn;
		}
	},

	pseudos: {
		// Potentially complex pseudos
		"not": markFunction(function( selector ) {
			// Trim the selector passed to compile
			// to avoid treating leading and trailing
			// spaces as combinators
			var input = [],
				results = [],
				matcher = compile( selector.replace( rtrim, "$1" ) );

			return matcher[ expando ] ?
				markFunction(function( seed, matches, context, xml ) {
					var elem,
						unmatched = matcher( seed, null, xml, [] ),
						i = seed.length;

					// Match elements unmatched by `matcher`
					while ( i-- ) {
						if ( (elem = unmatched[i]) ) {
							seed[i] = !(matches[i] = elem);
						}
					}
				}) :
				function( elem, context, xml ) {
					input[0] = elem;
					matcher( input, null, xml, results );
					// Don't keep the element (issue #299)
					input[0] = null;
					return !results.pop();
				};
		}),

		"has": markFunction(function( selector ) {
			if (typeof selector === "string") {
				Sizzle.compile(selector);
			}
			return function( elem ) {
				return Sizzle( selector, elem ).length > 0;
			};
		}),

		"contains": markFunction(function( text ) {
			text = text.replace( runescape, funescape );
			return function( elem ) {
				return ( elem.textContent || elem.innerText || getText( elem ) ).indexOf( text ) > -1;
			};
		}),

		// "Whether an element is represented by a :lang() selector
		// is based solely on the element's language value
		// being equal to the identifier C,
		// or beginning with the identifier C immediately followed by "-".
		// The matching of C against the element's language value is performed case-insensitively.
		// The identifier C does not have to be a valid language name."
		// http://www.w3.org/TR/selectors/#lang-pseudo
		"lang": markFunction( function( lang ) {
			// lang value must be a valid identifier
			if ( !ridentifier.test(lang || "") ) {
				Sizzle.error( "unsupported lang: " + lang );
			}
			lang = lang.replace( runescape, funescape ).toLowerCase();
			return function( elem ) {
				var elemLang;
				do {
					if ( (elemLang = documentIsHTML ?
						elem.lang :
						elem.getAttribute("xml:lang") || elem.getAttribute("lang")) ) {

						elemLang = elemLang.toLowerCase();
						return elemLang === lang || elemLang.indexOf( lang + "-" ) === 0;
					}
				} while ( (elem = elem.parentNode) && elem.nodeType === 1 );
				return false;
			};
		}),

		// Miscellaneous
		"target": function( elem ) {
			var hash = window.location && window.location.hash;
			return hash && hash.slice( 1 ) === elem.id;
		},

		"root": function( elem ) {
			return elem === docElem;
		},

		"focus": function( elem ) {
			return elem === document.activeElement && (!document.hasFocus || document.hasFocus()) && !!(elem.type || elem.href || ~elem.tabIndex);
		},

		// Boolean properties
		"enabled": createDisabledPseudo( false ),
		"disabled": createDisabledPseudo( true ),

		"checked": function( elem ) {
			// In CSS3, :checked should return both checked and selected elements
			// http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
			var nodeName = elem.nodeName.toLowerCase();
			return (nodeName === "input" && !!elem.checked) || (nodeName === "option" && !!elem.selected);
		},

		"selected": function( elem ) {
			// Accessing this property makes selected-by-default
			// options in Safari work properly
			if ( elem.parentNode ) {
				elem.parentNode.selectedIndex;
			}

			return elem.selected === true;
		},

		// Contents
		"empty": function( elem ) {
			// http://www.w3.org/TR/selectors/#empty-pseudo
			// :empty is negated by element (1) or content nodes (text: 3; cdata: 4; entity ref: 5),
			//   but not by others (comment: 8; processing instruction: 7; etc.)
			// nodeType < 6 works because attributes (2) do not appear as children
			for ( elem = elem.firstChild; elem; elem = elem.nextSibling ) {
				if ( elem.nodeType < 6 ) {
					return false;
				}
			}
			return true;
		},

		"parent": function( elem ) {
			return !Expr.pseudos["empty"]( elem );
		},

		// Element/input types
		"header": function( elem ) {
			return rheader.test( elem.nodeName );
		},

		"input": function( elem ) {
			return rinputs.test( elem.nodeName );
		},

		"button": function( elem ) {
			var name = elem.nodeName.toLowerCase();
			return name === "input" && elem.type === "button" || name === "button";
		},

		"text": function( elem ) {
			var attr;
			return elem.nodeName.toLowerCase() === "input" &&
				elem.type === "text" &&

				// Support: IE<8
				// New HTML5 attribute values (e.g., "search") appear with elem.type === "text"
				( (attr = elem.getAttribute("type")) == null || attr.toLowerCase() === "text" );
		},

		// Position-in-collection
		"first": createPositionalPseudo(function() {
			return [ 0 ];
		}),

		"last": createPositionalPseudo(function( matchIndexes, length ) {
			return [ length - 1 ];
		}),

		"eq": createPositionalPseudo(function( matchIndexes, length, argument ) {
			return [ argument < 0 ? argument + length : argument ];
		}),

		"even": createPositionalPseudo(function( matchIndexes, length ) {
			var i = 0;
			for ( ; i < length; i += 2 ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		}),

		"odd": createPositionalPseudo(function( matchIndexes, length ) {
			var i = 1;
			for ( ; i < length; i += 2 ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		}),

		"lt": createPositionalPseudo(function( matchIndexes, length, argument ) {
			var i = argument < 0 ? argument + length : argument;
			for ( ; --i >= 0; ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		}),

		"gt": createPositionalPseudo(function( matchIndexes, length, argument ) {
			var i = argument < 0 ? argument + length : argument;
			for ( ; ++i < length; ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		})
	}
};

Expr.pseudos["nth"] = Expr.pseudos["eq"];

// Add button/input type pseudos
for ( i in { radio: true, checkbox: true, file: true, password: true, image: true } ) {
	Expr.pseudos[ i ] = createInputPseudo( i );
}
for ( i in { submit: true, reset: true } ) {
	Expr.pseudos[ i ] = createButtonPseudo( i );
}

// Easy API for creating new setFilters
function setFilters() {}
setFilters.prototype = Expr.filters = Expr.pseudos;
Expr.setFilters = new setFilters();

tokenize = Sizzle.tokenize = function( selector, parseOnly ) {
	var matched, match, tokens, type,
		soFar, groups, preFilters,
		cached = tokenCache[ selector + " " ];

	if ( cached ) {
		return parseOnly ? 0 : cached.slice( 0 );
	}

	soFar = selector;
	groups = [];
	preFilters = Expr.preFilter;

	while ( soFar ) {

		// Comma and first run
		if ( !matched || (match = rcomma.exec( soFar )) ) {
			if ( match ) {
				// Don't consume trailing commas as valid
				soFar = soFar.slice( match[0].length ) || soFar;
			}
			groups.push( (tokens = []) );
		}

		matched = false;

		// Combinators
		if ( (match = rcombinators.exec( soFar )) ) {
			matched = match.shift();
			tokens.push({
				value: matched,
				// Cast descendant combinators to space
				type: match[0].replace( rtrim, " " )
			});
			soFar = soFar.slice( matched.length );
		}

		// Filters
		for ( type in Expr.filter ) {
			if ( (match = matchExpr[ type ].exec( soFar )) && (!preFilters[ type ] ||
				(match = preFilters[ type ]( match ))) ) {
				matched = match.shift();
				tokens.push({
					value: matched,
					type: type,
					matches: match
				});
				soFar = soFar.slice( matched.length );
			}
		}

		if ( !matched ) {
			break;
		}
	}

	// Return the length of the invalid excess
	// if we're just parsing
	// Otherwise, throw an error or return tokens
	return parseOnly ?
		soFar.length :
		soFar ?
			Sizzle.error( selector ) :
			// Cache the tokens
			tokenCache( selector, groups ).slice( 0 );
};

function toSelector( tokens ) {
	var i = 0,
		len = tokens.length,
		selector = "";
	for ( ; i < len; i++ ) {
		selector += tokens[i].value;
	}
	return selector;
}

function addCombinator( matcher, combinator, base ) {
	var dir = combinator.dir,
		skip = combinator.next,
		key = skip || dir,
		checkNonElements = base && key === "parentNode",
		doneName = done++;

	return combinator.first ?
		// Check against closest ancestor/preceding element
		function( elem, context, xml ) {
			while ( (elem = elem[ dir ]) ) {
				if ( elem.nodeType === 1 || checkNonElements ) {
					return matcher( elem, context, xml );
				}
			}
			return false;
		} :

		// Check against all ancestor/preceding elements
		function( elem, context, xml ) {
			var oldCache, uniqueCache, outerCache,
				newCache = [ dirruns, doneName ];

			// We can't set arbitrary data on XML nodes, so they don't benefit from combinator caching
			if ( xml ) {
				while ( (elem = elem[ dir ]) ) {
					if ( elem.nodeType === 1 || checkNonElements ) {
						if ( matcher( elem, context, xml ) ) {
							return true;
						}
					}
				}
			} else {
				while ( (elem = elem[ dir ]) ) {
					if ( elem.nodeType === 1 || checkNonElements ) {
						outerCache = elem[ expando ] || (elem[ expando ] = {});

						// Support: IE <9 only
						// Defend against cloned attroperties (jQuery gh-1709)
						uniqueCache = outerCache[ elem.uniqueID ] || (outerCache[ elem.uniqueID ] = {});

						if ( skip && skip === elem.nodeName.toLowerCase() ) {
							elem = elem[ dir ] || elem;
						} else if ( (oldCache = uniqueCache[ key ]) &&
							oldCache[ 0 ] === dirruns && oldCache[ 1 ] === doneName ) {

							// Assign to newCache so results back-propagate to previous elements
							return (newCache[ 2 ] = oldCache[ 2 ]);
						} else {
							// Reuse newcache so results back-propagate to previous elements
							uniqueCache[ key ] = newCache;

							// A match means we're done; a fail means we have to keep checking
							if ( (newCache[ 2 ] = matcher( elem, context, xml )) ) {
								return true;
							}
						}
					}
				}
			}
			return false;
		};
}

function elementMatcher( matchers ) {
	return matchers.length > 1 ?
		function( elem, context, xml ) {
			var i = matchers.length;
			while ( i-- ) {
				if ( !matchers[i]( elem, context, xml ) ) {
					return false;
				}
			}
			return true;
		} :
		matchers[0];
}

function multipleContexts( selector, contexts, results ) {
	var i = 0,
		len = contexts.length;
	for ( ; i < len; i++ ) {
		Sizzle( selector, contexts[i], results );
	}
	return results;
}

function condense( unmatched, map, filter, context, xml ) {
	var elem,
		newUnmatched = [],
		i = 0,
		len = unmatched.length,
		mapped = map != null;

	for ( ; i < len; i++ ) {
		if ( (elem = unmatched[i]) ) {
			if ( !filter || filter( elem, context, xml ) ) {
				newUnmatched.push( elem );
				if ( mapped ) {
					map.push( i );
				}
			}
		}
	}

	return newUnmatched;
}

function setMatcher( preFilter, selector, matcher, postFilter, postFinder, postSelector ) {
	if ( postFilter && !postFilter[ expando ] ) {
		postFilter = setMatcher( postFilter );
	}
	if ( postFinder && !postFinder[ expando ] ) {
		postFinder = setMatcher( postFinder, postSelector );
	}
	return markFunction(function( seed, results, context, xml ) {
		var temp, i, elem,
			preMap = [],
			postMap = [],
			preexisting = results.length,

			// Get initial elements from seed or context
			elems = seed || multipleContexts( selector || "*", context.nodeType ? [ context ] : context, [] ),

			// Prefilter to get matcher input, preserving a map for seed-results synchronization
			matcherIn = preFilter && ( seed || !selector ) ?
				condense( elems, preMap, preFilter, context, xml ) :
				elems,

			matcherOut = matcher ?
				// If we have a postFinder, or filtered seed, or non-seed postFilter or preexisting results,
				postFinder || ( seed ? preFilter : preexisting || postFilter ) ?

					// ...intermediate processing is necessary
					[] :

					// ...otherwise use results directly
					results :
				matcherIn;

		// Find primary matches
		if ( matcher ) {
			matcher( matcherIn, matcherOut, context, xml );
		}

		// Apply postFilter
		if ( postFilter ) {
			temp = condense( matcherOut, postMap );
			postFilter( temp, [], context, xml );

			// Un-match failing elements by moving them back to matcherIn
			i = temp.length;
			while ( i-- ) {
				if ( (elem = temp[i]) ) {
					matcherOut[ postMap[i] ] = !(matcherIn[ postMap[i] ] = elem);
				}
			}
		}

		if ( seed ) {
			if ( postFinder || preFilter ) {
				if ( postFinder ) {
					// Get the final matcherOut by condensing this intermediate into postFinder contexts
					temp = [];
					i = matcherOut.length;
					while ( i-- ) {
						if ( (elem = matcherOut[i]) ) {
							// Restore matcherIn since elem is not yet a final match
							temp.push( (matcherIn[i] = elem) );
						}
					}
					postFinder( null, (matcherOut = []), temp, xml );
				}

				// Move matched elements from seed to results to keep them synchronized
				i = matcherOut.length;
				while ( i-- ) {
					if ( (elem = matcherOut[i]) &&
						(temp = postFinder ? indexOf( seed, elem ) : preMap[i]) > -1 ) {

						seed[temp] = !(results[temp] = elem);
					}
				}
			}

		// Add elements to results, through postFinder if defined
		} else {
			matcherOut = condense(
				matcherOut === results ?
					matcherOut.splice( preexisting, matcherOut.length ) :
					matcherOut
			);
			if ( postFinder ) {
				postFinder( null, results, matcherOut, xml );
			} else {
				push.apply( results, matcherOut );
			}
		}
	});
}

function matcherFromTokens( tokens ) {
	var checkContext, matcher, j,
		len = tokens.length,
		leadingRelative = Expr.relative[ tokens[0].type ],
		implicitRelative = leadingRelative || Expr.relative[" "],
		i = leadingRelative ? 1 : 0,

		// The foundational matcher ensures that elements are reachable from top-level context(s)
		matchContext = addCombinator( function( elem ) {
			return elem === checkContext;
		}, implicitRelative, true ),
		matchAnyContext = addCombinator( function( elem ) {
			return indexOf( checkContext, elem ) > -1;
		}, implicitRelative, true ),
		matchers = [ function( elem, context, xml ) {
			var ret = ( !leadingRelative && ( xml || context !== outermostContext ) ) || (
				(checkContext = context).nodeType ?
					matchContext( elem, context, xml ) :
					matchAnyContext( elem, context, xml ) );
			// Avoid hanging onto element (issue #299)
			checkContext = null;
			return ret;
		} ];

	for ( ; i < len; i++ ) {
		if ( (matcher = Expr.relative[ tokens[i].type ]) ) {
			matchers = [ addCombinator(elementMatcher( matchers ), matcher) ];
		} else {
			matcher = Expr.filter[ tokens[i].type ].apply( null, tokens[i].matches );

			// Return special upon seeing a positional matcher
			if ( matcher[ expando ] ) {
				// Find the next relative operator (if any) for proper handling
				j = ++i;
				for ( ; j < len; j++ ) {
					if ( Expr.relative[ tokens[j].type ] ) {
						break;
					}
				}
				return setMatcher(
					i > 1 && elementMatcher( matchers ),
					i > 1 && toSelector(
						// If the preceding token was a descendant combinator, insert an implicit any-element `*`
						tokens.slice( 0, i - 1 ).concat({ value: tokens[ i - 2 ].type === " " ? "*" : "" })
					).replace( rtrim, "$1" ),
					matcher,
					i < j && matcherFromTokens( tokens.slice( i, j ) ),
					j < len && matcherFromTokens( (tokens = tokens.slice( j )) ),
					j < len && toSelector( tokens )
				);
			}
			matchers.push( matcher );
		}
	}

	return elementMatcher( matchers );
}

function matcherFromGroupMatchers( elementMatchers, setMatchers ) {
	var bySet = setMatchers.length > 0,
		byElement = elementMatchers.length > 0,
		superMatcher = function( seed, context, xml, results, outermost ) {
			var elem, j, matcher,
				matchedCount = 0,
				i = "0",
				unmatched = seed && [],
				setMatched = [],
				contextBackup = outermostContext,
				// We must always have either seed elements or outermost context
				elems = seed || byElement && Expr.find["TAG"]( "*", outermost ),
				// Use integer dirruns iff this is the outermost matcher
				dirrunsUnique = (dirruns += contextBackup == null ? 1 : Math.random() || 0.1),
				len = elems.length;

			if ( outermost ) {
				outermostContext = context === document || context || outermost;
			}

			// Add elements passing elementMatchers directly to results
			// Support: IE<9, Safari
			// Tolerate NodeList properties (IE: "length"; Safari: <number>) matching elements by id
			for ( ; i !== len && (elem = elems[i]) != null; i++ ) {
				if ( byElement && elem ) {
					j = 0;
					if ( !context && elem.ownerDocument !== document ) {
						setDocument( elem );
						xml = !documentIsHTML;
					}
					while ( (matcher = elementMatchers[j++]) ) {
						if ( matcher( elem, context || document, xml) ) {
							results.push( elem );
							break;
						}
					}
					if ( outermost ) {
						dirruns = dirrunsUnique;
					}
				}

				// Track unmatched elements for set filters
				if ( bySet ) {
					// They will have gone through all possible matchers
					if ( (elem = !matcher && elem) ) {
						matchedCount--;
					}

					// Lengthen the array for every element, matched or not
					if ( seed ) {
						unmatched.push( elem );
					}
				}
			}

			// `i` is now the count of elements visited above, and adding it to `matchedCount`
			// makes the latter nonnegative.
			matchedCount += i;

			// Apply set filters to unmatched elements
			// NOTE: This can be skipped if there are no unmatched elements (i.e., `matchedCount`
			// equals `i`), unless we didn't visit _any_ elements in the above loop because we have
			// no element matchers and no seed.
			// Incrementing an initially-string "0" `i` allows `i` to remain a string only in that
			// case, which will result in a "00" `matchedCount` that differs from `i` but is also
			// numerically zero.
			if ( bySet && i !== matchedCount ) {
				j = 0;
				while ( (matcher = setMatchers[j++]) ) {
					matcher( unmatched, setMatched, context, xml );
				}

				if ( seed ) {
					// Reintegrate element matches to eliminate the need for sorting
					if ( matchedCount > 0 ) {
						while ( i-- ) {
							if ( !(unmatched[i] || setMatched[i]) ) {
								setMatched[i] = pop.call( results );
							}
						}
					}

					// Discard index placeholder values to get only actual matches
					setMatched = condense( setMatched );
				}

				// Add matches to results
				push.apply( results, setMatched );

				// Seedless set matches succeeding multiple successful matchers stipulate sorting
				if ( outermost && !seed && setMatched.length > 0 &&
					( matchedCount + setMatchers.length ) > 1 ) {

					Sizzle.uniqueSort( results );
				}
			}

			// Override manipulation of globals by nested matchers
			if ( outermost ) {
				dirruns = dirrunsUnique;
				outermostContext = contextBackup;
			}

			return unmatched;
		};

	return bySet ?
		markFunction( superMatcher ) :
		superMatcher;
}

compile = Sizzle.compile = function( selector, match /* Internal Use Only */ ) {
	var i,
		setMatchers = [],
		elementMatchers = [],
		cached = compilerCache[ selector + " " ];

	if ( !cached ) {
		// Generate a function of recursive functions that can be used to check each element
		if ( !match ) {
			match = tokenize( selector );
		}
		i = match.length;
		while ( i-- ) {
			cached = matcherFromTokens( match[i] );
			if ( cached[ expando ] ) {
				setMatchers.push( cached );
			} else {
				elementMatchers.push( cached );
			}
		}

		// Cache the compiled function
		cached = compilerCache( selector, matcherFromGroupMatchers( elementMatchers, setMatchers ) );

		// Save selector and tokenization
		cached.selector = selector;
	}
	return cached;
};

/**
 * A low-level selection function that works with Sizzle's compiled
 *  selector functions
 * @param {String|Function} selector A selector or a pre-compiled
 *  selector function built with Sizzle.compile
 * @param {Element} context
 * @param {Array} [results]
 * @param {Array} [seed] A set of elements to match against
 */
select = Sizzle.select = function( selector, context, results, seed ) {
	var i, tokens, token, type, find,
		compiled = typeof selector === "function" && selector,
		match = !seed && tokenize( (selector = compiled.selector || selector) );

	results = results || [];

	// Try to minimize operations if there is only one selector in the list and no seed
	// (the latter of which guarantees us context)
	if ( match.length === 1 ) {

		// Reduce context if the leading compound selector is an ID
		tokens = match[0] = match[0].slice( 0 );
		if ( tokens.length > 2 && (token = tokens[0]).type === "ID" &&
				context.nodeType === 9 && documentIsHTML && Expr.relative[ tokens[1].type ] ) {

			context = ( Expr.find["ID"]( token.matches[0].replace(runescape, funescape), context ) || [] )[0];
			if ( !context ) {
				return results;

			// Precompiled matchers will still verify ancestry, so step up a level
			} else if ( compiled ) {
				context = context.parentNode;
			}

			selector = selector.slice( tokens.shift().value.length );
		}

		// Fetch a seed set for right-to-left matching
		i = matchExpr["needsContext"].test( selector ) ? 0 : tokens.length;
		while ( i-- ) {
			token = tokens[i];

			// Abort if we hit a combinator
			if ( Expr.relative[ (type = token.type) ] ) {
				break;
			}
			if ( (find = Expr.find[ type ]) ) {
				// Search, expanding context for leading sibling combinators
				if ( (seed = find(
					token.matches[0].replace( runescape, funescape ),
					rsibling.test( tokens[0].type ) && testContext( context.parentNode ) || context
				)) ) {

					// If seed is empty or no tokens remain, we can return early
					tokens.splice( i, 1 );
					selector = seed.length && toSelector( tokens );
					if ( !selector ) {
						push.apply( results, seed );
						return results;
					}

					break;
				}
			}
		}
	}

	// Compile and execute a filtering function if one is not provided
	// Provide `match` to avoid retokenization if we modified the selector above
	( compiled || compile( selector, match ) )(
		seed,
		context,
		!documentIsHTML,
		results,
		!context || rsibling.test( selector ) && testContext( context.parentNode ) || context
	);
	return results;
};

// One-time assignments

// Sort stability
support.sortStable = expando.split("").sort( sortOrder ).join("") === expando;

// Support: Chrome 14-35+
// Always assume duplicates if they aren't passed to the comparison function
support.detectDuplicates = !!hasDuplicate;

// Initialize against the default document
setDocument();

// Support: Webkit<537.32 - Safari 6.0.3/Chrome 25 (fixed in Chrome 27)
// Detached nodes confoundingly follow *each other*
support.sortDetached = assert(function( el ) {
	// Should return 1, but returns 4 (following)
	return el.compareDocumentPosition( document.createElement("fieldset") ) & 1;
});

// Support: IE<8
// Prevent attribute/property "interpolation"
// https://msdn.microsoft.com/en-us/library/ms536429%28VS.85%29.aspx
if ( !assert(function( el ) {
	el.innerHTML = "<a href='#'></a>";
	return el.firstChild.getAttribute("href") === "#" ;
}) ) {
	addHandle( "type|href|height|width", function( elem, name, isXML ) {
		if ( !isXML ) {
			return elem.getAttribute( name, name.toLowerCase() === "type" ? 1 : 2 );
		}
	});
}

// Support: IE<9
// Use defaultValue in place of getAttribute("value")
if ( !support.attributes || !assert(function( el ) {
	el.innerHTML = "<input/>";
	el.firstChild.setAttribute( "value", "" );
	return el.firstChild.getAttribute( "value" ) === "";
}) ) {
	addHandle( "value", function( elem, name, isXML ) {
		if ( !isXML && elem.nodeName.toLowerCase() === "input" ) {
			return elem.defaultValue;
		}
	});
}

// Support: IE<9
// Use getAttributeNode to fetch booleans when getAttribute lies
if ( !assert(function( el ) {
	return el.getAttribute("disabled") == null;
}) ) {
	addHandle( booleans, function( elem, name, isXML ) {
		var val;
		if ( !isXML ) {
			return elem[ name ] === true ? name.toLowerCase() :
					(val = elem.getAttributeNode( name )) && val.specified ?
					val.value :
				null;
		}
	});
}

// EXPOSE
return Sizzle;
// EXPOSE

})( window );

/* global console */
/**
 * Class that extends Sizzle and adds support for "matches-css" pseudo element.
 */
var StylePropertyMatcher = (function (window, document) { // jshint ignore:line

    var isWebKit = navigator.vendor && navigator.vendor.indexOf('Apple') > -1 &&
               navigator.userAgent && !navigator.userAgent.match('CriOS') && 
               window.getMatchedCSSRules;

    /**
     * There is a known issue in Safari browser:
     * getComputedStyle(el, ":before") is empty if element is not visible.
     * 
     * To circumvent this issue we use getMatchedCSSRules instead.
     */
    var getPseudoElementComputedStyle = function(element, pseudoElement) {
        var styles = [];
        var cssRules = window.getMatchedCSSRules(element, pseudoElement) || [];

        var iCssRules = cssRules.length;
        while (iCssRules--) {
            var style = cssRules[iCssRules].style;
            var iStyle = style.length;
            while (iStyle--) {
                var name = style[iStyle];
                styles[name] = style.getPropertyValue(name);
                styles.push(name);
            }
        }

        styles.sort();
        styles.getPropertyValue = function(name) {
            return styles[name];
        };
        return styles;
    };

    /**
     * Unquotes specified value
     */
    var removeDoubleQuotes = function(value) {
        if (typeof value === "string" && value.length > 1 && value[0] === '"' && value[value.length - 1] === '"') {
            // Remove double-quotes
            value = value.substring(1, value.length - 1);
        }
        return value;
    };

    /**
     * Unlike Safari, Chrome and FF doublequotes url() property value.
     * I suppose it would be better to leave it unquoted.
     */
    var removeUrlQuotes = function(value) {
        if (typeof value !== "string" || value.indexOf("url(\"") < 0) {
            return value;
        }

        var re = /url\(\"(.*?)\"\)/g;
        return value.replace(re, "url($1)");
    };

    /**
     * Cross-browser getComputedStyle function.
     * 
     * Known WebKit issue: 
     * getComputedStyle(el, ":before").content returns empty string if element is not visible. 
     */
    var getComputedStyle = function (element, pseudoElement) {
        var style;

        if (isWebKit && pseudoElement) {
            style = getPseudoElementComputedStyle(element, pseudoElement);
        } else {
            style = window.getComputedStyle(element, pseudoElement);
        }
        
        return style;
    };

    /**
     * Gets CSS property value
     * 
     * @param element       DOM node
     * @param pseudoElement Optional pseudoElement name
     * @param propertyName  CSS property name
     */
    var getComputedStylePropertyValue = function (element, pseudoElement, propertyName) {
        var style = getComputedStyle(element, pseudoElement);
        if (!style) {
            return null;
        }

        var value = style.getPropertyValue(propertyName);
        value = removeUrlQuotes(value);
        if (propertyName === "content") {
            // FF doublequotes content property value
            value = removeDoubleQuotes(value);
        }

        return value;
    };

    /**
     * Class that matches element style against the specified expression
     */
    var Matcher = function (propertyFilter, pseudoElement) {

        var propertyName;
        var regex;

        try {
            var parts = propertyFilter.split(":", 2);
            propertyName = parts[0].trim();
            var regexText = SimpleRegex.createRegexText(parts[1].trim());
            regex = new RegExp(regexText, "i");
        } catch (ex) {
            if (typeof console !== 'undefined' && console.error) {
                console.error('StylePropertyMatcher: invalid match string ' + propertyFilter);
            }
        }

        /**
         * Function to check if element CSS property matches filter pattern
         * 
         * @element Element to check
         */
        var matches = function (element) {
            if (!regex || !propertyName) {
                return false;
            }

            var value = getComputedStylePropertyValue(element, pseudoElement, propertyName);
            return value && regex.test(value);
        };

        this.matches = matches;
    };

    /**
     * Creates a new pseudo-class and registers it in Sizzle
     */
    var extendSizzle = function (sizzle) {
        // First of all we should prepare Sizzle engine
        sizzle.selectors.pseudos["matches-css"] = sizzle.selectors.createPseudo(function (propertyFilter) {
            var matcher = new Matcher(propertyFilter);
            return function (element) {
                return matcher.matches(element);
            };
        });
        sizzle.selectors.pseudos["matches-css-before"] = sizzle.selectors.createPseudo(function (propertyFilter) {
            var matcher = new Matcher(propertyFilter, ":before");
            return function (element) {
                return matcher.matches(element);
            };
        });
        sizzle.selectors.pseudos["matches-css-after"] = sizzle.selectors.createPseudo(function (propertyFilter) {
            var matcher = new Matcher(propertyFilter, ":after");
            return function (element) {
                return matcher.matches(element);
            };
        });
    };

    // EXPOSE
    return {
        extendSizzle: extendSizzle
    };
})(window, document);
/* global Sizzle, console, StylePropertyMatcher */

/**
 * Extended selector class.
 * The purpose of this class is to add support for extended pseudo-classes:
 * https://github.com/AdguardTeam/AdguardBrowserExtension/issues/321
 * https://github.com/AdguardTeam/AdguardBrowserExtension/issues/322
 * <br/>
 * Please note, that instead of using the pseudo-classes we use a bit different syntax.
 * This saves us from backward compatibility issues.
 * <br/>
 * Extended selection capabilities:<br/>
 * [-ext-has="selector"] - the same as :has() pseudo class from CSS4 specification
 * [-ext-contains="string"] - allows to select elements containing specified string
 * [-ext-matches-css="|background-image: url(data:*)"]
 */
var ExtendedSelector = (function () { // jshint ignore:line

    var PSEUDO_EXTENSIONS_MARKERS = [ ":has", ":contains", ":matches-css" ];

    // Add :matches-css-*() support
    StylePropertyMatcher.extendSizzle(Sizzle);

    /**
     * Complex replacement function. 
     * Unescapes quote characters inside of an extended selector.
     * 
     * @param match     Whole matched string
     * @param name      Group 1
     * @param quoteChar Group 2
     * @param value     Group 3
     */
    var evaluateMatch = function (match, name, quoteChar, value) {
        // Unescape quotes
        var re = new RegExp("([^\\\\]|^)\\\\" + quoteChar, "g");
        value = value.replace(re, "$1" + quoteChar);
        return ":" + name + "(" + value + ")";
    };

    /**
     * Checks if specified token is simple and can be used by document.querySelectorAll. 
     */
    var isSimpleToken = function (token) {

        if (token.type === "ID" ||
            token.type === "CLASS" ||
            token.type === "ATTR" ||
            token.type === "TAG" ||
            token.type === "CHILD") {
            // known simple tokens
            return true;
        }

        if (token.type === "PSEUDO") {
            // check if value contains any of extended pseudo classes
            var i = PSEUDO_EXTENSIONS_MARKERS.length;
            while (i--) {
                if (token.value.indexOf(PSEUDO_EXTENSIONS_MARKERS[i]) >= 0) {
                    return false;
                }
            }
            return true;
        }

        // all others aren't simple
        return false;
    };

    /**
     * Checks if specified token is parenthesis relation
     */
    var isRelationToken = function(token) {
        return token.type === " " || token.type === ">";
    };

    /**
     * Joins tokens values
     */
    var joinTokens = function(selector, relationToken, tokens) {
        selector = selector || "";
        if (relationToken) {
            selector += relationToken.value;
        }

        for (var i = 0; i < tokens.length; i++) {
            selector += tokens[i].value;
        }
        return selector;
    };

    /**
     * Parses selector into two parts:
     * 1. Simple selector, which can be used by document.querySelectorAll.
     * 2. Complex selector, which can be used by Sizzle only.
     * 
     * @returns object with three fields: simple, complex and relation (and also "selectorText" with source selector)
     */
    var tokenizeSelector = function (selectorText) {

        var tokens = Sizzle.tokenize(selectorText);
        if (tokens.length !== 1) {
            // Do not optimize complex selectors
            return {
                simple: null,
                relation: null,
                complex: selectorText,
                selectorText: selectorText
            };
        }

        tokens = tokens[0];
        var simple = "";
        var complex = "";
        
        // Simple tokens (can be used by document.querySelectorAll)
        var simpleTokens = [];
        // Complex tokens (cannot be used at all)
        var complexTokens = [];
        var relationToken = null;
        
        for (var i = 0; i < tokens.length; i++) {
            var token = tokens[i];

            if (complexTokens.length > 0 || (!isSimpleToken(token) && !isRelationToken(token))) {
                // If we meet complex token, all subsequent tokens are considered complex
                // All previously found simple tokens are also considered complex
                if (simpleTokens.length > 0) {
                    complexTokens = complexTokens.concat(simpleTokens);
                    simpleTokens = [];
                }

                complexTokens.push(token);
            } else if (isRelationToken(token)) {
                // Parenthesis relation token
                simple = joinTokens(simple, relationToken, simpleTokens);
                simpleTokens = [];

                // Save relation token (it could be used further)
                relationToken = token;
            } else {
                // Save to simple tokens collection
                simpleTokens.push(token);                
            }
        }

        // Finalize building simple and complex selectors
        if (simpleTokens.length > 0) {
            simple = joinTokens(simple, relationToken, simpleTokens);
            relationToken = null;
        }
        complex = joinTokens(complex, null, complexTokens);

        if (!simple) {
            // Nothing to optimize
            return {
                simple: null,
                relation: null,
                complex: selectorText,
                selectorText: selectorText
            };
        }

        // Validate simple token
        try {
            document.querySelector(simple);
        } catch (ex) {
            // Simple token appears to be invalid
            return {
                simple: null,
                relation: null,
                complex: selectorText,
                selectorText: selectorText
            };
        }

        return {
            simple: simple,
            relation: (relationToken === null ? null : relationToken.type),
            complex: (complex === "" ? null : complex),
            selectorText: selectorText
        };
    };

    /**
     * Prepares specified selector and compiles it with the Sizzle engine.
     * Preparation means transforming [-ext-*=""] attributes to pseudo classes.
     * 
     * @param selectorText Selector text
     */
    var prepareSelector = function (selectorText) {
        try {
            // Prepare selector to be compiled with Sizzle
            // Which means transform [-ext-*=""] attributes to pseudo classes
            var re = /\[-ext-([a-z-_]+)=(["'])((?:(?=(\\?))\4.)*?)\2\]/g;
            var str = selectorText.replace(re, evaluateMatch);

            var compiledSelector = tokenizeSelector(str);

            // Compiles and validates selector
            // Compilation in Sizzle means that selector will be saved to the inner cache and then reused
            Sizzle.compile(selectorText);
            if (compiledSelector.complex) {
                Sizzle.compile(compiledSelector.complex);
            }
            return compiledSelector;
        } catch (ex) {
            if (typeof console !== 'undefined' && console.error) {
                console.error('Extended selector is invalid: ' + selectorText);
            }
            return null;
        }
    };

    /**
     * Does the complex search (first executes document.querySelectorAll, then Sizzle)
     * 
     * @param compiledSelector Compiled selector (simple, complex and relation)
     */
    var complexSearch = function(compiledSelector) {
        var resultNodes = [];

        // First we use simple selector to narrow our search
        var simpleNodes = document.querySelectorAll(compiledSelector.simple);
        if (!simpleNodes || !simpleNodes.length) {
            return resultNodes;
        }

        var iSimpleNodes = simpleNodes.length;
        while (iSimpleNodes--) {
            var node = simpleNodes[iSimpleNodes];
            var childNodes = Sizzle(compiledSelector.complex, node); // jshint ignore:line
            if (compiledSelector.relation === ">") {
                // Filter direct children
                var iChildNodes = childNodes.length;
                while (iChildNodes--) {
                    var childNode = childNodes[iChildNodes];
                    if (childNode.parentNode === node) {
                        resultNodes.push(childNode);
                    }
                }
            } else {
                resultNodes = resultNodes.concat(childNodes);
            }
        }

        return Sizzle.uniqueSort(resultNodes);
    };

    // Constructor
    return function (selectorText) {
        var compiledSelector = prepareSelector(selectorText);

        // EXPOSE
        this.compiledSelector = compiledSelector;
        this.selectorText = (compiledSelector == null ? null : compiledSelector.selectorText);

        /**
         * Selects all DOM nodes matching this selector.
         */
        this.querySelectorAll = function () {
            if (compiledSelector === null) {
                // Invalid selector, always return empty array
                return [];
            }

            if (!compiledSelector.simple) {
                // No simple selector applied
                return Sizzle(compiledSelector.complex); // jshint ignore:line
            }

            if (!compiledSelector.complex) {
                // There is no complex selector, so we could simply return it immediately
                return document.querySelectorAll(compiledSelector.simple);
            }

            return complexSearch(compiledSelector);
        };

        /**
         * Checks if the specified element matches this selector
         */
        this.matches = function (element) {
            return Sizzle.matchesSelector(element, compiledSelector.selectorText);
        };
    };
})();
/* global CssParser, DomObserver, ExtendedSelector */

/**
 * Extended css class
 *
 * @param styleSheet
 * @constructor
 */
var ExtendedCss = function (styleSheet) { // jshint ignore:line
    var rules = [];
    var affectedElements = [];
    var domObserved;

    /**
     * Removes specified suffix from the string
     */
    var removeSuffix = function(str, suffix) {

        var index = str.indexOf(suffix, str.length - suffix.length);
        if (index >= 0) {
            return str.substring(0, index);
        }

        return str;
    };

    /**
     * Parses specified styleSheet in a number of rule objects
     *
     * @param styleSheet String with the stylesheet
     */
    var parse = function (styleSheet) {

        var result = [];
        var cssRules = CssParser.parseCss(styleSheet);
        var iCssRules = cssRules.length;
        while (iCssRules--) {
            var cssRule = cssRules[iCssRules];

            var ruleObject = Object.create(null);
            ruleObject.selector = new ExtendedSelector(cssRule.selectors);
            ruleObject.style = cssRule.style;
            result.push(ruleObject);
        }

        return result;
    };

    /**
     * Finds affectedElement object for the specified DOM node
     * 
     * @param node  DOM node
     * @returns     affectedElement found or null
     */
    var findAffectedElement = function (node) {
        var iAffectedElements = affectedElements.length;
        while (iAffectedElements--) {
            var affectedElement = affectedElements[iAffectedElements];
            if (affectedElement.node === node) {
                return affectedElement;
            }
        }
        return null;
    };

    /**
     * Applies style to the specified DOM node
     * 
     * @param affectedElement    Object containing DOM node and rule to be applied
     */
    var applyStyle = function (affectedElement) {

        if (affectedElement.protectionObserver) {
            // Style is already applied and protected by the observer
            return;
        }

        // DOM node
        var node = affectedElement.node;
        // Plain JS object with styles
        var style = affectedElement.rule.style;

        for (var prop in style) {

            // Apply this style only to existing properties
            // We can't use hasOwnProperty here (does not work in FF)
            if (typeof node.style.getPropertyValue(prop) !== "undefined") {
                var value = style[prop];

                // First we should remove !important attribute (or it won't be applied')
                value = removeSuffix(value.trim(), "!important").trim();
                node.style.setProperty(prop, value, "important");
            }
        }

        // Protect "style" attribute from changes
        affectedElement.protectionObserver = DomObserver.protectAttribute(node, 'style');
    };

    /**
     * Reverts style for the affected object
     */
    var revertStyle = function (affectedElement) {
        if (affectedElement.protectionObserver) {
            affectedElement.protectionObserver.disconnect();
        }

        affectedElement.node.style.cssText = affectedElement.originalStyle;
    };

    /**
     * Applies specified rule and returns list of elements affected
     * 
     * @param rule Rule to apply
     * @returns List of elements affected by this rule
     */
    var applyRule = function (rule) {
        var selector = rule.selector;
        var nodes = selector.querySelectorAll();

        var iNodes = nodes.length;
        while (iNodes--) {
            var node = nodes[iNodes];
            var affectedElement = findAffectedElement(node); 

            if (affectedElement) {
                // We have already applied style to this node
                // Let's re-apply style to it
                applyStyle(affectedElement);
            } else {
                // Applying style first time
                var originalStyle = node.style.cssText;
                affectedElement = {
                    // affected DOM node
                    node: node,
                    // rule to be applied
                    rule: rule,
                    // original node style
                    originalStyle: originalStyle,
                    // style attribute observer
                    protectionObserver: null
                };

                applyStyle(affectedElement);
                affectedElements.push(affectedElement);
            }
        }

        return nodes;
    };

    /**
     * Applies filtering rules
     *
     * @param rules Rules to apply
     */
    var applyRules = function (rules) {

        var elementsIndex = [];
        var iRules = rules.length;
        while (iRules--) {
            var rule = rules[iRules];
            var nodes = applyRule(rule);
            elementsIndex = elementsIndex.concat(nodes);
        }

        // Now revert styles for elements which are no more affected
        var iAffectedElements = affectedElements.length;
        while (iAffectedElements--) {
            var obj = affectedElements[iAffectedElements];
            if (elementsIndex.indexOf(obj.node) === -1) {
                // Time to revert style
                revertStyle(obj);
                affectedElements.splice(iAffectedElements, 1);
            }
        }
    };

    var domChanged = false;
    var lastTimeDomChanged = 0;

    /**
     * Called on any DOM change, we should examine extended CSS again.
     */
    var handleDomChange = function () {
        if (!domChanged) {
            return;
        }

        domChanged = false;
        applyRules(rules);
        lastTimeDomChanged = new Date().getTime();
    };

    /**
     * Schedules handleDomChange using requestAnimationFrame
     */
    var handleDomChangeAsync = function() {
        if (window.requestAnimationFrame) {
            window.requestAnimationFrame(handleDomChange);
        } else {
            handleDomChange();
        }
    };

    /**
     * Throttles handleDomChange function.
     */
    var handleDomChangeThrottle = function () {

        if (domChanged) {
            return;
        }
        domChanged = true;
        
        // Checking time since last time rules were applied.
        // We shouldn't allow it to trigger applying extended CSS rules too often.
        var timeSinceLastDomChange = new Date().getTime() - lastTimeDomChanged;
        var timeToNextDomChange = 50 - timeSinceLastDomChange;
        if (timeToNextDomChange > 0) {
            setTimeout(function() {
                handleDomChangeAsync();
            }, timeToNextDomChange);
        } else {
            handleDomChangeAsync();
        }
    };

    /**
     * Observe changes
     */
    var observe = function () {
        if (domObserved) {
            // Observer is already here
            return;
        }

        // Handle dynamically added elements
        domObserved = true;
        DomObserver.observeDom(handleDomChangeThrottle);
    };

    /**
     * Applies extended CSS rules
     */
    var apply = function () {
        applyRules(rules);
        observe();

        if (document.readyState !== "complete") {
            document.addEventListener("DOMContentLoaded", function () {
                applyRules(rules);
            });
        }
    };

    /**
     * Disposes ExtendedCss and removes our styles from matched elements
     */
    var dispose = function () {
        if (domObserved) {
            DomObserver.disconnectDom(handleDomChangeThrottle);
            domObserved = false;
        }
        var iElements = affectedElements.length;
        while (iElements--) {
            var obj = affectedElements[iElements];
            revertStyle(obj);
        }
    };

    // First of all parse the stylesheet
    rules = parse(styleSheet);

    // EXPOSE
    this.dispose = dispose;
    this.apply = apply;
    this.getAffectedElements = function () {
        return affectedElements;
    };
};
// EXPOSE
return ExtendedCss;
})(window);

/**
 * Global object for content scripts
 */
var adguardContent = {}; // jshint ignore:line

(function (adguard, self) {

    'use strict';

    /**
     * https://bugs.chromium.org/p/project-zero/issues/detail?id=1225&desc=6
     * Page script can inject global variables into the DOM, so content script isolation doesn't work as expected
     * So we have to make additional check before accessing a global variable.
     */
    function isDefined(property) {
        return Object.prototype.hasOwnProperty.call(self, property);
    }

    var browserApi = isDefined('browser') ? self.browser : self.chrome;

    adguard.i18n = browserApi.i18n;

    adguard.runtimeImpl = (function () {

        var onMessage = (function () {
            if (browserApi.runtime && browserApi.runtime.onMessage) {
                // Chromium, Edge, Firefox WebExtensions
                return browserApi.runtime.onMessage;
            }
            // Old Chromium
            return browserApi.extension.onMessage || browserApi.extension.onRequest;
        })();

        var sendMessage = (function () {
            if (browserApi.runtime && browserApi.runtime.sendMessage) {
                // Chromium, Edge, Firefox WebExtensions
                return browserApi.runtime.sendMessage;
            }
            // Old Chromium
            return browserApi.extension.sendMessage || browserApi.extension.sendRequest;
        })();

        return {
            onMessage: onMessage,
            sendMessage: sendMessage
        };

    })();

})(typeof adguardContent !== 'undefined' ? adguardContent : adguard, this); // jshint ignore:line

/* global adguardContent */

(function (adguard) {

    'use strict';

    window.i18n = adguard.i18n;

    window.contentPage = {
        sendMessage: adguard.runtimeImpl.sendMessage,
        onMessage: adguard.runtimeImpl.onMessage
    };

})(adguardContent);

/* global contentPage, WeakSet */

/**
 * Function for injecting some helper API into page context, that is used by request wrappers.
 *
 * @param scriptName Unique script name
 * @param shouldOverrideWebSocket If true we should override WebSocket object
 * @param shouldOverrideWebRTC If true we should override WebRTC objects
 * @param isInjected True means that we've already injected scripts in the contentWindow, i.e. wrapped request objects and passed message channel
 */
function injectPageScriptAPI(scriptName, shouldOverrideWebSocket, shouldOverrideWebRTC, isInjected) { // jshint ignore:line

    'use strict';

    /**
     * If script have been injected into a frame via contentWindow then we can simply take the copy of messageChannel left for us by parent document
     * Otherwise creates new message channel that sends a message to the content-script to check if request should be allowed or not.
     */
    var messageChannel = isInjected ? window[scriptName] : (function () {

        // Save original postMessage and addEventListener functions to prevent webpage from tampering both.
        var postMessage = window.postMessage;
        var addEventListener = window.addEventListener;

        // Current request ID (incremented every time we send a new message)
        var currentRequestId = 0;
        var requestsMap = {};

        /**
         * Handles messages sent from the content script back to the page script.
         *
         * @param event Event with necessary data
         */
        var onMessageReceived = function (event) {

            if (!event.data || !event.data.direction || event.data.direction !== "to-page-script@adguard") {
                return;
            }

            var requestData = requestsMap[event.data.requestId];
            if (requestData) {
                var wrapper = requestData.wrapper;
                requestData.onResponseReceived(wrapper, event.data.block);
                delete requestsMap[event.data.requestId];
            }
        };

        /**
         * @param url                The URL to which wrapped object is willing to connect
         * @param requestType        Request type ( WEBSOCKET or WEBRTC)
         * @param wrapper            WebSocket wrapper instance
         * @param onResponseReceived Called when response is received
         */
        var sendMessage = function (url, requestType, wrapper, onResponseReceived) {

            if (currentRequestId === 0) {
                // Subscribe to response when this method is called for the first time
                addEventListener.call(window, "message", onMessageReceived, false);
            }

            var requestId = ++currentRequestId;
            requestsMap[requestId] = {
                wrapper: wrapper,
                onResponseReceived: onResponseReceived
            };

            var message = {
                requestId: requestId,
                direction: 'from-page-script@adguard',
                elementUrl: url,
                documentUrl: document.URL,
                requestType: requestType
            };

            // Send a message to the background page to check if the request should be blocked
            postMessage.call(window, message, "*");
        };

        return {
            sendMessage: sendMessage
        };

    })();

    /*
     * In some case Chrome won't run content scripts inside frames.
     * So we have to intercept access to contentWindow/contentDocument and manually inject wrapper script into this context
     *
     * Based on: https://github.com/adblockplus/adblockpluschrome/commit/1aabfb3346dc0821c52dd9e97f7d61b8c99cd707
     */
    var injectedToString = Function.prototype.toString.bind(injectPageScriptAPI);

    var injectedFramesAdd;
    var injectedFramesHas;
    if (window.WeakSet instanceof Function) {
        var injectedFrames = new WeakSet();
        injectedFramesAdd = WeakSet.prototype.add.bind(injectedFrames);
        injectedFramesHas = WeakSet.prototype.has.bind(injectedFrames);
    } else {
        var frames = [];
        injectedFramesAdd = function (el) {
            if (frames.indexOf(el) < 0) {
                frames.push(el);
            }
        };
        injectedFramesHas = function (el) {
            return frames.indexOf(el) >= 0;
        };
    }

    /**
     * Injects wrapper's script into passed window
     * @param contentWindow Frame's content window
     */
    function injectPageScriptAPIInWindow(contentWindow) {
        try {
            if (contentWindow && !injectedFramesHas(contentWindow)) {
                injectedFramesAdd(contentWindow);
                contentWindow[scriptName] = messageChannel; // Left message channel for the injected script
                var args = "'" + scriptName + "', " + shouldOverrideWebSocket + ", " + shouldOverrideWebRTC + ", true";
                contentWindow.eval("(" + injectedToString() + ")(" + args + ");");
                delete contentWindow[scriptName];
            }
        } catch (e) {
        }
    }

    /**
     * Overrides access to contentWindow/contentDocument for the passed HTML element's interface (iframe, frame, object)
     * If the content of one of these objects is requested we will inject our wrapper script.
     * @param iface HTML element's interface
     */
    function overrideContentAccess(iface) {

        var contentWindowDescriptor = Object.getOwnPropertyDescriptor(iface.prototype, "contentWindow");
        var contentDocumentDescriptor = Object.getOwnPropertyDescriptor(iface.prototype, "contentDocument");

        // Apparently in HTMLObjectElement.prototype.contentWindow does not exist
        // in older versions of Chrome such as 42.
        if (!contentWindowDescriptor) {
            return;
        }

        var getContentWindow = Function.prototype.call.bind(contentWindowDescriptor.get);
        var getContentDocument = Function.prototype.call.bind(contentDocumentDescriptor.get);

        contentWindowDescriptor.get = function () {
            var contentWindow = getContentWindow(this);
            injectPageScriptAPIInWindow(contentWindow);
            return contentWindow;
        };
        contentDocumentDescriptor.get = function () {
            injectPageScriptAPIInWindow(getContentWindow(this));
            return getContentDocument(this);
        };

        Object.defineProperty(iface.prototype, "contentWindow", contentWindowDescriptor);
        Object.defineProperty(iface.prototype, "contentDocument", contentDocumentDescriptor);
    }

    var interfaces = [HTMLFrameElement, HTMLIFrameElement, HTMLObjectElement];
    for (var i = 0; i < interfaces.length; i++) {
        overrideContentAccess(interfaces[i]);
    }

    /**
     * Defines properties in destination object
     * @param src Source object
     * @param dest Destination object
     * @param properties Properties to copy
     */
    var copyProperties = function (src, dest, properties) {
        for (var i = 0; i < properties.length; i++) {
            var prop = properties[i];
            var descriptor = Object.getOwnPropertyDescriptor(src, prop);
            // Passed property may be undefined
            if (descriptor) {
                Object.defineProperty(dest, prop, descriptor);
            }
        }
    };

    /**
     * Check request by sending message to content script
     * @param url URL to block
     * @param type Request type
     * @param callback Result callback
     */
    var checkRequest = function (url, type, callback) {
        messageChannel.sendMessage(url, type, this, function (wrapper, blockConnection) {
            callback(blockConnection);
        });
    };

    /**
     * The function overrides window.WebSocket with our wrapper, that will check url with filters through messaging with content-script.
     *
     * IMPORTANT NOTE:
     * This function is first loaded as a content script. The only purpose of it is to call
     * the "toString" method and use resulting string as a text content for injected script.
     */
    var overrideWebSocket = function () { // jshint ignore:line

        if (!(window.WebSocket instanceof Function)) {
            return;
        }

        /**
         * WebSocket wrapper implementation.
         * https://github.com/AdguardTeam/AdguardBrowserExtension/issues/349
         *
         * Based on:
         * https://github.com/adblockplus/adblockpluschrome/commit/457a336ee55a433217c3ffe5d363e5c6980f26f4
         */

        /**
         * As far as possible we must track everything we use that could be sabotaged by the website later in order to circumvent us.
         */
        var RealWebSocket = WebSocket;
        var closeWebSocket = Function.prototype.call.bind(RealWebSocket.prototype.close);

        function WrappedWebSocket(url, protocols) {
            // Throw correct exceptions if the constructor is used improperly.
            if (!(this instanceof WrappedWebSocket)) {
                return RealWebSocket();
            }
            if (arguments.length < 1) {
                return new RealWebSocket();
            }

            var websocket = new RealWebSocket(url, protocols);

            // This is the key point: checking if this WS should be blocked or not
            // Don't forget that the type of 'websocket.url' is String, but 'url 'parameter might have another type.
            checkRequest(websocket.url, 'WEBSOCKET', function (blocked) {
                if (blocked) {
                    closeWebSocket(websocket);
                }
            });

            return websocket;
        }

        // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/488
        WrappedWebSocket.prototype = RealWebSocket.prototype;
        window.WebSocket = WrappedWebSocket.bind();

        copyProperties(RealWebSocket, WebSocket, ["CONNECTING", "OPEN", "CLOSING", "CLOSED", "name", "prototype"]);

        RealWebSocket.prototype.constructor = WebSocket;

    };

    /**
     * The function overrides window.RTCPeerConnection with our wrapper, that will check ice servers URLs with filters through messaging with content-script.
     *
     * IMPORTANT NOTE:
     * This function is first loaded as a content script. The only purpose of it is to call
     * the "toString" method and use resulting string as a text content for injected script.
     */
    var overrideWebRTC = function () { // jshint ignore:line


        if (!(window.RTCPeerConnection instanceof Function) &&
            !(window.webkitRTCPeerConnection instanceof Function)) {
            return;
        }

        /**
         * RTCPeerConnection wrapper implementation.
         * https://github.com/AdguardTeam/AdguardBrowserExtension/issues/588
         *
         * Based on:
         * https://github.com/adblockplus/adblockpluschrome/commit/af0585137be19011eace1cf68bf61eed2e6db974
         *
         * Chromium webRequest API doesn't allow the blocking of WebRTC connections
         * https://bugs.chromium.org/p/chromium/issues/detail?id=707683
         */

        var RealRTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection;
        var closeRTCPeerConnection = Function.prototype.call.bind(RealRTCPeerConnection.prototype.close);

        var RealArray = Array;
        var RealString = String;
        var createObject = Object.create;
        var defineProperty = Object.defineProperty;

        /**
         * Convert passed url to string
         * @param url URL
         * @returns {string}
         */
        function urlToString(url) {
            if (typeof url !== "undefined") {
                return RealString(url);
            }
        }

        /**
         * Creates new immutable array from original with some transform function
         * @param original
         * @param transform
         * @returns {*}
         */
        function safeCopyArray(original, transform) {

            if (original === null || typeof original !== "object") {
                return original;
            }

            var immutable = RealArray(original.length);
            for (var i = 0; i < immutable.length; i++) {
                defineProperty(immutable, i, {
                    configurable: false, enumerable: false, writable: false,
                    value: transform(original[i])
                });
            }
            defineProperty(immutable, "length", {
                configurable: false, enumerable: false, writable: false,
                value: immutable.length
            });
            return immutable;
        }

        /**
         * Protect configuration from mutations
         * @param configuration RTCPeerConnection configuration object
         * @returns {*}
         */
        function protectConfiguration(configuration) {

            if (configuration === null || typeof configuration !== "object") {
                return configuration;
            }

            var iceServers = safeCopyArray(
                configuration.iceServers,
                function (iceServer) {

                    var url = iceServer.url;
                    var urls = iceServer.urls;

                    // RTCPeerConnection doesn't iterate through pseudo Arrays of urls.
                    if (typeof urls !== "undefined" && !(urls instanceof RealArray)) {
                        urls = [urls];
                    }

                    return createObject(iceServer, {
                        url: {
                            configurable: false, enumerable: false, writable: false,
                            value: urlToString(url)
                        },
                        urls: {
                            configurable: false, enumerable: false, writable: false,
                            value: safeCopyArray(urls, urlToString)
                        }
                    });
                }
            );

            return createObject(configuration, {
                iceServers: {
                    configurable: false, enumerable: false, writable: false,
                    value: iceServers
                }
            });
        }

        /**
         * Check WebRTC connection's URL and close if it's blocked by rule
         * @param connection Connection
         * @param url URL to check
         */
        function checkWebRTCRequest(connection, url) {
            checkRequest(url, 'WEBRTC', function (blocked) {
                if (blocked) {
                    try {
                        closeRTCPeerConnection(connection);
                    } catch (e) {
                        // Ignore exceptions
                    }
                }
            });
        }

        /**
         * Check each URL of ice server in configuration for blocking.
         *
         * @param connection RTCPeerConnection
         * @param configuration Configuration for RTCPeerConnection
         * https://developer.mozilla.org/en-US/docs/Web/API/RTCConfiguration
         */
        function checkConfiguration(connection, configuration) {

            if (!configuration || !configuration.iceServers) {
                return;
            }

            var iceServers = configuration.iceServers;
            for (var i = 0; i < iceServers.length; i++) {

                var iceServer = iceServers[i];
                if (!iceServer) {
                    continue;
                }

                if (iceServer.url) {
                    checkWebRTCRequest(connection, iceServer.url);
                }

                if (iceServer.urls) {
                    for (var j = 0; j < iceServer.urls.length; j++) {
                        checkWebRTCRequest(connection, iceServer.urls[j]);
                    }
                }
            }
        }

        /**
         * Overrides setConfiguration method
         * https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/setConfiguration
         */
        if (RealRTCPeerConnection.prototype.setConfiguration) {

            var realSetConfiguration = Function.prototype.call.bind(RealRTCPeerConnection.prototype.setConfiguration);

            RealRTCPeerConnection.prototype.setConfiguration = function (configuration) {
                configuration = protectConfiguration(configuration);
                // Call the real method first, so that validates the configuration
                realSetConfiguration(this, configuration);
                checkConfiguration(this, configuration);
            };
        }

        function WrappedRTCPeerConnection(configuration, arg) {

            if (!(this instanceof WrappedRTCPeerConnection)) {
                return RealRTCPeerConnection();
            }

            configuration = protectConfiguration(configuration);

            /**
             * The old webkitRTCPeerConnection constructor takes an optional second argument and we must pass it.
             */
            var connection = new RealRTCPeerConnection(configuration, arg);
            checkConfiguration(connection, configuration);
            return connection;
        }

        WrappedRTCPeerConnection.prototype = RealRTCPeerConnection.prototype;

        var boundWrappedRTCPeerConnection = WrappedRTCPeerConnection.bind();
        copyProperties(RealRTCPeerConnection, boundWrappedRTCPeerConnection, ["caller", "generateCertificate", "name", "prototype"]);
        RealRTCPeerConnection.prototype.constructor = boundWrappedRTCPeerConnection;

        if ("RTCPeerConnection" in window) {
            window.RTCPeerConnection = boundWrappedRTCPeerConnection;
        }
        if ("webkitRTCPeerConnection" in window) {
            window.webkitRTCPeerConnection = boundWrappedRTCPeerConnection;
        }
    };

    if (shouldOverrideWebSocket) {
        overrideWebSocket();
    }

    if (shouldOverrideWebRTC) {
        overrideWebRTC();
    }
}

/**
 * This function is executed in the content script. It starts listening to events from the page script and passes them further to the background page.
 */
var initPageMessageListener = function () { // jshint ignore:line

    'use strict';

    /**
     * Listener for websocket wrapper messages.
     *
     * @param event
     */
    function pageMessageListener(event) {
        if (!(event.source === window &&
            event.data.direction &&
            event.data.direction === "from-page-script@adguard" &&
            event.data.elementUrl &&
            event.data.documentUrl)) {
            return;
        }

        var message = {
            type: 'checkPageScriptWrapperRequest',
            elementUrl: event.data.elementUrl,
            documentUrl: event.data.documentUrl,
            requestType: event.data.requestType,
            requestId: event.data.requestId
        };

        contentPage.sendMessage(message, function (response) {
            if (!response) {
                return;
            }

            var message = {
                direction: 'to-page-script@adguard',
                elementUrl: event.data.elementUrl,
                documentUrl: event.data.documentUrl,
                requestType: event.data.requestType,
                requestId: response.requestId,
                block: response.block
            };

            event.source.postMessage(message, event.origin);
        });
    }

    window.addEventListener("message", pageMessageListener, false);
};

/* global contentPage, ExtendedCss, HTMLDocument, XMLDocument, ElementCollapser, CssHitsCounter */
(function () {

    var requestTypeMap = {
        "img": "IMAGE",
        "input": "IMAGE",
        "audio": "MEDIA",
        "video": "MEDIA",
        "object": "OBJECT",
        "frame": "SUBDOCUMENT",
        "iframe": "SUBDOCUMENT",
        "embed": "OBJECT"
    };

    // Don't apply scripts twice
    var scriptsApplied = false;

    /**
     * Do not use shadow DOM on some websites
     * https://code.google.com/p/chromium/issues/detail?id=496055
     */
    var shadowDomExceptions = [
        'mail.google.com',
        'inbox.google.com',
        'productforums.google.com'
    ];

    /**
     * Do not use iframes pre-hiding on some websites.
     * https://github.com/AdguardTeam/AdguardBrowserExtension/issues/720
     */
    var iframeHidingExceptions = [
        'docs.google.com'
    ];

    var collapseRequests = Object.create(null);
    var collapseRequestId = 1;
    var isFirefox = false;
    var isOpera = false;
    var shadowRoot = null;
    var loadTruncatedCss = false;

    /**
     * Set callback for saving css hits
     */
    if (typeof CssHitsCounter !== 'undefined' &&
        typeof CssHitsCounter.setCssHitsFoundCallback === 'function') {

        CssHitsCounter.setCssHitsFoundCallback(function (stats) {
            contentPage.sendMessage({type: 'saveCssHitStats', stats: stats});
        });
    }

    /**
     * When Background page receives 'onCommitted' frame event then it sends scripts to corresponding frame
     * It allows us to execute script as soon as possible, because runtime.messaging makes huge overhead
     * If onCommitted event doesn't occur for the frame, scripts will be applied in usual way.
     */
    contentPage.onMessage.addListener(function (response, sender, sendResponse) {
        if (response.type === 'injectScripts') {
            // Notify background-page that content-script was received scripts
            sendResponse({applied: true});
            if (!isHtml()) {
                return;
            }
            applyScripts(response.scripts);
        }
    });

    /**
     * Initializing content script
     */
    var init = function () {

        if (!isHtml()) {
            return;
        }

        initRequestWrappers();

        // We use shadow DOM when it's available to minimize our impact on web page DOM tree.
        // According to ABP issue #452, creating a shadow root breaks running CSS transitions.
        // Because of this, we create shadow root right after content script is initialized.
        // First check if it's available already, chrome shows warning message in case of we try to create an additional root.
        shadowRoot = document.documentElement.shadowRoot;
        if (!shadowRoot) {
            if ("createShadowRoot" in document.documentElement && shadowDomExceptions.indexOf(document.domain) == -1) {
                shadowRoot = document.documentElement.createShadowRoot();
                shadowRoot.appendChild(document.createElement("shadow"));
            }
        }

        var userAgent = navigator.userAgent.toLowerCase();
        isFirefox = userAgent.indexOf('firefox') > -1;
        isOpera = userAgent.indexOf('opera') > -1 || userAgent.indexOf('opr') > -1;

        if (window !== window.top) {
            var width = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
            var height = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
            // Load only small set of css for small frames.
            // We hide all generic css rules in this case.
            // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/223
            loadTruncatedCss = (height * width) < 100000;
        }

        initCollapseEventListeners();
        tryLoadCssAndScripts();
    };

    /**
     * Checks if it is html document
     *
     * @returns {boolean}
     */
    var isHtml = function () {
        return (document instanceof HTMLDocument) ||
            // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/233
            ((document instanceof XMLDocument) && (document.createElement('div') instanceof HTMLDivElement));
    };

    /**
     * Uses in `initRequestWrappers` method.
     * We insert wrapper's code into http/https documents and dynamically created frames.
     * The last one is due to the circumvention with using iframe's contentWindow.
     */
    var isHttpOrAboutPage = function () {
        var protocol = window.location.protocol;
        return protocol.indexOf('http') === 0 || protocol.indexOf('about:') === 0;
    };

    /**
     * Try to keep DOM clean: let script removes itself when execution completes
     * @returns {string}
     */
    var cleanupCurrentScriptToString = function () {

        var cleanup = function () {
            var current = document.currentScript;
            var parent = current && current.parentNode;
            if (parent) {
                parent.removeChild(current);
            }
        };

        return '(' + cleanup.toString() + ')();';
    };

    /**
     * Execute scripts in a page context and cleanup itself when execution completes
     * @param scripts Array of scripts to execute
     */
    var executeScripts = function (scripts) {

        if (!scripts || scripts.length === 0) {
            return;
        }

        // Wraps with try catch and appends cleanup
        scripts.unshift("try {");
        scripts.push("} catch (ex) { console.error('Error executing AG js: ' + ex); }");
        scripts.push(cleanupCurrentScriptToString());

        var script = document.createElement("script");
        script.setAttribute("type", "text/javascript");
        script.textContent = scripts.join("\r\n");
        (document.head || document.documentElement).appendChild(script);
    };

    /**
     * We should override WebSocket constructor in the following browsers: Chrome (between 47 and 57 versions), Edge, YaBrowser, Opera and Safari (old versions)
     * Firefox and Safari (9 or higher) can be omitted because they allow us to inspect and block WS requests.
     * This function simply checks the conditions above.
     * @returns true if WebSocket constructor should be overridden
     */
    var shouldOverrideWebSocket = function () {

        // Checks for using of Content Blocker API for Safari 9+
        if (contentPage.isSafari) {
            return !contentPage.isSafariContentBlockerEnabled;
        }

        var userAgent = navigator.userAgent.toLowerCase();
        var isFirefox = userAgent.indexOf('firefox') >= 0;

        // Explicit check, we must not go further in case of Firefox
        // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/379
        if (isFirefox) {
            return false;
        }

        // Keep in mind that the following browsers (that support WebExt-API) Chrome, Edge, YaBrowser and Opera contain `Chrome/<version>` in their User-Agent string.
        var cIndex = userAgent.indexOf('chrome/');
        if (cIndex < 0) {
            return false;
        }

        var version = userAgent.substring(cIndex + 7);
        var versionNumber = Number.parseInt(version.substring(0, version.indexOf('.')));

        // WebSockets are broken in old versions of chrome and we don't need this hack in new version cause then websocket traffic is intercepted
        return versionNumber >= 47 && versionNumber <= 57;
    };

    /**
     * We should override RTCPeerConnection in all browsers, except the case of using of Content Blocker API for Safari 9+
     * @returns true if RTCPeerConnection should be overridden
     */
    var shouldOverrideWebRTC = function () {

        // Checks for using of Content Blocker API for Safari 9+
        if (contentPage.isSafari) {
            return !contentPage.isSafariContentBlockerEnabled;
        }

        return true;
    };

    /**
     * Overrides window.WebSocket and window.RTCPeerConnection running the function from wrappers.js
     * https://github.com/AdguardTeam/AdguardBrowserExtension/issues/203
     * https://github.com/AdguardTeam/AdguardBrowserExtension/issues/588
     */
    /* global injectPageScriptAPI, initPageMessageListener */
    var initRequestWrappers = function () {

        // Only for dynamically created frames and http/https documents.
        if (!isHttpOrAboutPage()) {
            return;
        }

        /**
         *
         * The code below is supposed to be used in WebExt extensions.
         * This code overrides WebSocket constructor (except for newer Chrome and FF) and RTCPeerConnection constructor, so that we could inspect & block them.
         *
         * https://github.com/AdguardTeam/AdguardBrowserExtension/issues/273
         * https://github.com/AdguardTeam/AdguardBrowserExtension/issues/572
         */
        var overrideWebSocket = shouldOverrideWebSocket();
        var overrideWebRTC = shouldOverrideWebRTC();

        if (overrideWebSocket || overrideWebRTC) {

            initPageMessageListener();

            var wrapperScriptName = 'wrapper-script-' + Math.random().toString().substr(2);
            var script = "(" + injectPageScriptAPI.toString() + ")('" + wrapperScriptName + "', " + overrideWebSocket + ", " + overrideWebRTC + ");";
            executeScripts([script]);
        }
    };

    /**
     * The main purpose of this function is to prevent blocked iframes "flickering".
     * So, we do two things:
     * 1. Add a temporary display:none style for all frames (which is removed on DOMContentLoaded event)
     * 2. Use a MutationObserver to react on dynamically added iframe
     *
     * https://github.com/AdguardTeam/AdguardBrowserExtension/issues/301
     */
    var addIframeHidingStyle = function () {
        if (window !== window.top) {
            // Do nothing for frames
            return;
        }

        /**
         * Checks for pre-hide iframes exception
         */
        var hideIframes = iframeHidingExceptions.indexOf(document.domain) < 0;

        var iframeHidingSelector = "iframe[src]";
        if (hideIframes) {
            ElementCollapser.hideBySelector(iframeHidingSelector, null, shadowRoot);
        }

        /**
         * For iframes with changed source we check if it should be collapsed
         *
         * @param mutations
         */
        var handleIframeSrcChanged = function (mutations) {
            for (var i = 0; i < mutations.length; i++) {
                var iframe = mutations[i].target;
                if (iframe) {
                    checkShouldCollapseElement(iframe);
                }
            }
        };

        var iframeObserver = new MutationObserver(handleIframeSrcChanged);
        var iframeObserverOptions = {
            attributes: true,
            attributeFilter: ['src']
        };

        /**
         * Dynamically added frames handler
         *
         * @param mutations
         */
        var handleDomChanged = function (mutations) {
            var iframes = [];
            for (var i = 0; i < mutations.length; i++) {
                var mutation = mutations[i];
                var addedNodes = mutation.addedNodes;
                for (var j = 0; j < addedNodes.length; j++) {
                    var node = addedNodes[j];
                    if (node.localName === "iframe") {
                        iframes.push(node);
                    }
                }
            }

            if (iframes.length > 0) {
                var iIframes = iframes.length;
                while (iIframes--) {
                    var iframe = iframes[iIframes];
                    checkShouldCollapseElement(iframe);
                    iframeObserver.observe(iframe, iframeObserverOptions);
                }
            }
        };

        /**
         * Removes iframes hide style and initiates should-collapse check for iframes
         */
        var onDocumentReady = function () {
            var iframes = document.getElementsByTagName('iframe');
            for (var i = 0; i < iframes.length; i++) {
                checkShouldCollapseElement(iframes[i]);
            }

            if (hideIframes) {
                ElementCollapser.unhideBySelector(iframeHidingSelector, shadowRoot);
            }

            if (document.body) {
                // Handle dynamically added frames
                var domObserver = new MutationObserver(handleDomChanged);
                domObserver.observe(document.body, {
                    childList: true,
                    subtree: true
                });
            }
        };

        //Document can already be loaded
        if (['interactive', 'complete'].indexOf(document.readyState) >= 0) {
            onDocumentReady();
        } else {
            document.addEventListener('DOMContentLoaded', onDocumentReady);
        }
    };

    /**
     * Loads CSS and JS injections
     */
    var tryLoadCssAndScripts = function () {
        var message = {
            type: 'getSelectorsAndScripts',
            documentUrl: window.location.href,
            options: {
                filter: ['selectors', 'scripts'],
                genericHide: loadTruncatedCss
            }
        };

        /**
         * Sending message to background page and passing a callback function
         */
        contentPage.sendMessage(message, processCssAndScriptsResponse);
    };

    /**
     * Processes response from the background page containing CSS and JS injections
     *
     * @param response Response from the background page
     */
    var processCssAndScriptsResponse = function (response) {
        if (!response || response.requestFilterReady === false) {
            /**
             * This flag (requestFilterReady) means that we should wait for a while, because the
             * request filter is not ready yet. This is possible only on browser startup.
             * In this case we'll delay injections until extension is fully initialized.
             */
            setTimeout(function () {
                tryLoadCssAndScripts();
            }, 100);

            return;
        } else if (response.collapseAllElements) {

            /**
             * This flag (collapseAllElements) means that we should check all page elements
             * and collapse them if needed. Why? On browser startup we can't block some
             * ad/tracking requests because extension is not yet initialized when
             * these requests are executed. At least we could hide these elements.
             */
            applySelectors(response.selectors, response.useShadowDom);
            applyScripts(response.scripts);
            initBatchCollapse();
        } else {
            applySelectors(response.selectors, response.useShadowDom);
            applyScripts(response.scripts);
        }

        if (response && response.selectors && response.selectors.css && response.selectors.css.length > 0) {
            addIframeHidingStyle();
        }

        if (typeof CssHitsCounter !== 'undefined' &&
            typeof CssHitsCounter.count === 'function' &&
            response && response.selectors && response.selectors.cssHitsCounterEnabled) {

            // Start css hits calculation
            CssHitsCounter.count();
        }
    };

    /**
     * Sets "style" DOM element content.
     *
     * @param styleEl       "style" DOM element
     * @param cssContent    CSS content to set
     * @param useShadowDom  true if we want to use shadow DOM
     */
    var setStyleContent = function (styleEl, cssContent, useShadowDom) {

        if (useShadowDom && !shadowRoot) {
            // Despite our will to use shadow DOM we cannot
            // It is rare case, but anyway: https://code.google.com/p/chromium/issues/detail?id=496055
            // The only thing we can do is to append styles to document root
            // We should remove ::content pseudo-element first
            cssContent = cssContent.replace(new RegExp('::content ', 'g'), '');
        }

        styleEl.textContent = cssContent;
    };

    /**
     * Applies CSS and extended CSS stylesheets
     *
     * @param selectors     Object with the stylesheets got from the background page.
     * @param useShadowDom  If true - add styles to shadow DOM instead of normal DOM.
     */
    var applySelectors = function (selectors, useShadowDom) {
        if (!selectors) {
            return;
        }

        applyCss(selectors.css, useShadowDom);
        applyExtendedCss(selectors.extendedCss);
    };

    /**
     * Applies CSS stylesheets
     *
     * @param css Array with CSS stylesheets
     */
    var applyCss = function (css, useShadowDom) {
        if (!css || css.length === 0) {
            return;
        }

        for (var i = 0; i < css.length; i++) {
            var styleEl = document.createElement("style");
            styleEl.setAttribute("type", "text/css");
            setStyleContent(styleEl, css[i], useShadowDom);

            if (useShadowDom && shadowRoot) {
                shadowRoot.appendChild(styleEl);
            } else {
                (document.head || document.documentElement).appendChild(styleEl);
            }

            protectStyleElementFromRemoval(styleEl, useShadowDom);
            protectStyleElementContent(styleEl);
        }
    };

    /**
     * Applies Extended Css stylesheet
     *
     * @param extendedCss Array with ExtendedCss stylesheets
     */
    var applyExtendedCss = function (extendedCss) {
        if (!extendedCss || !extendedCss.length) {
            return;
        }

        // https://github.com/AdguardTeam/ExtendedCss
        new ExtendedCss(extendedCss.join("\n")).apply();
    };

    /**
     * Protects specified style element from changes to the current document
     * Add a mutation observer, which is adds our rules again if it was removed
     *
     * @param protectStyleEl protected style element
     */
    var protectStyleElementContent = function (protectStyleEl) {
        var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
        if (!MutationObserver) {
            return;
        }
        /* observer, which observe protectStyleEl inner changes, without deleting styleEl */
        var innerObserver = new MutationObserver(function (mutations) {

            for (var i = 0; i < mutations.length; i++) {

                var m = mutations[i];
                if (protectStyleEl.hasAttribute("mod") && protectStyleEl.getAttribute("mod") == "inner") {
                    protectStyleEl.removeAttribute("mod");
                    break;
                }

                protectStyleEl.setAttribute("mod", "inner");
                var isProtectStyleElModified = false;

                /* further, there are two mutually exclusive situations: either there were changes the text of protectStyleEl,
                 either there was removes a whole child "text" element of protectStyleEl
                 we'll process both of them */

                if (m.removedNodes.length > 0) {
                    for (var j = 0; j < m.removedNodes.length; j++) {
                        isProtectStyleElModified = true;
                        protectStyleEl.appendChild(m.removedNodes[j]);
                    }
                } else {
                    if (m.oldValue) {
                        isProtectStyleElModified = true;
                        protectStyleEl.textContent = m.oldValue;
                    }
                }

                if (!isProtectStyleElModified) {
                    protectStyleEl.removeAttribute("mod");
                }
            }

        });

        innerObserver.observe(protectStyleEl, {
            'childList': true,
            'characterData': true,
            'subtree': true,
            'characterDataOldValue': true
        });
    };

    /**
     * Protects style element from removing.
     *
     * @param protectStyleEl protected style element
     * @param useShadowDom shadowDOM flag
     */
    var protectStyleElementFromRemoval = function (protectStyleEl, useShadowDom) {
        var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
        if (!MutationObserver) {
            return;
        }
        /* observer, which observe deleting protectStyleEl */
        var outerObserver = new MutationObserver(function (mutations) {
            for (var i = 0; i < mutations.length; i++) {

                var m = mutations[i];
                var removedNodeIndex = [].indexOf.call(mutations[i].removedNodes, protectStyleEl);
                if (removedNodeIndex != -1) {
                    var removedStyleEl = m.removedNodes[removedNodeIndex];

                    outerObserver.disconnect();

                    applyCss([removedStyleEl.textContent], useShadowDom);

                    break;
                }
            }

        });

        outerObserver.observe(protectStyleEl.parentNode, {'childList': true, 'characterData': true});
    };

    /**
     * Applies JS injections.
     *
     * @param scripts Array with JS scripts and scriptSource ('remote' or 'local')
     */
    var applyScripts = function (scripts) {

        if (scriptsApplied) {
            return;
        }
        scriptsApplied = true;

        if (!scripts || scripts.length === 0) {
            return;
        }

        var scriptsToApply = [];

        for (var i = 0; i < scripts.length; i++) {
            var scriptRule = scripts[i];
            switch (scriptRule.scriptSource) {
                case 'local':
                    scriptsToApply.push(scriptRule.rule);
                    break;
                case 'remote':
                    /**
                     * Note (!) (Firefox, Opera):
                     * In case of Firefox and Opera add-ons, JS filtering rules are hardcoded into add-on code.
                     * Look at ScriptFilterRule.getScriptSource to learn more.
                     */
                    if (!isFirefox && !isOpera) {
                        scriptsToApply.push(scriptRule.rule);
                    }
                    break;
            }
        }

        if (scriptsToApply.length === 0) {
            return;
        }

        /**
         * JS injections are created by JS filtering rules:
         * http://adguard.com/en/filterrules.html#javascriptInjection
         */
        executeScripts(scriptsToApply);
    };

    /**
     * Init listeners for error and load events.
     * We will then check loaded elements if they are blocked by our extension.
     * In this case we'll hide these blocked elements.
     */
    var initCollapseEventListeners = function () {
        document.addEventListener("error", checkShouldCollapse, true);

        // We need to listen for load events to hide blocked iframes (they don't raise error event)
        document.addEventListener("load", checkShouldCollapse, true);
    };

    /**
     * Checks if loaded element is blocked by AG and should be hidden
     *
     * @param event Load or error event
     */
    var checkShouldCollapse = function (event) {
        var element = event.target;
        var eventType = event.type;
        var tagName = element.tagName.toLowerCase();

        var expectedEventType = (tagName == "iframe" || tagName == "frame" || tagName == "embed") ? "load" : "error";
        if (eventType != expectedEventType) {
            return;
        }

        checkShouldCollapseElement(element);
    };

    /**
     * Extracts element URL from the dom node
     *
     * @param element DOM node
     */
    var getElementUrl = function (element) {
        var elementUrl = element.src || element.data;
        if (!elementUrl ||
            elementUrl.indexOf('http') !== 0 ||
            // Some sources could not be set yet, lazy loaded images or smth.
            // In some cases like on gog.com, collapsing these elements could break the page script loading their sources 
            elementUrl === element.baseURI) {
            return null;
        }

        return elementUrl;
    };

    /**
     * Saves collapse request (to be reused after we get result from bg page)
     *
     * @param element Element to check
     * @return request ID
     */
    var saveCollapseRequest = function (element) {

        var tagName = element.tagName.toLowerCase();
        var requestId = collapseRequestId++;
        collapseRequests[requestId] = {
            element: element,
            src: element.src,
            tagName: tagName
        };

        return requestId;
    };

    /**
     * Hides element temporarily (until collapse check request is processed)
     *
     * @param element Element to hide
     */
    var tempHideElement = function (element) {
        // We skip big frames here
        if (element.localName === 'iframe' || element.localName === 'frame' || element.localName === 'embed') {
            if (element.clientHeight * element.clientWidth > 400 * 300) {
                return;
            }
        }

        ElementCollapser.hideElement(element, shadowRoot);
    };

    /**
     * Response callback for "processShouldCollapse" message.
     *
     * @param response Response got from the background page
     */
    var onProcessShouldCollapseResponse = function (response) {

        if (!response) {
            return;
        }

        // Get original collapse request
        var collapseRequest = collapseRequests[response.requestId];
        if (!collapseRequest) {
            return;
        }
        delete collapseRequests[response.requestId];

        var element = collapseRequest.element;
        if (response.collapse === true) {
            var elementUrl = collapseRequest.src;
            ElementCollapser.collapseElement(element, elementUrl, shadowRoot);
        }

        // Unhide element, which was previously hidden by "tempHideElement"
        // In case if element is collapsed, there's no need to hide it
        // Otherwise we shouldn't hide it either as it shouldn't be blocked
        ElementCollapser.unhideElement(element, shadowRoot);
    };

    /**
     * Checks if element is blocked by AG and should be hidden
     *
     * @param element Element to check
     */
    var checkShouldCollapseElement = function (element) {

        var requestType = requestTypeMap[element.localName];
        if (!requestType) {
            return;
        }

        var elementUrl = getElementUrl(element);
        if (!elementUrl) {
            return;
        }

        // Save request to a map (it will be used in response callback)
        var requestId = saveCollapseRequest(element);

        // Hide element right away (to prevent iframes "blinking")
        tempHideElement(element);

        // Send a message to the background page to check if the element really should be collapsed
        var message = {
            type: 'processShouldCollapse',
            elementUrl: elementUrl,
            documentUrl: document.URL,
            requestType: requestType,
            requestId: requestId
        };

        contentPage.sendMessage(message, onProcessShouldCollapseResponse);
    };

    /**
     * Response callback for "processShouldCollapseMany" message.
     *
     * @param response Response from bg page.
     */
    var onProcessShouldCollapseManyResponse = function (response) {

        if (!response) {
            return;
        }

        var requests = response.requests;
        for (var i = 0; i < requests.length; i++) {
            var collapseRequest = requests[i];
            onProcessShouldCollapseResponse(collapseRequest);
        }
    };

    /**
     * Collects all elements from the page and checks if we should hide them.
     */
    var checkBatchShouldCollapse = function () {
        var requests = [];

        // Collect collapse requests
        for (var tagName in requestTypeMap) { // jshint ignore:line
            var requestType = requestTypeMap[tagName];

            var elements = document.getElementsByTagName(tagName);
            for (var j = 0; j < elements.length; j++) {

                var element = elements[j];
                var elementUrl = getElementUrl(element);
                if (!elementUrl) {
                    continue;
                }

                var requestId = saveCollapseRequest(element);

                requests.push({
                    elementUrl: elementUrl,
                    requestType: requestType,
                    requestId: requestId,
                    tagName: tagName
                });
            }
        }

        var message = {
            type: 'processShouldCollapseMany',
            requests: requests,
            documentUrl: document.URL
        };

        // Send all prepared requests in one message
        contentPage.sendMessage(message, onProcessShouldCollapseManyResponse);
    };

    /**
     * This method is used when we need to check all page elements with collapse rules.
     * We need this when the browser is just started and add-on is not yet initialized.
     * In this case content scripts waits for add-on initialization and the
     * checks all page elements.
     */
    var initBatchCollapse = function () {
        if (document.readyState === 'complete' ||
            document.readyState === 'loaded' ||
            document.readyState === 'interactive') {
            checkBatchShouldCollapse();
        } else {
            document.addEventListener('DOMContentLoaded', checkBatchShouldCollapse);
        }
    };

    /**
     * Called when document become visible.
     * https://github.com/AdguardTeam/AdguardBrowserExtension/issues/159
     */
    var onVisibilityChange = function () {

        if (document.hidden === false) {
            document.removeEventListener("visibilitychange", onVisibilityChange);
            init();
        }
    };

    /**
     * Messaging won't work when page is loaded by Safari top hits
     */
    if (contentPage.isSafari && document.hidden) {
        document.addEventListener("visibilitychange", onVisibilityChange);
        return;
    }

    // Start the content script
    init();
})();

})(window);