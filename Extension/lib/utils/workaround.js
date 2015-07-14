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
var Log = require('utils/log').Log;
var UrlUtils = require('utils/url').UrlUtils;
var FilterRule = require('filter/rules/base-filter-rule').FilterRule;
var USE_DEFAULT_SCRIPT_RULES = require('utils/local-script-rules').USE_DEFAULT_SCRIPT_RULES;
var DEFAULT_SCRIPT_RULES = require('utils/local-script-rules').DEFAULT_SCRIPT_RULES;

/**
 * We collect here all workarounds and ugly hacks:)
 */
var WorkaroundUtils = exports.WorkaroundUtils = {

	/**
	 * @returns true if e10s is enabled
	 */
	isMultiProcessFirefoxMode: function() {
		return this.multiProcessFirefoxMode;
	},

	/**
	 * Saves FF multi-process flag.
	 *
	 * In case if FF is working in e10s we change the way we do the following:
	 * 1. No more collapsing elements from the chrome process.
	 * We now use the same way as chromium extension - collapsing elements in the content script.
	 * It is slow, but it won't slow down the browser.
	 *
	 * More info:
	 * https://github.com/AdguardTeam/AdguardBrowserExtension/issues/4
	 *
	 * @param value true if multiprocess
	 */
	setMultiProcessFirefoxMode: function(value) {

		if (this.multiProcessFirefoxMode !== value) {
			Log.info("Set multi-process mode to {0}", value);
		}

		this.multiProcessFirefoxMode = value;
	},

	/**
	 * Checks if we should update frame's blocked requests counter.
	 * This method checks frame's creation time and does not allow
	 * updating blocked count for old frames.
	 *
	 * Thus we trying to fix an issue with pages making ad requests constantly.
	 *
	 * @param frameData Frame data
	 */
	shouldUpdateBlockedCount: function(frameData) {

		// max age is 60 seconds
		return frameData && (frameData.timeAdded + 60000 > Date.now());
	},

	/**
	 * Converts blocked counter to the badge text.
	 * Workaround for FF - make 99 max.
	 *
	 * @param blocked Blocked requests count
	 */
	getBlockedCountText: function(blocked) {
		var blockedText = blocked == "0" ? "" : blocked;
		if (blocked - 0 > 99) {
			blockedText = "99";
		}
		return blockedText;
	},

	/**
	 * Checks if it is facebook like button iframe
	 * TODO: Ugly, remove this
	 *
	 * @param url URL
	 * @returns true if it is
	 */
	isFacebookIframe: function (url) {
		// facebook iframe workaround
		// do not inject anything to facebook frames
		return url.indexOf('www.facebook.com/plugins/like.php') > -1;
	},

    /**
     * http://jira.performix.ru/browse/AG-3184
     *
     * By the rules of AMO and addons.opera.com we cannot use remote scripts
     * (and our JS injection rules could be considered as remote scripts).
     *
     * So what we do:
     * 1. We gather all current JS rules in the DEFAULT_SCRIPT_RULES object
     * 2. We disable JS rules got from remote server
     * 3. We allow only custom rules got from the User filter (which user creates manually)
     *    or from this DEFAULT_SCRIPT_RULES object
     *
     * @param antiBannerService Antibanner service (used to get user rules)
     * @param url               Page URL
     * @returns Scripts to be injected to the page
     */
	getScriptsForUrl: function (antiBannerService, url) {

	    if (!USE_DEFAULT_SCRIPT_RULES) {
		    // Get JS scripts from filters
		    return antiBannerService.getRequestFilter().getScriptsForUrl(url);
	    }

	    // In case of opera and firefox browsers, use predefined script rules
		if (WorkaroundUtils._scriptRules == null) {
			WorkaroundUtils._populateScriptRules();
		}

		var rules = [];
		for (var filterId in WorkaroundUtils._scriptRules) {
			if (antiBannerService.isAntiBannerFilterEnabled(filterId)) {
				var filterRules = WorkaroundUtils._scriptRules[filterId] || [];
				rules = rules.concat(filterRules);
			}
		}

		var domain = UrlUtils.toPunyCode(UrlUtils.getDomainName(url));
		var scripts = [];
		for (var j = 0; j < rules.length; j++) {
			var rule = rules[j];
			if (rule.isPermitted(domain)) {
				scripts.push(rule.script);
			}
		}

		var userScripts = antiBannerService.getRequestFilter().getUserScriptsForUrl(url);
		if (userScripts) {
			scripts = scripts.concat(userScripts);
		}
		return scripts;
	},

    /**
     * Initialize pre-compiled JS scripts
     * @private
     */
	_populateScriptRules: function () {
		var rules = Object.create(null);
		for (var filterId in  DEFAULT_SCRIPT_RULES) {
			rules[filterId] = [];
			var filterRules = DEFAULT_SCRIPT_RULES[filterId];
			for (var i = 0; i < filterRules.length; i++) {
				var rule = FilterRule.createRule(filterRules[i]);
				if (rule != null) {
					rules[filterId].push(rule);
				}
			}
		}
		WorkaroundUtils._scriptRules = rules;
	},

	_scriptRules: null
};