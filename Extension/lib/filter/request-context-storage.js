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
 * Each request has a context with unique key: requestId
 * Context contains information about this request: id, url, referrer, type,
 * applied rules, original and modified headers
 *
 * This API is exposed via adguard.requestContextStorage:
 *
 * - get - Get context by key
 * - record - Initialize context for request (uses in onBeforeRequest)
 * - update - Updates context properties (rules)
 * - bindContentRule - Binds content rule and removed element to the context
 * - onContentModificationStarted - Must be called to point that content modification is started
 *   Following 2 methods have same logic (push rules to log, record rule hits and perform cleanup),
 *   but called in different cases:
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
     * @property {Array} replaceRules - Applied replace rules
     * @property {Array} contentRules - Content rules
     * @property {Array} cspRules CSP - rules
     * @property {number} eventId - Internal counter for log events
     * @property {number} requestState - Is request between onBeforeRequest and onCompleted/onErrorOccurred events
     * @property {number} contentModifyingState - Is content modification started
     * @property {Map<object, string[]>} elements - Content rules attached elements
     * @property {number} stealthActions - Applied stealth actions
     * @property {boolean} cspReportBlocked - Blocked because is csp report request
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
        DONE: 3,
    };

    /**
     * Collects context
     * @type {Map<string, RequestContext>}
     */
    const contexts = new Map();

    /**
     * Event counter for pushing rules to the filtering log on request complete/error
     * Don't use requestId, because redirected requests have the same request identifier
     * @type {number}
     */
    let nextEventId = 0;

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
     * Creates copy of headers array
     * @param headers Headers to copy
     * @return {{name: *, value: *}[]}
     */
    const copyHeaders = headers => (headers || []).map(h => ({ name: h.name, value: h.value }));

    /**
     * Generates next event identifier
     * @returns {number}
     */
    const getNextEventId = () => {
        nextEventId += 1;
        return nextEventId;
    };

    /**
     * Gets request context
     * @param {string} requestId Request identifier
     */
    const get = (requestId) => {
        return contexts.get(requestId);
    };

    /**
     * Records request context
     *
     * @param {string} requestId Request identifier
     * @param {string} requestUrl Request url
     * @param {string} referrerUrl Request referrer url
     * @param {string} originUrl Request origin url (initiator)
     * @param {string} requestType Request type
     * @param {object} tab Request tab
     */
    const record = (requestId, requestUrl, referrerUrl, originUrl, requestType, tab) => {
        const eventId = getNextEventId();

        // Clears filtering log. If contexts map already contains this requests that means that we caught redirect
        if (requestType === adguard.RequestTypes.DOCUMENT && !contexts.has(requestId)) {
            adguard.filteringLog.clearEventsByTabId(tab.tabId);
        }

        const context = {
            requestId,
            requestUrl,
            referrerUrl,
            originUrl,
            requestType,
            tab,
            eventId,
            requestState: States.PROCESSING,
            contentModifyingState: States.NONE,
        };
        contexts.set(requestId, context);

        adguard.filteringLog.addHttpRequestEvent(tab, requestUrl, referrerUrl, requestType, null, eventId);
    };

    /**
     * Some "requests" can't be intercepted by webRequest API: WS and WebRTC, popups.
     * So them don't have usual request identifier and must be processing in the other way.
     * @param requestUrl {string} Request URL
     * @param referrerUrl {string} Referrer
     * @param requestType {string} Request type
     * @param tab {object} Tab
     * @param requestRule {object} Request rule
     */
    const recordEmulated = (requestUrl, referrerUrl, requestType, tab, requestRule) => {
        adguard.filteringLog.addHttpRequestEvent(tab, requestUrl, referrerUrl, requestType, requestRule);
        adguard.webRequestService.recordRuleHit(tab, requestRule, requestUrl);
    };

    /**
     * Updates request context
     * @param {string} requestId Request identifier
     * @param {RequestContext} update
     */
    const update = (requestId, update) => {
        const context = contexts.get(requestId);
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
            // Some requests may execute for a long time, that's why we update filtering log when
            // we get a request rule
            adguard.filteringLog.bindRuleToHttpRequestEvent(
                context.tab,
                context.requestRule,
                context.eventId
            );
        }
        if ('replaceRules' in update) {
            context.replaceRules = update.replaceRules;
        }
        if ('removeparamRules' in update) {
            context.removeparamRules = update.removeparamRules;
        }
        if ('cspRules' in update) {
            context.cspRules = appendRules(context.cspRules, update.cspRules);
        }
        if ('stealthActions' in update) {
            context.stealthActions = update.stealthActions;
        }

        if ('requestHeaders' in update) {
            context.requestHeaders = copyHeaders(update.requestHeaders);
        }
        if ('responseHeaders' in update) {
            context.responseHeaders = copyHeaders(update.responseHeaders);
        }
        if ('modifiedRequestHeaders' in update) {
            context.modifiedRequestHeaders = copyHeaders(update.modifiedRequestHeaders);
        }
        if ('modifiedResponseHeaders' in update) {
            context.modifiedResponseHeaders = copyHeaders(update.modifiedResponseHeaders);
        }

        if ('cspReportBlocked' in update) {
            context.cspReportBlocked = update.cspReportBlocked;
        }
    };

    /**
     * Binds content rule with serialized element to the request
     *
     * @param {string} requestId Request identifier
     * @param {object} rule Content rule
     * @param {object} elementHtml Serialized HTML element
     */
    const bindContentRule = (requestId, rule, elementHtml) => {
        const context = contexts.get(requestId);
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
     */
    const remove = (requestId) => {
        const context = contexts.get(requestId);
        if (!context) {
            return;
        }

        const {
            tab,
            requestUrl,
            referrerUrl,
        } = context;

        let ruleHitsRecords = [];

        if (context.requestState === States.DONE) {
            context.requestState = States.NONE;

            const {
                requestRule,
                cspRules,
                stealthActions,
                cspReportBlocked,
            } = context;

            if (requestRule) {
                adguard.filteringLog.bindRuleToHttpRequestEvent(tab, requestRule, context.eventId);
                ruleHitsRecords.push(requestRule);
            }

            if (cspRules) {
                for (const cspRule of cspRules) {
                    adguard.filteringLog.addHttpRequestEvent(tab, requestUrl, referrerUrl, adguard.RequestTypes.CSP, cspRule);
                }
                ruleHitsRecords = ruleHitsRecords.concat(cspRules);
            }

            if (stealthActions) {
                adguard.filteringLog.bindStealthActionsToHttpRequestEvent(tab, stealthActions, context.eventId);
            }

            if (cspReportBlocked) {
                adguard.filteringLog.bindCspReportBlockedToHttpRequestEvent(tab, cspReportBlocked, context.eventId);
            }
        }

        if (context.contentModifyingState === States.DONE) {
            context.contentModifyingState = States.NONE;

            const { contentRules, replaceRules } = context;

            if (replaceRules) {
                adguard.filteringLog.bindReplaceRulesToHttpRequestEvent(tab, replaceRules, context.eventId);
                ruleHitsRecords.push(replaceRules);
            }

            if (contentRules) {
                for (const contentRule of contentRules) {
                    const elements = context.elements.get(contentRule) || [];
                    for (const element of elements) {
                        adguard.filteringLog.addCosmeticEvent(
                            tab,
                            element,
                            requestUrl,
                            context.requestType,
                            contentRule
                        );
                    }
                    context.elements.delete(contentRule);
                }
                ruleHitsRecords = ruleHitsRecords.concat(contentRules);
            }
        }

        for (let i = 0; i < ruleHitsRecords.length; i += 1) {
            adguard.webRequestService.recordRuleHit(tab, ruleHitsRecords[i], requestUrl);
        }

        // All processes finished
        if (context.requestState === States.NONE
            && context.contentModifyingState === States.NONE) {
            contexts.delete(requestId);
        }
    };

    /**
     * Called on request complete/error event
     *
     * @param {string} requestId Request identifier
     */
    const onRequestCompleted = (requestId) => {
        update(requestId, { requestState: States.DONE });
        remove(requestId);
    };

    /**
     * Indicates that content modification in progress
     *
     * @param {string} requestId Request identifier
     */
    const onContentModificationStarted = (requestId) => {
        update(requestId, { contentModifyingState: States.PROCESSING });
    };

    /**
     * Indicates that content modification finished
     *
     * @param {string} requestId Request identifier
     */
    const onContentModificationFinished = (requestId) => {
        update(requestId, { contentModifyingState: States.DONE });
        remove(requestId);
    };

    // Expose
    adguard.requestContextStorage = {
        get,
        record,
        recordEmulated,
        update,
        bindContentRule,
        onRequestCompleted,
        onContentModificationStarted,
        onContentModificationFinished,
    };
})(adguard);
