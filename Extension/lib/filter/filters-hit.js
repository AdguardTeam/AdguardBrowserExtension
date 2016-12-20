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
 * Initializing required libraries for this file.
 * require method is overridden in Chrome extension (port/require.js).
 */
var setTimeout = require('sdk/timers').setTimeout;
var clearTimeout = require('sdk/timers').clearTimeout;
var ServiceClient = require('../../lib/utils/service-client').ServiceClient;
var LS = require('../../lib/utils/local-storage').LS;
var userSettings = require('../../lib/utils/user-settings').userSettings;
var EventNotifier = require('../../lib/utils/notifier').EventNotifier;
var EventNotifierTypes = require('../../lib/utils/common').EventNotifierTypes;
var Log = require('../../lib/utils/log').Log;
var UrlUtils = require('../../lib/utils/url').UrlUtils;

/**
 * This object is used to store and track ad filters usage stats.
 * It is used if user has enabled "Send statistics for ad filters usage" option.
 * More info about ad filters stats: http://adguard.com/en/filter-rules-statistics.html
 *
 * @constructor
 */
var FilterRulesHitCount = function () {

    this.serviceClient = new ServiceClient();
    this._init();

    this.collectStatsEnabled = userSettings.collectHitsCount();
    EventNotifier.addListener(function (event, setting) {
        if (event == EventNotifierTypes.CHANGE_USER_SETTINGS && setting == userSettings.settings.DISABLE_COLLECT_HITS) {
            this.collectStatsEnabled = userSettings.collectHitsCount();
            if (!this.collectStatsEnabled) {
                this.cleanup();
            }
        }
    }.bind(this));
};

FilterRulesHitCount.prototype = {

    MAX_PAGE_VIEWS_COUNT: 20,
    HITS_COUNT_PROP: 'filters-hit-count',
    HITS_PROP: 'h',

    setAntiBannerService: function (antiBannerService) {
        this.antiBannerService = antiBannerService;
    },

    addDomainView: function (domain) {

        if (!this.collectStatsEnabled) {
            return;
        }
        if (!domain) {
            return;
        }

        var domains = this.stats.domains;
        if (!domains) {
            this.stats.domains = domains = Object.create(null);
        }

        var domainInfo = domains[domain];
        if (!domainInfo) {
            domains[domain] = domainInfo = Object.create(null);
            domainInfo.views = 0;
        }
        domainInfo.views++;
        this.stats.views = (this.stats.views || 0) + 1;

        this._saveHitsCountStats(this.stats);
    },

    addRuleHit: function (domain, ruleText, filterId, requestUrl) {

        if (!this.collectStatsEnabled) {
            return;
        }

        if (!domain || !ruleText || !filterId) {
            return;
        }

        var domainInfo = this.stats.domains ? this.stats.domains[domain] : null;
        if (!domainInfo) {
            return;
        }

        var rules = domainInfo.rules;
        if (!rules) {
            domainInfo.rules = rules = Object.create(null);
        }

        var filterRules = rules[filterId];
        if (!filterRules) {
            rules[filterId] = filterRules = Object.create(null);
        }

        if (!(ruleText in filterRules)) {
            filterRules[ruleText] = null;
        }

        var ruleInfo = filterRules[ruleText];
        if (!ruleInfo) {
            filterRules[ruleText] = ruleInfo = Object.create(null);
        }

        if (requestUrl) {
            var requestDomain = UrlUtils.getDomainName(requestUrl);
            // Domain hits
            var domainHits = ruleInfo[requestDomain] || 0;
            ruleInfo[requestDomain] = domainHits + 1;
        } else {
            // Css hits
            var hits = ruleInfo[this.HITS_PROP] || 0;
            ruleInfo[this.HITS_PROP] = hits + 1;
        }

        this._saveHitsCountStats(this.stats);
    },

    cleanup: function () {
        this.stats = Object.create(null);
        LS.removeItem(this.HITS_COUNT_PROP);
    },

    _init: function () {
        this.stats = this._getHitCountStats();
    },

    _getHitCountStats: function () {
        var json = LS.getItem(this.HITS_COUNT_PROP);
        var stats = Object.create(null);
        try {
            if (json) {
                stats = JSON.parse(json);
            }
        } catch (ex) {
            Log.error("Error retrieve hit count statistic, cause {0}", ex);
        }
        return stats;
    },

    _saveHitsCountStats: function (stats) {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
        }
        this.timeoutId = setTimeout(function () {
            try {
                LS.setItem(this.HITS_COUNT_PROP, JSON.stringify(stats));
            } catch (ex) {
                Log.error("Error save hit count statistic to storage, cause {0}", ex);
            }
            this._sendStats();
        }.bind(this), 2000);
    },

    _sendStats: function () {
        var overallViews = this.stats.views || 0;
        if (overallViews < this.MAX_PAGE_VIEWS_COUNT) {
            return;
        }
        if (!this.collectStatsEnabled) {
            return;
        }
        var enabledFilters = [];
        if (this.antiBannerService) {
            enabledFilters = this.antiBannerService.getEnabledAntiBannerFilters();
        }
        this.serviceClient.sendHitStats(JSON.stringify(this.stats), enabledFilters);
        this.cleanup();
    }
};

var filterRulesHitCount = exports.filterRulesHitCount = new FilterRulesHitCount();