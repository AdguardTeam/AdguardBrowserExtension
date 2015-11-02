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
var UrlUtils = require('utils/url').UrlUtils;
var Log = require('utils/log').Log;

/**
 * Base class for all filter rules
 */
var FilterRule = exports.FilterRule = function (text, filterId) {
	this.ruleText = text;
	this.filterId = filterId;
};

FilterRule.prototype = {

	/**
	 * Loads $domain option.
	 * http://adguard.com/en/filterrules.html#hideRulesDomainRestrictions
	 * http://adguard.com/en/filterrules.html#advanced
	 *
	 * @param domains List of domains. Examples: "example.com|test.com" or "example.com,test.com"
	 */
	loadDomains: function (domains) {

		if (StringUtils.isEmpty(domains)) {
			return;
		}

		var permittedDomains = null;
		var restrictedDomains = null;

		var parts = domains.split(/[,|]/);
		try {
			for (var i = 0; i < parts.length; i++) {
				var domain = parts[i], domainName;
				if (StringUtils.startWith(domain, FilterRule.NOT_MARK)) {
					domainName = UrlUtils.toPunyCode(domain.substring(1).trim());
					if (!StringUtils.isEmpty(domainName)) {
						if (restrictedDomains == null) {
							restrictedDomains = [];
						}
						restrictedDomains.push(domainName);
					}
				} else {
					domainName = UrlUtils.toPunyCode(domain.trim());
					if (!StringUtils.isEmpty(domainName)) {
						if (permittedDomains == null) {
							permittedDomains = [];
						}
						permittedDomains.push(domainName);
					}
				}
			}
		} catch (ex) {
			Log.error("Error load domains from {0}, cause {1}", domains, ex);
		}

		this.setPermittedDomains(permittedDomains);
		this.setRestrictedDomains(restrictedDomains);
	},

	getPermittedDomains: function () {
		if (this.permittedDomain) {
			return [this.permittedDomain];
		} else {
			return this.permittedDomains;
		}
	},

	getRestrictedDomains: function () {
		if (this.restrictedDomain) {
			return [this.restrictedDomain];
		} else {
			return this.restrictedDomains;
		}
	},

	setPermittedDomains: function (permittedDomains) {
		if (!permittedDomains || permittedDomains.length == 0) {
			delete this.permittedDomain;
			delete this.permittedDomains;
			return;
		}
		if (permittedDomains.length > 1) {
			this.permittedDomains = permittedDomains;
		} else {
			this.permittedDomain = permittedDomains[0];
		}
	},

	setRestrictedDomains: function (restrictedDomains) {
		if (!restrictedDomains || restrictedDomains.length == 0) {
			delete this.restrictedDomain;
			delete this.restrictedDomains;
			return;
		}
		if (restrictedDomains.length > 1) {
			this.restrictedDomains = restrictedDomains;
		} else {
			this.restrictedDomain = restrictedDomains[0];
		}
	},

	/**
	 * Checks if rule is domain-sensitive
	 * @returns boolean true if $domain option is present. Otherwise false.
	 */
	isDomainSensitive: function () {
		return this.hasRestrictedDomains() || this.hasPermittedDomains();

	},

	/**
	 * @returns boolean true if rule has permitted domains
	 */
	hasPermittedDomains: function() {
		return (this.permittedDomain || (this.permittedDomains && this.permittedDomains.length > 0));
	},

	/**
	 * @returns boolean true if rule has restricted domains
	 */
	hasRestrictedDomains: function() {
		return (this.restrictedDomain || (this.restrictedDomains && this.restrictedDomains.length > 0));
	},

	/**
	 * Checks if rule could be applied to the specified domain name
	 *
	 * @param domainName Domain name
	 * @returns boolean true if rule is permitted
	 */
	isPermitted: function (domainName) {

		if (StringUtils.isEmpty(domainName)) {
			return false;
		}

		if (this.restrictedDomain && UrlUtils.isDomainOrSubDomain(domainName, this.restrictedDomain)) {
			return false;
		}

		if (this.restrictedDomains && UrlUtils.isDomainOrSubDomainOfAny(domainName, this.restrictedDomains)) {
			return false;
		}

		if (this.hasPermittedDomains()) {
			if (this.permittedDomain && UrlUtils.isDomainOrSubDomain(domainName, this.permittedDomain)) {
				return true;
			}

			return UrlUtils.isDomainOrSubDomainOfAny(domainName, this.permittedDomains);
		}

		return true;
	},

	/**
	 * Adds restricted domains
	 *
	 * @param domains List of domains
	 */
	addRestrictedDomains: function (domains) {
		if (domains) {
			var restrictedDomains = this.getRestrictedDomains();
			restrictedDomains = CollectionUtils.removeDuplicates((restrictedDomains || []).concat(domains));
			this.setRestrictedDomains(restrictedDomains);
		}
	},

	/**
	 * Removes restricted domains
	 *
	 * @param domains List of domains
	 */
	removeRestrictedDomains: function (domains) {
		if (domains) {
			var restrictedDomains = this.getRestrictedDomains();
			for (var i = 0; i < domains.length; i++) {
				CollectionUtils.remove(restrictedDomains, domains[i]);
			}
			this.setRestrictedDomains(restrictedDomains);
		}
	}
};

