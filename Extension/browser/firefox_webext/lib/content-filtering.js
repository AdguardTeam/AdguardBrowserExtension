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
const wrapper = {
    /**
     * Add html rule event to log
     *
     * @param {Number} tabId - tab id
     * @param {Number} requestId
     * @param {String} elementString - element string presentation
     * @param {String} frameUrl - Frame url
     * @param {Object} rule - html rule
     */
    addHtmlEvent(tabId, requestId, elementString, frameUrl, rule) {
        adguard.requestContextStorage.bindContentRule(requestId, rule, elementString);

        // TODO: [TSUrlFilter] fix logging content rules
    },

    /**
     * Add html rule event to log
     *
     * @param {Number} tabId - tab id
     * @param {Number} requestId
     * @param {String} frameUrl - Frame url
     * @param {Object} rules - cookie rule
     */
    addReplaceRulesEvent(tabId, requestId, frameUrl, rules) {
        adguard.requestContextStorage.update(requestId, { replaceRules: rules });
    },

    /**
     * Called on modification started
     *
     * @param requestId
     */
    onModificationStarted(requestId) {
        // Call this method to prevent removing context on request complete/error event
        adguard.requestContextStorage.onContentModificationStarted(requestId);
    },

    /**
     * Called on modification finished
     *
     * @param requestId
     */
    onModificationFinished(requestId) {
        adguard.requestContextStorage.onContentModificationFinished(requestId);
    },
};

adguard.contentFiltering = new ContentFiltering(wrapper);
