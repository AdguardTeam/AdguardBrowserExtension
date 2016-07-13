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

/* global antiBannerService, framesMap, userSettings, UrlUtils */

var stealthService = (function () {

    'use strict';

    var StealthService = function () {

    };

    StealthService.prototype = {

        SEARCH_ENGINES: [
            /https?:\/\/(www\.)?google\./i,
            /https?:\/\/(www\.)?yandex\./i,
            /https?:\/\/(www\.)?bing\./i,
            /https?:\/\/(www\.)?yahoo\./i,
            /https?:\/\/(www\.)?go\.mail\.ru/i,
            /https?:\/\/(www\.)?ask\.com/i,
            /https?:\/\/(www\.)?aol\.com/i,
            /https?:\/\/(www\.)?baidu\.com/i,
            /https?:\/\/(www\.)?seznam\.cz/i
        ],

        LINUX_OS: 'X11; Linux x86_64',

        headers: {
            USER_AGENT: 'User-Agent',
            REFERRER: 'Referer',
            COOKIE: 'Cookie',
            SET_COOKIE: 'Set-Cookie',
            ETAG: 'ETag',
            X_CLIENT_DATA: 'X-Client-Data'
        },

        headerValues: {
            PRAGMA: {
                name: 'Pragma',
                value: 'no-cache'
            },
            DO_NOT_TRACK: {
                name: 'DNT',
                value: '1'
            },
            USER_AGENT: {
                name: 'User-Agent',
                value: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2227.0 Safari/537.36'
            },
            REFERRER: {
                name: 'Referer',
                value: 'https://adguard.com/referrer.html'
            },
            X_FORWARDED_FOR: {
                name: 'X-Forwarded-For',
                value: '192.168.0.0'
            },
            X_REAL_IP: {
                name: 'X-Real-IP',
                value: '192.168.0.0'
            }
        },

        processRequestHeaders: function (requestDetails) {

            var tab = requestDetails.tab;
            var requestUrl = requestDetails.requestUrl;
            var requestType = requestDetails.requestType;

            if (framesMap.isTabWhiteListed(tab) || framesMap.isTabProtectionDisabled(tab)) {
                return;
            }

            var frameData = framesMap.getMainFrame(tab);
            if (!frameData) {
                //frame wasn't recorded in onBeforeRequest event
                return;
            }

            var sourceUrl = frameData.url;
            if (requestUrl === sourceUrl) {
                sourceUrl = this._getHeaderValue(requestDetails.requestHeaders, this.headers.REFERRER);
                frameData.referrerUrl = sourceUrl;
            }

            var whiteListRule = antiBannerService.getRequestFilter().findWhiteListRule(requestUrl, sourceUrl, requestType);
            if (whiteListRule) {
                return;
            }

            var stealthWhiteListRule = antiBannerService.getRequestFilter().findWhiteListRule(requestUrl, sourceUrl, "STEALTH")
                || antiBannerService.getRequestFilter().findWhiteListRule(sourceUrl, sourceUrl, "STEALTH");
            if (stealthWhiteListRule) {
                return;
            }

            if (!requestDetails.requestHeaders) {
                requestDetails.requestHeaders = [];
            }

            var thirdParty = UrlUtils.isThirdPartyRequest(requestUrl, sourceUrl);
            var isMainFrame = requestType === "DOCUMENT";

            // Remove referrer for third-party requests
            var hideReferrer = userSettings.getProperty(userSettings.settings.HIDE_REFERRER);
            if (thirdParty && hideReferrer) {
                this._replaceHeader(requestDetails.requestHeaders, this.headerValues.REFERRER);
            }

            // Hide referrer in case of search engine is referrer
            var hideSearchQueries = userSettings.getProperty(userSettings.settings.HIDE_SEARCH_QUERIES);
            if (hideSearchQueries && isMainFrame && thirdParty && this._isSearchEngine(sourceUrl)) {
                this._replaceHeader(requestDetails.requestHeaders, this.headerValues.REFERRER);
            }

            // Remove cookie header for third-party requests
            var blockCookies = userSettings.getProperty(userSettings.settings.BLOCK_THIRD_PARTY_COOKIES);
            if (thirdParty && blockCookies && !isMainFrame) {
                this._removeHeader(requestDetails.requestHeaders, this.headers.COOKIE);
            }

            // Remove User-Agent header
            var hideUserAgent = userSettings.getProperty(userSettings.settings.HIDE_USER_AGENT);
            if (hideUserAgent) {
                this._replaceUserAgent(requestDetails.requestHeaders);
            }

            // Hide Ip Address
            var hideIpAddress = userSettings.getProperty(userSettings.settings.HIDE_IP_ADDRESS);
            if (hideIpAddress) {
                this._replaceHeader(requestDetails.requestHeaders, this.headerValues.X_FORWARDED_FOR, true);
                this._replaceHeader(requestDetails.requestHeaders, this.headerValues.X_REAL_IP, true);
            }

            // Remove X-Client-Data header
            var blockChromeClientData = userSettings.getProperty(userSettings.settings.BLOCK_CHROME_CLIENT_DATA);
            if (blockChromeClientData) {
                this._removeHeader(requestDetails.requestHeaders, this.headers.X_CLIENT_DATA);
            }

            // Adding Pragma: no-cache header blocks ETag header (which is used for tracking)
            var blockThirdPartyCache = userSettings.getProperty(userSettings.settings.BLOCK_THIRD_PARTY_CACHE);
            if (thirdParty && blockThirdPartyCache && !isMainFrame) {
                requestDetails.requestHeaders.push(this.headerValues.PRAGMA);
            }

            // Adding Do-Not-Track (DNT) header
            var sendDoNotTrack = userSettings.getProperty(userSettings.settings.SEND_DO_NOT_TRACK);
            if (sendDoNotTrack) {
                requestDetails.requestHeaders.push(this.headerValues.DO_NOT_TRACK);
            }

            // this._removeHeader(requestDetails.requestHeaders, 'X-Client-Data');

            return {
                requestHeaders: requestDetails.requestHeaders
            };
        },

        processResponseHeaders: function (requestDetails) {

            var tab = requestDetails.tab;
            var requestUrl = requestDetails.requestUrl;
            var requestType = requestDetails.requestType;

            if (framesMap.isTabWhiteListed(tab) || framesMap.isTabProtectionDisabled(tab)) {
                return;
            }

            var frameData = framesMap.getMainFrame(tab);
            if (!frameData) {
                //frame wasn't recorded in onBeforeRequest event
                return;
            }

            var sourceUrl = frameData.url;
            if (requestUrl === sourceUrl) {
                sourceUrl = frameData.referrerUrl;
            }

            var whiteListRule = antiBannerService.getRequestFilter().findWhiteListRule(requestUrl, sourceUrl, requestType);
            if (whiteListRule) {
                return;
            }

            var thirdParty = UrlUtils.isThirdPartyRequest(requestUrl, sourceUrl);
            var isMainFrame = requestType === "DOCUMENT";

            // Remove cookie header for third-party requests
            var blockCookies = userSettings.getProperty(userSettings.settings.BLOCK_THIRD_PARTY_COOKIES);
            if (thirdParty && blockCookies && !isMainFrame) {
                this._removeHeader(requestDetails.responseHeaders, this.headers.SET_COOKIE);
                this._removeHeader(requestDetails.responseHeaders, this.headers.ETAG);
            }

            return {
                responseHeaders: requestDetails.responseHeaders
            };
        },

        _getHeaderValue: function (headers, headerName) {
            if (!headers) {
                return '';
            }

            for (var i = 0; i < headers.length; i++) {
                if (headers[i].name === headerName) {
                    return headers[i].value;
                }
            }

            return '';
        },

        _removeHeader: function (headers, headerName) {
            if (headers) {
                for (var i = headers.length - 1; i >= 0; i--) {
                    if (headers[i].name === headerName) {
                        headers.splice(i, 1);
                    }
                }
            }
        },

        _replaceHeader: function (headers, header, appendIfNotExist) {
            var headerFound = false;
            for (var i = 0; i < headers.length; i++) {
                if (headers[i].name === header.name) {
                    headers[i] = header;
                    headerFound = true;
                }
            }
            if (!headerFound && appendIfNotExist) {
                headers.push(header);
            }
        },

        _replaceUserAgent: function (headers) {
            if (!headers) {
                return;
            }
            for (var i = 0; i < headers.length; i++) {
                if (headers[i].name === this.headers.USER_AGENT) {
                    var headerValue = headers[i].value;
                    if (!headerValue) {
                        return;
                    }
                    var index1 = headerValue.indexOf('(');
                    if (index1 < 0) {
                        headers[i] = this.headerValues.USER_AGENT;
                        return;
                    }
                    var index2 = headerValue.indexOf(')', index1);
                    if (index2 < 0) {
                        headers[i] = this.headerValues.USER_AGENT;
                        return;
                    }
                    headers[i].value = headerValue.substring(0, index1 + 1) + this.LINUX_OS + headerValue.substring(index2);
                }
            }
        },

        _isSearchEngine: function (url) {
            if (!url) {
                return false;
            }

            for (var i = 0; i < this.SEARCH_ENGINES.length; i++) {
                if (this.SEARCH_ENGINES[i].test(url)) {
                    return true;
                }
            }

            return false;
        }
    };

    return new StealthService();

})();