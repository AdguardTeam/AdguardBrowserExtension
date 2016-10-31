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
var UrlFilterRuleLookupTable = require('../../../lib/filter/rules/url-filter-lookup-table').UrlFilterRuleLookupTable;
var StringUtils = require('../../../lib/utils/common').StringUtils;
var UrlUtils = require('../../../lib/utils/url').UrlUtils;

/**
 * Filter for Url filter rules.
 * Read here for details:
 * http://adguard.com/en/filterrules.html#baseRules
 */
var UrlFilter = exports.UrlFilter = function (rules) {

	this.basicRulesTable = new UrlFilterRuleLookupTable();
	this.importantRulesTable = new UrlFilterRuleLookupTable();

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

		if (rule.isImportant) {
			this.importantRulesTable.addRule(rule);
		} else {
			this.basicRulesTable.addRule(rule);
		}
	},

	/**
	 * Removes rule from UrlFilter
	 *
	 * @param rule Rule to remove
	 */
	removeRule: function (rule) {

		if (rule.isImportant) {
			this.importantRulesTable.removeRule(rule);
		} else {
			this.basicRulesTable.removeRule(rule);
		}
	},

	/**
	 * Removes all rules from UrlFilter
	 */
	clearRules: function () {
		this.basicRulesTable.clearRules();
		this.importantRulesTable.clearRules();
	},

	/**
	 * Searches for first rule matching specified request
	 *
	 * @param url           Request url
	 * @param documentHost  Document host
	 * @param requestType   Request content type (UrlFilterRule.contentTypes)
	 * @param thirdParty    true if request is third-party
	 * @param skipGenericRules    skip generic rules
	 * @return matching rule or null if no match found
	 */
	isFiltered: function (url, documentHost, requestType, thirdParty, skipGenericRules) {
		// First looking for the rule marked with $important modifier
		var rule = this.importantRulesTable.findRule(url, documentHost, thirdParty, requestType, !skipGenericRules);

		if (rule == null) {
			rule = this.basicRulesTable.findRule(url, documentHost, thirdParty, requestType, !skipGenericRules);
		}
		return rule;
	},

	/**
	 * Returns the array of loaded rules
	 */
	getRules: function () {
		var rules = this.basicRulesTable.getRules();
		return rules.concat(this.importantRulesTable.getRules());
	}
};
