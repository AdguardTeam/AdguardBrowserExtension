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

import { throttle } from 'lodash-es';

import { AUTO_UPDATE_STATE_KEY_MV3 } from '../../../common/constants';
import { logger } from '../../../common/logger';
import { type StorageInterface } from '../../../common/storage';
import { browserStorage } from '../../storages';

import { type AutoUpdateState, AutoUpdateStateValidator } from './types';

/**
 * Manages persistence of auto-update state to chrome.storage.local.
 * Handles state caching and throttled writes.
 *
 * We need to store this state to persist across service worker restarts,
 * since service worker can restart in less time than configured idle threshold,
 * so both `updateAvailableTimestamp` and `lastNavigationTimestamp` are important
 * to save in storage, e.g.:
 * - 10:00 `onUpdateAvailable` received;
 * - 10:05 `lastNavigationTimestamp` last updated;
 * - 10:10 service worker restarts and loads state;
 * - 10:35 service worker detects idle state and performs auto-update
 *   (30 minutes after last activity).
 *
 * Without saving these timestamps to storage, we could potentially wait
 * forever for idle state and never perform auto-update.
 *
 * Also we store information about next version and isManualCheck flag
 * to show update icon after SW restarts.
 *
 * FIXME: It not AutoUpdateState anymore, rename.
 */
export class UpdateStateManager implements StorageInterface<
    keyof AutoUpdateState,
    AutoUpdateState[keyof AutoUpdateState]
> {
    /**
     * Throttle interval for state saves in milliseconds.
     */
    private static readonly SAVE_THROTTLE_MS = 5 * 1000;

    /**
     * Storage key for auto-update state.
     */
    private readonly stateKey = AUTO_UPDATE_STATE_KEY_MV3;

    /**
     * In-memory cache of auto-update state.
     */
    private state: AutoUpdateState | undefined;

    /**
     * Throttled save to chrome.storage.local.
     */
    public save = throttle((): void => {
        if (!this.state) {
            return;
        }

        browserStorage.set(this.stateKey, JSON.stringify(this.state)).catch((error) => {
            logger.debug('[ext.UpdateStateManager]: Failed to save state:', error);
        });
    }, UpdateStateManager.SAVE_THROTTLE_MS);

    /**
     * Gets the next version from state.
     *
     * @returns Next version or undefined if not set.
     */
    public get nextVersion(): string | undefined {
        try {
            return this.get('nextVersion');
        } catch {
            return undefined;
        }
    }

    /**
     * Sets the next version in state.
     */
    public set nextVersion(version: string | undefined) {
        if (version === undefined) {
            return;
        }
        try {
            this.set('nextVersion', version);
        } catch {
            logger.debug('[ext.UpdateStateManager.nextVersion]: Failed to set nextVersion');
        }
    }

    /**
     * Gets the isManualCheck flag from state.
     *
     * @returns True if last check was manual, false otherwise.
     */
    public get isManualCheck(): boolean {
        try {
            return this.get('isManualCheck');
        } catch {
            return false;
        }
    }

    /**
     * Sets the isManualCheck flag in state.
     */
    public set isManualCheck(value: boolean) {
        try {
            this.set('isManualCheck', value);
        } catch {
            logger.debug('[ext.UpdateStateManager.isManualCheck]: Failed to set isManualCheck');
        }
    }

    /**
     * Gets the update available timestamp from state.
     *
     * @returns Timestamp or undefined if not set.
     */
    public get updateAvailableTimestamp(): number | undefined {
        try {
            return this.get('updateAvailableTimestamp');
        } catch {
            return undefined;
        }
    }

    /**
     * Sets the update available timestamp in state.
     */
    public set updateAvailableTimestamp(timestamp: number | undefined) {
        if (timestamp === undefined) {
            return;
        }
        try {
            this.set('updateAvailableTimestamp', timestamp);
        } catch {
            logger.debug('[ext.UpdateStateManager.updateAvailableTimestamp]: Failed to set updateAvailableTimestamp');
        }
    }

    /**
     * Initializes state: loads from storage, validates, and caches.
     * Resets to undefined state if data is not valid or not found.
     *
     * @returns Loaded state or null if not found/invalid.
     */
    public async init(): Promise<AutoUpdateState | null> {
        try {
            const stateStr = await browserStorage.get(this.stateKey);

            if (typeof stateStr !== 'string') {
                return null;
            }

            const state = AutoUpdateStateValidator.parse(JSON.parse(stateStr));

            this.setCache(state);

            return state;
        } catch (error) {
            logger.error('[ext.UpdateStateManager.init]: Failed to load auto-update state:', error);
            return null;
        }
    }

    /**
     * Returns entire cached state.
     *
     * @returns Auto-update state.
     *
     * @throws Error if state is not initialized.
     */
    public getData(): AutoUpdateState {
        if (!this.state) {
            throw UpdateStateManager.createNotInitializedError();
        }

        return this.state;
    }

    /**
     * Sets state to memory cache.
     * Does NOT trigger save.
     *
     * @param state State data to cache.
     */
    public setCache(state: AutoUpdateState): void {
        this.state = state;
    }

    /**
     * Sets state to cache and triggers throttled save.
     *
     * @param state State data to cache and save.
     */
    public setData(state: AutoUpdateState): void {
        this.setCache(state);
        this.save();
    }

    /**
     * Updates specific field in state and triggers throttled save.
     * Implements StorageInterface.
     *
     * @param field Field to update.
     * @param value New value.
     *
     * @throws Error if state is not initialized.
     */
    public set<K extends keyof AutoUpdateState>(
        field: K,
        value: AutoUpdateState[K],
    ): void {
        if (!this.state) {
            throw UpdateStateManager.createNotInitializedError();
        }

        this.state[field] = value;
        this.save();
    }

    /**
     * Returns specific field from cached state.
     * Implements StorageInterface.
     *
     * @param field Field to get.
     *
     * @returns Field value.
     *
     * @throws Error if state is not initialized.
     */
    public get<K extends keyof AutoUpdateState>(field: K): AutoUpdateState[K] {
        if (!this.state) {
            throw UpdateStateManager.createNotInitializedError();
        }

        return this.state[field];
    }

    /**
     * Removes a field from state.
     * Implements StorageInterface.
     *
     * @param field Field to remove.
     *
     * @throws Error if state is not initialized.
     */
    public remove<K extends keyof AutoUpdateState>(field: K): void {
        if (!this.state) {
            throw UpdateStateManager.createNotInitializedError();
        }

        if (this.state[field] !== undefined) {
            delete this.state[field];
            this.save();
        }
    }

    /**
     * Clears state from cache and storage.
     */
    public async clear(): Promise<void> {
        this.state = undefined;

        try {
            await browserStorage.remove(this.stateKey);
        } catch (error) {
            logger.error('[ext.UpdateStateManager.clear]: Failed to clear storage:', error);
        }
    }

    /**
     * Helper to create initialization error.
     *
     * @returns Error with message.
     */
    private static createNotInitializedError(): Error {
        return new Error('Auto-update state is not initialized');
    }
}
