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
var exports = {};

/**
 * requires wrapper.
 *
 * Used in Chrome extension.
 * In Firefox extension we use native "require" method.
 */
function require(module) {
	if (module in exports) {
		return exports[module];
	}
	return exports
}

exports.Cc = {
	"@mozilla.org/network/protocol;1?name=http": {
		getService: function (iface) {
			if (iface == exports.Ci.nsIHttpProtocolHandler) return navigator;
		}
	},
	"@mozilla.org/xmlextras/domparser;1": {
		createInstance: function (iface) {
			if (iface == exports.Ci.nsIDOMParser) return {};
		}
	},
	"@mozilla.org/xmlextras/xmlhttprequest;1": {
		createInstance: function (iface) {
			if (iface == exports.Ci.nsIXMLHttpRequest) return new XMLHttpRequest();
		}
	}
};

exports.Ci = {
	nsIHttpProtocolHandler: 'nsIHttpProtocolHandler',
	nsIDOMParser: 'nsIDOMParser',
	nsIXMLHttpRequest: 'nsIXMLHttpRequest'
};

exports.Cu = {

    modules: {
        'resource://gre/modules/devtools/Console.jsm': {console: console}
    },

    import: function (module) {
        return this.modules[module];
    }
};

exports.punycode = window.punycode;

exports['sdk/core/promise'] = {

	defer: function () {
		return new Deferred();
	},

	all: function (arr) {
		return Deferred.when.apply(Deferred, arr);
	}
};

exports.setTimeout = setTimeout;
exports.clearTimeout = clearTimeout;

// Global i18n
var i18n = ext.i18n;