/**
 * This file is part of Adguard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * Adguard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Adguard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Adguard Browser Extension. If not, see <http://www.gnu.org/licenses/>.
 */

/* eslint-disable camelcase, no-control-regex, max-len */

import punycode from 'punycode';
import { strings } from '../../common/strings';

export const url = (function () {
    const RE_V4 = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|0x[0-9a-f][0-9a-f]?|0[0-7]{3})\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|0x[0-9a-f][0-9a-f]?|0[0-7]{3})$/i;
    const RE_V4_HEX = /^0x([0-9a-f]{8})$/i;
    const RE_V4_NUMERIC = /^[0-9]+$/;
    const RE_V4inV6 = /(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

    const RE_BAD_CHARACTERS = /([^0-9a-f:])/i;
    const RE_BAD_ADDRESS = /([0-9a-f]{5,}|:{3,}|[^:]:$|^:[^:]$)/i;

    /**
     * Helper methods to work with URLs
     */
    const UrlUtils = {

        isHttpRequest(url) {
            return url && url.indexOf('http') === 0;
        },

        isHttpOrWsRequest(url) {
            return url && (url.indexOf('http') === 0 || url.indexOf('ws') === 0);
        },

        toPunyCode(domain) {
            if (!domain) {
                return '';
            }
            if (/^[\x00-\x7F]+$/.test(domain)) {
                return domain;
            }
            return punycode.toASCII(domain);
        },

        /**
         * Retrieves hostname from URL
         */
        getHost(url) {
            if (!url) {
                return null;
            }

            let firstIdx = url.indexOf('//');
            if (firstIdx === -1) {
                /**
                 * It's non hierarchical structured URL (e.g. stun: or turn:)
                 * https://tools.ietf.org/html/rfc4395#section-2.2
                 * https://tools.ietf.org/html/draft-nandakumar-rtcweb-stun-uri-08#appendix-B
                 */
                firstIdx = url.indexOf(':');
                if (firstIdx === -1) {
                    return null;
                }
                firstIdx -= 1;
            }

            const nextSlashIdx = url.indexOf('/', firstIdx + 2);
            const startParamsIdx = url.indexOf('?', firstIdx + 2);

            let lastIdx = nextSlashIdx;
            if (startParamsIdx > 0 && (startParamsIdx < nextSlashIdx || nextSlashIdx < 0)) {
                lastIdx = startParamsIdx;
            }

            let host = lastIdx === -1 ? url.substring(firstIdx + 2) : url.substring(firstIdx + 2, lastIdx);

            const portIndex = host.indexOf(':');

            host = portIndex === -1 ? host : host.substring(0, portIndex);

            // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/1586
            const lastChar = host.charAt(host.length - 1);
            if (lastChar === '.') {
                host = host.slice(0, -1);
            }

            return host;
        },

        getDomainName(url) {
            const host = this.getHost(url);
            return this.getCroppedDomainName(host);
        },

        getCroppedDomainName(host) {
            return strings.startWith(host, 'www.') ? host.substring(4) : host;
        },

        isIpv4(address) {
            if (RE_V4.test(address)) {
                return true;
            }
            if (RE_V4_HEX.test(address)) {
                return true;
            }
            if (RE_V4_NUMERIC.test(address)) {
                return true;
            }
            return false;
        },

        isIpv6(address) {
            let a4addon = 0;
            const address4 = address.match(RE_V4inV6);
            if (address4) {
                const temp4 = address4[0].split('.');
                for (let i = 0; i < 4; i += 1) {
                    if (/^0[0-9]+/.test(temp4[i])) {
                        return false;
                    }
                }
                address = address.replace(RE_V4inV6, '');
                if (/[0-9]$/.test(address)) {
                    return false;
                }

                address += temp4.join(':');
                a4addon = 2;
            }

            if (RE_BAD_CHARACTERS.test(address)) {
                return false;
            }

            if (RE_BAD_ADDRESS.test(address)) {
                return false;
            }

            function count(string, substring) {
                return (string.length - string.replace(new RegExp(substring, 'g'), '').length) / substring.length;
            }

            const halves = count(address, '::');
            if (halves === 1 && count(address, ':') <= 6 + 2 + a4addon) {
                return true;
            }

            if (halves === 0 && count(address, ':') === 7 + a4addon) {
                return true;
            }

            return false;
        },

        urlEquals(u1, u2) {
            if (!u1 || !u2) {
                return false;
            }
            // eslint-disable-next-line prefer-destructuring
            u1 = u1.split(/[#?]/)[0];
            // eslint-disable-next-line prefer-destructuring
            u2 = u2.split(/[#?]/)[0];
            return u1 === u2;
        },
    };

    return UrlUtils;
})();
