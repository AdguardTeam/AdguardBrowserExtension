/**
 * Copyright (c) 2015-2026 Adguard Software Ltd.
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

import { DEFAULT_FILTERS_UPDATE_PERIOD } from '../../../../common/settings';
import { type FilterVersionData } from '../../../schema';

/**
 * Checks whether a filter is due for a full update.
 *
 * If there is no version data, the filter is considered outdated. When the
 * default update period is configured or no period is passed, the filter's
 * `Expires` value is used; otherwise the user-selected period applies.
 *
 * @param filterVersion Filter version data, if any.
 * @param updatePeriod Update period in milliseconds. Omit it to always use `Expires`.
 *
 * @returns True if the filter should be fully updated.
 */
export const isFullUpdateDue = (
    filterVersion: FilterVersionData | undefined,
    updatePeriod?: number,
): boolean => {
    if (!filterVersion) {
        return true;
    }

    const { lastCheckTime, expires } = filterVersion;

    // By default, checks the "expires" field for each filter.
    // IMPORTANT: "expires" in filter is specified in SECONDS.
    if (updatePeriod === undefined || updatePeriod === DEFAULT_FILTERS_UPDATE_PERIOD) {
        return lastCheckTime + expires * 1000 <= Date.now();
    }

    // Check, if the renewal period of each filter has passed.
    return lastCheckTime + updatePeriod <= Date.now();
};
