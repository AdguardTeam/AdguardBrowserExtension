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
 * Initializing required libraries for this file.
 * require method is overridden in Chrome extension (port/require.js).
 */
var StringUtils = require('../../../lib/utils/common').StringUtils;
var CollectionUtils = require('../../../lib/utils/common').CollectionUtils;
var Utils = require('../../../lib/utils/browser-utils').Utils;

/**
 * Special hash table that greatly increases speed of searching url filter rule by its shortcut
 */
var ShortcutsLookupTable = exports.ShortcutsLookupTable = function (rules) {

    this.lookupTable = Object.create(null);

    if (rules) {
        for (var i = 0; i < rules.length; i++) {
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

        var shortcut = this._getRuleShortcut(rule);

        if (!shortcut
            || ShortcutsLookupTable.ANY_HTTP_URL == shortcut
            || ShortcutsLookupTable.ANY_HTTPS_URL == shortcut) {
            // Shortcut does not exists or it is too short
            return false;
        }

        if (!(shortcut in this.lookupTable)) {
            // Array is too "memory-hungry" so we try to store one rule instead
            this.lookupTable[shortcut] = rule;
        } else {
            var obj = this.lookupTable[shortcut];
            if (Utils.isArray(obj)) {
                // That is popular shortcut, more than one rule
                obj.push(rule);
            } else {
                this.lookupTable[shortcut] = [obj, rule];
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

        var shortcut = this._getRuleShortcut(rule);

        if (!shortcut) {
            // Shortcut does not exists or it is too short
            return;
        }

        if (shortcut in this.lookupTable) {
            var obj = this.lookupTable[shortcut];
            if (Utils.isArray(obj)) {
                CollectionUtils.removeRule(obj, rule);
                if (obj.length == 0) {
                    delete this.lookupTable[shortcut];
                }
            } else {
                delete this.lookupTable[shortcut];
            }
        }
    },

    /**
     * Clears lookup table
     */
    clearRules: function () {
        this.lookupTable = Object.create(null);
    },

    /**
     * Searches for filter rules restricted to the specified url
     *
     * @param url url
     * @return List of filter rules or null if nothing found
     */
    lookupRules: function (url) {

        var result = [];
        for (var i = 0; i <= url.length - ShortcutsLookupTable.SHORTCUT_LENGTH; i++) {
            var hash = url.substring(i, i + ShortcutsLookupTable.SHORTCUT_LENGTH);
            var value = this.lookupTable[hash];
            if (value) {
                if (Utils.isArray(value)) {
                    result = result.concat(value);
                } else {
                    result.push(value);
                }
            }
        }
        return result;
    },

    /**
     * @returns {Array} rules in lookup table
     */
    getRules: function () {
        var result = [];
        for (var r in this.lookupTable) {
            var value = this.lookupTable[r];
            if (value) {
                if (Utils.isArray(value)) {
                    result = result.concat(value);
                } else {
                    result.push(value);
                }
            }
        }

        return result;
    },

    _getRuleShortcut: function (rule) {
        if (StringUtils.isEmpty(rule.shortcut) || rule.shortcut.length < ShortcutsLookupTable.SHORTCUT_LENGTH) {
            return null;
        }

        return rule.shortcut.substring(rule.shortcut.length - ShortcutsLookupTable.SHORTCUT_LENGTH);
    }
};

// Constants
ShortcutsLookupTable.SHORTCUT_LENGTH = 6;
ShortcutsLookupTable.ANY_HTTP_URL = "http:/";
ShortcutsLookupTable.ANY_HTTPS_URL = "https:";