/**
 * Filter classes enumeration
 */
var FilterClasses = null;

function getClasses() {
	if (!FilterClasses) {
		FilterClasses = {
			CssFilterRule: require('filter/rules/css-filter-rule').CssFilterRule,
			UrlFilterRule: require('filter/rules/url-filter-rule').UrlFilterRule,
			ScriptFilterRule: require('filter/rules/script-filter-rule').ScriptFilterRule
		}
	}
	return FilterClasses;
}

/**
 * Method that parses rule text and creates object of a suitable class.
 *
 * @param ruleText Rule text
 * @param filterId Filter identifier
 * @returns Filter rule object. Either UrlFilterRule or CssFilterRule or ScriptFilterRule.
 */
FilterRule.createRule = function (ruleText, filterId) {

	ruleText = ruleText ? ruleText.trim() : null;
	if (!ruleText) {
		return null;
	}
	var rule = null;
	try {
		if (StringUtils.startWith(ruleText, FilterRule.COMMENT) ||
			StringUtils.contains(ruleText, FilterRule.OLD_INJECT_RULES) ||
			StringUtils.contains(ruleText, FilterRule.MASK_CONTENT_RULE) ||
			StringUtils.contains(ruleText, FilterRule.MASK_JS_RULE)) {
			// Empty or comment, ignore
			// Content rules are not supported
			return null;
		}

		var CssFilterRule = getClasses().CssFilterRule;
		var UrlFilterRule = getClasses().UrlFilterRule;
		var ScriptFilterRule = getClasses().ScriptFilterRule;
		if (StringUtils.startWith(ruleText, FilterRule.MASK_WHITE_LIST)) {
			rule = new UrlFilterRule(ruleText, filterId);
		} else if (StringUtils.contains(ruleText, FilterRule.MASK_CSS_RULE) || StringUtils.contains(ruleText, FilterRule.MASK_CSS_EXCEPTION_RULE)) {
			rule = new CssFilterRule(ruleText, filterId);
		} else if (StringUtils.contains(ruleText, FilterRule.MASK_CSS_INJECT_RULE) || StringUtils.contains(ruleText, FilterRule.MASK_CSS_EXCEPTION_INJECT_RULE)) {
			rule = new CssFilterRule(ruleText, filterId);
		} else if (StringUtils.contains(ruleText, FilterRule.MASK_SCRIPT_RULE) || StringUtils.contains(ruleText, FilterRule.MASK_SCRIPT_EXCEPTION_RULE)) {
			rule = new ScriptFilterRule(ruleText, filterId);
		} else {
			rule = new UrlFilterRule(ruleText, filterId);
		}
	} catch (ex) {
		Log.warn("Cannot create rule from {0}, cause {1}", ruleText, ex);
	}
	return rule;
};

/**
 * urlencodes rule text.
 * We need this function because of this issue:
 * https://github.com/AdguardTeam/AdguardBrowserExtension/issues/34
 */
FilterRule.escapeRule = function (ruleText) {
	return encodeURIComponent(ruleText).replace(/'/g, "%27");
};

FilterRule.PARAMETER_START = "[";
FilterRule.PARAMETER_END = "]";
FilterRule.MASK_WHITE_LIST = "@@";
FilterRule.MASK_CONTENT_RULE = "$$";
FilterRule.MASK_CSS_RULE = "##";
FilterRule.MASK_CSS_EXCEPTION_RULE = "#@#";
FilterRule.MASK_CSS_INJECT_RULE = "#$#";
FilterRule.MASK_CSS_EXCEPTION_INJECT_RULE = "#@$#";
FilterRule.MASK_SCRIPT_RULE = "#%#";
FilterRule.MASK_SCRIPT_EXCEPTION_RULE = "#@%#";
FilterRule.MASK_JS_RULE = "%%";
FilterRule.MASK_BANNER_RULE = "++";
FilterRule.MASK_CONFIGURATION_RULE = "~~";
FilterRule.COMMENT = "!";
FilterRule.EQUAL = "=";
FilterRule.COMA_DELIMITER = ",";
FilterRule.LINE_DELIMITER = "|";
FilterRule.NOT_MARK = "~";
FilterRule.OLD_INJECT_RULES = "adg_start_style_inject";
