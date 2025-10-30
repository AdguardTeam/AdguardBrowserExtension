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

import { AUTO_UPDATE_CONFIG_KEY_MV3 } from '../../../common/constants';
import { logger } from '../../../common/logger';
import { browserStorage } from '../../storages';

import { type AutoUpdateConfig, AutoUpdateConfigValidator } from './types';
import { IdleDetector } from './idle-detector';
import { type UpdateStateManager } from './update-state-manager';

/**
 * Manages automatic update orchestration after Chrome downloads an update.
 *
 * Responsibilities:
 * - Create and manage IdleDetector for tracking browser inactivity.
 * - Start/stop periodic checks for idle conditions.
 * - Apply update when idle threshold is met.
 * - Clean up resources.
 */
export class AutoUpdateManager {
    /**
     * Idle detector for tracking browser navigation activity.
     */
    private idleDetector: IdleDetector | null = null;

    /**
     * Interval ID for periodic auto-update condition checks.
     */
    private checkIntervalId: number | undefined;

    /**
     * State manager for persistence across service worker restarts.
     */
    private readonly stateManager: UpdateStateManager;

    /**
     * Auto-update configuration.
     */
    private config: Required<AutoUpdateConfig>;

    /**
     * Default auto-update configuration.
     */
    private static readonly DEFAULT_CONFIG: Required<AutoUpdateConfig> = {
        ICON_DELAY_MS: 24 * 60 * 60 * 1000, // 24 hours
        IDLE_THRESHOLD_MS: 30 * 60 * 1000, // 30 minutes
        CHECK_INTERVAL_MS: 20 * 1000, // 20 seconds
    };

    /**
     * Callback to invoke when update should be applied.
     */
    private readonly onUpdateShouldApply: () => void;

    /**
     * Creates AutoUpdateManager instance.
     *
     * @param options Configuration options.
     * @param options.stateManager State manager for persistence.
     * @param options.onUpdateShouldApply Callback when update should be applied.
     */
    constructor(options: {
        stateManager: UpdateStateManager;
        onUpdateShouldApply: () => void;
    }) {
        this.stateManager = options.stateManager;
        this.onUpdateShouldApply = options.onUpdateShouldApply;
        // Config will be loaded via init()
        this.config = AutoUpdateManager.DEFAULT_CONFIG;
    }

    /**
     * Initializes the manager by loading configuration from storage.
     * Should be called before start().
     */
    public async init(): Promise<void> {
        await this.loadConfig();
    }

    /**
     * Gets the current configuration.
     *
     * @returns Auto-update configuration.
     */
    public getConfig(): Required<AutoUpdateConfig> {
        return this.config;
    }

    /**
     * Loads auto-update configuration from storage.
     * Reads from chrome.storage.local to allow runtime configuration for testing.
     */
    private async loadConfig(): Promise<void> {
        try {
            const configStr = await browserStorage.get(AUTO_UPDATE_CONFIG_KEY_MV3);

            if (typeof configStr !== 'string') {
                return;
            }

            const customConfig = AutoUpdateConfigValidator.parse(JSON.parse(configStr));

            logger.info('[ext.AutoUpdateManager.loadConfig]: Using custom config from storage:', customConfig);

            this.config = {
                ...AutoUpdateManager.DEFAULT_CONFIG,
                ...customConfig,
            };
        } catch (error) {
            logger.error('[ext.AutoUpdateManager.loadConfig]: Failed to load config:', error);
        }
    }

    /**
     * Gets whether auto-update monitoring is currently active.
     *
     * @returns True if monitoring is active.
     */
    public get isActive(): boolean {
        return this.checkIntervalId !== undefined;
    }

    /**
     * Starts auto-update monitoring.
     * Creates IdleDetector and begins periodic checks for idle conditions.
     *
     * @param loadedNavigationTimestamp Initial timestamp from storage after SW restart.
     */
    public startMonitoring(loadedNavigationTimestamp?: number): void {
        // Avoid multiple intervals
        if (this.checkIntervalId !== undefined) {
            logger.debug('[ext.AutoUpdateManager.startMonitoring]: Auto-update check already running');
            return;
        }

        // Create idle detector with callback to save state on navigation
        const onNavigation = (timestamp: number): void => {
            this.stateManager.set('lastNavigationTimestamp', timestamp);
        };

        this.idleDetector = new IdleDetector({
            onNavigation,
            initialTimestamp: loadedNavigationTimestamp,
        });

        // Start periodic check for auto-update conditions
        // eslint-disable-next-line no-restricted-globals
        this.checkIntervalId = self.setInterval(
            () => this.checkConditions(),
            this.config.CHECK_INTERVAL_MS,
        );

        logger.trace(`[ext.AutoUpdateManager.startMonitoring]: Auto-update monitoring started. Check interval: ${this.config.CHECK_INTERVAL_MS}ms, Idle threshold: ${this.config.IDLE_THRESHOLD_MS}ms, Icon delay: ${this.config.ICON_DELAY_MS}ms`);
    }

    /**
     * Stops auto-update monitoring and cleans up resources.
     */
    public stopMonitoring(): void {
        // Stop periodic check
        if (this.checkIntervalId !== undefined) {
            // eslint-disable-next-line no-restricted-globals
            self.clearInterval(this.checkIntervalId);
            this.checkIntervalId = undefined;
        }

        // Stop idle detector
        if (this.idleDetector) {
            this.idleDetector.stopMonitoring();
            this.idleDetector = null;
        }

        logger.trace('[ext.AutoUpdateManager.stopMonitoring]: Auto-update monitoring stopped');
    }

    /**
     * Gets the icon delay in milliseconds.
     *
     * @returns Icon delay in milliseconds.
     */
    public get iconDelayMs(): number {
        return this.config.ICON_DELAY_MS;
    }

    /**
     * Checks if idle conditions are met and applies update if ready.
     * Called periodically by internal interval.
     */
    private async checkConditions(): Promise<void> {
        try {
            // Ensure next version is still available
            const nextVersion = this.stateManager.nextVersion;
            if (!nextVersion) {
                logger.debug('[ext.AutoUpdateManager.checkConditions]: No next version found, stopping');
                this.stopMonitoring();
                return;
            }

            // Ensure idle detector is initialized
            if (!this.idleDetector) {
                logger.error('[ext.AutoUpdateManager.checkConditions]: Idle detector is not initialized');
                return;
            }

            // FIXME: Pass IDLE_THRESHOLD_MS to IdleDetector constructor and
            // encapsulate this check in IdleDetector.
            const idleDuration = this.idleDetector.getIdleDuration();

            // Check if browser is idle and should apply update
            const idleThreshold = this.config.IDLE_THRESHOLD_MS;
            if (idleDuration < idleThreshold) {
                logger.trace(`[ext.AutoUpdateManager.checkConditions]: Browser is not idle, skipping update. Idle duration: ${idleDuration}ms, threshold: ${idleThreshold}ms`);
                return;
            }

            logger.info(`[ext.AutoUpdateManager.checkConditions]: Idle threshold reached, applying update. Idle duration: ${idleDuration}ms`);

            // Stop monitoring and invoke callback
            this.stopMonitoring();
            this.onUpdateShouldApply();
        } catch (error) {
            logger.error('[ext.AutoUpdateManager.checkConditions]: Failed to check conditions:', error);
        }
    }
}
