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

// types import from background does not affect on bundle size
import type { FilterMetadata } from '../background/api/filters/main';
import type { RegularFilterMetadata } from '../background/schema/metadata/filter';

import { AntiBannerFiltersId } from './constants';
import { CustomFilterUtils } from './custom-filter-utils';

/**
 * Extracted to common helper class to avoid bundling of background filter api code
 * into pages where only this helper is used, e.g., fullscreen-user-rules.js.
 */
export class CommonFilterUtils {
    /**
     * Checks if filter is built-in: not custom, not user-rules, not allowlist
     *
     * @param filterId Filter id.
     *
     * @returns True, if filter is common, else returns false.
     */
    public static isCommonFilter(filterId: number): boolean {
        return !CustomFilterUtils.isCustomFilter(filterId)
            && filterId !== AntiBannerFiltersId.UserFilterId
            && filterId !== AntiBannerFiltersId.AllowlistFilterId;
    }

    /**
     * Checks whether the filter is a regular filter.
     *
     * It is needed only for proper types checking instead of type castings.
     *
     * @param filter Filter metadata.
     *
     * @returns True if filter is a regular filter, false otherwise.
     */
    public static isRegularFilterMetadata(filter: FilterMetadata): filter is RegularFilterMetadata {
        return CommonFilterUtils.isCommonFilter(filter.filterId);
    }
}
