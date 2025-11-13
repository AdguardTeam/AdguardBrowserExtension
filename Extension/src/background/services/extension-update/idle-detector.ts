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

import { logger } from '../../../common/logger';

/**
 * Detects browser idle state by monitoring navigation events.
 * Used to determine when to automatically apply extension updates.
 */
export class IdleDetector {
    /**
     * Last navigation event timestamp in milliseconds.
     */
    #lastEventTimestamp: number;

    /**
     * Callback invoked when navigation is detected.
     */
    private readonly onNavigationDetected: (timestamp: number) => void;

    /**
     * Creates an IdleDetector instance and automatically starts monitoring.
     *
     * @param options Configuration options.
     * @param options.onNavigation Callback invoked when navigation is detected.
     * Receives the navigation timestamp for state persistence.
     * @param options.initialTimestamp Optional initial timestamp.
     * Defaults to current time if not provided.
     */
    constructor(options: {
        onNavigation: (timestamp: number) => void;
        initialTimestamp?: number;
    }) {
        this.onNavigationDetected = options.onNavigation;
        this.#lastEventTimestamp = options.initialTimestamp ?? Date.now();

        // Bind method to preserve 'this' context when used as event listener callback
        this.handleNavigation = this.handleNavigation.bind(this);

        // Register listener
        chrome.webNavigation.onCommitted.addListener(this.handleNavigation);

        logger.debug('[ext.IdleDetector.constructor]: Navigation monitoring started automatically');
    }

    /**
     * Stops monitoring and cleans up listeners.
     */
    public stopMonitoring(): void {
        chrome.webNavigation.onCommitted.removeListener(this.handleNavigation);
        logger.debug('[ext.IdleDetector.stopMonitoring]: Navigation monitoring stopped');
    }

    /**
     * Returns milliseconds elapsed since last navigation event.
     *
     * @returns Time in milliseconds since last activity.
     */
    public getIdleDuration(): number {
        return Date.now() - this.#lastEventTimestamp;
    }

    /**
     * Handles navigation events.
     * Updates timestamp and invokes callback.
     */
    private handleNavigation(): void {
        this.#lastEventTimestamp = Date.now();

        const prettyTimestamp = new Date(this.#lastEventTimestamp).toISOString();
        logger.trace(`[ext.IdleDetector.handleNavigation]: Navigation event detected, updating timestamp: ${prettyTimestamp}`);

        // Invoke callback with timestamp
        this.onNavigationDetected(this.#lastEventTimestamp);
    }
}
