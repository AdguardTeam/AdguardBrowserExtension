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
var CollectionUtils = require('../../../lib/utils/common').CollectionUtils;

/**
 * Filter that manages JS injection rules.
 * Read here for details: http://adguard.com/en/filterrules.html#javascriptInjection
 */
var ScriptFilter = exports.ScriptFilter = function (rules) {

	this.scriptRules = [];
	this.exceptionsRules = [];

	if (rules) {
		for (var i = 0; i < rules.length; i++) {
			this.addRule(rules[i]);
		}
	}
};

ScriptFilter.prototype = {

	/**
	 * Adds JS injection rule
	 *
	 * @param rule Rule object
	 */
	addRule: function (rule) {
		if (rule.whiteListRule) {
			this.exceptionsRules.push(rule);
			this._applyExceptionRuleToFilter(rule);
			return;
		}

		this._applyExceptionRulesToRule(rule);
		this.scriptRules.push(rule);
	},

	/**
	 * Removes JS injection rule
	 *
	 * @param rule Rule object
	 */
	removeRule: function (rule) {
		CollectionUtils.removeRule(this.scriptRules, rule);
		CollectionUtils.removeRule(this.exceptionsRules, rule);
		this._rollbackExceptionRule(rule);
	},

	/**
	 * Removes all rules from this filter
	 */
	clearRules: function () {
		this.scriptRules = [];
		this.exceptionsRules = [];
	},

	/**
	 * Returns the array of loaded rules
	 */
	getRules: function () {
		var result = [];
		return result.concat(this.scriptRules).concat(this.exceptionsRules);
	},

	/**
	 * Builds script for the specified domain to be injected
	 *
	 * @param domainName Domain name
	 * @returns List of scripts to be applied and scriptSource
	 */
	buildScript: function (domainName) {
		var scripts = [];
		for (var i = 0; i < this.scriptRules.length; i++) {
			var rule = this.scriptRules[i];
			if (rule.isPermitted(domainName)) {
				scripts.push({
					scriptSource: rule.scriptSource,
					rule: rule.script
				});
			}
		}
		return scripts;
	},

	/**
	 * Rolls back exception rule:
	 * http://adguard.com/en/filterrules.html#javascriptInjectionExceptions
	 *
	 * @param exceptionRule Exception rule
	 * @private
	 */
	_rollbackExceptionRule: function (exceptionRule) {

		if (!exceptionRule.whiteListRule) {
			return;
		}

		for (var i = 0; i < this.scriptRules.length; i++) {
			var scriptRule = this.scriptRules[i];
			if (scriptRule.script == exceptionRule.script) {
				scriptRule.removeRestrictedDomains(exceptionRule.getPermittedDomains());
			}
		}
	},

	/**
	 * Applies exception rule:
	 * http://adguard.com/en/filterrules.html#javascriptInjectionExceptions
	 *
	 * @param exceptionRule Exception rule
	 * @private
	 */
	_applyExceptionRuleToFilter: function (exceptionRule) {
		for (var i = 0; i < this.scriptRules.length; i++) {
			this._removeExceptionDomains(this.scriptRules[i], exceptionRule);
		}
	},

	/**
	 * Applies exception rules:
	 * http://adguard.com/en/filterrules.html#javascriptInjectionExceptions
	 *
	 * @param scriptRule JS injection rule
	 * @private
	 */
	_applyExceptionRulesToRule: function (scriptRule) {
		for (var i = 0; i < this.exceptionsRules.length; i++) {
			this._removeExceptionDomains(scriptRule, this.exceptionsRules[i]);
		}
	},

	_removeExceptionDomains: function (scriptRule, exceptionRule) {

		if (scriptRule.script != exceptionRule.script) {
			return;
		}

		scriptRule.addRestrictedDomains(exceptionRule.getPermittedDomains());
	}
};