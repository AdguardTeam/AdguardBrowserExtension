/* global safari */
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
/* global require, exports, i18n */

var Cu = require('chrome').Cu;
var Cc = require('chrome').Cc;
var Ci = require('chrome').Ci;
var setTimeout = require('sdk/timers').setTimeout; // jshint ignore: line
var clearTimeout = require('sdk/timers').clearTimeout; // jshint ignore: line
Cu.import("resource://gre/modules/Services.jsm");

var LS = require('../../lib/utils/local-storage').LS;
var Prefs = require('../../lib/prefs').Prefs;
var RequestTypes = require('../../lib/utils/common').RequestTypes;

var Utils = exports.Utils = {

    navigator: Cc["@mozilla.org/network/protocol;1?name=http"].getService(Ci.nsIHttpProtocolHandler),

    objectContentTypes: '.jar.swf.',
    mediaContentTypes: '.mp4.flv.avi.m3u.webm.mpeg.3gp.3gpp.3g2.3gpp2.ogg.mov.qt.',
    fontContentTypes: '.ttf.otf.woff.woff2.eot.',
    imageContentTypes: '.ico.png.gif.jpg.jpeg.webp.',

    getClientId: function () {

        var clientId = LS.getItem("client-id");
        if (!clientId) {
            var result = [];
            var suffix = (Date.now()) % 1e8;
            var symbols = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz01234567890';
            for (var i = 0; i < 8; i++) {
                var symbol = symbols[Math.floor(Math.random() * symbols.length)];
                result.push(symbol);
            }
            clientId = result.join('') + suffix;
            LS.setItem("client-id", clientId);
        }

        return clientId;
    },

    /**
     * Checks if left version is greater than the right version
     */
    isGreaterVersion: function (leftVersion, rightVersion) {
        var left = new Version(leftVersion);
        var right = new Version(rightVersion);
        return left.compare(right) > 0;
    },

    isGreaterOrEqualsVersion: function (leftVersion, rightVersion) {
        var left = new Version(leftVersion);
        var right = new Version(rightVersion);
        return left.compare(right) >= 0;
    },

    getAppVersion: function () {
        return LS.getItem("app-version");
    },

    setAppVersion: function (version) {
        LS.setItem("app-version", version);
    },

    isYaBrowser: function () {
        return Prefs.getBrowser() == "YaBrowser";
    },

    isOperaBrowser: function () {
        return Prefs.getBrowser() == "Opera";
    },

    isSafariBrowser: function () {
        return Prefs.getBrowser() == "Safari";
    },
    
    isEdgeBrowser: function() {
        return Prefs.getBrowser() == "Edge";
    },

    isSafari9Plus: function () {
        return Prefs.getBrowser() == "Safari" && 
            this.isGreaterOrEqualsVersion(Prefs.safariVersion, "9.0");
    },

    isFirefoxBrowser: function () {
        return Prefs.getBrowser() == "Firefox" || Prefs.getBrowser() == "Android";
    },

    isChromeBrowser: function () {
        return Prefs.getBrowser() == "Chrome";
    },

    isChromium: function () {
        return Prefs.platform == 'chromium';
    },

    isWindowsOs: function () {
        return this.navigator.userAgent.toLowerCase().indexOf("win") >= 0;
    },

    isMacOs: function () {
        return this.navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    },
    
    /**
     * Returns true if Shadow DOM is supported.
     * http://caniuse.com/#feat=shadowdom
     * 
     * In this case we transform CSS selectors and inject CSS to shadow DOM.
     * https://github.com/AdguardTeam/AdguardBrowserExtension/issues/44
     */
    isShadowDomSupported: function() {
        
        // Shadow DOM is supported by all modern chromium browsers
        return this.isChromium();
    },
    
    /**
     * Returns true if Safari content blocker API is supported
     */
    isContentBlockerEnabled: function () {
        
        if (typeof safari == 'undefined' || !this.isSafari9Plus()) {
            return false;
        }
        
        if (typeof this._useOldSafariAPI == 'undefined') {
            // Seems that getItem returns a string
            // Cast it to string as I don't understand why it's type randomly changes (in dev build it is string, in beta - boolean)
            this._useOldSafariAPI = (String(safari.extension.settings.getItem('useOldSafariAPI')) == 'true');
        }

        return !this._useOldSafariAPI;
    },

    getExtensionStoreLink: function () {
        var urlBuilder = ["http://adguard.com/"];

        if (Prefs.locale == "ru") {
            urlBuilder.push("ru");
        } else {
            urlBuilder.push("en");
        }
        urlBuilder.push("/extension-page.html?browser=");

        if (this.isOperaBrowser()) {
            urlBuilder.push("opera");
        } else if (this.isFirefoxBrowser()) {
            urlBuilder.push("firefox");
        } else if (this.isYaBrowser()) {
            urlBuilder.push("yabrowser");
        } else if (this.isSafariBrowser()) {
            urlBuilder.push("safari");
        } else if (this.isEdgeBrowser()) {
            urlBuilder.push("edge");
        } else {
            urlBuilder.push("chrome");
        }

        return urlBuilder.join("");
    },

    debounce: function (func, wait) {
        var timeout;
        return function () {
            var context = this, args = arguments;
            var later = function () {
                timeout = null;
                func.apply(context, args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    getFiltersUpdateResultMessage: function (success, updatedFilters) {
        var title = i18n.getMessage("options_popup_update_title");
        var text = [];
        if (success) {
            if (updatedFilters.length === 0) {
                text.push(i18n.getMessage("options_popup_update_not_found"));
            } else {
                updatedFilters.sort(function (a, b) {
                    return a.displayNumber - b.displayNumber;
                });
                for (var i = 0; i < updatedFilters.length; i++) {
                    var filter = updatedFilters[i];
                    text.push(i18n.getMessage("options_popup_update_updated", [filter.name, filter.version]).replace("$1", filter.name).replace("$2", filter.version));
                }
            }
        } else {
            text.push(i18n.getMessage("options_popup_update_error"));
        }

        return {
            title: title,
            text: text
        };
    },

    getFiltersEnabledResultMessage: function (enabledFilters) {
        var title = i18n.getMessage("alert_popup_filter_enabled_title");
        var text = [];
        enabledFilters.sort(function (a, b) {
            return a.displayNumber - b.displayNumber;
        });
        for (var i = 0; i < enabledFilters.length; i++) {
            var filter = enabledFilters[i];
            text.push(i18n.getMessage("alert_popup_filter_enabled_text", [filter.name]).replace("$1", filter.name));
        }
        return {
            title: title,
            text: text
        };
    },

    findHeaderByName: function (headers, headerName) {
        if (headers) {
            for (var i = 0; i < headers.length; i++) {
                var header = headers[i];
                if (header.name === headerName) {
                    return header;
                }
            }
        }
        return null;
    },

    /**
     * Set header value. Only for Chrome
     * @param headers
     * @param headerName
     * @param headerValue
     */
    setHeaderValue: function (headers, headerName, headerValue) {
        if (!headers) {
            headers = [];
        }
        var header = this.findHeaderByName(headers, headerName);
        if (header) {
            header.value = headerValue;
        } else {
            headers.push({name: headerName, value: headerValue});
        }
        return headers;
    },

    getSafebrowsingBackUrl: function (frameData) {
        if (frameData) {
            //https://code.google.com/p/chromium/issues/detail?id=11854
            var previousUrl = frameData.previousUrl;
            if (previousUrl && previousUrl.indexOf('http') === 0) {
                return previousUrl;
            }
            var referrerUrl = frameData.referrerUrl;
            if (referrerUrl && referrerUrl.indexOf('http') === 0) {
                return referrerUrl;
            }
        }
        if (this.isFirefoxBrowser()) {
            return 'about:newtab';
        } else if (this.isSafariBrowser()) {
            return 'about:blank';
        } else {
            return 'about:newtab';
        }
    },

    /**
     * Checks if specified object is array
     * We don't use instanceof because it is too slow: http://jsperf.com/instanceof-performance/2
     * @param obj Object
     */
    isArray: Array.isArray || function (obj) {
        return '' + obj === '[object Array]';
    },

    /**
     * Parse content type from path
     * @param path Path
     * @returns {*} content type (RequestTypes.*) or null
     */
    parseContentTypeFromUrlPath: function (path) {

        var ext = path.slice(-6);
        var pos = ext.lastIndexOf('.');

        // Unable to parse extension from url
        if (pos === -1) {
            return null;
        }

        ext = ext.slice(pos) + '.';
        if (this.objectContentTypes.indexOf(ext) !== -1) {
            return RequestTypes.OBJECT;
        }
        if (this.mediaContentTypes.indexOf(ext) !== -1) {
            return RequestTypes.MEDIA;
        }
        if (this.fontContentTypes.indexOf(ext) !== -1) {
            return RequestTypes.FONT;
        }
        if (this.imageContentTypes.indexOf(ext) !== -1) {
            return RequestTypes.IMAGE;
        }

        return null;
    }
};

var Version = exports.Version = function (version) {

    this.version = Object.create(null);

    var parts = String(version || "").split(".");

    function parseVersionPart(part) {
        if (isNaN(part)) {
            return 0;
        }
        return Math.max(part - 0, 0);
    }

    for (var i = 3; i >= 0; i--) {
        this.version[i] = parseVersionPart(parts[i]);
    }
};

Version.prototype.compare = function (o) {
    for (var i = 0; i < 4; i++) {
        if (this.version[i] > o.version[i]) {
            return 1;
        } else if (this.version[i] < o.version[i]) {
            return -1;
        }
    }
    return 0;
};

var ConcurrentUtils = exports.ConcurrentUtils = {

    runAsync: function (callback, context) {
        var params = Array.prototype.slice.call(arguments, 2);
        setTimeout(function () {
            callback.apply(context, params);
        }, 0);
    }
};