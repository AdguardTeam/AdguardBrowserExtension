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

import { AUTO_DISABLE_FILTERS_KEY } from '../../common/constants';
import { getZodErrorMessage } from '../../common/error';
import { logger } from '../../common/logger';
import {
    autoDisableFiltersStorageDataValidator,
    defaultAutoDisableFiltersState,
    type AutoDisableFiltersStorageData,
} from '../schema';
import { StringStorage } from '../utils/string-storage';

import { browserStorage } from './shared-instances';

/**
 * Storage for the language filters auto-disable state.
 *
 * Reads and updates run in one queue, so each update sees the result of the previous one.
 * The cached state is the source of truth: an update changes it at once and then persists it.
 * A failed write is retried with a growing delay; any later successful write persists it too.
 */
export class AutoDisableFiltersStorage extends StringStorage<
    typeof AUTO_DISABLE_FILTERS_KEY,
    AutoDisableFiltersStorageData,
    'async'
> {
    /**
     * Delay before the first retry of a failed storage write.
     */
    public static readonly RETRY_DELAY_MS = 60 * 1000;

    /**
     * Maximum delay between retries of a failed storage write.
     */
    public static readonly MAX_RETRY_DELAY_MS = 60 * 60 * 1000;

    /**
     * Promise chain which serializes reads and updates.
     */
    private queue: Promise<unknown> = Promise.resolve();

    /**
     * Timer id of a scheduled retry.
     */
    private retryTimerId: number | null = null;

    /**
     * Delay before the next retry; doubles after each failed retry.
     */
    private retryDelayMs = AutoDisableFiltersStorage.RETRY_DELAY_MS;

    /**
     * Creates a new {@link AutoDisableFiltersStorage}.
     */
    constructor() {
        super(AUTO_DISABLE_FILTERS_KEY, browserStorage);
    }

    /**
     * Returns the state after all previously queued updates.
     *
     * @returns Current state.
     */
    public getState(): Promise<AutoDisableFiltersStorageData> {
        return this.enqueue(() => this.readState());
    }

    /**
     * Applies an update to the current state and persists the result.
     *
     * Rejects only when the state cannot be read. A failed write keeps the new
     * state in the cache and is retried.
     *
     * @param updater Returns the next state, or the same object when nothing changes.
     *
     * @returns Promise resolved after the update is applied.
     */
    public update(
        updater: (state: AutoDisableFiltersStorageData) => AutoDisableFiltersStorageData,
    ): Promise<void> {
        return this.enqueue(async () => {
            const state = await this.readState();
            const nextState = updater(state);

            if (nextState !== state) {
                await this.write(nextState);
            }
        });
    }

    /**
     * Starts a new observation period and removes pending notifications.
     * Does not read the old state, so it also works when the stored state cannot be read.
     *
     * @returns Promise resolved after the reset is applied.
     */
    public reset(): Promise<void> {
        return this.enqueue(() => this.write(defaultAutoDisableFiltersState));
    }

    /**
     * Returns cached state or loads it from the storage.
     * Must be called within the queue.
     *
     * Read failures are propagated: otherwise valid stored data could be replaced by defaults.
     *
     * @returns Cached or loaded state; defaults when the stored data cannot be parsed.
     */
    private async readState(): Promise<AutoDisableFiltersStorageData> {
        if (this.data !== undefined) {
            return this.data;
        }

        const stored = await this.read();
        let state: AutoDisableFiltersStorageData = defaultAutoDisableFiltersState;

        try {
            if (typeof stored === 'string') {
                state = autoDisableFiltersStorageDataValidator.parse(JSON.parse(stored));
            }
        } catch (e) {
            logger.warn(`[ext.AutoDisableFiltersStorage.readState]: cannot parse state, using defaults: ${getZodErrorMessage(e)}`);
        }

        this.setCache(state);

        return state;
    }

    /**
     * Caches the state and persists it, scheduling a retry if the write fails.
     * Must be called within the queue.
     *
     * @param state State to write.
     */
    private async write(state: AutoDisableFiltersStorageData): Promise<void> {
        this.setCache(state);

        try {
            await this.storage.set(this.key, JSON.stringify(state));
        } catch (e) {
            logger.error(`[ext.AutoDisableFiltersStorage.write]: cannot save state, will retry: ${getZodErrorMessage(e)}`);
            this.scheduleRetry();
            return;
        }

        this.retryDelayMs = AutoDisableFiltersStorage.RETRY_DELAY_MS;
        if (this.retryTimerId !== null) {
            // eslint-disable-next-line no-restricted-globals
            self.clearTimeout(this.retryTimerId);
            this.retryTimerId = null;
        }
    }

    /**
     * Schedules a write of the cached state and doubles the delay for the next retry.
     */
    private scheduleRetry(): void {
        if (this.retryTimerId !== null) {
            return;
        }

        const delayMs = this.retryDelayMs;
        this.retryDelayMs = Math.min(delayMs * 2, AutoDisableFiltersStorage.MAX_RETRY_DELAY_MS);
        // eslint-disable-next-line no-restricted-globals
        this.retryTimerId = self.setTimeout(() => {
            this.retryTimerId = null;
            this.enqueue(() => this.write(this.getData()));
        }, delayMs);
    }

    /**
     * Runs the task after all previously queued tasks finish.
     *
     * @param task Task to run.
     *
     * @returns Promise resolved with the task result.
     */
    private enqueue<T>(task: () => Promise<T>): Promise<T> {
        const result = this.queue.then(task);
        this.queue = result.catch(() => undefined);

        return result;
    }
}

export const autoDisableFiltersStorage = new AutoDisableFiltersStorage();
