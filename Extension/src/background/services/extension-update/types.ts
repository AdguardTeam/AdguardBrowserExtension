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
 * Field names for AutoUpdateState to avoid magic strings.
 */
export const AutoUpdateStateField = {
    nextVersion: 'nextVersion',
    isManualCheck: 'isManualCheck',
    updateAvailableTimestamp: 'updateAvailableTimestamp',
    lastNavigationTimestamp: 'lastNavigationTimestamp',
} as const;

/**
 * Shared update state validator (used by both manual and auto-update).
 */
export const SharedUpdateStateValidator = zod.object({
    /**
     * Next available version for update.
     */
    [AutoUpdateStateField.nextVersion]: zod.string().optional(),

    /**
     * Whether update was discovered via manual check (user-triggered)
     * or automatically (Chrome background update).
     */
    [AutoUpdateStateField.isManualCheck]: zod.boolean().optional(),
});

/**
 * Shared update state (used by both manual and auto-update).
 */
export type SharedUpdateState = zod.infer<typeof SharedUpdateStateValidator>;

/**
 * Auto-update specific state validator (timestamps for orchestration).
 */
export const AutoUpdateSpecificStateValidator = zod.object({
    /**
     * Timestamp when update became available (for icon delay calculation).
     * Only used for automatic updates.
     */
    [AutoUpdateStateField.updateAvailableTimestamp]: zod.number().optional(),

    /**
     * Timestamp of last navigation event (for idle detection).
     * Only used for automatic updates.
     */
    [AutoUpdateStateField.lastNavigationTimestamp]: zod.number().optional(),
});

/**
 * Auto-update specific state (timestamps for orchestration).
 */
export type AutoUpdateSpecificState = zod.infer<typeof AutoUpdateSpecificStateValidator>;

/**
 * Manual update notification metadata validator.
 * Stored before reload, retrieved once by UI for notification, then deleted.
 */
export const ManualUpdateMetadataValidator = zod.object({
    /**
     * Version of the extension where the manual update was initialized.
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
 * Manual update notification metadata.
 * Stored before reload, retrieved once by UI for notification, then deleted.
 */
export type ManualUpdateMetadata = zod.infer<typeof ManualUpdateMetadataValidator>;

/**
 * Combined update state validator (shared + auto-specific).
 * This is stored together in chrome.storage.local for efficiency.
 */
export const AutoUpdateStateValidator = SharedUpdateStateValidator.merge(
    AutoUpdateSpecificStateValidator,
);

/**
 * Combined update state (shared + auto-specific).
 */
export type AutoUpdateState = SharedUpdateState & AutoUpdateSpecificState;

/**
 * Auto-update configuration validator.
 */
export const AutoUpdateConfigValidator = zod.object({
    /**
     * Time to wait before showing the update icon after update becomes available.
     */
    iconDelayMs: zod.number().optional(),

    /**
     * Time of inactivity before automatically applying update.
     */
    idleThresholdMs: zod.number().optional(),

    /**
     * Interval for checking if conditions are met to apply auto-update.
     */
    checkIntervalMs: zod.number().optional(),
}).strict();

/**
 * Auto-update configuration data.
 */
export type AutoUpdateConfig = zod.infer<typeof AutoUpdateConfigValidator>;
