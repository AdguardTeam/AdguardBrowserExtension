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
var Cu = require('chrome').Cu;
Cu.import("resource://gre/modules/Services.jsm");

var SimplePrefs = require('sdk/simple-prefs');
var Log = require('../lib/utils/log').Log;

var self = require('sdk/self');

/**
 * Local storage adapter
 */
exports.LS = {

	storage: SimplePrefs.prefs,
	branch: Services.prefs.getBranch('extensions.' + self.id + '.'),

	getItem: function (key) {
		return this.storage[key];
	},

	setItem: function (key, value) {
		try {
			this.storage[key] = value;
		} catch (ex) {
			Log.error("Error save item cause: {0}", ex);
		}
	},

	removeItem: function (key) {
		this.branch.clearUserPref(key);
	},

	clean: function () {
		for (var key in this.storage) {
			this.removeItem(key);
		}
	}
};