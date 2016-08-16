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

        // TODO: Parse and create ExtendedSelector objects here
        return [
            {selectors: 'blahblah, blahblah', style: {display: 'none!important;'}},
            {selectors: 'blahblah2, blahblah2', style: {display: 'none!important;'}}
        ];
    };

    /**
     * Applies filtering rules
     *
     * @param rules Rules to apply
     */
    var applyRules = function (rules) {
        // TODO: Apply specified rules
    };

    /**
     * Checks that affected elements are still matching our selectors
     */
    var checkAffectedElements = function () {
        var iElements = affectedElements.length;
        while (iElements--) {
            var obj = affectedElements[i];
            // TODO: Check if element still matches one of the selectors
            if (obj.matchedSelector.matches(obj.element)) {
                // We're good, do nothing (or maybe apply it again?)
            } else {
                // TODO: Remove our styles (something like that)
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
        observer.disconnect();
        var iElements = affectedElements.length;
        while (iElements--) {
            // TODO: removeStyle
        }
    };

    // First of all parse the stylesheet
    rules = parse(styleSheet);

    // EXPOSE
    this.dispose = dispose;
    this.apply = apply;
};