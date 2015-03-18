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
var StringUtils = require('utils/common').StringUtils;
var CollectionUtils = require('utils/common').CollectionUtils;
var Utils = require('utils/common').Utils;

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

    // Adds rule to shortcuts lookup table
    addRule: function (rule) {

        var shortcut = this._getRuleShortcut(rule);

        if (!shortcut) {
            // Shortcut does not exists or it is too short
            return;
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
    },

    // Removes rule from the shortcuts table
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

    clearRules: function () {
        this.lookupTable = Object.create(null);
    },

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

    _getRuleShortcut: function (rule) {
        if (StringUtils.isEmpty(rule.shortcut) || rule.shortcut.length < ShortcutsLookupTable.SHORTCUT_LENGTH) {
            return null;
        }

        return rule.shortcut.substring(rule.shortcut.length - ShortcutsLookupTable.SHORTCUT_LENGTH);
    }
};

// Constants
ShortcutsLookupTable.SHORTCUT_LENGTH = 6;
