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

(function (adguard, api) {

    'use strict';

    // Constants
    const SHORTCUT_LENGTH = 6;
    const ANY_URL_SHORTCUTS = [
        'http:/',
        'https:',
        '|https',
        '|http:',
    ];

    /**
     * Retrieves shortcut for rule
     * @param rule
     */
    function getRuleShortcut(rule) {
        if (!rule.shortcut || rule.shortcut.length < SHORTCUT_LENGTH) {
            return null;
        }
        return rule.shortcut.substring(0, SHORTCUT_LENGTH);
    }

    function djb2HashBetween(str, begin, end) {
        let hash = 5381;
        for (let i = begin; i < end; i += 1) {
            hash = (hash * 33) ^ str.charCodeAt(i);
        }
        return hash >>> 0;
    }

    function djb2Hash(str) {
        if (!str) {
            return 0;
        }
        return djb2HashBetween(str, 0, str.length);
    }    

    /**
     * Special hash table that greatly increases speed of searching url filter rule by its shortcut
     */
    const ShortcutsLookupTable = function (rules) {

        this.lookupTable = new Map();

        if (rules) {
            for (let i = 0; i < rules.length; i++) {
                this.addRule(rules[i]);
            }
        }
    };

    ShortcutsLookupTable.prototype = {

        /**
         * Adds rule to shortcuts lookup table
         *
         * @param rule Rule to add to the table
         * @return boolean true if rule shortcut is applicable and rule was added
         */
        addRule: function (rule) {
            const shortcut = getRuleShortcut(rule);

            if (!shortcut || ANY_URL_SHORTCUTS.indexOf(shortcut) !== -1) {
                // Shortcut does not exists or it is too short
                return false;
            }

            const shortcutHash = djb2Hash(shortcut);

            if (!this.lookupTable.has(shortcutHash)) {
                // Array is too "memory-hungry" so we try to store one rule instead
                this.lookupTable.set(shortcutHash, rule);
            } else {
                const obj = this.lookupTable.get(shortcutHash);
                if (adguard.utils.collections.isArray(obj)) {
                    // That is popular shortcut, more than one rule
                    obj.push(rule);
                } else {
                    this.lookupTable.set(shortcutHash, [obj, rule]);
                }
            }

            return true;
        },

        /**
         * Removes specified rule from the lookup table
         *
         * @param rule Rule to remove
         */
        removeRule: function (rule) {
            const shortcut = getRuleShortcut(rule);

            if (!shortcut) {
                // Shortcut does not exists or it is too short
                return;
            }

            const shortcutHash = djb2Hash(shortcut);

            if (this.lookupTable.has(shortcutHash)) {
                const obj = this.lookupTable.get(shortcutHash);
                if (adguard.utils.collections.isArray(obj)) {
                    adguard.utils.collections.removeRule(obj, rule);
                    if (obj.length === 0) {
                        this.lookupTable.delete(shortcutHash);
                    }
                } else {
                    this.lookupTable.delete(shortcutHash);
                }
            }
        },

        /**
         * Clears lookup table
         */
        clearRules: function () {
            this.lookupTable.clear();
        },

        /**
         * Searches for filter rules restricted to the specified url
         *
         * @param url url
         * @return List of filter rules or null if nothing found
         */
        lookupRules: function (url) {
            let result = null;
            for (let i = 0; i <= url.length - SHORTCUT_LENGTH; i++) {
                const hash = djb2HashBetween(url, i, i +SHORTCUT_LENGTH);
                const value = this.lookupTable.get(hash);

                if (value) {
                    if (adguard.utils.collections.isArray(value)) {
                        if (result === null) {
                            result = [];
                        }
                        for (let rule of value) {
                            if (url.indexOf(rule.shortcut) !== -1) {
                                result.push(rule);
                            }
                        }
                    } else {
                        if (result === null) {
                            result = [];
                        }
                        if (url.indexOf(value.shortcut) !== -1) {
                            result.push(value);
                        }
                    }
                }
            }

            return result;
        },

        /**
         * @returns {Array} rules in lookup table
         */
        getRules: function () {
            let result = [];
            this.lookupTable.forEach((value) => {
                if (value) {
                    if (adguard.utils.collections.isArray(value)) {
                        result = result.concat(value);
                    } else {
                        result.push(value);
                    }
                }
            });
            return result;
        }
    };

    api.ShortcutsLookupTable = ShortcutsLookupTable;

})(adguard, adguard.rules);