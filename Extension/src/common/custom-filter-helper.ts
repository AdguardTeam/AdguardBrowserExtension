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

import { CUSTOM_FILTERS_START_ID } from './constants';

/**
 * Extracted to common helper class because it is used in background and options pages
 */
export class CustomFilterHelper {
    /**
     * Check if filter is custom.
     *
     * @param filterId Filter id.
     *
     * @returns True, if filter is custom, else returns false.
     */
    public static isCustomFilter(filterId: number): boolean {
        return filterId >= CUSTOM_FILTERS_START_ID;
    }
}
