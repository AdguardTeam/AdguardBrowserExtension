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
var FilterRule = require('../../../lib/filter/rules/base-filter-rule').FilterRule;
var AntiBannerFiltersId = require('../../../lib/utils/common').AntiBannerFiltersId;
var DEFAULT_SCRIPT_RULES = require('../../../lib/utils/local-script-rules').DEFAULT_SCRIPT_RULES;

/**
 * JS injection rule:
 * http://adguard.com/en/filterrules.html#javascriptInjection
 */
var ScriptFilterRule = exports.ScriptFilterRule = function (rule, filterId) {

	FilterRule.call(this, rule, filterId);

	this.script = null;
	this.whiteListRule = StringUtils.contains(rule, FilterRule.MASK_SCRIPT_EXCEPTION_RULE);
	var mask = this.whiteListRule ? FilterRule.MASK_SCRIPT_EXCEPTION_RULE : FilterRule.MASK_SCRIPT_RULE;

	var indexOfMask = rule.indexOf(mask);
	if (indexOfMask > 0) {
		// domains are specified, parsing
		var domains = rule.substring(0, indexOfMask);
		this.loadDomains(domains);
	}

	this.script = rule.substring(indexOfMask + mask.length);

	/**
	 * By the rules of AMO and addons.opera.com we cannot use remote scripts
	 * (and our JS injection rules could be considered as remote scripts).
	 *
	 * So, what we do:
	 * 1. Pre-compile all current JS rules to the add-on and mark them as 'local'. Other JS rules (new not pre-compiled) are maked as 'remote'.
	 * 2. Also we mark as 'local' rules from the "User Filter" (local filter which user can edit)
	 * 3. In case of Firefox and Opera we apply only 'local' JS rules and ignore all marked as 'remote'
	 */
	function getScriptSource(filterId, ruleText) {
		return (filterId == AntiBannerFiltersId.USER_FILTER_ID || ruleText in DEFAULT_SCRIPT_RULES) ? 'local' : 'remote';
	}

	this.scriptSource = getScriptSource(filterId, rule);
};

ScriptFilterRule.prototype = Object.create(FilterRule.prototype);