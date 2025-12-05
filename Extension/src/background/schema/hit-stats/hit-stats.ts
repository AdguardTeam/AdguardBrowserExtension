/**
 * Copyright (c) 2015-2025 Adguard Software Ltd.
 *
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
import zod from 'zod';

const filterRulesHitsValidator = zod.record(
    /**
     * Index of rule.
     */
    zod.string(),
    /**
     * The number of matches of this rule.
     */
    zod.number(),
);

const filterHitsValidator = zod.record(
    /**
     * Filter's id.
     */
    zod.string(),
    filterRulesHitsValidator.optional(),
);

const hitStatsValidator = zod.object({
    /**
     * Contains an object with filter IDs as keys and their
     * {@link filterRulesHitsValidator} as values.
     */
    filters: filterHitsValidator.optional(),
}).strict();

/**
 * Contains an object 'filters' with filter IDs as keys and their
 * {@link filterRulesHitsValidator} as values or undefined.
 */
export type HitStats = zod.infer<typeof hitStatsValidator>;

const filtersVersionsValidator = zod.record(
    /**
     * Filter's id.
     */
    zod.string(),

    /**
     * Version of the filter.
     */
    zod.string(),
);

export const hitStatsStorageDataValidator = zod.object({
    /**
     * The number of hits in relation to the hit rule.
     */
    stats: hitStatsValidator.optional(),

    /**
     * Contains an object with filter IDs as keys and their versions as values.
     */
    versions: filtersVersionsValidator.optional(),

    /**
     * The total number of hits with no link to the rules.
     */
    totalHits: zod.number().optional(),
}).strict();

/**
 * Contains the number of hits overall and in relation to the hit rule.
 */
export type HitStatsStorageData = zod.infer<typeof hitStatsStorageDataValidator>;
