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
 * Module for managing requests context
 */
(function (adguard) {

    /**
     * @typedef {object} RequestContext
     * @property {string} requestId - Request identifier
     * @property {string} requestUrl - Request url
     * @property {string> referrerUrl - Request referrer url
     * @property {string} requestType - Request type
     * @property {object} tab Request - tab
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
     */

    /**
     * @typedef {object} States
     * @property {number} NONE
     * @property {number} PROCESSING
     * @property {number} DONE
     * @property {function} isFinished
     */
    const States = {
        NONE: 1,
        PROCESSING: 2,
        DONE: 3,
        isFinished: (state) => {
            return state === States.NONE || state === States.DONE;
        }
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
     * @property {string} requestId Request identifier
     * @property {string} requestUrl Request url
     * @property {string> referrerUrl Request referrer url
     * @property {string} requestType Request type
     * @property {object} tab Request tab
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
        context.contentRules = appendRules(context.contentRules, update.contentRules);
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

        let rules = [];

        if (context.requestState === States.PROCESSING) {
            context.requestState = States.DONE;
            if (context.requestRule) {
                rules.push(context.requestRule);
            }
            if (context.cspRules) {
                rules = rules.concat(context.cspRules);
            }
        }

        if (context.contentModifyingState === States.PROCESSING) {
            context.contentModifyingState = States.DONE;
            if (context.replaceRule) {
                rules.push(context.replaceRule);
            }
            if (context.contentRules) {
                rules = rules.concat(context.contentRules);
            }
        }

        if (rules.length > 0) {
            adguard.filteringLog.bindRuleToHttpRequestEvent(context.tab, rules[0], requestId);
        }

        for (let i = 0; i < rules.length; i++) {
            adguard.webRequestService.recordRuleHit(context.tab, rules[i], context.requestUrl);
        }

        // All processes finished
        if (States.isFinished(context.requestState) &&
            States.isFinished(context.contentModifyingState)) {
            contexts.delete(key);
        }
    };

    /**
     * Indicates that content modification is started
     *
     * @param {string} requestId Request identifier
     * @param {string} requestUrl Request url
     */
    const onContentModificationStarted = (requestId, requestUrl) => {
        update(requestId, requestUrl, { contentModifyingState: States.PROCESSING });
    };

    // Expose
    adguard.requestContextStorage = {
        get,
        record,
        update,
        remove,
        onContentModificationStarted,
    }

})(adguard);
