/**
 * @file
 * This file is part of AdGuard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * AdGuard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * AdGuard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with AdGuard Browser Extension. If not, see <http://www.gnu.org/licenses/>.
 */
import punycode from 'punycode';

/**
 * Helper class to work with URLs
 */
export class UrlUtils {
    // eslint-disable-next-line max-len
    static RE_V4 = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|0x[0-9a-f][0-9a-f]?|0[0-7]{3})\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|0x[0-9a-f][0-9a-f]?|0[0-7]{3})$/i;

    static RE_V4_HEX = /^0x([0-9a-f]{8})$/i;

    static RE_V4_NUMERIC = /^[0-9]+$/;

    static RE_V4_IN_V6 = /(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

    static RE_BAD_CHARACTERS = /([^0-9a-f:])/i;

    static RE_BAD_ADDRESS = /([0-9a-f]{5,}|:{3,}|[^:]:$|^:[^:]$)/i;

    static toPunyCode(domain: string): string {
        // eslint-disable-next-line no-control-regex
        if (/^[\x00-\x7F]+$/.test(domain)) {
            return domain;
        }
        return punycode.toASCII(domain);
    }

    static getHost(url: string): string | null {
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
        const lastChar = host.charAt(host.length - 1);
        if (lastChar === '.') {
            host = host.slice(0, -1);
        }

        return host;
    }

    static getDomainName(url: string): string | null {
        const host = UrlUtils.getHost(url);

        if (!host) {
            return null;
        }

        return UrlUtils.getCroppedDomainName(host);
    }

    static getCroppedDomainName(host: string): string {
        return host.indexOf('www.') === 0 ? host.substring(4) : host;
    }

    static isIpv4(address: string): boolean {
        if (UrlUtils.RE_V4.test(address)) {
            return true;
        }
        if (UrlUtils.RE_V4_HEX.test(address)) {
            return true;
        }
        if (UrlUtils.RE_V4_NUMERIC.test(address)) {
            return true;
        }
        return false;
    }

    static isIpv6(address: string): boolean {
        let a4addon = 0;
        const address4 = address.match(UrlUtils.RE_V4_IN_V6)?.[0];
        if (address4) {
            const temp4 = address4.split('.');
            for (let i = 0; i < 4; i += 1) {
                const part = temp4[i];
                if (part && /^0[0-9]+/.test(part)) {
                    return false;
                }
            }
            address = address.replace(UrlUtils.RE_V4_IN_V6, '');
            if (/[0-9]$/.test(address)) {
                return false;
            }

            address += temp4.join(':');
            a4addon = 2;
        }

        if (UrlUtils.RE_BAD_CHARACTERS.test(address)) {
            return false;
        }

        if (UrlUtils.RE_BAD_ADDRESS.test(address)) {
            return false;
        }

        const count = (string: string, substring: string): number => {
            return (string.length - string.replace(new RegExp(substring, 'g'), '').length) / substring.length;
        };

        const halves = count(address, '::');
        if (halves === 1 && count(address, ':') <= 6 + 2 + a4addon) {
            return true;
        }

        if (halves === 0 && count(address, ':') === 7 + a4addon) {
            return true;
        }

        return false;
    }
}
