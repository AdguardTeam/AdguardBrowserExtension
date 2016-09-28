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
 * Object that collapses or hides DOM elements and able to roll it back.
 */
var ElementCollapser = (function() {

    var collapserStyleId = "adguard-collapse-styles";
    var hiddenElements = [];

    /**
     * Gets full DOM path to the specified element
     */
    var getDomPath = function (el) {
        var stack = [];
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
            var nodeName = el.nodeName.toLowerCase();
            if (sibCount > 1) {
                stack.unshift(nodeName + ':nth-of-type(' + (sibIndex + 1) + ')');
            } else {
                stack.unshift(nodeName);
            }
            el = el.parentNode;
        }
        stack.splice(0, 1); // removes the html element
        return stack.join(' > ');
    };

    /**
     * Adds "selectorText { display:none!important; }" style
     */
    var hideBySelector = function(selectorText, cssText) {
        var styleElement = document.getElementById(collapserStyleId);
        if (!styleElement) {
            styleElement = document.createElement("style");
            styleElement.id = collapserStyleId;
            styleElement.setAttribute("type", "text/css");
            (document.head || document.documentElement).appendChild(styleElement);
        }

        var rule = selectorText + '{' + (cssText || "display: none!important") + '}';
        styleElement.sheet.insertRule(rule, styleElement.sheet.cssRules.length);
    };

    /**
     * Unhides elements which were previously hidden by the specified selector
     */
    var unhideBySelector = function(selectorText) {
        var styleElement = document.getElementById(collapserStyleId);
        if (!styleElement || !styleElement.sheet) {
            return;
        }
        var iLength = styleElement.sheet.cssRules.length;
        while (iLength--) {
            var cssRule = styleElement.sheet.cssRules[iLength];
            if (cssRule.selectorText == selectorText) {
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
            }, 100);
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
        var selectorText = getDomPath(element);
        // First check if we have hidden it already
        var hiddenElement = findHiddenElement(element);
        if (hiddenElement && hiddenElement.selectorText === selectorText) {
            // Nothing changed, we should do nothing
            return;
        }

        var tagName = element.tagName.toLowerCase();
        if (tagName === "frame" || tagName === "iframe") {
            // Use specific style for frames due to these issues:
            // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/346
            // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/355
            // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/347
            hideBySelector(selectorText, "visibility: hidden!important; height: 0px!important;");
        } else {
            hideBySelector(selectorText);
        }

        if (hiddenElement) {
            // Remove redundant selector and save the new one
            unhideBySelector(hiddenElement.selectorText);
            hiddenElement.selectorText = selectorText;
        } else {
            hiddenElement = {
                node: element,
                selectorText: selectorText
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
                unhideBySelector(hiddenElement.selectorText);
                hiddenElements.splice(iLength, 1);
            }
        }
    };

    /**
     * Collapses specified element.
     *
     * @param element Element to collapse
     */
    var collapseElement = function(element) {

        var tagName = element.tagName.toLowerCase();
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
         */
        collapseElement: collapseElement,

        /**
         * Hides specified element
         *
         * @param element Element to hide
         */
        hideElement: hideElement,

        /**
         * Removes the style used to hide the specified element
         *
         * @param element Element to unhide
         */
        unhideElement: unhideElement,

        /**
         * Adds "selectorText { display:none!important; }" style
         *
         * @param selectorText CSS selector
         * @param cssText (optional) Overrides style used for hiding
         */
        hideBySelector: hideBySelector,

        /**
         * Unhides elements which were previously hidden by the specified selector
         *
         * @param selectorText CSS selector
         */
        unhideBySelector: unhideBySelector
    };
})();