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
(function (api) {

    function isNonEmptyString(str) {
        return typeof str === "string" && !!str.trim();
    }

    /**
     * Parses "Set-Cookie" header value and returns a cookie object with its properties
     * 
     * @param {string} setCookieValue "Set-Cookie" header value to parse
     */
    function parseSetCookie(setCookieValue) {
        const parts = setCookieValue.split(";").filter(isNonEmptyString);
        const nameValue = parts.shift().split("=");
        const name = nameValue.shift();
        const value = nameValue.join("="); // everything after the first =, joined by a "=" if there was more than one part
        const cookie = {
            name: name, // grab everything before the first =
            value: value
        };

        parts.forEach((part) => {
            const sides = part.split("=");
            const key = sides
                .shift()
                .trimLeft()
                .toLowerCase();
            const optionValue = sides.join("=");
            if (key === "expires") {
                cookie.expires = new Date(optionValue);
            } else if (key === "max-age") {
                cookie.maxAge = parseInt(optionValue, 10);
            } else if (key === "secure") {
                cookie.secure = true;
            } else if (key === "httponly") {
                cookie.httpOnly = true;
            } else if (key === "samesite") {
                cookie.sameSite = optionValue;
            } else {
                // other keys
                cookie[key] = optionValue;
            }
        });

        return cookie;
    }


    adguard.utils.cookie = {

        parseCookie: function () { },
        parseSetCookie: parseSetCookie,
        serialize: function () { },
    };
})(adguard.utils);