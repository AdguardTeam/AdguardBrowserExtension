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

import zod from 'zod';

import { logger } from '../../../common/logger';
import { EXTENSION_UPDATE_CHECK_KEYS, NotifierType } from '../../../common/constants';
import { browserStorage } from '../../storages';
import { Prefs } from '../../prefs';
import { Version } from '../../utils/version';
import { notifier } from '../../notifier';
import { BackendUpdateChecker } from '../extension-update/backend-update-checker';
import { UpdateCheckStatus } from '../extension-update/types';

/**
 * Interval for the periodic check timer (20 seconds in milliseconds).
 */
const CHECK_INTERVAL_MS = 20_000;

/**
 * Minimum time between update checks (24 hours in milliseconds).
 */
const CHECK_PERIOD_MS = 24 * 60 * 60 * 1000;

/**
 * Validator for the last successful update-check timestamp from storage.
 */
const lastCheckTimestampValidator = zod.number().nonnegative().finite();

/**
 * Service responsible for periodically checking extension update availability
 * via the AdGuard Backend API.
 *
 * This service:
 * - Checks for updates on extension start if 24h has elapsed since the last check.
 * - Registers a setInterval (20-second tick) to re-check every 24 hours.
 * - Persists the available update version to chrome.storage.local.
 * - Feeds the About page indicator for both MV2 and MV3.
 * - Operates independently of the existing MV3 ExtensionUpdateService.
 */
export class UpdateCheckService {
    /**
     * Timer ID for the periodic check interval.
     */
    private intervalId: number | null = null;

    /**
     * In-memory cache of the last-check timestamp.
     *
     * Read from storage once on init. Updated in-memory immediately after
     * each check (before storage write). The 20s tick reads from this cache,
     * not from storage, to avoid storage reads on every tick.
     */
    private lastCheckTimestamp: number | undefined;

    /**
     * Whether an update check is currently running.
     */
    private isChecking = false;

    /**
     * Initializes the update check service.
     *
     * On start, reads the last-check timestamp from storage (once) and caches
     * it in memory. If more than 24 hours have elapsed (or no prior check
     * exists), performs an update check immediately. Then registers a
     * setInterval to poll every 20 seconds. The tick reads from the
     * in-memory cache, not from storage.
     *
     * @returns Promise that resolves when the initial check (if any) completes.
     */
    public async init(): Promise<void> {
        // Clear an existing interval if init is called again in the same JS context.
        if (this.intervalId !== null) {
            // eslint-disable-next-line no-restricted-globals
            self.clearInterval(this.intervalId);
            this.intervalId = null;
        }

        // Reset storage-derived cache on every init so invalid or unreadable storage
        // cannot reuse a timestamp from a previous init in the same JS context.
        this.lastCheckTimestamp = undefined;

        // Read from storage once, cache in memory.
        // If storage read fails, lastCheckTimestamp stays undefined, so one check runs.
        try {
            const stored = await browserStorage.get(EXTENSION_UPDATE_CHECK_KEYS.timestamp);
            const timestamp = UpdateCheckService.parseTimestamp(stored);
            if (timestamp !== undefined) {
                this.lastCheckTimestamp = timestamp;
            }
        } catch (e) {
            logger.error('[ext.UpdateCheckService.init]: Failed to read last-check timestamp from storage:', e);
        }

        // Clear stale available version if the extension was updated
        // to a version >= the stored available version.
        await UpdateCheckService.clearStaleAvailableVersion();

        await this.maybeCheck();

        // eslint-disable-next-line no-restricted-globals
        this.intervalId = self.setInterval(
            () => {
                this.maybeCheck().catch((e) => {
                    logger.error('[ext.UpdateCheckService.init]: Periodic check failed:', e);
                });
            },
            CHECK_INTERVAL_MS,
        );
    }

    /**
     * Parses the last-check timestamp from browser storage.
     *
     * `browser.storage.local` preserves numeric values.
     *
     * @param rawTimestamp Raw timestamp value from storage.
     *
     * @returns Parsed timestamp, or undefined when the value is invalid.
     */
    private static parseTimestamp(rawTimestamp: unknown): number | undefined {
        const parseResult = lastCheckTimestampValidator.safeParse(rawTimestamp);

        return parseResult.success ? parseResult.data : undefined;
    }

    /**
     * Stores the currently available update version and notifies opened pages.
     *
     * @param version Available version to store, or undefined to clear it.
     */
    private static async setAvailableUpdateVersion(version?: string): Promise<void> {
        if (version) {
            await browserStorage.set(
                EXTENSION_UPDATE_CHECK_KEYS.availableVersion,
                version,
            );
        } else {
            await browserStorage.remove(EXTENSION_UPDATE_CHECK_KEYS.availableVersion);
        }

        notifier.notifyListeners(NotifierType.AvailableUpdateVersionChanged, version);
    }

