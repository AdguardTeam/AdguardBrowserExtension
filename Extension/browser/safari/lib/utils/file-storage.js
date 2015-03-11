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
 * File storage adapter
 */
var FS = exports.FS = {

	LINE_BREAK: '\n',

	readFromFile: function (path, callback) {
		try {
			var value = LS.getItem(path);
			var lines = [];
			if (value) {
				lines = value.split(/[\r\n]+/);
			}
			callback(null, lines);
		} catch (ex) {
			callback(ex);
		}
	},

	writeToFile: function (path, data, callback) {
		var value = data.join(FS.LINE_BREAK);
		try {
			LS.setItem(path, value);
			callback();
		} catch (ex) {
			callback(ex);
		}
	},

	/**
	 * @Deprecated use only for data transfer from previous versions
	 * @param path
	 * @param listener
	 * @param callback
	 */
	readFromFileWithListener: function (path, listener, callback) {
		try {
			var value = LS.getItem(path);
			var lines = (value || "").split(/[\r\n]+/);
			for (var i = 0; i < lines.length; i++) {
				listener.process(lines[i]);
			}
			callback(null);
		} catch (ex) {
			callback(ex);
		}
	},

	removeFile: function (path, successCallback) {
		LS.removeItem(path);
		successCallback();
	}
};