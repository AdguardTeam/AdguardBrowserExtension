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

/* global TextDecoder, TextEncoder, DOMParser */

adguard.contentFiltering = (function (adguard) {

    /**
     * Encapsulates response data filter logic
     * https://mail.mozilla.org/pipermail/dev-addons/2017-April/002729.html
     *
     * @param requestId Request identifier
     * @constructor
     */
    var ContentFilter = function (requestId) {

        this.filter = adguard.webRequest.filterResponseData(requestId);
        this.decoder = new TextDecoder("utf-8");
        this.content = '';
        this.contentDfd = new adguard.utils.Promise();

        this.filter.ondata = function (event) {
            this.content += this.decoder.decode(event.data, {stream: true});
        }.bind(this);

        this.filter.onstop = function () {
            this.content += this.decoder.decode(); // finish stream
            this.contentDfd.resolve(this.content);
        }.bind(this);

        this.filter.onerror = function () {
            this.contentDfd.reject(this.filter.error);
        }.bind(this);

        this.write = function (content) {
            var encoder = new TextEncoder();
            this.filter.write(encoder.encode(content));
            this.filter.close();
        };

        this.getContent = function () {
            return this.contentDfd;
        };
    };

    /**
     * For correctly applying replace or content rules we have to work with the whole response content.
     * This class allows read response fully.
     * See some details here: https://mail.mozilla.org/pipermail/dev-addons/2017-April/002729.html
     *
     * @constructor
     */
    var ResponseContentHandler = function () {

        this.handleResponse = function (requestId, requestUrl, requestType, callback) {

            var contentFilter = new ContentFilter(requestId);

            contentFilter.getContent()
                .then(function (content) {
                    try {
                        content = callback(content);
                    } catch (ex) {
                        adguard.console.error('Error while applying content filter to {0}. Error: {1}', requestUrl, ex);
                    }
                    contentFilter.write(content);
                }, function (error) {
                    adguard.console.error('An error has occurred in content filter for request {0} to {1} - {2}. Error: {3}', requestId, requestUrl, requestType, error);
                });
        };
    };

    var DocumentParser = function () {

        if (typeof DOMParser === 'undefined') {
            adguard.console.info('DOMParser object is not defined');
            this.parse = function () {
                return null;
            };
            return;
        }

        // parser and parsererrorNS could be cached on startup for efficiency
        var parser = new DOMParser();
        var errorneousParse = parser.parseFromString('<', 'text/xml');
        var parsererrorNS = errorneousParse.getElementsByTagName("parsererror")[0].namespaceURI;

        /**
         * Checking for parse errors
         * https://developer.mozilla.org/en-US/docs/Web/API/DOMParser#Error_handling
         * @param parsedDocument
         * @returns true if html cannot parsed
         */
        function isParseError(parsedDocument) {
            if (parsererrorNS === 'http://www.w3.org/1999/xhtml') {
                return parsedDocument.getElementsByTagName("parsererror").length > 0;
            }
            return parsedDocument.getElementsByTagNameNS(parsererrorNS, 'parsererror').length > 0;
        }

        /**
         * Parse html to document
         * @param html HTML content
         * @returns Document
         */
        this.parse = function (html) {
            var doc = parser.parseFromString(html, "text/html");
            if (isParseError(doc)) {
                return null;
            }
            return doc;
        };
    };

    var responseContentHandler = new ResponseContentHandler();
    var documentParser = new DocumentParser();

    /**
     * Contains mask of accepted request types for replace rules
     */
    var replaceRuleAllowedRequestTypeMask = (function () {
        var mask = 0;
        var replaceRuleAllowedRequestTypes = [adguard.RequestTypes.DOCUMENT, adguard.RequestTypes.SUBDOCUMENT, adguard.RequestTypes.SCRIPT, adguard.RequestTypes.STYLESHEET, adguard.RequestTypes.XMLHTTPREQUEST];
        for (var i = 0; i < replaceRuleAllowedRequestTypes.length; i++) {
            var requestType = replaceRuleAllowedRequestTypes[i];
            mask |= adguard.rules.UrlFilterRule.contentTypes[requestType];
        }
        return mask;
    })();

    function isUtf8Charset(contentType) {
        if (!contentType) {
            return true;
        }
        return contentType.toLowerCase().indexOf('utf-8') >= 0;
    }

    /**
     * Contains collection of accepted content types for replace rules
     */
    var replaceRuleAllowedContentTypes = ['text/', 'application/json', 'application/xml', 'application/xhtml+xml', 'application/javascript', 'application/x-javascript'];

    /**
     * Checks if $replace rule should be applied to this request
     * @param requestType Request type
     * @param contentType Content-Type header value
     * @returns {boolean}
     */
    var shouldApplyReplaceRule = function (requestType, contentType) {

        // In case of .features or .features.responseContentFilteringSupported are not defined
        var responseContentFilteringSupported = adguard.prefs.features && adguard.prefs.features.responseContentFilteringSupported;
        if (!responseContentFilteringSupported) {
            return false;
        }

        var requestTypeMask = adguard.rules.UrlFilterRule.contentTypes[requestType];
        if ((requestTypeMask & replaceRuleAllowedRequestTypeMask) === requestTypeMask) {
            return true;
        }

        if (requestType === adguard.RequestTypes.OTHER && contentType) {
            for (var i = 0; i < replaceRuleAllowedContentTypes.length; i++) {
                if (contentType.indexOf(replaceRuleAllowedContentTypes[i]) === 0) {
                    return true;
                }
            }
        }

        return false;
    };

    /**
     * Checks if content filtration rules should by applied to this request
     * @param requestType Request type
     */
    var shouldApplyContentRules = function (requestType) {

        // In case of .features or .features.responseContentFilteringSupported are not defined
        var responseContentFilteringSupported = adguard.prefs.features && adguard.prefs.features.responseContentFilteringSupported;
        if (!responseContentFilteringSupported) {
            return false;
        }

        return requestType === adguard.RequestTypes.DOCUMENT ||
            requestType === adguard.RequestTypes.SUBDOCUMENT;
    };

    /**
     * Applies content and replace rules to the request
     * @param tab Tab
     * @param requestUrl Request URL
     * @param referrerUrl Referrer
     * @param requestType Request type
     * @param requestId Request identifier
     * @param statusCode Request status
     * @param method Request method
     * @param contentType Content-Type header
     */
    var apply = function (tab, requestUrl, referrerUrl, requestType, requestId, statusCode, method, contentType) {

        if (statusCode !== 200) {
            adguard.console.debug('Skipping request to {0} - {1} with status {2}', requestUrl, requestType, statusCode);
            return;
        }

        if (method !== 'GET' && method !== 'POST') {
            adguard.console.debug('Skipping request to {0} - {1} with method {2}', requestUrl, requestType, method);
            return;
        }

        if (!isUtf8Charset(contentType)) {
            adguard.console.debug('Skipping request to {0} - {1} with Content-Type {2}', requestUrl, requestType, contentType);
            return;
        }

        var contentRules = null;
        var replaceRule = null;

        if (shouldApplyContentRules(requestType)) {
            contentRules = adguard.webRequestService.getContentRules(tab, requestUrl);
            if (contentRules && contentRules.length === 0) {
                contentRules = null;
            }
        }

        if (shouldApplyReplaceRule(requestType, contentType)) {
            var requestRule = adguard.webRequestService.getRuleForRequest(tab, requestUrl, referrerUrl, requestType);
            if (requestRule && requestRule.getReplace()) {
                replaceRule = requestRule;
            }
        }

        if (!contentRules && !replaceRule) {
            return;
        }

        responseContentHandler.handleResponse(requestId, requestUrl, requestType, function (content) {

            if (contentRules && contentRules.length > 0) {
                var doc = documentParser.parse(content);
                if (doc !== null) {
                    var elements = adguard.requestFilter.getMatchedElementsForContentRules(doc, contentRules);
                    if (elements) {
                        for (var i = 0; i < elements.length; i++) {
                            var element = elements[i];
                            if (element.parentNode) {
                                element.parentNode.removeChild(element);
                            }
                        }
                        content = doc.documentElement.outerHTML;
                    }
                }
            }

            // response content is over 3MB, ignore it
            if (content.length > 3 * 1024 * 1024) {
                return content;
            }

            if (replaceRule) {
                content = replaceRule.getReplace().apply(content);
            }

            return content;
        });
    };

    return {
        apply: apply
    }

})(adguard);