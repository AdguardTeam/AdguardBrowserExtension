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

var changeApplicationFilteringDisabled = AntiBannerService.prototype.changeApplicationFilteringDisabled;
AntiBannerService.prototype.changeApplicationFilteringDisabled = function (disabled) {
    if (disabled) {
        SafariContentBlocker.clearFilters();
    } else {
        this._createRequestFilter();
    }

    changeApplicationFilteringDisabled.call(this, disabled);
};

var getRequestFilter = AntiBannerService.prototype.getRequestFilter;
AntiBannerService.prototype.getRequestFilter = function () {

    if (this.dirtyRules) {
        var rules = [];

        //Add request filter rules
        for (var ruleText in this.dirtyRules) {
            rules.push(ruleText);
        }

        //Add whitelist/blocklist rules
        for (var i in whiteListService.whiteListDomains) {
            var rule = whiteListService._createWhiteListRule(whiteListService.whiteListDomains[i]);
            rules.push(rule.ruleText);

            //TODO: Handle blocklist mode
        }

        SafariContentBlocker.loadFilters(rules);
    }

    return getRequestFilter.call(this);
};

var addWhiteListDomain = AntiBannerService.prototype.addWhiteListDomain;
AntiBannerService.prototype.addWhiteListDomain = function (domain) {
    addWhiteListDomain.call(this, domain);

    var filter = this._getFilterById(AntiBannerFiltersId.WHITE_LIST_FILTER_ID);
    var rule = whiteListService._createWhiteListRule(domain);

    EventNotifier.notifyListeners(EventNotifierTypes.ADD_RULE, filter, [rule]);
};

var addWhiteListDomains = AntiBannerService.prototype.addWhiteListDomains;
AntiBannerService.prototype.addWhiteListDomains = function (domains) {
    addWhiteListDomains.call(this, domains);

    if (!domains) {
        return;
    }
    var filter = this._getFilterById(AntiBannerFiltersId.WHITE_LIST_FILTER_ID);
    var rules = [];
    for (var i = 0; i < domains.length; i++) {
        var domain = domains[i];
        var rule = this._createWhiteListRule(domain);
        if (rule) {
            rules.push(rule);
        }
    }

    EventNotifier.notifyListeners(EventNotifierTypes.ADD_RULES, filter, rules);
};

var removeWhiteListDomain = AntiBannerService.prototype.removeWhiteListDomain;
AntiBannerService.prototype.removeWhiteListDomain = function (domain) {
    removeWhiteListDomain.call(this, domain);

    var filter = this._getFilterById(AntiBannerFiltersId.WHITE_LIST_FILTER_ID);
    var rule = whiteListService._createWhiteListRule(domain);
    EventNotifier.notifyListeners(EventNotifierTypes.REMOVE_RULE, filter, [rule]);
};

var clearWhiteListFilter = AntiBannerService.prototype.clearWhiteListFilter;
AntiBannerService.prototype.clearWhiteListFilter = function () {
    clearWhiteListFilter.call(this);

    var filter = this._getFilterById(AntiBannerFiltersId.WHITE_LIST_FILTER_ID);
    EventNotifier.notifyListeners(EventNotifierTypes.UPDATE_FILTER_RULES, filter, []);
};

/**
 * List of events which cause RequestFilter re-creation
 * @type {Array}
 */
var UPDATE_REQUEST_FILTER_EVENTS = [EventNotifierTypes.UPDATE_FILTER_RULES, EventNotifierTypes.ENABLE_FILTER, EventNotifierTypes.DISABLE_FILTER, EventNotifierTypes.ADD_RULE, EventNotifierTypes.ADD_RULES, EventNotifierTypes.REMOVE_RULE];

(function () {

    EventNotifier.addListener(function (event, params) {
        switch (event) {
            case EventNotifierTypes.REBUILD_REQUEST_FILTER_END:
                console.log('REBUILD_REQUEST_FILTER_END:' + params);
                break;
            case EventNotifierTypes.CHANGE_USER_SETTINGS:
                console.log('CHANGE_USER_SETTINGS:' + params);
                break;
            case EventNotifierTypes.UPDATE_WHITELIST_FILTER_RULES:
                console.log('UPDATE_WHITELIST_FILTER_RULES:' + params);
                break;
        }
    });

})();