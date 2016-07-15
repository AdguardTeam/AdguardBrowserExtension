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
/* global exports */
/**
 * Simple logger with log levels
 */
var Log = exports.Log = (function() {
	
	// Redefine if you need it
	var CURRENT_LEVEL = "INFO";
	
	var LEVELS = {
		ERROR: 1,
		WARN: 2,
		INFO: 3,
		DEBUG: 4
	};
	
	/**
	 * Pretty-print javascript error
	 */
	var errorToString = function(error) {
		return error.toString() + "\nStack trace:\n" + error.stack;
	};
	
	/**
	 * Prints log message
	 */
	var print = function (level, method, args) {
		//check log level
		if (LEVELS[CURRENT_LEVEL] < LEVELS[level]) {
			return;
		}
		if (!args || args.length === 0 || !args[0]) {
			return;
		}

		var str = args[0] + "";
		args = Array.prototype.slice.call(args, 1);
		var formatted = str.replace(/{(\d+)}/g, function (match, number) {
			
			if (typeof args[number] != "undefined") {
				var value = args[number];
				if (value instanceof Error) {
					value = errorToString(value);
				} else if (value && value.message) {
					value = value.message;
				}
				return value;
			}
			
			return match;
		});

		var now = new Date();
		formatted = now.toISOString() + ": " + formatted;
		console[method](formatted);
	};
	
	/**
	 * Expose public API
	 */
	return {
		debug: function () {
			print("DEBUG", "log", arguments);
		},

		info: function () {
			print("INFO", "info", arguments);
		},

		warn: function(){
			print("WARN", "info", arguments);
		},

		error: function () {
			print("ERROR", "error", arguments);
		}
	};
})();