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
 * Extended css class
 *
 * @param styleSheet
 * @constructor
 */
var ExtendedCss = function (styleSheet) {
    var rules = [];
    var affectedElements = [];
    var domObserver;

    /**
     * Parses specified styleSheet in a number of rules
     *
     * @param styleSheet String with the stylesheet
     */
    var parse = function (styleSheet) {

        var rulesForCssText = function (styleContent) {
            var doc = document.implementation.createHTMLDocument(""),
                styleElement = document.createElement("style");

            styleElement.textContent = styleContent;
            // the style will only be parsed once it is added to a document
            doc.body.appendChild(styleElement);

            return styleElement.sheet.cssRules;
        };

        var rules = rulesForCssText(styleSheet);

        var result = [];
        for (var i = 0; i < rules.length; i++) {
            var rule = rules[i];
            var selector = rule.selectorText;
            if (selector && (selector.indexOf('-ext-has') >= 0 || selector.indexOf('-ext-contains') >= 0)) {
                result.push({
                    selector: new ExtendedSelector(rule.selectorText),
                    style: {display: 'none! important;'}
                });
            }
        }

        return result;
    };

    /**
     * Applies filtering rules
     *
     * @param rules Rules to apply
     */
    var applyRules = function (rules) {
        for (var i = 0; i < rules.length; i++) {
            var rule = rules[i];

            var selector = rule.selector;
            var elements = selector.querySelectorAll();

            var iElements = elements.length;
            while (iElements--) {
                var el = elements[iElements];
                var originalStyle = el.style;

                el.style = rule.style;

                affectedElements.push({
                    element: el,
                    matchedSelector: selector,
                    originalStyle: originalStyle
                });
            }
        }
    };

    /**
     * Checks that affected elements are still matching our selectors
     */
    var checkAffectedElements = function () {
        var iElements = affectedElements.length;
        while (iElements--) {
            var obj = affectedElements[iElements];
            if (obj.matchedSelector.matches(obj.element)) {
                // We're good, do nothing (or maybe apply it again?)
            } else {
                obj.element.style = obj.originalStyle;
            }
        }
    };

    /**
     * Observe changes
     */
    var observe = function () {
        if (domObserver) {
            // Observer is already here
            return;
        }

        // Handle dynamically added elements
        var domObserver = new MutationObserver(onDomChanged);

        if (document.body) {
            domObserver.observe(document.body, {
                childList: true,
                subtree: true
            });
        } else {
            document.addEventListener('DOMContentLoaded', function () {
                domObserver.observe(document.body, {
                    childList: true,
                    subtree: true
                });
            });
        }
    };

    /**
     * Called on any DOM change, we should examine extended CSS again
     *
     * @param mutations
     */
    var onDomChanged = function (mutations) {

        if (mutations.length) {
            applyRules(rules);
            checkAffectedElements();
        }
    };

    /**
     * Applies extended CSS rules
     */
    var apply = function () {
        applyRules(rules);
        observe();
    };

    /**
     * Disposes ExtendedCss and removes our styles from matched elements
     */
    var dispose = function () {
        domObserver.disconnect();
        var iElements = affectedElements.length;
        while (iElements--) {
            var obj = affectedElements[iElements];

            obj.element.style = obj.originalStyle;
        }
    };

    // First of all parse the stylesheet
    rules = parse(styleSheet);

    // EXPOSE
    this.dispose = dispose;
    this.apply = apply;
};