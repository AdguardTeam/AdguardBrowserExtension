/**
 * @file
 * This file is part of AdGuard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * AdGuard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * AdGuard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with AdGuard Browser Extension. If not, see <http://www.gnu.org/licenses/>.
 */
import { HIT_STATISTIC_KEY } from '../../common/constants';
import { StringStorage } from '../utils/string-storage';
import { HitStatsStorageData } from '../schema';
import { storage } from './main';

/**
 * Class for asynchronous control {@link HitStats} storage data,
 * that is persisted as string in another key value storage
 *
 * @see {@link StringStorage}
 */
export class HitStatsStorage extends StringStorage<typeof HIT_STATISTIC_KEY, HitStatsStorageData, 'async'> {
    /**
     * Add 1 rule hit to stats
     *
     * @param ruleText - rule test
     * @param filterId - filter id
     * @throws error, if storage is not initialized
     */
    addRuleHitToCache(
        ruleText: string,
        filterId: number,
    ): void {
        if (!this.data) {
            throw HitStatsStorage.createNotInitializedError();
        }

        if (!this.data.stats) {
            this.data.stats = {};
        }

        if (!this.data.stats.filters) {
            this.data.stats.filters = {};
        }

        const id = String(filterId);

        let rules = this.data.stats.filters[id];

        if (!rules) {
            rules = {};
        }

        rules[ruleText] = (rules[ruleText] || 0) + 1;
        this.data.stats.filters[id] = rules;
        this.data.totalHits = (this.data.totalHits || 0) + 1;
    }

    private static createNotInitializedError(): Error {
        return new Error('hit stats is not initialized');
    }
}

/**
 * {@link HitStatsStorage} instance, that stores
 * stringified {@link HitStats} in {@link storage} under
 * {@link HIT_STATISTIC_KEY} key
 */
export const hitStatsStorage = new HitStatsStorage(
    HIT_STATISTIC_KEY,
    storage,
);
