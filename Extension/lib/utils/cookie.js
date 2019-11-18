/* eslint-disable prefer-template */
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
 * Helper methods for parsing and extracting browser cookies from headers (both Set-Cookie and Cookie).
 *
 * This API is exposed via adguard.utils.cookie:
 *
 * - parseCookie    Parses "Cookie" header value and returns all the cookie key-pairs
 * - parseSetCookie Parses "Set-Cookie" header value and returns the key-pairs
 * - serialize      Serializes cookie object into a set-cookie value
 *
 * Heavily inspired by https://github.com/nfriedly/set-cookie-parser and https://github.com/jshttp/cookie
 */
(function (adguard) {
    /**
     * RegExp to match field-content in RFC 7230 sec 3.2
     *
     * field-content = field-vchar [ 1*( SP / HTAB ) field-vchar ]
     * field-vchar   = VCHAR / obs-text
     * obs-text      = %x80-FF
     */
    // eslint-disable-next-line no-control-regex
    const FIELD_CONTENT_REGEX = /^[\u0009\u0020-\u007e\u0080-\u00ff]+$/;

    /**
     * @typedef {object} Cookie
     * @property {string} name Cookie name
     * @property {string} value Cookie value
     * @property {string} path Cookie path (string or undefined)
     * @property {string} domain Domain for the cookie (string or undefined,
     *                           may begin with "." to indicate the named domain or any subdomain of it)
     * @property {Date} expires Absolute expiration date for the cookie (Date object or undefined)
     * @property {number} maxAge relative max age of the cookie in seconds from when the client
     *                           receives it (integer or undefined)
     * @property {boolean} secure indicates that this cookie should only be sent over HTTPs (true or undefined)
     * @property {boolean} httpOnly indicates that this cookie should not be accessible to client-side
     *                              JavaScript (true or undefined)
     * @property {string} sameSite indicates a cookie ought not to be sent along with cross-site requests
     *                             (string or undefined)
     */

    /**
     * Parse an HTTP Cookie header string and return an object with all cookie name-value pairs.
     *
     * @param {string} cookieValue HTTP Cookie value
     * @returns {Array.<{ name: String, value: String }>} Array of cookie name-value pairs
     * @public
     */
    function parseCookie(cookieValue) {
        if (adguard.utils.strings.isEmpty(cookieValue)) {
            return null;
        }

        // Prepare the array to return
        const cookies = [];

        // Split Cookie values
        const pairs = cookieValue.split(/; */);

        for (let i = 0; i < pairs.length; i += 1) {
            const pair = pairs[i];
            const eqIdx = pair.indexOf('=');

            // skip things that don't look like key=value
            if (eqIdx < 0) {
                continue;
            }

            const key = pair.substr(0, eqIdx).trim();
            const value = pair.substr(eqIdx + 1, pair.length).trim();

            cookies.push({
                name: key,
                value,
            });
        }

        return cookies;
    }

    /**
     * Parses "Set-Cookie" header value and returns a cookie object with its properties
     *
     * @param {string} setCookieValue "Set-Cookie" header value to parse
     * @returns {Cookie} cookie object or null if it failed to parse the value
     * @public
     */
    function parseSetCookie(setCookieValue) {
        if (adguard.utils.strings.isEmpty(setCookieValue)) {
            return null;
        }

        const parts = setCookieValue.split(';').filter(s => !adguard.utils.strings.isEmpty(s));
        const nameValuePart = parts.shift();
        const nameValue = nameValuePart.split('=');
        const name = nameValue.shift();
        // everything after the first =, joined by a "=" if there was more than one part
        const value = nameValue.join('=');
        const cookie = {
            name, // grab everything before the first =
            value,
        };

        parts.forEach((part) => {
            const sides = part.split('=');
            const key = sides
                .shift()
                .trimLeft()
                .toLowerCase();
            const optionValue = sides.join('=');
            if (key === 'expires') {
                cookie.expires = new Date(optionValue);
            } else if (key === 'max-age') {
                cookie.maxAge = parseInt(optionValue, 10);
            } else if (key === 'secure') {
                cookie.secure = true;
            } else if (key === 'httponly') {
                cookie.httpOnly = true;
            } else if (key === 'samesite') {
                cookie.sameSite = optionValue;
            } else {
                // other keys
                cookie[key] = optionValue;
            }
        });

        return cookie;
    }

    /**
     * Serializes cookie data into a string suitable for Set-Cookie header.
     *
     * @param {Cookie} cookie A cookie object
     * @return {string} Set-Cookie string or null if it failed to serialize object
     * @throws {TypeError} Thrown in case of invalid input data
     * @public
     */
    function serialize(cookie) {
        if (!cookie) {
            throw new TypeError('empty cookie data');
        }

        // 1. Validate fields
        if (!FIELD_CONTENT_REGEX.test(cookie.name)) {
            throw new TypeError(`Cookie name is invalid: ${cookie.name}`);
        }
        if (cookie.value && !FIELD_CONTENT_REGEX.test(cookie.value)) {
            throw new TypeError(`Cookie value is invalid: ${cookie.value}`);
        }
        if (cookie.domain && !FIELD_CONTENT_REGEX.test(cookie.domain)) {
            throw new TypeError(`Cookie domain is invalid: ${cookie.domain}`);
        }
        if (cookie.path && !FIELD_CONTENT_REGEX.test(cookie.path)) {
            throw new TypeError(`Cookie path is invalid: ${cookie.path}`);
        }
        if (cookie.expires && typeof cookie.expires.toUTCString !== 'function') {
            throw new TypeError(`Cookie expires is invalid: ${cookie.expires}`);
        }

        // 2. Build Set-Cookie header value
        let setCookieValue = cookie.name + '=' + cookie.value;

        if (typeof cookie.maxAge === 'number' && !Number.isNaN(cookie.maxAge)) {
            setCookieValue += '; Max-Age=' + Math.floor(cookie.maxAge);
        }
        if (cookie.domain) {
            setCookieValue += '; Domain=' + cookie.domain;
        }
        if (cookie.path) {
            setCookieValue += '; Path=' + cookie.path;
        }
        if (cookie.expires) {
            setCookieValue += '; Expires=' + cookie.expires.toUTCString();
        }
        if (cookie.httpOnly) {
            setCookieValue += '; HttpOnly';
        }
        if (cookie.secure) {
            setCookieValue += '; Secure';
        }
        if (!adguard.utils.strings.isEmpty(cookie.sameSite)) {
            const sameSite = cookie.sameSite.toLowerCase();

            switch (sameSite) {
                case 'lax':
                    setCookieValue += '; SameSite=Lax';
                    break;
                case 'strict':
                    setCookieValue += '; SameSite=Strict';
                    break;
                case 'none':
                    setCookieValue += '; SameSite=None';
                    break;
                default:
                    throw new TypeError(`Cookie sameSite is invalid: ${cookie.sameSite}`);
            }
        }

        // Don't affected. Let it be here just in case
        // https://bugs.chromium.org/p/chromium/issues/detail?id=232693
        if (cookie.priority) {
            setCookieValue += `; Priority=${cookie.priority}`;
        }

        return setCookieValue;
    }

    // EXPOSE
    adguard.utils.cookie = {
        parseCookie,
        parseSetCookie,
        serialize,
    };
})(adguard);
