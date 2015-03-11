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
 * Map containing tabs data
 */
var TabsMap = exports.TabsMap = function () {
	this.tabs = Object.create(null);
};

TabsMap.prototype = {

	/**
	 * Gets tab data by tab id
	 * @param tab   Tab
	 * @returns Tab data
	 */
	get: function (tab) {
		if (!tab) {
			return null;
		}
		return this.tabs[tab.id];
	},

	collection: function () {
		var result = [];
		for (var id in this.tabs) {
			result.push(this.tabs[id]);
		}
		return result;
	},

	/**
	 * Saves tab data
	 *
	 * @param tab   Tab
	 * @param value Tab data
	 */
	set: function (tab, value) {
		if (tab) {
			this.tabs[tab.id] = value;
		}
	},

	/**
	 * Remove tab data
	 *
	 * @param tab Tab
	 */
	remove: function (tab) {
		this._onClose(tab);
	},

	/**
	 * Clear tab data when tab is closed
	 *
	 * @param tab   Tab
	 * @private
	 */
	_onClose: function (tab) {
		if (tab) {
			delete this.tabs[tab.id];
		}
	}
};
