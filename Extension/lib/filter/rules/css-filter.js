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
/* global require, exports */
/**
 * Initializing required libraries for this file.
 * require method is overridden in Chrome extension (port/require.js).
 */
var FilterUtils = require('../../../lib/utils/common').FilterUtils;
var FilterRule = require('../../../lib/filter/rules/base-filter-rule').FilterRule;
var Utils = require('../../../lib/utils/browser-utils').Utils;

var isShadowDomSupported = Utils.isShadowDomSupported();

/**
 * This class manages CSS rules and builds styles to inject to pages.
 * ABP element hiding rules: http://adguard.com/en/filterrules.html#hideRules
 * CSS injection rules: http://adguard.com/en/filterrules.html#cssInjection
 */
var CssFilter = exports.CssFilter = function (rules) {
	this.commonCss = null;
	this.commonCssHits = null;
	this.commonRules = [];
	this.domainSensitiveRules = [];
	this.extendedCssRules = [];
	this.exceptionRules = [];
	this.dirty = false;

	if (rules) {
		for (var i = 0; i < rules.length; i++) {
			this.addRule(rules[i]);
		}
	}
};

CssFilter.prototype = {

	/**
	 * Adds rule to CssFilter
	 *
	 * @param rule Rule to add
	 */
	addRule: function (rule) {
		// TODO: Check that extended css rules can be also whitelist (#@#)

		if (rule.whiteListRule) {
			this.exceptionRules.push(rule);
		} else if (rule.extendedCss) {
			this.extendedCssRules.push(rule);
		} else if (rule.isDomainSensitive()) {
			this.domainSensitiveRules.push(rule);
		} else {
			this.commonRules.push(rule);
		}

		this.dirty = true;
	},

	/**
	 * Removes rule from the CssFilter
	 *
	 * @param rule Rule to remove
	 */
	removeRule: function (rule) {

		var ruleText = rule.ruleText;

		this.exceptionRules = this.exceptionRules.filter(function (r) {
			return r.ruleText != ruleText;
		});
		this.extendedCssRules = this.extendedCssRules.filter(function (r) {
			return r.ruleText != ruleText;
		});
		this.domainSensitiveRules = this.domainSensitiveRules.filter(function (r) {
			return r.ruleText != ruleText;
		});
		this.commonRules = this.commonRules.filter(function (r) {
			return r.ruleText != ruleText;
		});

		this._rollbackExceptionRule(rule);

		this.dirty = true;
	},

	/**
	 * Clears CssFilter
	 */
	clearRules: function () {
		this.commonRules = [];
		this.domainSensitiveRules = [];
		this.exceptionRules = [];
		this.extendedCssRules = [];
		this.commonCss = null;
		this.dirty = true;
	},

	/**
	 * Returns the array of loaded rules
	 */
	getRules: function () {
		var result = [];
		return result.concat(this.commonRules).
			concat(this.domainSensitiveRules).
			concat(this.exceptionRules).
			concat(this.extendedCssRules);
	},

	/**
	 * Builds CSS to be injected to the page.
	 * This method builds CSS for element hiding rules only:
	 * http://adguard.com/en/filterrules.html#hideRules
	 *
	 * @param domainName    Domain name
	 * @param genericHide    flag to hide common rules
	 * @returns {{css: (*|*[]), extendedCss: (*|*[])}}
	 */
	buildCss: function (domainName, genericHide) {
		this._rebuild();

		var rules = this._filterRules(domainName, genericHide);

		var stylesheets = this._createCssStylesheets(rules);
		if (!genericHide) {
			stylesheets.css = this._getCommonCss().concat(stylesheets.css);
		}

		return stylesheets;
	},

	/**
	 * Builds CSS to be injected to the page.
	 * This method builds CSS for CSS injection rules:
	 * http://adguard.com/en/filterrules.html#cssInjection
	 *
	 * @param domainName Domain name
	 * @param genericHide flag to hide common rules
	 * @returns {{css: (*|*[]), extendedCss: (*|*[])}}
	 */
	buildInjectCss: function (domainName, genericHide) {
		this._rebuildBinding();
		var domainRules = this._filterDomainSensitiveRules(domainName);
		var injectDomainRules = [];
		if (domainRules !== null) {
			injectDomainRules = domainRules.filter(function (rule) {
				return (rule.isInjectRule || rule.extendedCss) && (!genericHide || !rule.isGeneric());
			});
		}

		var result;

		if (genericHide) {
			result = injectDomainRules;
		} else {
			var commonInjectedRules = this.commonRules.filter(function (rule) {
				return rule.isInjectRule;
			});

			result = injectDomainRules.concat(commonInjectedRules);
		}

		return this._createCssStylesheets(result);
	},

	/**
	 * Builds CSS to be injected to the page.
	 * If user has enabled "Send statistics for ad filters usage" option we build CSS with enabled hits stats.
	 * In this case style contains "background-image" with unique URL.
	 * Tracking requests to this URL shows us which rule has been used.
	 *
	 * This method is used for Chrome extension only.
	 * In other browsers we don't collect hit stats. See Prefs.collectHitsCountEnabled property for details.
	 *
	 * @param domainName    Domain name
	 * @param hitPrefix     Prefix for background-image url
	 * @param genericHide   Flag to hide common rules
	 * @returns {{css: (*|*[]), extendedCss: (*|*[])}}
	 */
	buildCssHits: function (domainName, hitPrefix, genericHide) {
		this._rebuildHits(hitPrefix);

		var rules = this._filterRules(domainName, genericHide);

		var stylesheets = this._createCssStylesheetsHits(rules, hitPrefix);
		if (!genericHide) {
			stylesheets.css = this._getCommonCssHits(hitPrefix).concat(stylesheets.css);
		}

		return stylesheets;
	},

	/**
	 * Filters rules with specified parameters
	 *
	 * @param domainName
	 * @param genericHide
	 * @returns {*}
	 * @private
	 */
	_filterRules: function (domainName, genericHide) {
		var result;
		var domainRules = this._filterDomainSensitiveRules(domainName);
		if (genericHide) {
			var nonGenericRules = [];
			if (domainRules !== null) {
				nonGenericRules = domainRules.filter(function (rule) {
					return !rule.isGeneric();
				});
			}

			result = nonGenericRules;
		} else {
			result = domainRules;
		}

		return result;
	},

	/**
	 * Creates separated stylesheet for css and extended css rules.
	 *
	 * @param rules
	 * @returns {{css: (*|*[]), extendedCss: (*|*[])}}
	 * @private
	 */
	_createCssStylesheets: function (rules) {
		var extendedCssRules = rules.filter(function (rule) {
			return rule.extendedCss;
		});

		var cssRules = rules.filter(function (rule) {
			return !rule.extendedCss;
		});

		return {
			css: this._buildCssByRules(cssRules),
			extendedCss: this._buildCssByRules(extendedCssRules)
		};
	},

	/**
	 * Creates separated stylesheet for css and extended css rules.
	 *
	 * @param rules
	 * @param hitPrefix
	 * @returns {{css: (*|List), extendedCss: (*|List)}}
	 * @private
	 */
	_createCssStylesheetsHits: function (rules, hitPrefix) {
		var extendedCssRules = rules.filter(function (rule) {
			return rule.extendedCss;
		});

		var cssRules = rules.filter(function (rule) {
			return !rule.extendedCss;
		});

		return {
			css: this._buildCssByRulesHits(cssRules, hitPrefix),
			extendedCss: this._buildCssByRulesHits(extendedCssRules, hitPrefix)
		};
	},

	/**
	 * Rebuilds CSS stylesheets if CssFilter is "dirty" (has some changes which are not applied yet).
	 *
	 * @private
	 */
	_rebuild: function () {
		if (!this.dirty) {
			return;
		}
		this._applyExceptionRules();
		this.commonCss = this._buildCssByRules(this.commonRules);
		this.commonCssHits = null;
		this.dirty = false;
	},

	/**
	 * Rebuilds CSS with hits stylesheet if CssFilter is "dirty" (has some changes which are not applied yet).
	 *
	 * If user has enabled "Send statistics for ad filters usage" option we build CSS with enabled hits stats.
	 * This method is used in Chrome (in other browsers we don't collect hit stats).
	 *
	 * @param hitPrefix Prefix for background-image url
	 * @private
	 */
	_rebuildHits: function (hitPrefix) {
		if (!this.dirty) {
			return;
		}
		this._applyExceptionRules();
		this.commonCssHits = this._buildCssByRulesHits(this.commonRules, hitPrefix);
		this.commonCss = null;
		this.dirty = false;
	},

	/**
	 * Rebuilds CSS filter.
	 *
	 * This method is used in Safari if Content Blocker is enabled.
	 * In this case we don't need commonCss and commonCssHits strings.
	 *
	 * @private
	 */
	_rebuildBinding: function () {
		if (!this.dirty) {
			return;
		}
		this._applyExceptionRules();
		this.commonCss = null;
		this.commonCssHits = null;
		this.dirty = false;
	},
	/**
	 * Applies exception rules
	 *
	 * Read here for details:
	 * http://adguard.com/en/filterrules.html#hideRulesExceptions
	 * http://adguard.com/en/filterrules.html#cssInjectionExceptions
	 * @private
	 */
	_applyExceptionRules: function () {

		var i, j, rule, exceptionRules;

		var exceptionRulesMap = this._arrayToMap(this.exceptionRules, 'cssSelector');

		for (i = 0; i < this.domainSensitiveRules.length; i++) {
			rule = this.domainSensitiveRules[i];
			exceptionRules = exceptionRulesMap[rule.cssSelector];
			if (exceptionRules) {
				for (j = 0; j < exceptionRules.length; j++) {

					this._applyExceptionRule(rule, exceptionRules[j]);
				}
			}
		}

		for (i = 0; i < this.extendedCssRules.length; i++) {
			rule = this.extendedCssRules[i];
			exceptionRules = exceptionRulesMap[rule.cssSelector];
			if (exceptionRules) {
				for (j = 0; j < exceptionRules.length; j++) {
					this._applyExceptionRule(rule, exceptionRules[j]);
				}
			}
		}

		var newDomainSensitiveRules = [];

		for (i = 0; i < this.commonRules.length; i++) {
			rule = this.commonRules[i];
			exceptionRules = exceptionRulesMap[rule.cssSelector];
			if (exceptionRules) {
				for (j = 0; j < exceptionRules.length; j++) {
					this._applyExceptionRule(rule, exceptionRules[j]);
				}
				if (rule.isDomainSensitive()) {
					// Rule has become domain sensitive.
					// We should remove it from common rules and add to domain sensitive.
					newDomainSensitiveRules.push(rule);
				}
			}
		}

		var newDomainSensitiveRulesMap = this._arrayToMap(newDomainSensitiveRules, 'ruleText');

		this.domainSensitiveRules = this.domainSensitiveRules.concat(newDomainSensitiveRules);
		// Remove new domain sensitive rules from common rules
		this.commonRules = this.commonRules.filter(function (el) {
			return !(el.ruleText in newDomainSensitiveRulesMap);
		});
	},

	/**
	 * Applies exception rule to the specified common rule.
	 * Common means that this rule does not have $domain option.
	 *
	 * @param commonRule        Rule object
	 * @param exceptionRule     Exception rule object
	 * @private
	 */
	_applyExceptionRule: function (commonRule, exceptionRule) {

		if (commonRule.cssSelector != exceptionRule.cssSelector) {
			return;
		}

		commonRule.addRestrictedDomains(exceptionRule.getPermittedDomains());
	},

	/**
	 * Getter for commonCss field.
	 * Lazy-initializes commonCss field if needed.
	 *
	 * @returns Common CSS stylesheet content
	 * @private
	 */
	_getCommonCss: function () {
		if (this.commonCss === null || this.commonCss.length === 0) {
			this.commonCss = this._buildCssByRules(this.commonRules);
		}
		return this.commonCss;
	},

	/**
	 * Getter for commonCssHits field.
	 * Lazy-initializes commonCssHits field if needed.
	 *
	 * @param hitPrefix Css hits prefix
	 * @returns Prefix for background-image url
	 * @private
	 */
	_getCommonCssHits: function (hitPrefix) {
		if (this.commonCssHits === null || this.commonCssHits.length === 0) {
			this.commonCssHits = this._buildCssByRulesHits(this.commonRules, hitPrefix);
		}
		return this.commonCssHits;
	},

	/**
	 * Rolls back exception rule (used if this exception rule is removed from the user filter)
	 *
	 * @param exceptionRule Exception rule to roll back
	 * @private
	 */
	_rollbackExceptionRule: function (exceptionRule) {

		if (!exceptionRule.whiteListRule) {
			return;
		}

		var newCommonRules = [];
		var i, rule;

		for (i = 0; i < this.domainSensitiveRules.length; i++) {
			rule = this.domainSensitiveRules[i];
			if (rule.cssSelector == exceptionRule.cssSelector) {
				rule.removeRestrictedDomains(exceptionRule.getPermittedDomains());
				if (!rule.isDomainSensitive()) {
					// Rule has become common.
					// We should remove it from domain sensitive rules and add to common.
					newCommonRules.push(rule);
				}
			}
		}

		for (i = 0; i < this.extendedCssRules.length; i++) {
			rule = this.extendedCssRules[i];
			if (rule.cssSelector == exceptionRule.cssSelector) {
				rule.removeRestrictedDomains(exceptionRule.getPermittedDomains());
			}
		}

		this.commonRules = this.commonRules.concat(newCommonRules);

		// Remove new common rules from  domain sensitive rules
		var newCommonRulesMap = this._arrayToMap(newCommonRules, 'ruleText');
		this.domainSensitiveRules = this.domainSensitiveRules.filter(function (el) {
			return !(el.ruleText in newCommonRulesMap);
		});
	},

	/**
	 * Gets list of domain-sensitive rules for the specified domain name.
	 *
	 * @param domainName Domain name
	 * @returns {Array} List of rules which could be applied to this domain
	 * @private
	 */
	_filterDomainSensitiveRules: function (domainName) {
		var rules = [];
		var rule;

		if (domainName) {
			if (this.domainSensitiveRules !== null) {
				var iDomainSensitive = this.domainSensitiveRules.length;
				while (iDomainSensitive--) {
					rule = this.domainSensitiveRules[iDomainSensitive];
					if (rule.isPermitted(domainName)) {
						rules.push(rule);
					}
				}
			}

			if (this.extendedCssRules !== null) {
				var iExtendedCss = this.extendedCssRules.length;
				while (iExtendedCss--) {
					rule = this.extendedCssRules[iExtendedCss];
					if (rule.isPermitted(domainName)) {
						rules.push(rule);
					}
				}
			}
		}

		return rules;
	},

	/**
	 * Builds CSS to be injected
	 *
	 * @param rules     List of rules
	 * @returns *[] of CSS stylesheets
	 * @private
	 */
	_buildCssByRules: function (rules) {

		var CSS_SELECTORS_PER_LINE = 50;
		var ELEMHIDE_CSS_STYLE = " { display: none!important; }\r\n";

		var elemHideSb = [];
		var selectorsCount = 0;
		var cssSb = [];

		for (var i = 0; i < rules.length; i++) {
			var rule = rules[i];

			if (rule.isInjectRule) {
				cssSb.push(this._getRuleCssSelector(rule));
			} else {
				elemHideSb.push(this._getRuleCssSelector(rule));
				++selectorsCount;
				if (selectorsCount % CSS_SELECTORS_PER_LINE === 0 || rule.extendedCss) {
					elemHideSb.push(ELEMHIDE_CSS_STYLE);
				} else {
					elemHideSb.push(", ");
				}
			}
		}

		if (elemHideSb.length > 0) {
			// Last element should always be a style (it will replace either a comma or the same style)
			elemHideSb[elemHideSb.length - 1] = ELEMHIDE_CSS_STYLE;
		}

		var styles = [];
		var elemHideStyle = elemHideSb.join("");
		var cssStyle = cssSb.join("\r\n");

		if (elemHideStyle) {
			styles.push(elemHideStyle);
		}

		if (cssStyle) {
			styles.push(cssStyle);
		}

		return styles;
	},

	/**
	 * Chrome extension only.
	 *
	 * Builds CSS with background-image style to be injected.
	 * This method is used if user has enabled "Send statistics for ad filters usage" option.
	 * Tracking requests for background image allows us to track rule hits.
	 *
	 * @param rules     List of rules
	 * @param hitPrefix Prefix for background-image url
	 * @returns List of CSS stylesheets
	 * @private
	 */
	_buildCssByRulesHits: function (rules, hitPrefix) {

		var ELEMHIDE_CSS_STYLE = " { display: none!important; }\r\n";
		var ELEMHIDE_HIT_START = " { display: none!important; background-image: url('" + hitPrefix + "/elemhidehit.png#";
		var ELEMHIDE_HIT_SEP = encodeURIComponent(';');
		var ELEMHIDE_HIT_END = "') !important;}\r\n";

		var elemHideSb = [];
		var cssSb = [];

		for (var i = 0; i < rules.length; i++) {
			var rule = rules[i];

			if (rule.isInjectRule) {
				cssSb.push(this._getRuleCssSelector(rule));
			} else {
				elemHideSb.push(this._getRuleCssSelector(rule));
				if (FilterUtils.isUserFilterRule(rule)) {
					elemHideSb.push(ELEMHIDE_CSS_STYLE);
				} else {
					elemHideSb.push(ELEMHIDE_HIT_START);
					elemHideSb.push(rule.filterId);
					elemHideSb.push(ELEMHIDE_HIT_SEP);
                    elemHideSb.push(FilterRule.escapeRule(rule.ruleText));
					elemHideSb.push(ELEMHIDE_HIT_END);
				}
			}
		}

		var styles = [];
		var elemHideStyle = elemHideSb.join("");
		var cssStyle = cssSb.join("\r\n");

		if (elemHideStyle) {
			styles.push(elemHideStyle);
		}

		if (cssStyle) {
			styles.push(cssStyle);
		}

		return styles;
	},

	_getRuleCssSelector: function(rule) {
		if (!isShadowDomSupported || rule.extendedCss) {
			return rule.cssSelector;
		} else {
			return "::content " + rule.cssSelector;
		}
	},

	_arrayToMap: function (array, prop) {
		var map = Object.create(null);
		for (var i = 0; i < array.length; i++) {
			var el = array[i];
			var property = el[prop];
			if (!(property in map)) {
				map[property] = [];
			}
			map[property].push(el);
		}
		return map;
	}
};