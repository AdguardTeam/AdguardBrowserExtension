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

/* global safari */

(function (adguard, api) {

    /**
     * Extension version (x.x.x)
     * @param version
     * @constructor
     */
    var Version = function (version) {

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

    /**
     * Compares with other version
     * @param o
     * @returns {number}
     */
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

    var objectContentTypes = '.jar.swf.';
    var mediaContentTypes = '.mp4.flv.avi.m3u.webm.mpeg.3gp.3gpp.3g2.3gpp2.ogg.mov.qt.';
    var fontContentTypes = '.ttf.otf.woff.woff2.eot.';
    var imageContentTypes = '.ico.png.gif.jpg.jpeg.webp.';

    //noinspection UnnecessaryLocalVariableJS
    var Utils = {

        getClientId: function () {

            var clientId = adguard.localStorage.getItem("client-id");
            if (!clientId) {
                var result = [];
                var suffix = (Date.now()) % 1e8;
                var symbols = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz01234567890';
                for (var i = 0; i < 8; i++) {
                    var symbol = symbols[Math.floor(Math.random() * symbols.length)];
                    result.push(symbol);
                }
                clientId = result.join('') + suffix;
                adguard.localStorage.setItem("client-id", clientId);
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

        /**
         * @returns Extension version
         */
        getAppVersion: function () {
            return adguard.localStorage.getItem("app-version");
        },

        setAppVersion: function (version) {
            adguard.localStorage.setItem("app-version", version);
        },

        isYaBrowser: function () {
            return adguard.prefs.browser === "YaBrowser";
        },

        isOperaBrowser: function () {
            return adguard.prefs.browser === "Opera";
        },

        isSafariBrowser: function () {
            return adguard.prefs.browser === "Safari";
        },

        isEdgeBrowser: function () {
            return adguard.prefs.browser === "Edge";
        },

        isSafari9Plus: function () {
            return adguard.prefs.browser === "Safari" &&
                this.isGreaterOrEqualsVersion(adguard.prefs.safariVersion, "9.0");
        },

        isFirefoxBrowser: function () {
            return adguard.prefs.browser === "Firefox";
        },

        isChromeBrowser: function () {
            return adguard.prefs.browser === "Chrome";
        },

        isChromium: function () {
            return adguard.prefs.platform === 'chromium';
        },

        isWindowsOs: function () {
            return navigator.userAgent.toLowerCase().indexOf("win") >= 0;
        },

        isMacOs: function () {
            return navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        },

        /**
         * Returns true if Safari content blocker API is supported
         */
        isContentBlockerEnabled: function () {

            if (typeof safari === 'undefined' || !this.isSafari9Plus()) {
                return false;
            }

            if (typeof this._useOldSafariAPI === 'undefined') {
                // Seems that getItem returns a string
                // Cast it to string as I don't understand why it's type randomly changes (in dev build it is string, in beta - boolean)
                this._useOldSafariAPI = (String(safari.extension.settings.getItem('useOldSafariAPI')) === 'true');
            }

            return !this._useOldSafariAPI;
        },

        /**
         * Finds header object by header name (case insensitive)
         * @param headers Headers collection
         * @param headerName Header name
         * @returns {*}
         */
        findHeaderByName: function (headers, headerName) {
            if (headers) {
                for (var i = 0; i < headers.length; i++) {
                    var header = headers[i];
                    if (header.name.toLowerCase() === headerName.toLowerCase()) {
                        return header;
                    }
                }
            }
            return null;
        },

        /**
         * Finds header value by name (case insensitive)
         * @param headers Headers collection
         * @param headerName Header name
         * @returns {null}
         */
        getHeaderValueByName: function (headers, headerName) {
            var header = this.findHeaderByName(headers, headerName);
            return header ? header.value : null;
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

        getSafebrowsingBackUrl: function (tab) {
            //https://code.google.com/p/chromium/issues/detail?id=11854
            var previousUrl = adguard.tabs.getTabMetadata(tab.tabId, 'previousUrl');
            if (previousUrl && previousUrl.indexOf('http') === 0) {
                return previousUrl;
            }
            var referrerUrl = adguard.tabs.getTabMetadata(tab.tabId, 'referrerUrl');
            if (referrerUrl && referrerUrl.indexOf('http') === 0) {
                return referrerUrl;
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
         * Parse content type from path
         * @param path Path
         * @returns {*} content type (adguard.RequestTypes.*) or null
         */
        parseContentTypeFromUrlPath: function (path) {

            var ext = path.slice(-6);
            var pos = ext.lastIndexOf('.');

            // Unable to parse extension from url
            if (pos === -1) {
                return null;
            }

            ext = ext.slice(pos) + '.';
            if (objectContentTypes.indexOf(ext) !== -1) {
                return adguard.RequestTypes.OBJECT;
            }
            if (mediaContentTypes.indexOf(ext) !== -1) {
                return adguard.RequestTypes.MEDIA;
            }
            if (fontContentTypes.indexOf(ext) !== -1) {
                return adguard.RequestTypes.FONT;
            }
            if (imageContentTypes.indexOf(ext) !== -1) {
                return adguard.RequestTypes.IMAGE;
            }

            return null;
        },

        /**
         * Retrieve languages from navigator
         * @param limit Limit of preferred languages
         * @returns {Array}
         */
        getNavigatorLanguages: function (limit) {
            var languages = [];
            // https://developer.mozilla.org/ru/docs/Web/API/NavigatorLanguage/languages
            if (adguard.utils.collections.isArray(navigator.languages)) {
                languages = navigator.languages.slice(0, limit);
            } else if (navigator.language) {
                languages.push(navigator.language); // .language is first in .languages
            }
            return languages;
        },

        /**
         * Affected issues:
         * https://github.com/AdguardTeam/AdguardBrowserExtension/issues/602
         * https://github.com/AdguardTeam/AdguardBrowserExtension/issues/566
         * 'Popup' window

         * Creators update is not yet released, so we use Insider build 15063 instead.
         */
        EDGE_CREATORS_UPDATE: 15063,

        isEdgeBeforeCreatorsUpdate: function () {
            return this.isEdgeBrowser() && adguard.prefs.edgeVersion.build < this.EDGE_CREATORS_UPDATE;
        },

        /**
         * Returns extension params: clientId, version and locale
         */
        getExtensionParams: function () {
            var clientId = encodeURIComponent(this.getClientId());
            var locale = encodeURIComponent(adguard.app.getLocale());
            var version = encodeURIComponent(adguard.app.getVersion());
            var id = encodeURIComponent(adguard.app.getId());
            var params = [];
            params.push('v=' + version);
            params.push('cid=' + clientId);
            params.push('lang=' + locale);
            params.push('id=' + id);
            return params;
        }

    };

    api.browser = Utils;

})(adguard, adguard.utils);
