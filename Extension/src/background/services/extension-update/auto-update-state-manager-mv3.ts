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
 * Manages persistence of extension update state to chrome.storage.local.
 * Handles state caching and throttled writes for update orchestration.
 *
 * ## State Architecture:
 *
 * This manager stores a combination of:
 * 1. **SharedUpdateState**
 * 2. **AutoUpdateSpecificState**.
 *
 * These are combined into `AutoUpdateState` and stored together for efficiency.
 *
 * Note: **ManualUpdateMetadata** is stored separately by ManualUpdateHandler
 * since it has a different lifecycle (post-reload notification data).
 *
 * ## Why This State Manager Exists:
 *
 * We need to persist this state across service worker restarts since SW can restart
 * in less time than the configured idle threshold. For example:
 * - 10:00 `onUpdateAvailable` received.
 * - 10:05 `lastNavigationTimestamp` last updated.
 * - 10:10 service worker restarts and loads state.
 * - 10:35 service worker detects idle state and performs auto-update (30 minutes after last activity).
 *
 * Without persisting these timestamps to storage, we could potentially wait forever
 * for idle state and never perform auto-update.
 *
 * ## Why Throttling:
 *
 * `lastNavigationTimestamp` updates on every navigation event, so throttling prevents
 * excessive storage writes while maintaining SW resilience.
 *
 * Note: Despite the name "AutoUpdateState", this manager handles both shared state
 * and auto-update specific state (timestamps).
 * The name reflects the primary use case (auto-update orchestration).
 */
export class AutoUpdateStateManager implements StorageInterface<
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
    public save: () => void;

    /**
     * Creates AutoUpdateStateManager instance and initializes throttled save method.
     */
    constructor() {
        this.save = throttle(this.saveToStorage.bind(this), AutoUpdateStateManager.SAVE_THROTTLE_MS);
    }

    /**
     * Saves state to chrome.storage.local.
     */
    private saveToStorage(): void {
        if (!this.state) {
            return;
        }

        browserStorage.set(this.stateKey, JSON.stringify(this.state)).catch((error) => {
            logger.debug('[ext.AutoUpdateStateManager.saveToStorage]: Failed to save state:', error);
        });
    }

    /**
     * Initializes state: loads from storage, validates, and caches.
     * Initializes with empty state if no saved data found.
     *
     * @returns Loaded state or null if not found/invalid.
     */
    public async init(): Promise<AutoUpdateState | null> {
        try {
            const stateStr = await browserStorage.get(this.stateKey);

            if (typeof stateStr !== 'string') {
                // Initialize with empty state object to allow setting values later
                this.setCache({});
                return null;
            }

            const state = AutoUpdateStateValidator.parse(JSON.parse(stateStr));

            this.setCache(state);

            return state;
        } catch (error) {
            logger.error('[ext.AutoUpdateStateManager.init]: Failed to load auto-update state:', error);
            // Initialize with empty state on error to prevent undefined state issues
            this.setCache({});
            return null;
        }
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
            throw AutoUpdateStateManager.createNotInitializedError();
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
            throw AutoUpdateStateManager.createNotInitializedError();
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
            throw AutoUpdateStateManager.createNotInitializedError();
        }

        if (this.state[field] !== undefined) {
            delete this.state[field];
            this.save();
        }
    }

    /**
     * Clears state from cache and storage.
     * Reinitializes with empty state to allow future operations.
     */
    public async clear(): Promise<void> {
        // Reinitialize with empty state instead of undefined to prevent errors
        this.state = {};

        try {
            await browserStorage.remove(this.stateKey);
        } catch (error) {
            logger.error('[ext.AutoUpdateStateManager.clear]: Failed to clear storage:', error);
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
