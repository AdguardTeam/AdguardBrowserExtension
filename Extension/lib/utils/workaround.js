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
	 * By the rules of AMO and addons.opera.com we cannot use remote scripts
	 * (and our JS injection rules could be considered as remote scripts).
	 *
	 * So, what we do:
	 * 1. Pre-compile all current JS rules to the add-on and mark them as 'local'. Other JS rules (new not pre-compiled) are maked as 'remote'.
	 * 2. Also we mark as 'local' rules from the "User Filter" (local filter which user can edit)
	 * 3. In case of Firefox and Opera we apply only 'local' JS rules and ignore all marked as 'remote'
	 */
	getScriptSource: function (filterId, ruleText) {
		return (filterId == AntiBannerFiltersId.USER_FILTER_ID || ruleText in DEFAULT_SCRIPT_RULES) ? 'local' : 'remote';
	}
};