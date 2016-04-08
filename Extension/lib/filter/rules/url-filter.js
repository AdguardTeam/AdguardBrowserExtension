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
var ShortcutsLookupTable = require('../../../lib/filter/rules/shortcuts-lookup-table').ShortcutsLookupTable;
var StringUtils = require('../../../lib/utils/common').StringUtils;
var CollectionUtils = require('../../../lib/utils/common').CollectionUtils;
var UrlUtils = require('../../../lib/utils/url').UrlUtils;

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
	 * @param genericUrlBlockRule    genericblock rule or null
	 * @return matching rule or null if no match found
	 */
	isFiltered: function (url, refHost, requestType, thirdParty, genericUrlBlockRule) {
		var rule;
		var genericBlockRuleFired;

		var _isFiltered = function (url, refHost, rules, requestType, thirdParty, genericRulesAllowed) {

			for (var i = 0; i < rules.length; i++) {
				var rule = rules[i];
				if (rule.isPermitted(refHost) && rule.isFiltered(url, thirdParty, requestType)) {
					if (genericRulesAllowed || !rule.isGeneric()) {
						return rule;
					} else if (rule.isGeneric()) {
						genericBlockRuleFired = true;
					}
				}
			}

			return null;
		};

		var rules = this.lookupTable.lookupRules(url.toLowerCase());
		// Check against rules with shortcuts
		if (rules && rules.length > 0) {
			rule = _isFiltered(url, refHost, rules, requestType, thirdParty, !genericUrlBlockRule);
			if (rule != null) {
				return rule;
			}
		}

		// Check against rules without shortcuts
		if (this.rulesWithoutShortcuts != null && this.rulesWithoutShortcuts.length > 0) {
			rule = _isFiltered(url, refHost, this.rulesWithoutShortcuts, requestType, thirdParty, !genericUrlBlockRule);
			if (rule != null) {
				return rule;
			}
		}

		if (genericBlockRuleFired) {
			return genericUrlBlockRule;
		}

		return null;
	},

	/**
	 * Returns the array of loaded rules
	 */
	getRules: function () {
		var rules = this.lookupTable.getRules();
		return rules.concat(this.rulesWithoutShortcuts);
	}
};
