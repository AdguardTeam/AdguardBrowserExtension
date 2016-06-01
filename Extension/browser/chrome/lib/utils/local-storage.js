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
/* global exports, Log */
/**
 * Local storage adapter
 */
var LS = exports.LS = {

	storage: localStorage,

	getItem: function (key) {
		return LS.storage.getItem(key);
	},

	setItem: function (key, value) {
		try {
			LS.storage.setItem(key, value);
		} catch (ex) {
			Log.error("Error while saving item {0} to the localStorage: {1}", key, ex);
		}
	},

	removeItem: function (key) {
		LS.storage.removeItem(key);
	}
};