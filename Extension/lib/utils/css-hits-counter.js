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

var CssHitsCounter = (function () { // jshint ignore:line

    'use strict';

    var CONTENT_ATTR_PREFIX = 'adguard';

    var onCssHitsFoundCallback;

    /**
     * Unquotes specified value
     */
    function removeQuotes(value) {
        if (typeof value === "string" && value.length > 1 &&
            (value[0] === '"' && value[value.length - 1] === '"' || value[0] === '\'' && value[value.length - 1] === '\'')) {
            // Remove double-quotes or single-quotes
            value = value.substring(1, value.length - 1);
        }
        return value;
    }

    /**
     * Serialize HTML element
     * @param element
     */
    function elementToString(element) {
        var s = [];
        s.push('<');
        s.push(element.localName);
        var attributes = element.attributes;
        for (var i = 0; i < attributes.length; i++) {
            var attr = attributes[i];
            s.push(' ');
            s.push(attr.name);
            s.push('="');
            s.push(attr.value.replace(/"/g, '\\"'));
            s.push('"');
        }
        s.push('>');
        return s.join('');
    }

    /**
     * Random id generator
     * @param {Number} [length=10] - length of random key
     * @returns {String} - random key with desired length
     */
    function generateRandomKey(length) {
        var DEFAULT_LENGTH = 10;
        length = (typeof length !== 'undefined') ? length : DEFAULT_LENGTH;
        var result = '';
        var possibleValues = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (var i = 0; i < length; i += 1) {
            result += possibleValues.charAt(Math.floor(Math.random() * possibleValues.length));
        }
        return result;
    }

    var HitsCounterStorage = {
        counter: 0,
        randomKey: generateRandomKey(),
        isCounted: function (element, rule) {
            var hitAddress = element[this.randomKey];
            if (hitAddress) {
                var countedHit = this[hitAddress];
                if (countedHit) {
                    return countedHit.element === element && countedHit.rule === rule;
                }
            }
            return false;
        },
        setCounted: function (element, rule) {
            var counter = this.getCounter();
            element[this.randomKey] = counter;
            this[counter] = { element: element, rule: rule };
        },
        getCounter: function () {
            this.counter = this.counter + 1;
            return this.counter;
        },
    };

    /**
     * Main calculation function.
     * 1. Select sub collection from elements.
     * 2. For each element from sub collection: retrieve calculated css 'content' attribute and if it contains 'adguard' marker then retrieve rule text and filter identifier.
     * 3. Start next task with some delay.
     *
     * @param elements Collection of all elements
     * @param start Start of batch
     * @param end End of batch
     * @param step Size of batch
     * @param result Collection for save result
     * @param callback Finish callback
     */
    function countCssHitsBatch(elements, start, end, step, result, callback) {
        var length = Math.min(end, elements.length);
        for (var i = start; i < length; i++) {

            var element = elements[i];
            var style = getComputedStyle(element);
            if (!style) {
                continue;
            }
            var content = style.content;
            if (!content || content.indexOf(CONTENT_ATTR_PREFIX) < 0) {
                continue;
            }

            var filterIdAndRuleText = decodeURIComponent(content);
            // 'content' value may include open and close quotes.
            filterIdAndRuleText = removeQuotes(filterIdAndRuleText);
            // Remove prefix
            filterIdAndRuleText = filterIdAndRuleText.substring(CONTENT_ATTR_PREFIX.length);
            // Attribute 'content' in css looks like: {content: 'adguard{filterId};{ruleText}'}
            var index = filterIdAndRuleText.indexOf(';');
            if (index < 0) {
                continue;
            }
            var filterId = parseInt(filterIdAndRuleText.substring(0, index), 10);
            var ruleText = filterIdAndRuleText.substring(index + 1);
            var RULE_FILTER_SEPARATOR = ';';
            var ruleAndFilterString = filterId + RULE_FILTER_SEPARATOR + ruleText;
            if (HitsCounterStorage.isCounted(element, ruleAndFilterString)) {
                continue;
            }
            HitsCounterStorage.setCounted(element, ruleAndFilterString);
            result.push({
                filterId: filterId,
                ruleText: ruleText,
                element: elementToString(element),
            });
        }

        if (length === elements.length) {
            callback(result);
            return;
        }

        start = end;
        end += step;

        // Start next task with some delay
        setTimeout(function () {
            countCssHitsBatch(elements, start, end, step, result, callback);
        }, 50);
    }

    function countCssHitsForMutations() {
        var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
        if (!MutationObserver) {
            return;
        }
        var observer = new MutationObserver(function (mutationRecords) {
            var potentialElementsWithNewHits = [];
            mutationRecords.forEach(function (mutationRecord) {
                var mutationTarget = mutationRecord.target;
                potentialElementsWithNewHits.push(mutationTarget);
                var mutationTargetElements = mutationTarget.querySelectorAll('*');
                for (var i = 0; i < mutationTargetElements.length; i += 1) {
                    potentialElementsWithNewHits.push(mutationTargetElements[i]);
                }
            });
            countCssHitsBatch(potentialElementsWithNewHits, 0, 100, 100, [], function (result) {
                if (result.length > 0 && typeof onCssHitsFoundCallback === 'function') {
                    onCssHitsFoundCallback(result);
                }
            });
        });
        observer.observe(document.documentElement, {
            childList: true,
            subtree: true,
            attributes: true,
        });
    }

    /**
     * This function divides calculation process into tasks.
     * When calculation finishes, sends results to background page.
     * See countCssHitsBatch for details.
     */
    function countCssHits() {
        var elements = document.querySelectorAll('*');
        // Submit first task.
        countCssHitsBatch(elements, 0, 100, 100, [], function (result) {
            if (result.length > 0 && typeof onCssHitsFoundCallback === 'function') {
                onCssHitsFoundCallback(result);
            }
        });
        countCssHitsForMutations();
    }

    /**
     * Invoke countCssHits with delay.
     * Delay is 2 seconds
     */
    function countCssHitsLater() {

        // Cleanup event listener
        removeEventListener('load', countCssHitsLater);

        setTimeout(countCssHits, 2000);
    }

    /**
     * This function prepares calculation of css hits.
     * We are waiting for 'load' event and start calculation.
     */
    var count = function () {
        // 'load' has already fired
        if (document.readyState === 'complete') {
            countCssHitsLater();
        } else {
            addEventListener('load', countCssHitsLater);
        }
    };

    /**
     * Sets callback that is fired on css hits.
     * @param callback Callback function
     */
    var setCssHitsFoundCallback = function (callback) {
        if (typeof callback !== 'function') {
            throw new Error('Wrong callback type');
        }
        onCssHitsFoundCallback = callback;
    };

    return {
        count: count,
        setCssHitsFoundCallback: setCssHitsFoundCallback
    };

})();