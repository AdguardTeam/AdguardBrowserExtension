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

import { localStorage } from '../../../storage';
import { settings } from '../../../settings/user-settings';
import { application } from '../../../application';
import { backend } from '../../filters/service-client';
import { log } from '../../../../common/log';
import { utils } from '../../../utils/common';
import { lazyGet, lazyGetClear } from '../../../utils/lazy';

/**
 * This module is used to store and track ad filters usage stats.
 * It is used if user has enabled "Send statistics for ad filters usage" option.
 * More info about ad filters stats: http://adguard.com/en/filter-rules-statistics.html
 */
const browsersHitStats = (function () {
    const MAX_PAGE_VIEWS_COUNT = 20;
    const HITS_COUNT_PROP = 'filters-hit-count';
    const HITS_PROP = 'h';

    let throttleTimeoutId;

    /**
     * Reads hit stats from local storage
     * @returns {null}
     */
    function getHitCountStats() {
        const json = localStorage.getItem(HITS_COUNT_PROP);
        let stats = Object.create(null);
        try {
            if (json) {
                stats = JSON.parse(json);
            }
        } catch (ex) {
            log.error('Error retrieve hit count statistic, cause {0}', ex);
        }
        return stats;
    }

    /**
     * Object for aggregation hit stats (Lazy initialized)
     */
    const hitStatsHolder = {
        get hitStats() {
            return lazyGet(hitStatsHolder, 'hitStats', getHitCountStats);
        },
    };

    /**
     * Cleanup stats
     */
    function cleanup() {
        localStorage.removeItem(HITS_COUNT_PROP);
        lazyGetClear(hitStatsHolder, 'hitStats');
    }

    /**
     * Sends hit stats to backend server
     */
    function sendStats() {
        const overallViews = hitStatsHolder.hitStats.views || 0;
        if (overallViews < MAX_PAGE_VIEWS_COUNT) {
            return;
        }
        const enabledFilters = application.getEnabledFilters();
        backend.sendHitStats(JSON.stringify(hitStatsHolder.hitStats), enabledFilters);
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
        throttleTimeoutId = setTimeout(() => {
            try {
                localStorage.setItem(HITS_COUNT_PROP, JSON.stringify(stats));
            } catch (ex) {
                log.error('Error save hit count statistic to storage, cause {0}', ex);
            }
            sendStats();
        }, 2000);
    }

    /**
     * Add 1 domain view to stats
     * @param domain
     */
    const addDomainView = function (domain) {
        if (!domain) {
            return;
        }

        let { domains } = hitStatsHolder.hitStats;
        if (!domains) {
            hitStatsHolder.hitStats.domains = domains = Object.create(null);
        }

        let domainInfo = domains[domain];
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
    const addRuleHit = function (domain, ruleText, filterId, requestUrl) {
        if (!domain || !ruleText || !filterId) {
            return;
        }

        const domainInfo = hitStatsHolder.hitStats.domains ? hitStatsHolder.hitStats.domains[domain] : null;
        if (!domainInfo) {
            return;
        }

        let { rules } = domainInfo;
        if (!rules) {
            domainInfo.rules = rules = Object.create(null);
        }

        let filterRules = rules[filterId];
        if (!filterRules) {
            rules[filterId] = filterRules = Object.create(null);
        }

        if (!(ruleText in filterRules)) {
            filterRules[ruleText] = null;
        }

        let ruleInfo = filterRules[ruleText];
        if (!ruleInfo) {
            filterRules[ruleText] = ruleInfo = Object.create(null);
        }

        if (requestUrl) {
            const requestDomain = utils.url.getDomainName(requestUrl);
            // Domain hits
            const domainHits = ruleInfo[requestDomain] || 0;
            ruleInfo[requestDomain] = domainHits + 1;
        } else {
            // Css hits
            const hits = ruleInfo[HITS_PROP] || 0;
            ruleInfo[HITS_PROP] = hits + 1;
        }

        saveHitsCountStats(hitStatsHolder.hitStats);
    };

    /**
     * Hit stats getter
     */
    const getStats = function () {
        return hitStatsHolder.hitStats;
    };

    /**
     * Cleanup stats on property disabled
     */
    settings.onUpdated.addListener((setting) => {
        if (setting === settings.DISABLE_COLLECT_HITS && !settings.collectHitsCount()) {
            cleanup();
        }
    });

    return {
        addRuleHit,
        addDomainView,
        cleanup,
        getStats,
    };
})();

export default browsersHitStats;
