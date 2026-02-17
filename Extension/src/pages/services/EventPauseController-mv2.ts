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

import { NotifierType } from '../../common/constants';
import { logger } from '../../common/logger';

/**
 * Type of change being tracked by the event pause controller.
 * Used for identifying change type in method parameters.
 */
export enum ChangeType {
    /** Filter enable/disable change */
    Filter = 'filter',
    /** Filter group enable/disable change */
    Group = 'group',
}

/**
 * Base type for pending changes.
 * Contains common fields shared by all pending change types.
 */
type PendingChangeBase = {
    /** Expected state after the change completes (true = enabled, false = disabled) */
    expectedState: boolean;
};

/**
 * Represents a pending filter enable/disable change.
 * Duck typing: presence of filterId indicates this is a filter change.
 */
type PendingFilterChange = PendingChangeBase & {
    /** ID of the filter being changed */
    filterId: number;
};

/**
 * Represents a pending filter group enable/disable change.
 * Duck typing: presence of groupId indicates this is a group change.
 */
type PendingGroupChange = PendingChangeBase & {
    /** ID of the filter group being changed */
    groupId: number;
};

/**
 * Union of all pending change types.
 * Type can be determined by checking which ID field is present (duck typing).
 */
type PendingChange = PendingFilterChange | PendingGroupChange;

/**
 * Controller for temporarily pausing background event processing
 * to prevent toggle reversion during user interactions.
 *
 * MV2 only - MV3 uses blocking UI approach.
 */
class EventPauseController {
    /**
     * Whether event processing is currently paused.
     * When true, most background events will be skipped.
     */
    private isPaused = false;

    /**
     * Map of pending changes keyed by a unique identifier (e.g., "filter-1", "group-3").
     * Tracks all user-initiated changes that haven't been confirmed yet.
     */
    private pendingChanges: Map<string, PendingChange> = new Map();

    /**
     * Timeout ID for the debounce timer that schedules event resumption.
     * Cleared and reset whenever a new change is registered.
     */
    private resumeTimeoutId: ReturnType<typeof setTimeout> | null = null;

    /**
     * Debounce duration after last user action before resuming event listening.
     * This ensures rapid consecutive toggles don't cause issues.
     */
    private static readonly RESUME_DELAY_MS = 2000;

    /**
     * Maximum time to keep events paused regardless of pending changes.
     * Safety mechanism to prevent indefinite pausing.
     */
    private static readonly MAX_PAUSE_DURATION_MS = 10000;

    /**
     * Timeout ID for the maximum pause duration safety timer.
     * Forces event resumption after MAX_PAUSE_DURATION_MS regardless of pending changes.
     */
    private maxPauseTimeoutId: ReturnType<typeof setTimeout> | null = null;

    /**
     * List of event types that should be skipped when events are paused.
     * These are the events that can cause toggle reversion.
     */
    private static readonly EVENTS_TO_SKIP: string[] = [
        NotifierType.SettingUpdated,
        NotifierType.RequestFilterUpdated,
    ];

    /**
     * Called when user initiates a toggle change.
     * Pauses event processing and tracks the expected state.
     *
     * @param type Type of change (filter or group)
     * @param id ID of the filter or group being changed
     * @param expectedState Expected state after change (true = enabled, false = disabled)
     */
    registerPendingChange(
        type: ChangeType,
        id: number,
        expectedState: boolean,
    ): void {
        const key = `${type}-${id}`;

        const meta = {
            expectedState,
        };

        const pendingChange = type === ChangeType.Filter
            ? { filterId: id, ...meta }
            : { groupId: id, ...meta };

        this.pendingChanges.set(key, pendingChange);

        this.pause();
        this.scheduleResume();
    }

    /**
     * Called when background confirms a state change (success).
     * Removes from pending if state matches expected.
     *
     * @param type Type of change (filter or group)
     * @param id ID of the filter or group that was changed
     * @param actualState Actual state confirmed by background (true = enabled, false = disabled)
     */
    confirmChange(
        type: ChangeType,
        id: number,
        actualState: boolean,
    ): void {
        const key = `${type}-${id}`;
        const pending = this.pendingChanges.get(key);

        if (pending && pending.expectedState === actualState) {
            this.pendingChanges.delete(key);
        }

        if (this.pendingChanges.size === 0) {
            this.scheduleResume();
        }
    }

    /**
     * Called when a toggle operation fails (error from background).
     * Removes the pending change regardless of state - the UI has already
     * been reverted, so we just need to clean up and allow events to resume.
     *
     * @param type Type of change (filter or group)
     * @param id ID of the filter or group that failed to change
     */
    cancelChange(type: ChangeType, id: number): void {
        const key = `${type}-${id}`;
        this.pendingChanges.delete(key);

        if (this.pendingChanges.size === 0) {
            this.scheduleResume();
        }
    }

    /**
     * Check if events should currently be processed.
     *
     * @returns True if events should be processed, false if they should be paused
     */
    shouldProcessEvents(): boolean {
        return !this.isPaused;
    }

    /**
     * Check if a specific event type should be skipped.
     * Only events that could cause toggle reversion should be skipped.
     *
     * @param eventType The type of event to check (e.g., 'RequestFilterUpdated')
     *
     * @returns True if the event should be skipped, false if it should be processed
     */
    shouldSkipEvent(eventType: string): boolean {
        if (!this.isPaused) {
            return false;
        }

        return EventPauseController.EVENTS_TO_SKIP.includes(eventType);
    }

    /**
     * Pauses event processing and starts the maximum pause duration timer.
     * Called internally when a pending change is registered.
     */
    private pause(): void {
        this.isPaused = true;

        if (this.maxPauseTimeoutId) {
            clearTimeout(this.maxPauseTimeoutId);
        }

        this.maxPauseTimeoutId = setTimeout(() => {
            this.forceResume();
        }, EventPauseController.MAX_PAUSE_DURATION_MS);
    }

    /**
     * Schedules event resumption after the debounce delay.
     * Clears any existing resume timer and starts a new one.
     * Events will only resume if there are no pending changes when the timer fires.
     */
    private scheduleResume(): void {
        if (this.resumeTimeoutId) {
            clearTimeout(this.resumeTimeoutId);
        }

        this.resumeTimeoutId = setTimeout(() => {
            if (this.pendingChanges.size === 0) {
                this.resume();
            }
        }, EventPauseController.RESUME_DELAY_MS);
    }

    /**
     * Resumes event processing and clears all state.
     * Clears pending changes map and all active timers.
     */
    private resume(): void {
        this.isPaused = false;
        this.pendingChanges.clear();

        if (this.resumeTimeoutId) {
            clearTimeout(this.resumeTimeoutId);
            this.resumeTimeoutId = null;
        }

        if (this.maxPauseTimeoutId) {
            clearTimeout(this.maxPauseTimeoutId);
            this.maxPauseTimeoutId = null;
        }
    }

    /**
     * Forces event resumption after maximum pause duration is exceeded.
     * Logs a warning if there are still pending changes that haven't been confirmed.
     * This is a safety mechanism to prevent indefinite event pausing.
     */
    private forceResume(): void {
        if (this.pendingChanges.size > 0) {
            logger.warn('[ext.EventPauseController.forceResume]: Force resuming with pending changes:', Array.from(this.pendingChanges.entries()));
        }
        this.resume();
    }

    /**
     * Cleanup when options page unmounts.
     * Resumes event processing and clears all state to prevent memory leaks.
     */
    dispose(): void {
        this.resume();
    }
}

export const eventPauseController = new EventPauseController();
