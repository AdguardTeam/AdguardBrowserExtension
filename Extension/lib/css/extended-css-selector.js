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
 */
var ExtendedSelector = (function () {

    /**
     * Prepares specified selector and compiles it with the Sizzle engine.
     * Preparation means transforming [-ext-*=""] attributes to pseudo classes.
     * 
     * @param selectorText Selector text
     */
    var prepareSelector = function(selectorText) {
        try {
            // Prepare selector to be compiled with Sizzle
            // Which means transform [-ext-*=""] attributes to pseudo classes
            var str = selectorText.replace(/\[-ext-([a-z-_]+)=(["'])((?:(?=(\\?))\4.)*?)\2\]/g, ':$1($3)');
            
            // Compiles and validates selector
            // Compilation in Sizzle means that selector will be saved to an inner cache and then reused
            Sizzle.compile(str);
            return str;
        } catch (ex) {
            if (typeof console !== 'undefined' && console.error) {
                console.error('Extended selector is invalid: ' + selectorText);
            }
            return null;
        }
    };

    // Constructor
    return function(selectorText) {
        var compiledSelector = prepareSelector(selectorText);

        // EXPOSE
        this.compiledSelector = compiledSelector;
        this.selectorText = selectorText;

        /**
         * Selects all DOM nodes matching this selector.
         */
        this.querySelectorAll = function() {
            return Sizzle(compiledSelector);
        };

        /**
         * Checks if the specified element matches this selector
         */
        this.matches = function(element) {
            return Sizzle.matchesSelector(element, compiledSelector);
        };
    };
})();