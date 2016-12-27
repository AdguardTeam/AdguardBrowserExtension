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
 * This object is used to store and track ad filters usage stats.
 * It is used if user has enabled "Send statistics for ad filters usage" option.
 * More info about ad filters stats: http://adguard.com/en/filter-rules-statistics.html
 *
 * @constructor
 */
adguard.hitStats = (function (adguard) {

    'use strict';

    var MAX_PAGE_VIEWS_COUNT = 20;
    var HITS_COUNT_PROP = 'filters-hit-count';
    var HITS_PROP = 'h';

    var throttleTimeoutId;

    /**
     * Object for aggregation hit stats (Lazy initialized)
     */
    var hitStatsHolder = {
        get hitStats() {
            return adguard.lazyGet(hitStatsHolder, 'hitStats', getHitCountStats);
        }
    };

    /**
     * Reads hit stats from local storage
     * @returns {null}
     */
    function getHitCountStats() {
        var json = adguard.localStorage.getItem(HITS_COUNT_PROP);
        var stats = Object.create(null);
        try {
            if (json) {
                stats = JSON.parse(json);
            }
        } catch (ex) {
            adguard.console.error("Error retrieve hit count statistic, cause {0}", ex);
        }
        return stats;
    }

    /**
     * Sends hit stats to backend server
     */
    function sendStats() {
        var overallViews = hitStatsHolder.hitStats.views || 0;
        if (overallViews < MAX_PAGE_VIEWS_COUNT) {
            return;
        }
        var enabledFilters = adguard.filters.getEnabledFilters();
        adguard.backend.sendHitStats(JSON.stringify(hitStatsHolder.hitStats), enabledFilters);
        cleanup();
    }

    /**
     * Save hit stats to local storage and invoke sendStats
     * Throttled with 2 seconds delay
     * @param stats
     */
    function saveHitsCountStats(stats) {
        if (throttleTimeoutId) {
            clearTimeout(throttleTimeoutId);
        }
        throttleTimeoutId = setTimeout(function () {
            try {
                adguard.localStorage.setItem(HITS_COUNT_PROP, JSON.stringify(stats));
            } catch (ex) {
                adguard.console.error("Error save hit count statistic to storage, cause {0}", ex);
            }
            sendStats();
        }, 2000);
    }

    /**
     * Add 1 domain view to stats
     * @param domain
     */
    var addDomainView = function (domain) {

        if (!domain) {
            return;
        }

        var domains = hitStatsHolder.hitStats.domains;
        if (!domains) {
            hitStatsHolder.hitStats.domains = domains = Object.create(null);
        }

        var domainInfo = domains[domain];
        if (!domainInfo) {
            domains[domain] = domainInfo = Object.create(null);
            domainInfo.views = 0;
        }
        domainInfo.views++;
        hitStatsHolder.hitStats.views = (hitStatsHolder.hitStats.views || 0) + 1;

        saveHitsCountStats(hitStatsHolder.hitStats);
    };

    /**
     * Add 1 rule hit to stats
     * @param domain Domain of site where rule was applied
     * @param ruleText
     * @param filterId
     * @param requestUrl Url to which rule was applied
     */
    var addRuleHit = function (domain, ruleText, filterId, requestUrl) {

        if (!domain || !ruleText || !filterId) {
            return;
        }

        var domainInfo = hitStatsHolder.hitStats.domains ? hitStatsHolder.hitStats.domains[domain] : null;
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
            var requestDomain = adguard.utils.url.getDomainName(requestUrl);
            // Domain hits
            var domainHits = ruleInfo[requestDomain] || 0;
            ruleInfo[requestDomain] = domainHits + 1;
        } else {
            // Css hits
            var hits = ruleInfo[HITS_PROP] || 0;
            ruleInfo[HITS_PROP] = hits + 1;
        }

        saveHitsCountStats(hitStatsHolder.hitStats);
    };

    /**
     * Cleanup stats
     */
    function cleanup() {
        adguard.localStorage.removeItem(HITS_COUNT_PROP);
        adguard.lazyGetClear(hitStatsHolder, 'hitStats');
    }

    /**
     * Hit stats getter
     */
    var getStats = function () {
        return hitStatsHolder.hitStats;
    };

    /**
     * Cleanup stats on property disabled
     */
    adguard.settings.onUpdated.addListener(function (setting) {
        if (setting === adguard.settings.DISABLE_COLLECT_HITS && !adguard.settings.collectHitsCount()) {
            cleanup();
        }
    });

    return {
        addRuleHit: addRuleHit,
        addDomainView: addDomainView,
        cleanup: cleanup,
        getStats: getStats
    };

})(adguard);
