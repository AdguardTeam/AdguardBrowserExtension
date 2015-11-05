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
var ShortcutsLookupTable = require('filter/rules/shortcuts-lookup-table').ShortcutsLookupTable;
var StringUtils = require('utils/common').StringUtils;
var CollectionUtils = require('utils/common').CollectionUtils;
var UrlUtils = require('utils/url').UrlUtils;

/**
 * Filter for Url filter rules.
 * Read here for details:
 * http://adguard.com/en/filterrules.html#baseRules
 */
var UrlFilter = exports.UrlFilter = function (rules) {

	this.lookupTable = new ShortcutsLookupTable();
	this.rulesWithoutShortcuts = [];

	if (rules) {
		for (var i = 0; i < rules.length; i++) {
			this.addRule(rules[i]);
		}
	}
};

UrlFilter.prototype = {

	/**
	 * Adds rule to UrlFilter
	 *
	 * @param rule Rule object
	 */
	addRule: function (rule) {

		if (StringUtils.isEmpty(rule.shortcut) || rule.shortcut.length < ShortcutsLookupTable.SHORTCUT_LENGTH) {
			this.rulesWithoutShortcuts.push(rule);
		} else {
			this.lookupTable.addRule(rule);
		}
	},

	/**
	 * Removes rule from UrlFilter
	 *
	 * @param rule Rule to remove
	 */
	removeRule: function (rule) {

		if (StringUtils.isEmpty(rule.shortcut) || rule.shortcut.length < ShortcutsLookupTable.SHORTCUT_LENGTH) {
			CollectionUtils.removeRule(this.rulesWithoutShortcuts, rule);
		} else {
			this.lookupTable.removeRule(rule);
		}
	},

	/**
	 * Removes all rules from UrlFilter
	 */
	clearRules: function () {
		this.rulesWithoutShortcuts = [];
		this.lookupTable.clearRules();
	},

	/**
	 * Searches for first rule matching specified request
	 *
	 * @param url           Request url
	 * @param refHost       Referrer host
	 * @param requestType   Request content type (UrlFilterRule.contentTypes)
	 * @param thirdParty    true if request is third-party
	 * @return First matching rule or null if no match found
	 */
	isFiltered: function (url, refHost, requestType, thirdParty) {
		var rule;

		var rules = this.lookupTable.lookupRules(url.toLowerCase());

		// Check against rules with shortcuts
		if (rules && rules.length > 0) {
			rule = this._isFiltered(url, refHost, rules, requestType, thirdParty);
			if (rule) {
				return rule;
			}
		}

		// Check against rules without shortcuts
		if (this.rulesWithoutShortcuts != null && this.rulesWithoutShortcuts.length > 0) {
			rule = this._isFiltered(url, refHost, this.rulesWithoutShortcuts, requestType, thirdParty);
			if (rule != null) {
				return rule;
			}
		}

		return null;
	},

	/**
	 * Returns the array of loaded rules
	 */
	getRules: function () {
		var rules = this.lookupTable.getRules();
		return rules.concat(this.rulesWithoutShortcuts);
	},

	/**
	 * Searches for first rule in "rules" collection matching specified request
	 *
	 * @param url           Request url
	 * @param refHost       Referrer host
	 * @param rules         Rules collection
	 * @param requestType   Request content type (UrlFilterRule.contentTypes)
	 * @param thirdParty    true if request is third-party
	 * @return First matching rule or null if no match found
	 */
	_isFiltered: function (url, refHost, rules, requestType, thirdParty) {

		for (var i = 0; i < rules.length; i++) {
			var rule = rules[i];
			if (rule.isPermitted(refHost) && rule.isFiltered(url, thirdParty, requestType)) {
				return rule;
			}
		}

		return null;
	}
};
