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
 * Module for managing requests context.
 *
 * Each request has a context with unique key: pair of requestId and requestUrl (for handling redirects and auth requests)
 * Context contains information about this request: id, url, referrer, type, applied rules, original and modified headers
 *
 * This API is exposed via adguard.requestContextStorage:
 *
 * - get - Get context by key
 * - record - Initialize context for request (uses in onBeforeRequest)
 * - update - Updates context properties (headers, rules)
 * - bindContentRule - Binds content rule and removed element to the context
 * - onContentModificationStarted - Must be called to point that content modification is started
 *   Following 2 methods have same logic (push rules to log, record rule hits and perform cleanup), but called in different cases:
 * - onRequestCompleted - Finishes request processing on request complete/error event.
 * - onContentModificationFinished - After content modification and applying all rules (replace and content)
 */
(function (adguard) {

    /**
     * @typedef {object} RequestContext
     * @property {string} requestId - Request identifier
     * @property {string} requestUrl - Request url
     * @property {string} referrerUrl - Request referrer url
     * @property {string} requestType - Request type
     * @property {{tabId: Number}} tab - Request tab
     * @property {Array} requestHeaders - Original request headers
     * @property {Array} modifiedRequestHeaders - Modified request headers
     * @property {Array} responseHeaders - Original response headers
     * @property {Array} modifiedResponseHeaders - Modified response headers
     * @property {object} requestRule - Request rule
     * @property {object} replaceRule - Replace rule
     * @property {Array} contentRules - Content rules
     * @property {Array} cspRules CSP - rules
     * @property {number} requestState - Is request between onBeforeRequest and onCompleted/onErrorOccurred events
     * @property {number} contentModifyingState - Is content modification started
     * @property {Map<object, string[]>} elements - Content rules attached elements
     */

    /**
     * @typedef {object} States
     * @property {number} NONE - Ready for cleanup (not started or already finished and processed)
     * @property {number} PROCESSING - In progress
     * @property {number} DONE - Finished, ready for processing. Next transition to NONE and cleanup
     */
    const States = {
        NONE: 1,
        PROCESSING: 2,
        DONE: 3
    };

    /**
     * Collects context
     * @type {Map<string, RequestContext>}
     */
    const contexts = new Map();

    /**
     * Constructs unique request context key
     * @param {string} requestId Request identifier
     * @param {string} requestUrl Request url
     * @returns {string} Request context key
     */
    const constructKey = (requestId, requestUrl) => {
        return requestId + '_' + requestUrl;
    };

    /**
     * Append rules to the current rules
     * @param {Array} original - Original value
     * @param {Array}toAppend - Value to append
     * @returns {Array} concatenated value
     */
    const appendRules = (original, toAppend) => {
        if (toAppend) {
            original = (original || []).concat(toAppend);
        }
        return original;
    };

    /**
     * Gets request context
     * @param {string} requestId Request identifier
     * @param {string} requestUrl Request url
     */
    const get = (requestId, requestUrl) => {
        const key = constructKey(requestId, requestUrl);
        return contexts.get(key);
    };

    /**
     * Records request context
     *
     * @param {string} requestId Request identifier
     * @param {string} requestUrl Request url
     * @param {string} referrerUrl Request referrer url
     * @param {string} requestType Request type
     * @param {object} tab Request tab
     */
    const record = (requestId, requestUrl, referrerUrl, requestType, tab) => {

        const key = constructKey(requestId, requestUrl);
        const context = {
            requestId, requestUrl, referrerUrl, requestType, tab,
            requestState: States.PROCESSING,
            contentModifyingState: States.NONE
        };
        contexts.set(key, context);

        adguard.filteringLog.addHttpRequestEvent(tab, requestUrl, referrerUrl, requestType, null, requestId);
    };

    /**
     * Updates request context
     * @param {string} requestId Request identifier
     * @param {string} requestUrl Request url
     * @param {RequestContext} update
     */
    const update = (requestId, requestUrl, update) => {

        const key = constructKey(requestId, requestUrl);
        const context = contexts.get(key);

        if (!context) {
            return;
        }

        // Updates request lifecycle
        if ('requestState' in update) {
            context.requestState = update.requestState;
        }
        if ('contentModifyingState' in update) {
            context.contentModifyingState = update.contentModifyingState;
        }

        // Updates rules for request
        if ('requestRule' in update) {
            context.requestRule = update.requestRule;
        }
        if ('replaceRule' in update) {
            context.replaceRule = update.replaceRule;
        }
        context.cspRules = appendRules(context.cspRules, update.cspRules);

        if ('requestHeaders' in update) {
            context.requestHeaders = update.requestHeaders;
        }
        if ('responseHeaders' in update) {
            context.responseHeaders = update.responseHeaders;
        }
        //TODO: add request/response headers updates

    };

    /**
     * Binds content rule with serialized element to the request
     *
     * @param {string} requestId Request identifier
     * @param {string} requestUrl Request url
     * @param {object} rule Content rule
     * @param {object} elementHtml Serialized HTML element
     */
    const bindContentRule = (requestId, requestUrl, rule, elementHtml) => {

        const key = constructKey(requestId, requestUrl);
        const context = contexts.get(key);

        if (!context) {
            return;
        }

        context.contentRules = appendRules(context.contentRules, [rule]);
        if (!context.elements) {
            context.elements = new Map();
        }

        let ruleElements = context.elements.get(rule);
        if (!ruleElements) {
            ruleElements = [];
            context.elements.set(rule, ruleElements);
        }
        ruleElements.push(elementHtml);
    };

    /**
     * Finishes request processing
     *
     * Invoked in the following cases:
     * 1) on complete/error event for request
     * 2) on content modification finished
     *
     * In case of content modification don't forget to call onContentModificationStarted method
     * to prevent removing context for complete/error event for request
     *
     * @param {string} requestId Request identifier
     * @param {string} requestUrl Request url
     */
    const remove = (requestId, requestUrl) => {

        const key = constructKey(requestId, requestUrl);
        const context = contexts.get(key);

        if (!context) {
            return;
        }

        const tab = context.tab;
        const referrerUrl = context.referrerUrl;

        let ruleHitsRecords = [];

        if (context.requestState === States.DONE) {

            context.requestState = States.NONE;

            if (context.requestRule) {
                adguard.filteringLog.bindRuleToHttpRequestEvent(tab, context.requestRule, requestUrl, requestId);
                ruleHitsRecords.push(context.requestRule);
            }

            if (context.cspRules) {
                for (let cspRule of context.cspRules) {
                    adguard.filteringLog.addHttpRequestEvent(tab, requestUrl, referrerUrl, adguard.RequestTypes.CSP, cspRule);
                }
                ruleHitsRecords = ruleHitsRecords.concat(context.cspRules);
            }
        }

        if (context.contentModifyingState === States.DONE) {

            context.contentModifyingState = States.NONE;

            if (context.replaceRule) {
                adguard.filteringLog.bindRuleToHttpRequestEvent(tab, context.replaceRule, requestUrl, requestId);
                ruleHitsRecords.push(context.replaceRule);
            }

            if (context.contentRules) {
                for (let contentRule of context.contentRules) {
                    const elements = context.elements.get(contentRule) || [];
                    for (let element of elements) {
                        adguard.filteringLog.addCosmeticEvent(tab, element, requestUrl, context.requestType, contentRule);
                    }
                    context.elements.delete(contentRule);
                }
                ruleHitsRecords = ruleHitsRecords.concat(context.contentRules);
            }
        }

        for (let i = 0; i < ruleHitsRecords.length; i++) {
            adguard.webRequestService.recordRuleHit(tab, ruleHitsRecords[i], requestUrl);
        }

        // All processes finished
        if (context.requestState === States.NONE &&
            context.contentModifyingState === States.NONE) {

            contexts.delete(key);
        }
    };

    /**
     * Called on request complete/error event
     *
     * @param {string} requestId Request identifier
     * @param {string} requestUrl Request url
     */
    const onRequestCompleted = (requestId, requestUrl) => {
        update(requestId, requestUrl, { requestState: States.DONE });
        remove(requestId, requestUrl);
    };

    /**
     * Indicates that content modification in progress
     *
     * @param {string} requestId Request identifier
     * @param {string} requestUrl Request url
     */
    const onContentModificationStarted = (requestId, requestUrl) => {
        update(requestId, requestUrl, { contentModifyingState: States.PROCESSING });
    };

    /**
     * Indicates that content modification finished
     *
     * @param {string} requestId Request identifier
     * @param {string} requestUrl Request url
     */
    const onContentModificationFinished = (requestId, requestUrl) => {
        update(requestId, requestUrl, { contentModifyingState: States.DONE });
        remove(requestId, requestUrl);
    };

    // Expose
    adguard.requestContextStorage = {
        get,
        record,
        update,
        bindContentRule,
        onRequestCompleted,
        onContentModificationStarted,
        onContentModificationFinished,
    }

})(adguard);
