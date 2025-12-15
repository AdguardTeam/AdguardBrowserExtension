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

import { type PageStatsData } from '../../../Extension/src/background/schema';
import { PageStatsStorage } from '../../../Extension/src/background/storages/page-stats';

export const getEmptyPageStatsDataFixture = (
    updated: number,
): PageStatsData => {
    const emptyStats = { [PageStatsStorage.TOTAL_GROUP_ID]: 0 };
    return {
        hours: Array(PageStatsStorage.MAX_HOURS_HISTORY).fill(emptyStats),
        days: Array(PageStatsStorage.MAX_DAYS_HISTORY).fill(emptyStats),
        months: Array(PageStatsStorage.MAX_MONTHS_HISTORY).fill(emptyStats),
        updated,
    };
};
