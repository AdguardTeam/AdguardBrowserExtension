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

var SafariContentBlocker = require('content-blocker').SafariContentBlocker;


AntiBannerService.prototype.changeApplicationFilteringDisabled = function (disabled) {
    if (disabled) {
        SafariContentBlocker.clearFilters();
    } else {
        this._createRequestFilter();
    }

    userSettings.changeFilteringDisabled(disabled);
    this.applicationFilteringDisabled = disabled;
};

AntiBannerService.prototype.getRequestFilter = function () {

    // Check if we can lazy-init request filter
    if (this.dirtyRules) {
        var rules = [];

        //Add whitelist/blocklist rules
        for (var i in whiteListService.whiteListDomains) {
            var rule = whiteListService._createWhiteListRule(whiteListService.whiteListDomains[i]);
            rules.push(rule.ruleText);

            //TODO: Handle blocklist mode
        }

        //Add request filter rules
        for (var ruleText in this.dirtyRules) {
            rules.push(ruleText);
        }

        SafariContentBlocker.loadFilters(rules);

        // Request filter is ready
        this.requestFilter = new RequestFilter();;

        // No need in dirtyRules collection anymore
        this.dirtyRules = null;
    }

    return this.requestFilter;
};

/**
 * List of events which cause RequestFilter re-creation
 * @type {Array}
 */
var UPDATE_REQUEST_FILTER_EVENTS = [EventNotifierTypes.UPDATE_FILTER_RULES, EventNotifierTypes.ENABLE_FILTER, EventNotifierTypes.DISABLE_FILTER, EventNotifierTypes.ADD_RULE, EventNotifierTypes.ADD_RULES, EventNotifierTypes.REMOVE_RULE];