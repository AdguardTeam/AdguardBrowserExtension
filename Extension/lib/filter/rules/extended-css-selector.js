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

    var EXTENDED_PSEUDO_CLASS_HAS = '-ext-has';
    var EXTENDED_PSEUDO_CLASS_CONTAINS = '-ext-contains';
    var EXTENDED_PSEUDO_CLASSES = [EXTENDED_PSEUDO_CLASS_HAS, EXTENDED_PSEUDO_CLASS_CONTAINS];


    var extractCommonSelector = function (selector, extendedClasses) {
        var result = selector;

        for (var i = 0; i < extendedClasses.length; i++) {
            var extClass = extendedClasses[i];
            if (result.indexOf(extClass.extClassBlock) >= 0) {
                result = result.replace(extClass.extClassBlock, '');
            }
        }

        return result;
    };

    var extractExtendedPseudoClasses = function (selector) {
        var extractClass = function (selector, extClass) {
            var nameStartIndex = selector.indexOf('[' + extClass);
            if (nameStartIndex < 0) {
                return null;
            }

            if (nameStartIndex > 0 && selector.charAt(nameStartIndex - 1) == '\\') {
                // Escaped squareBracket character
                return null;
            }

            var nameEndIndex = selector.indexOf(']', nameStartIndex);
            if (nameEndIndex < 0) {
                // Incorrect selector
                return null;
            }

            var extClassBlock = selector.substring(nameStartIndex, nameEndIndex + 1);

            var value = null;
            var valueIndex = extClassBlock.indexOf('=');
            if (valueIndex > 0) {
                value = extClassBlock.substring(valueIndex + 2, extClassBlock.length - 2);
            }

            return {
                extClass: extClass,
                value: value,
                extClassBlock: extClassBlock
            };
        };

        var result = [];
        for (var i = 0; i < EXTENDED_PSEUDO_CLASSES.length; i++) {
            var r = extractClass(selector, EXTENDED_PSEUDO_CLASSES[i]);
            if (r) {
                result.push(r);
            }
        }

        return result;
    };

    var checkExtendedClasses = function (element, extendedClasses) {
        for (var i = 0; i < extendedClasses.length; i++) {
            var extClass = extendedClasses[i];

            if (extClass.extClass == EXTENDED_PSEUDO_CLASS_HAS) {
                if (element.querySelector(extClass.value)) {
                    return true;
                }
            } else if (extClass.extClass == EXTENDED_PSEUDO_CLASS_CONTAINS) {
                if (element.innerHTML.indexOf(extClass.value) >= 0) {
                    return true;
                }
            }
        }

        return false;
    };

    var selector = function (selectorText) {
        var s = selectorText.replace(/\[-ext-([a-z-_]+)=(["'])((?:(?=(\\?))\4.)*?)\2\]/g, ':$1($3)');

        var parser = new CssSelectorParser();
        parser.registerSelectorPseudos('has', 'contains');
        parser.registerNestingOperators('>', '+', '~');
        parser.registerAttrEqualityMods('^', '$', '*', '~');
        parser.enableSubstitutes();

        var parsed = parser.parse(s);
        console.warn(parsed);

        //if (parsed.type == 'ruleSet') {
        //    var rule = parsed.rule;
        //    console.log(rule);
        //}

        var extendedClasses = extractExtendedPseudoClasses(selectorText);
        var commonSelector = extractCommonSelector(selectorText, extendedClasses);

        var query = function () {
            //var elements = document.querySelectorAll("*");

            var filter = function(elements, parsedSelector) {
                console.log('Filtering for selector:');
                console.log(parsedSelector);
                console.log(elements.length);

                var result = [];

                if (parsedSelector.type == 'ruleSet') {
                    var rule = parsed.rule;

                    result = result.concat(filter(elements, rule))
                } else if (parsedSelector.type == 'rule') {
                    var r = [];
                    for (var i = 0; i < elements.length; i++) {
                        console.log(elements);

                        if (!parsedSelector.tagName
                            || (elements[i].tagName && (elements[i].tagName.toLowerCase() == parsedSelector.tagName.toLowerCase()))) {
                            r.push(elements[i]);
                        }

                        //TODO: Add other qualifiers
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

            return filter(document.querySelectorAll("*"), parsed);

            //var result = [];
            //var elements = document.querySelectorAll(commonSelector);
            //var iElements = elements.length;
            //while (iElements > 0 && --iElements) {
            //    var element = elements[iElements];
            //    if (element && checkExtendedClasses(element, extendedClasses)) {
            //        result.push(element);
            //    }
            //}
            //return result;
        };

        return {
            queryAll: query,
            extendedPseudoClasses: extendedClasses,
            commonSelector: commonSelector
        }
    };

    return selector;
})();