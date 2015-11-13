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
var FilterRule = require('filter/rules/base-filter-rule').FilterRule;

/**
 * CSS rule.
 *
 * Read here for details:
 * http://adguard.com/en/filterrules.html#hideRules
 * http://adguard.com/en/filterrules.html#cssInjection
 */
var CssFilterRule = exports.CssFilterRule = function (rule, filterId) {

	FilterRule.call(this, rule, filterId);

	var isInjectRule = StringUtils.contains(rule, FilterRule.MASK_CSS_INJECT_RULE) || StringUtils.contains(rule, FilterRule.MASK_CSS_EXCEPTION_INJECT_RULE);
	if (isInjectRule) {
		this.isInjectRule = isInjectRule;
	}

	var mask;
	if (isInjectRule) {
		this.whiteListRule = StringUtils.contains(rule, FilterRule.MASK_CSS_EXCEPTION_INJECT_RULE);
		mask = this.whiteListRule ? FilterRule.MASK_CSS_EXCEPTION_INJECT_RULE : FilterRule.MASK_CSS_INJECT_RULE;
	} else {
		this.whiteListRule = StringUtils.contains(rule, FilterRule.MASK_CSS_EXCEPTION_RULE);
		mask = this.whiteListRule ? FilterRule.MASK_CSS_EXCEPTION_RULE : FilterRule.MASK_CSS_RULE;
	}

	var indexOfMask = rule.indexOf(mask);
	if (indexOfMask > 0) {
		// domains are specified, parsing
		var domains = rule.substring(0, indexOfMask);
		this.loadDomains(domains);
	}
	this.cssSelector = rule.substring(indexOfMask + mask.length);
};

CssFilterRule.prototype = Object.create(FilterRule.prototype);