    /**
     * Returns the available update version from extension storage.
     *
     * @returns Available update version, or undefined if it is missing or invalid.
     */
    public static async getAvailableUpdateVersion(): Promise<string | undefined> {
        try {
            const rawVersion = await browserStorage.get(EXTENSION_UPDATE_CHECK_KEYS.availableVersion);

            return typeof rawVersion === 'string' ? rawVersion : undefined;
        } catch (e) {
            logger.error('[ext.UpdateCheckService.getAvailableUpdateVersion]: Failed to read available update version:', e);

            return undefined;
        }
    }

    /**
     * Clears the stored available update version if the current extension version
     * is greater than or equal to it. This prevents showing a stale update
     * message after the extension has been updated.
     *
     * @returns Promise that resolves when the check completes.
     */
    private static async clearStaleAvailableVersion(): Promise<void> {
        let storedVersion: unknown;

        try {
            storedVersion = await browserStorage.get(
                EXTENSION_UPDATE_CHECK_KEYS.availableVersion,
            );

            if (typeof storedVersion !== 'string') {
                return;
            }

            const currentVersion = new Version(Prefs.version);
            const availableVersion = new Version(storedVersion);

            // If current version >= available version, the extension was updated.
            // Clear the stale version to prevent showing an outdated update message.
            if (currentVersion.compare(availableVersion) >= 0) {
                await UpdateCheckService.setAvailableUpdateVersion();
                logger.debug('[ext.UpdateCheckService.clearStaleAvailableVersion]: Cleared stale available version:', storedVersion);
            }
        } catch (e) {
            logger.error('[ext.UpdateCheckService.clearStaleAvailableVersion]: Failed to clear stale available version:', e);

            if (typeof storedVersion === 'string') {
                try {
                    await UpdateCheckService.setAvailableUpdateVersion();
                } catch (removeError) {
                    logger.error('[ext.UpdateCheckService.clearStaleAvailableVersion]: Failed to remove malformed version:', removeError);
                }
            }
        }
    }

    /**
     * Checks if 24 hours have elapsed since the last check attempt,
     * and if so, performs an update check.
     *
     * @returns Promise that resolves when the check (if any) completes.
     */
    private async maybeCheck(): Promise<void> {
        // Read from memory instead of storage to keep interval ticks cheap.
        if (
            typeof this.lastCheckTimestamp === 'number'
            && Date.now() - this.lastCheckTimestamp < CHECK_PERIOD_MS
        ) {
            return;
        }

        await this.checkUpdate();
    }

    /**
     * Performs an update check against the backend API.
     *
     * Persists the last-check timestamp after every backend response.
     * On update available, persists the version to storage.
     * On no update, clears any previously stored version.
     * On error, logs the error without retrying before the next check period.
     *
     * @returns Promise that resolves when the check completes.
     */
    public async checkUpdate(): Promise<void> {
        if (this.isChecking) {
            return;
        }

        this.isChecking = true;

        try {
            const result = await BackendUpdateChecker.checkUpdate();

            switch (result.status) {
                case UpdateCheckStatus.UpdateAvailable: {
                    await UpdateCheckService.setAvailableUpdateVersion(result.version);
                    logger.debug(`[ext.UpdateCheckService.checkUpdate]: Update available: ${result.version}`);
                    break;
                }
                case UpdateCheckStatus.NoUpdate:
                case UpdateCheckStatus.NoContent: {
                    await UpdateCheckService.setAvailableUpdateVersion();
                    logger.debug('[ext.UpdateCheckService.checkUpdate]: No update available');
                    break;
                }
                case UpdateCheckStatus.Error: {
                    logger.error('[ext.UpdateCheckService.checkUpdate]: Check failed:', result.error);
                    break;
                }
                default: {
                    const exhaustiveCheck: never = result;
                    return exhaustiveCheck;
                }
            }

            // Update memory first so the next interval tick sees the fresh timestamp.
            this.lastCheckTimestamp = Date.now();
            await browserStorage.set(
                EXTENSION_UPDATE_CHECK_KEYS.timestamp,
                this.lastCheckTimestamp,
            );
        } catch (e) {
            logger.error('[ext.UpdateCheckService.checkUpdate]: Unexpected error:', e);
        } finally {
            this.isChecking = false;
        }
    }
}

export const updateCheckService = new UpdateCheckService();
