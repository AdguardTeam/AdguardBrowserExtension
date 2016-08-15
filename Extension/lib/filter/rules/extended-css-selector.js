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
 * Extended selector class
 */
var ExtendedSelector = (function () {

    var checkElementHasClasses = function (element, classNames) {
        for (var i = 0; i < classNames.length; i++) {
            if (!element.classList.contains(classNames[i])) {
                return false;
            }
        }

        return true;
    };

    var checkElementPseudos = function (element, pseudos) {
        for (var i = 0; i < pseudos.length; i++) {
            var pseudo = pseudos[i];

            if (pseudo.name == 'has') {
                if (pseudo.valueType == 'selector') {
                    return filter(element.querySelectorAll("*"), pseudo.value).length > 0;
                }
            } else if (pseudo.name == 'contains') {
                if (!element.innerHTML || element.innerHTML.indexOf(pseudo.value.rule.tagName) < 0) {
                    return false;
                }
            }
        }

        return true;
    };

    var checkElement = function (element, selector) {
        if (selector.tagName
            && (!element.tagName || (element.tagName.toLowerCase() != selector.tagName.toLowerCase()))) {
            return false;
        }

        if (selector.classNames && selector.classNames.length > 0
            && !checkElementHasClasses(element, selector.classNames)) {
            return false;
        }

        if (selector.id
            && element.id != selector.id) {
            return false;
        }

        if (selector.pseudos && selector.pseudos.length > 0
            && !checkElementPseudos(element, selector.pseudos)) {
            return false;
        }

        return true;
    };

    var filter = function (elements, parsedSelector) {
        console.log('Filtering for selector:');
        console.log(parsedSelector);
        console.log(elements.length);

        var result = [];

        if (parsedSelector.type == 'ruleSet') {
            var rule = parsedSelector.rule;

            result = result.concat(filter(elements, rule))
        } else if (parsedSelector.type == 'rule') {
            var r = [];
            for (var i = 0; i < elements.length; i++) {
                if (checkElement(elements[i], parsedSelector)) {
                    r.push(elements[i]);
                }
            }

            if (parsedSelector.rule) {
                var children = [];
                for (var j = 0; j < r.length; j++) {
                    for (var k = 0; k < r[j].children.length; k++) {
                        children.push(r[j].children[k]);
                    }
                }
                result = result.concat(filter(children, parsedSelector.rule));
            } else {
                result = result.concat(r);
            }
        }

        return result;
    };

    var selector = function (selectorText) {
        var s = selectorText.replace(/\[-ext-([a-z-_]+)=(["'])((?:(?=(\\?))\4.)*?)\2\]/g, ':$1($3)');

        var parser = new CssSelectorParser();
        parser.registerSelectorPseudos('has', 'contains');
        parser.registerNestingOperators('>', '+', '~');
        parser.registerAttrEqualityMods('^', '$', '*', '~');
        parser.enableSubstitutes();

        var parsed = parser.parse(s);

        return filter(document.querySelectorAll("*"), parsed);
    };

    return selector;
})();