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

import zod from 'zod';

import { ForwardFrom } from '../../../common/forward';

/**
 * Manual extension update data validator.
 */
export const ManualExtensionUpdateDataValidator = zod.object({
    /**
     * Version of the extension where the manual extension update was initialized.
     */
    initVersion: zod.string(),

    /**
     * Page to open after the extension reloads.
     */
    pageToOpenAfterReload: zod.enum([ForwardFrom.Options, ForwardFrom.Popup]),

    /**
     * Whether the extension update was successful.
     */
    isOk: zod.boolean(),
});

/**
 * Manual extension update data.
 */
export type ManualExtensionUpdateData = zod.infer<typeof ManualExtensionUpdateDataValidator>;

/**
 * Auto-update state validator.
 */
export const AutoUpdateStateValidator = zod.object({
    /**
     * Timestamp when update became available.
     *
     * Can be skipped if isManualCheck is true.
     *
     * TODO: Automate checking for this field:
     * - If isManualCheck is true, updateAvailableTimestamp should be skipped.
     * - If isManualCheck is false, updateAvailableTimestamp should be required.
     */
    updateAvailableTimestamp: zod.number().optional(),

    /**
     * Timestamp of last navigation event.
     *
     * Can be skipped if isManualCheck is true.
     *
     * TODO: Automate checking for this field:
     * - If isManualCheck is true, lastNavigationTimestamp should be skipped.
     * - If isManualCheck is false, lastNavigationTimestamp should be required.
     */
    lastNavigationTimestamp: zod.number().optional(),

    /**
     * Next available version for auto-update.
     */
    nextVersion: zod.string(),

    /**
     * Update discovered via manual check triggered by user or automatically.
     */
    isManualCheck: zod.boolean(),
});

/**
 * Auto-update state data.
 */
export type AutoUpdateState = zod.infer<typeof AutoUpdateStateValidator>;

/**
 * Auto-update configuration validator.
 */
export const AutoUpdateConfigValidator = zod.object({
    /**
     * Time to wait before showing the update icon after update becomes available.
     */
    ICON_DELAY_MS: zod.number().optional(),

    /**
     * Time of inactivity before automatically applying update.
     */
    IDLE_THRESHOLD_MS: zod.number().optional(),

    /**
     * Interval for checking if conditions are met to apply auto-update.
     */
    CHECK_INTERVAL_MS: zod.number().optional(),
}).strict();

/**
 * Auto-update configuration data.
 */
export type AutoUpdateConfig = zod.infer<typeof AutoUpdateConfigValidator>;
