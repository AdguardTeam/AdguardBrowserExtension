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

/**
 * Describes the relationship between the number of blocked requests and
 * the name of the group (similar to the tag).
 */
const pageStatsDataItemValidator = zod.record(zod.string(), zod.number());

/**
 * Describes the relationship between the number of blocked requests and
 * the name of the group (similar to the tag).
 */
export type PageStatsDataItem = zod.infer<typeof pageStatsDataItemValidator>;

const pageStatsDataValidator = zod.object({
    /**
     * Blocked requests grouped by hours.
     */
    hours: pageStatsDataItemValidator.array(),

    /**
     * Blocked requests grouped by days.
     */
    days: pageStatsDataItemValidator.array(),

    /**
     * Blocked requests grouped by months.
     */
    months: pageStatsDataItemValidator.array(),

    /**
     * The time stamp of the last update. In milliseconds.
     */
    updated: zod.number(),
});

/**
 * Describes an object with blocked requests grouped by time and timestamp of
 * the last update.
 */
export type PageStatsData = zod.infer<typeof pageStatsDataValidator>;

export const pageStatsValidator = zod.object({
    /**
     * Total blocked requests.
     */
    totalBlocked: zod.number().optional(),
    /**
     * Blocked requests grouped by time.
     */
    data: pageStatsDataValidator.optional(),
});

/**
 * Contains total blocked requests and blocked requests grouped by time.
 */
export type PageStats = zod.infer<typeof pageStatsValidator>;
