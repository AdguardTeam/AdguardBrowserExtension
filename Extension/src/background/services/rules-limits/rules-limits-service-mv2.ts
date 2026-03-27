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

/**
 * MV2 stub — there are no DNR quotas in MV2, so limits are never exceeded.
 */
export class RulesLimitsService {
    /**
     * MV2 stub. Always returns `false` because MV2 has no declarativeNetRequest quota.
     *
     * @returns `false`.
     */
    public static async areFilterLimitsExceeded(): Promise<boolean> {
        return false;
    }

    /**
     * MV2 stub. No-op because MV2 has no declarativeNetRequest quota warnings.
     *
     * @returns Resolved promise.
     */
    public static async clearRulesLimitsWarning(): Promise<void> {
        return Promise.resolve();
    }
}

export const rulesLimitsService = new RulesLimitsService();
