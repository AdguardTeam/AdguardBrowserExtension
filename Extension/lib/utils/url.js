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

(function (api, global) {
    const RE_V4 = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|0x[0-9a-f][0-9a-f]?|0[0-7]{3})\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|0x[0-9a-f][0-9a-f]?|0[0-7]{3})$/i;
    const RE_V4_HEX = /^0x([0-9a-f]{8})$/i;
    const RE_V4_NUMERIC = /^[0-9]+$/;
    const RE_V4inV6 = /(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

    const RE_BAD_CHARACTERS = /([^0-9a-f:])/i;
    const RE_BAD_ADDRESS = /([0-9a-f]{5,}|:{3,}|[^:]:$|^:[^:]$)/i;

    // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/1010
    const RESERVED_DOMAINS = api.publicSuffixes;

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
            return global.punycode.toASCII(domain);
        },

        isThirdPartyRequest(requestUrl, referrer) {
            const domainName = this._get2NdLevelDomainName(requestUrl);
            const refDomainName = this._get2NdLevelDomainName(referrer);
            return domainName != refDomainName;
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
            return api.strings.startWith(host, 'www.') ? host.substring(4) : host;
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
                for (let i = 0; i < 4; i++) {
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
            if (halves == 1 && count(address, ':') <= 6 + 2 + a4addon) {
                return true;
            }

            if (halves == 0 && count(address, ':') == 7 + a4addon) {
                return true;
            }

            return false;
        },

        urlEquals(u1, u2) {
            if (!u1 || !u2) {
                return false;
            }
            u1 = u1.split(/[#?]/)[0];
            u2 = u2.split(/[#?]/)[0];
            return u1 == u2;
        },

        /**
         * Checks all domains from domainNames with isDomainOrSubDomain
         * @param domainNameToCheck Domain name to check
         * @param domainNames List of domain names
         * @returns boolean true if there is suitable domain in domainNames
         */
        isDomainOrSubDomainOfAny(domainNameToCheck, domainNames) {
            if (!domainNames || domainNames.length === 0) {
                return false;
            }

            for (let i = 0; i < domainNames.length; i += 1) {
                if (this.isDomainOrSubDomain(domainNameToCheck, domainNames[i])) {
                    return true;
                }
            }

            return false;
        },

        /**
         * Checks if the specified domain is a sub-domain of equal to domainName
         *
         * @param domainNameToCheck Domain name to check
         * @param domainName        Domain name
         * @returns boolean true if there is suitable domain in domainNames
         */
        isDomainOrSubDomain: (function () {
            /**
             * Extract from domain name tld if exists
             *
             * @param {string} domainName
             * @returns {string} string is empty if tld doesn't exist
             */
            function extractTld(domainName) {
                let guess = domainName;
                let dotIndex = guess.indexOf('.');
                while (dotIndex >= 0) {
                    if (guess in RESERVED_DOMAINS) {
                        return guess;
                    }
                    guess = guess.slice(dotIndex + 1, guess.length);
                    dotIndex = guess.indexOf('.');
                }
                if (guess in RESERVED_DOMAINS) {
                    return guess;
                }
                return '';
            }

            /**
             * Generates from domain tld wildcard e.g. google.com -> google.* ; youtube.co.uk -> youtube.*
             *
             * @param {string} domainName
             * @returns {string} string is empty if tld for provided domain name doesn't exists
             */
            function genTldWildcard(domainName) {
                const tld = extractTld(domainName);
                if (tld) {
                    return `${domainName.slice(0, domainName.indexOf(`.${tld}`))}.*`;
                }
                return '';
            }

            function matchAsWildcard(wildcard, domainNameToCheck) {
                const wildcardedDomainToCheck = genTldWildcard(domainNameToCheck);
                if (wildcardedDomainToCheck) {
                    return wildcardedDomainToCheck === wildcard
                        || api.strings.endsWith(wildcardedDomainToCheck, wildcard)
                        && api.strings.endsWith(wildcardedDomainToCheck, `.${wildcard}`);
                }
                return false;
            }

            function isWildcardDomain(domainName) {
                return api.strings.endsWith(domainName, '.*');
            }

            return function (domainNameToCheck, domainName) {
                // Checks if domain name from rule is tld wildcard
                // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/571
                if (isWildcardDomain(domainName)) {
                    return matchAsWildcard(domainName, domainNameToCheck);
                }
                // Double endsWith check is memory optimization
                // Works in android, not sure if it makes sense here
                return domainName == domainNameToCheck
                    || api.strings.endsWith(domainNameToCheck, domainName)
                    && api.strings.endsWith(domainNameToCheck, `.${domainName}`);
            };
        })(),

        _get2NdLevelDomainName(url) {
            const host = this.getHost(url);

            if (!host) {
                return null;
            }

            const parts = host.split('.');
            if (parts.length <= 2) {
                return host;
            }

            const twoPartDomain = `${parts[parts.length - 2]}.${parts[parts.length - 1]}`;
            const isContainsTwoLvlPostfix = (twoPartDomain in RESERVED_DOMAINS);

            const threePartDomain = `${parts[parts.length - 3]}.${twoPartDomain}`;
            if (parts.length == 3 && isContainsTwoLvlPostfix) {
                return threePartDomain;
            }
            if (threePartDomain in RESERVED_DOMAINS) {
                if (parts.length == 3) {
                    return threePartDomain;
                }
                return `${parts[parts.length - 4]}.${threePartDomain}`;
            }

            return isContainsTwoLvlPostfix ? threePartDomain : twoPartDomain;
        },

        /**
         * Removes query params from url by regexp
         *
         * @param {string} url
         * @param {RegExp} regExp
         * @param invert remove every parameter in url except the ones matched regexp
         */
        cleanUrlParamByRegExp(url, regExp, invert = false) {
            const searchIndex = url.indexOf('?');

            // If no params, nothing to modify
            if (searchIndex === -1) {
                return url;
            }

            const urlPieces = [url.slice(0, searchIndex), url.slice(searchIndex + 1)];

            if (invert) {
                urlPieces[1] = urlPieces[1]
                    .split('&')
                    .filter(x => x)
                    .filter(x => x && x.match(regExp))
                    .join('&');
            } else {
                urlPieces[1] = urlPieces[1]
                    .split('&')
                    .filter(x => x)
                    .filter((x) => {
                        const test = x.includes('=') ? x : `${x}=`;
                        return !test.match(regExp);
                    })
                    .join('&');
            }

            // Cleanup empty params (p0=0&=2&=3)
            urlPieces[1] = urlPieces[1]
                .split('&')
                .filter(x => x && !x.startsWith('='))
                .join('&');

            // If we've collapsed the URL to the point where there's an '&' against the '?'
            // then we need to get rid of that.
            while (urlPieces[1].charAt(0) === '&') {
                urlPieces[1] = urlPieces[1].substr(1);
            }

            return urlPieces[1] ? urlPieces.join('?') : urlPieces[0];
        },

        /**
         * Removes query params from url by array of params
         *
         * @param {string} url
         * @param {string[]} params
         * @param invert if true removes all query parameters with the name different from param
         */
        cleanUrlParam(url, params, invert = false) {
            const trackingParametersRegExp = new RegExp(`((^|&)(${params.join('|')})=[^&#]*)`, 'g');
            return this.cleanUrlParamByRegExp(url, trackingParametersRegExp, invert);
        },
    };

    api.url = UrlUtils;
})(adguard.utils, window);
