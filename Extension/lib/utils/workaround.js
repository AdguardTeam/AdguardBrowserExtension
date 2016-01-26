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
var Log = require('../../lib/utils/log').Log;
var UrlUtils = require('../../lib/utils/url').UrlUtils;

/**
 * We collect here all workarounds and ugly hacks:)
 */
var WorkaroundUtils = exports.WorkaroundUtils = {

	/**
	 * Converts blocked counter to the badge text.
	 * Workaround for FF - make 99 max.
	 *
	 * @param blocked Blocked requests count
	 */
	getBlockedCountText: function(blocked) {
		var blockedText = blocked == "0" ? "" : blocked;
		if (blocked - 0 > 99) {
			blockedText = '\u221E';
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
	}
};