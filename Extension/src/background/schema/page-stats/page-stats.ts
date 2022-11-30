/**
 * @file
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
import zod from 'zod';

export const pageStatsDataItemValidator = zod.record(zod.string(), zod.number());

export type PageStatsDataItem = zod.infer<typeof pageStatsDataItemValidator>;

export const pageStatsDataValidator = zod.object({
    hours: pageStatsDataItemValidator.array(),
    days: pageStatsDataItemValidator.array(),
    months: pageStatsDataItemValidator.array(),
    updated: zod.number(),
});

export type PageStatsData = zod.infer<typeof pageStatsDataValidator>;

export const pageStatsValidator = zod.object({
    totalBlocked: zod.number().optional(),
    data: pageStatsDataValidator.optional(),
});

export type PageStats = zod.infer<typeof pageStatsValidator>;
