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
     * @param rule css rule
     */
    var applyCss = function (rule) {
        var styleElement = getStyleElement();
        if (!styleElement) {
            styleElement = document.createElement("style");
            styleElement.id = collapserStyleId;
            styleElement.setAttribute("type", "text/css");
            (document.head || document.documentElement).appendChild(styleElement);
        }

        styleElement.sheet.insertRule(prepareSelector(rule), styleElement.sheet.cssRules.length);
    };

    /**
     * Adds "selectorText { display:none!important; }" style
     * @param selectorText
     * @param cssText optional
     */
    var hideBySelector = function(selectorText, cssText) {
        var rule = selectorText + '{' + (cssText || "display: none!important;") + '}';
        applyCss(rule);
    };

    /**
     * Adds "selectorText { display:none!important; }" style
     */
    var hideBySelectorAndTagName = function(selectorText, tagName) {
        if (tagName === "frame" || tagName === "iframe") {
            // Use specific style for frames due to these issues:
            // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/346
            // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/355
            // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/347
            // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/733
            hideBySelector(selectorText, "visibility: hidden!important; height: 0px!important; min-height: 0px!important;");
        } else {
            hideBySelector(selectorText, null);
        }
    };

    /**
     * Unhides elements which were previously hidden by the specified selector
     */
    var unhideBySelector = function(selectorText, selectorTextEscaped) {
        var styleElement = getStyleElement();
        if (!styleElement || !styleElement.sheet) {
            return;
        }
        var iLength = styleElement.sheet.cssRules.length;
        while (iLength--) {
            var cssRule = styleElement.sheet.cssRules[iLength];
            // Returns escaped selector in FF and unescaped in Chrome
            if (cssRule.selectorText == prepareSelector(selectorText)
                || cssRule.selectorText == prepareSelector(selectorTextEscaped)) {
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
     */
    var hideElement = function(element) {
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
        hideBySelectorAndTagName(selectorTextEscaped, tagName);

        if (hiddenElement) {
            // Remove redundant selector and save the new one
            unhideBySelector(hiddenElement.selectorText, hiddenElement.selectorTextEscaped);
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
    var unhideElement = function(element) {
        var iLength = hiddenElements.length;
        while (iLength--) {
            var hiddenElement = hiddenElements[iLength];
            if (hiddenElement.node === element) {
                unhideBySelector(hiddenElement.selectorText, hiddenElement.selectorTextEscaped);
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
     * @returns {Element} or null
     */
    var getStyleElement = function() {
        return document.getElementById(collapserStyleId);
    };

    /**
     * Prepares selector or rule text
     * @param selector
     * @returns {*}
     */
    var prepareSelector = function (selector) {
        return selector;
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
     */
    var collapseElement = function(element, elementUrl) {
        
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
                hideBySelectorAndTagName(srcSelector, tagName);

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
         * @param element Element to collapse
         * @param elementUrl Element's source url
         */
        collapseElement: collapseElement,

        /**
         * Hides specified element
         * @param element Element to hide
         */
        hideElement: hideElement,

        /**
         * Removes the style used to hide the specified element
         * @param element Element to unhide
         */
        unhideElement: unhideElement,

        /**
         * Adds "selectorText { display:none!important; }" style
         * @param selectorText CSS selector
         * @param cssText (optional) Overrides style used for hiding
         */
        hideBySelector: hideBySelector,

        /**
         * Unhides elements which were previously hidden by the specified selector
         * @param selectorText CSS selector
         */
        unhideBySelector: unhideBySelector
    };
})();