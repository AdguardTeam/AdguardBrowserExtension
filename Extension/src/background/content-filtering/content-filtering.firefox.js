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

import * as TSUrlFilter from '@adguard/tsurlfilter';
import { requestContextStorage } from '../filter/request-context-storage';

/**
 * Listens content filtering callbacks
 */
const modificationsListener = {
    /**
     * On html rule applied
     *
     * @param {Number} tabId - tab id
     * @param {Number} requestId
     * @param {String} elementString - element string presentation
     * @param {String} frameUrl - Frame url
     * @param {Object} rule - html rule
     */
    onHtmlRuleApplied(tabId, requestId, elementString, frameUrl, rule) {
        requestContextStorage.bindContentRule(requestId, rule, elementString);
    },

    /**
     * On replace rules applied
     *
     * @param {Number} tabId - tab id
     * @param {Number} requestId
     * @param {String} frameUrl - Frame url
     * @param {Object} rules - cookie rule
     */
    onReplaceRulesApplied(tabId, requestId, frameUrl, rules) {
        requestContextStorage.update(requestId, { replaceRules: rules });
    },

    /**
     * Called on modification started
     *
     * @param requestId
     */
    onModificationStarted(requestId) {
        // Call this method to prevent removing context on request complete/error event
        requestContextStorage.onContentModificationStarted(requestId);
    },

    /**
     * Called on modification finished
     *
     * @param requestId
     */
    onModificationFinished(requestId) {
        requestContextStorage.onContentModificationFinished(requestId);
    },
};

const firefoxContentFiltering = new TSUrlFilter.ContentFiltering(modificationsListener);

export default firefoxContentFiltering;
