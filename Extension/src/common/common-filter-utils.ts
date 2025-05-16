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

import { AntiBannerFiltersId } from './constants';
import { CustomFilterUtils } from './custom-filter-utils';

/**
 * Extracted to common helper class to avoid bundling of background filter api code
 * into pages where only this helper is used, e.g., fullscreen-user-rules.js.
 */
export class CommonFilterUtils {
    /**
     * Checks if filter is built-in: not custom, not user-rules, not allowlist
     * and not quick fixes filter (used only for MV3 version).
     *
     * @param filterId Filter id.
     *
     * @returns True, if filter is common, else returns false.
     */
    public static isCommonFilter(filterId: number): boolean {
        return !CustomFilterUtils.isCustomFilter(filterId)
            && filterId !== AntiBannerFiltersId.UserFilterId
            && filterId !== AntiBannerFiltersId.AllowlistFilterId
            && filterId !== AntiBannerFiltersId.QuickFixesFilterId;
    }
}
