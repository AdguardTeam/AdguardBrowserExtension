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

(function (adguard, api) {
    /**
     * Extension version (x.x.x)
     * @param version
     * @constructor
     */
    const Version = function (version) {
        this.version = Object.create(null);

        const parts = String(version || '').split('.');

        function parseVersionPart(part) {
            if (isNaN(part)) {
                return 0;
            }
            return Math.max(part - 0, 0);
        }

        for (let i = 3; i >= 0; i--) {
            this.version[i] = parseVersionPart(parts[i]);
        }
    };

    /**
     * Compares with other version
     * @param o
     * @returns {number}
     */
    Version.prototype.compare = function (o) {
        for (let i = 0; i < 4; i++) {
            if (this.version[i] > o.version[i]) {
                return 1;
            } if (this.version[i] < o.version[i]) {
                return -1;
            }
        }
        return 0;
    };

    const objectContentTypes = '.jar.swf.';
    const mediaContentTypes = '.mp4.flv.avi.m3u.webm.mpeg.3gp.3gpp.3g2.3gpp2.ogg.mov.qt.';
    const fontContentTypes = '.ttf.otf.woff.woff2.eot.';
    const imageContentTypes = '.ico.png.gif.jpg.jpeg.webp.';

    // noinspection UnnecessaryLocalVariableJS
    const Utils = {

        getClientId() {
            let clientId = adguard.localStorage.getItem('client-id');
            if (!clientId) {
                const result = [];
                const suffix = (Date.now()) % 1e8;
                const symbols = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz01234567890';
                for (let i = 0; i < 8; i++) {
                    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
                    result.push(symbol);
                }
                clientId = result.join('') + suffix;
                adguard.localStorage.setItem('client-id', clientId);
            }

            return clientId;
        },

        /**
         * Checks if left version is greater than the right version
         */
        isGreaterVersion(leftVersion, rightVersion) {
            const left = new Version(leftVersion);
            const right = new Version(rightVersion);
            return left.compare(right) > 0;
        },

        isGreaterOrEqualsVersion(leftVersion, rightVersion) {
            const left = new Version(leftVersion);
            const right = new Version(rightVersion);
            return left.compare(right) >= 0;
        },

        /**
         * Returns major number of version
         *
         * @param version
         */
        getMajorVersionNumber(version) {
            const v = new Version(version);
            return v.version[0];
        },

        /**
         * Returns minor number of version
         *
         * @param version
         */
        getMinorVersionNumber(version) {
            const v = new Version(version);
            return v.version[1];
        },

        /**
         * @returns Extension version
         */
        getAppVersion() {
            return adguard.localStorage.getItem('app-version');
        },

        setAppVersion(version) {
            adguard.localStorage.setItem('app-version', version);
        },

        isYaBrowser() {
            return adguard.prefs.browser === 'YaBrowser';
        },

        isOperaBrowser() {
            return adguard.prefs.browser === 'Opera';
        },

        isEdgeBrowser() {
            return adguard.prefs.browser === 'Edge';
        },

        isEdgeChromiumBrowser() {
            return adguard.prefs.browser === 'EdgeChromium';
        },

        isFirefoxBrowser() {
            return adguard.prefs.browser === 'Firefox';
        },

        isChromeBrowser() {
            return adguard.prefs.browser === 'Chrome';
        },

        isChromium() {
            return adguard.prefs.platform === 'chromium';
        },

        isWindowsOs() {
            return navigator.userAgent.toLowerCase().indexOf('win') >= 0;
        },

        isMacOs() {
            return navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        },

        /**
         * Finds header object by header name (case insensitive)
         * @param headers Headers collection
         * @param headerName Header name
         * @returns {*}
         */
        findHeaderByName(headers, headerName) {
            if (headers) {
                for (let i = 0; i < headers.length; i++) {
                    const header = headers[i];
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
        getHeaderValueByName(headers, headerName) {
            const header = this.findHeaderByName(headers, headerName);
            return header ? header.value : null;
        },

        /**
         * Set header value. Only for Chrome
         * @param headers
         * @param headerName
         * @param headerValue
         */
        setHeaderValue(headers, headerName, headerValue) {
            if (!headers) {
                headers = [];
            }
            const header = this.findHeaderByName(headers, headerName);
            if (header) {
                header.value = headerValue;
            } else {
                headers.push({ name: headerName, value: headerValue });
            }
            return headers;
        },

        /**
         * Removes header from headers by name
         *
         * @param {Array} headers
         * @param {String} headerName
         * @return {boolean} True if header were removed
         */
        removeHeader(headers, headerName) {
            let removed = false;
            if (headers) {
                for (let i = headers.length - 1; i >= 0; i--) {
                    const header = headers[i];
                    if (header.name.toLowerCase() === headerName.toLowerCase()) {
                        headers.splice(i, 1);
                        removed = true;
                    }
                }
            }
            return removed;
        },

        getSafebrowsingBackUrl(tab) {
            // https://code.google.com/p/chromium/issues/detail?id=11854
            const previousUrl = adguard.tabs.getTabMetadata(tab.tabId, 'previousUrl');
            if (previousUrl && previousUrl.indexOf('http') === 0) {
                return previousUrl;
            }
            const referrerUrl = adguard.tabs.getTabMetadata(tab.tabId, 'referrerUrl');
            if (referrerUrl && referrerUrl.indexOf('http') === 0) {
                return referrerUrl;
            }

            return 'about:newtab';
        },

        /**
         * Parse content type from path
         * @param path Path
         * @returns {*} content type (adguard.RequestTypes.*) or null
         */
        parseContentTypeFromUrlPath(path) {
            let ext = path.slice(-6);
            const pos = ext.lastIndexOf('.');

            // Unable to parse extension from url
            if (pos === -1) {
                return null;
            }

            ext = `${ext.slice(pos)}.`;
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
        getNavigatorLanguages(limit) {
            let languages = [];
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

        isEdgeBeforeCreatorsUpdate() {
            return this.isEdgeBrowser() && adguard.prefs.edgeVersion.build < this.EDGE_CREATORS_UPDATE;
        },

        /**
         * Returns extension params: clientId, version and locale
         */
        getExtensionParams() {
            const clientId = encodeURIComponent(this.getClientId());
            const locale = encodeURIComponent(adguard.app.getLocale());
            const version = encodeURIComponent(adguard.app.getVersion());
            const id = encodeURIComponent(adguard.app.getId());
            const params = [];
            params.push(`v=${version}`);
            params.push(`cid=${clientId}`);
            params.push(`lang=${locale}`);
            params.push(`id=${id}`);
            return params;
        },

        /**
         * Checks if extension has required permissions
         * @param {Array<string>} permissions
         * @param {Array<string>} [origins]
         * @returns {Promise<boolean>}
         */
        containsPermissions: (permissions, origins) => new Promise((resolve) => {
            browser.permissions.contains({
                permissions,
                origins,
            }, resolve);
        }),

        /**
         * Requests required permission
         * @param {Array<string>} permissions
         * @param {Array<string>} [origins]
         * @returns {Promise<any>}
         */
        requestPermissions: (permissions, origins) => new Promise((resolve) => {
            browser.permissions.request({
                permissions,
                origins,
            }, resolve);
        }),

        /**
         * Removes unused permissions
         * @param {Array<string>} permissions
         * @param {Array<string>} [origins]
         * @returns {Promise<any>}
         */
        removePermission: (permissions, origins) => new Promise((resolve) => {
            browser.permissions.remove({
                permissions,
                origins,
            }, resolve);
        }),
    };

    api.browser = Utils;
})(adguard, adguard.utils);
