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

    var DEFAULT_CHARSET = 'utf-8';
    var LATIN_1 = 'iso-8859-1';
    var SUPPORTED_CHARSETS = [DEFAULT_CHARSET, 'windows-1251', 'windows-1252', LATIN_1];

    /**
     * Encapsulates response data filter logic
     * https://mail.mozilla.org/pipermail/dev-addons/2017-April/002729.html
     *
     * @param requestId Request identifier
     * @param charset encoding
     * @constructor
     */
    var ContentFilter = function (requestId, requestType, charset) {

        this.filter = adguard.webRequest.filterResponseData(requestId);
        this.requestType = requestType;

        this.content = '';
        this.contentDfd = new adguard.utils.Promise();

        this.initEncoders = () => {
            let set = this.charset ? this.charset : DEFAULT_CHARSET;

            // Redefining it as TextDecoder does not understand the iso- name
            if (set === LATIN_1) {
                set = 'windows-1252';
            }

            this.decoder = new TextDecoder(set);
            if (set === DEFAULT_CHARSET) {
                this.encoder = new TextEncoder();
            } else {
                this.encoder = new TextEncoder(set, { NONSTANDARD_allowLegacyEncoding: true });
            }
        };

        this.charset = charset;
        this.initEncoders();

        this.filter.ondata = (event) => {
            if (!this.charset) {
                try {
                    var charset;
                    /**
                     * If this.charset is undefined and requestType is DOCUMENT or SUBDOCUMENT, we try
                     * to detect charset from page <meta> tags
                     */
                    if (this.requestType === adguard.RequestTypes.DOCUMENT ||
                        this.requestType === adguard.RequestTypes.SUBDOCUMENT) {
                        charset = this.parseCharset(event.data);
                    }
                    /**
                     * If we fail to find charset from meta tags we set charset to 'iso-8859-1',
                     * because this charset allows to decode and encode data without errors
                     */
                    if (!charset) {
                        charset = LATIN_1;
                    }
                    if (charset && SUPPORTED_CHARSETS.indexOf(charset) >= 0) {
                        this.charset = charset;
                        this.initEncoders();
                        this.content += this.decoder.decode(event.data, {stream: true});
                    } else {
                        // Charset is not supported
                        this.disconnect(event.data);
                    }
                } catch (e) {
                    adguard.console.warn(e);
                    // on error we disconnect the filter from the request
                    this.disconnect(event.data);
                }
            } else {
                this.content += this.decoder.decode(event.data, {stream: true});
            }
        };

        this.filter.onstop = () => {
            this.content += this.decoder.decode(); // finish stream
            this.contentDfd.resolve(this.content);
        };

        this.filter.onerror = () => {
            this.contentDfd.reject(this.filter.error);
        };

        this.disconnect = (data) => {
            this.filter.write(data);
            this.filter.disconnect();

            this.contentDfd.resolve(null);
        };

        this.write = function (content) {
            this.filter.write(this.encoder.encode(content));
            this.filter.close();
        };

        this.getContent = function () {
            return this.contentDfd;
        };

        /**
         * Parses charset from data, looking for:
         * <meta charset="utf-8" />
         * <meta http-equiv="Content-type" content="text/html; charset=utf-8" />
         *
         * @param data
         * @returns {*}
         */
        this.parseCharset = function (data) {
            var decoded = new TextDecoder('utf-8').decode(data).toLowerCase();
            var match = /<meta\s*charset\s*=\s*['"](.*?)['"]/.exec(decoded);
            if (match && match.length > 1) {
                return match[1].trim().toLowerCase();
            }

            match = /<meta\s*http-equiv\s*=\s*['"]?content-type['"]?\s*content\s*=\s*[\\]?['"]text\/html;\s*charset=(.*?)[\\]?['"]/.exec(decoded);
            if (match && match.length > 1) {
                return match[1].trim().toLowerCase();
            }

            return null;
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

        this.handleResponse = function (requestId, requestUrl, requestType, charset, callback) {

            var contentFilter = new ContentFilter(requestId, requestType, charset);

            contentFilter.getContent()
                .then(function (content) {
                    if (!content) {
                        return;
                    }

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

    /**
     * Parses charset from content-type header
     *
     * @param contentType
     * @returns {*}
     */
    var parseCharsetFromHeader = function (contentType) {
        if (!contentType) {
            return null;
        }

        contentType = contentType.toLowerCase();
        var match = /charset=(.*?)$/.exec(contentType);
        if (match && match.length > 1) {
            return match[1].toLowerCase();
        }

        return null;
    };

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
     * Applies content rules to the document.
     * If document wasn't modified then method will return null
     * @param tab Tab
     * @param frameUrl Frame URL
     * @param requestType Request type
     * @param doc Document
     * @param rules Content rules
     * @returns null or document html
     */
    function applyContentRules(tab, frameUrl, requestType, doc, rules) {
        var deleted = [];

        for (var i = 0; i < rules.length; i++) {
            var rule = rules[i];
            var elements = rule.getMatchedElements(doc);
            if (elements) {
                for (var j = 0; j < elements.length; j++) {
                    var element = elements[j];
                    if (element.parentNode && deleted.indexOf(element) < 0) {
                        element.parentNode.removeChild(element);
                        adguard.filteringLog.addCosmeticEvent(tab, element, frameUrl, requestType, rule);
                        deleted.push(element);
                    }
                }
            }
        }

        // Add <!DOCTYPE html ... >
        // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/959
        // XMLSerializer is used to serialize doctype object
        var doctype = doc.doctype ? new XMLSerializer().serializeToString(doc.doctype) + "\r\n" : "";
        return deleted.length > 0 ? doctype + doc.documentElement.outerHTML : null;
    }

    function applyReplaceRules(content, replaceRules) {
        let modifiedContent = content;
        for (let i = 0; i < replaceRules.length; i += 1) {
            const replaceRule = replaceRules[i];
            const replaceOption = replaceRule.replaceOption;
            modifiedContent = replaceOption.apply(modifiedContent);
        }

        if (modifiedContent) {
            content = modifiedContent;
        }

        // TODO use this methods when rule will be applied
        // TODO how applied rules will be displayed in the filtering log
        // adguard.filteringLog.bindRuleToHttpRequestEvent(tab, requestRule, requestUrl, requestId);
        // adguard.webRequestService.recordRuleHit(tab, replaceRule, requestUrl);

        return content;
    }

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

        var charset = parseCharsetFromHeader(contentType);
        if (charset && SUPPORTED_CHARSETS.indexOf(charset) < 0) {
            // Charset is detected and it is not supported
            adguard.console.warn('Skipping request to {0} - {1} with Content-Type {2}', requestUrl, requestType, contentType);
            return;
        }

        let contentRules = null;
        let replaceRules = null;

        if (shouldApplyContentRules(requestType)) {
            contentRules = adguard.webRequestService.getContentRules(tab, requestUrl);
            if (contentRules && contentRules.length === 0) {
                contentRules = null;
            }
        }

        if (shouldApplyReplaceRule(requestType, contentType)) {
            replaceRules = adguard.webRequestService.getReplaceRules(tab, requestUrl, referrerUrl, requestType);
            if (replaceRules && replaceRules.length === 0) {
                replaceRules = null;
            }
        }

        if (!contentRules && !replaceRules) {
            return;
        }

        responseContentHandler.handleResponse(requestId, requestUrl, requestType, charset, function (content) {

            if (!content) {
                return content;
            }

            if (contentRules && contentRules.length > 0) {
                var doc = documentParser.parse(content);
                if (doc !== null) {
                    var modified = applyContentRules(tab, referrerUrl, requestType, doc, contentRules);
                    if (modified !== null) {
                        content = modified;
                    }
                }
            }

            // response content is over 3MB, ignore it
            if (content.length > 3 * 1024 * 1024) {
                return content;
            }

            if (replaceRules) {
                const modifiedContent = applyReplaceRules(content, replaceRules);
                if (modifiedContent !== null) {
                    content = modifiedContent;
                }
            }

            return content;
        });
    };

    return {
        apply: apply
    };

})(adguard);
