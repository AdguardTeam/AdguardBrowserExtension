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
var ElementCollapser = (function () {
    /**
     * https://github.com/AdguardTeam/AdguardBrowserExtension/issues/1436
     * Because Edge doesn't support CSS.escape use next function
     */
    var cssEscape = CSS.escape || function(value) {
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
                (codeUnit >= 0x0001 && codeUnit <= 0x001F) || codeUnit == 0x007F ||
                // If the character is the first character and is in the range [0-9]
                // (U+0030 to U+0039), […]
                (index === 0 && codeUnit >= 0x0030 && codeUnit <= 0x0039) ||
                // If the character is the second character and is in the range [0-9]
                // (U+0030 to U+0039) and the first character is a `-` (U+002D), […]
                (
                    index == 1 &&
                    codeUnit >= 0x0030 && codeUnit <= 0x0039 &&
                    firstCodeUnit == 0x002D
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
                length == 1 &&
                codeUnit == 0x002D
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
                codeUnit == 0x002D ||
                codeUnit == 0x005F ||
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

    /**
     * The <style> node that contains all the collapsing styles
     */
    var styleNode;

    /**
     * Adds "selectorText { display:none!important; }" style
     * @param selectorText
     * @param cssText optional
     */
    var hideBySelector = function (selectorText, cssText) {
        var rule = selectorText + '{' + (cssText || "display: none!important;") + '}';

        if (!styleNode) {
            styleNode = document.createElement("style");
            styleNode.setAttribute("type", "text/css");
            (document.head || document.documentElement).appendChild(styleNode);
        }

        styleNode.sheet.insertRule(rule, styleNode.sheet.cssRules.length);
    };

    /**
     * Adds "selectorText { display:none!important; }" style
     */
    var hideBySelectorAndTagName = function (selectorText, tagName) {
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
     * Creates selector for specified tagName and src attribute
     */
    var createSelectorForSrcAttr = function (srcAttrValue, tagName) {
        return tagName + '[src="' + cssEscape(srcAttrValue) + '"]';
    };

    /**
     * Clears priority for specified styles
     *
     * @param {HTMLElement} element element affected
     * @param {Array.<string>} styles array of style names
     */
    var clearElStylesPriority = function (element, styles) {
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
     * Collapses the specified element using a CSS style if possible (or inline style if not)
     *
     * @param {HTMLElement} element Element to collapse
     * @param {string} elementUrl Element's source url
     */
    var collapseElement = function (element, elementUrl) {

        if (isCollapsed(element)) {
            return;
        }

        var tagName = element.tagName.toLowerCase();

        if (elementUrl) {

            // Check that element still has the same "src" attribute
            // If it has changed, we do not need to collapse it anymore
            if (element.src === elementUrl) {
                // To not to keep track of changing src for elements, we are going to collapse it with a CSS rule
                // But we take element url, cause current source could be already modified
                // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/408
                var srcAttribute = element.getAttribute('src');
                var srcSelector = createSelectorForSrcAttr(srcAttribute, tagName);
                hideBySelectorAndTagName(srcSelector, tagName);

                // Remove important priority from the element style
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

    /**
     * Checks if specified element is already collapsed or not.
     * There is a big chance that we've already done it from the background page (see collapseElement method in webrequest.js)
     *
     * @param {HTMLElement} element Element to check
     */
    var isCollapsed = function (element) {
        var computedStyle = window.getComputedStyle(element);
        return (computedStyle && computedStyle.display === "none");
    };

    /**
     * Removes the collapser's style node
     */
    var clear = function() {
        if (!styleNode) {
            return;
        }

        styleNode.parentNode.removeChild(styleNode);
    };

    // EXPOSE
    return {
        collapseElement: collapseElement,
        isCollapsed: isCollapsed,
        clear: clear
    };
})();
