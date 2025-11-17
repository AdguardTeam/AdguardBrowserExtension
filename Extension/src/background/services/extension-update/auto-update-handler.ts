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

import { AUTO_UPDATE_CONFIG_KEY_MV3, MANUAL_EXTENSION_UPDATE_KEY } from '../../../common/constants';
import { logger } from '../../../common/logger';
import { browserStorage } from '../../storages';
import { ContentScriptInjector } from '../../content-script-injector';

import {
    type AutoUpdateConfig,
    AutoUpdateConfigValidator,
    AutoUpdateStateField,
} from './types';
import { IdleDetector } from './idle-detector';
import { type AutoUpdateStateManager } from './auto-update-state-manager';

/**
 * Handles automatic update orchestration after Chrome downloads an update.
 *
 * Responsibilities:
 * - Create and manage IdleDetector for tracking browser inactivity.
 * - Start/stop periodic checks for idle conditions.
 * - Apply update when idle threshold is met.
 * - Clean up resources.
 */
export class AutoUpdateHandler {
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
    private readonly stateManager: AutoUpdateStateManager;

    /**
     * Auto-update configuration.
     */
    private config: Required<AutoUpdateConfig>;

    /**
     * Default auto-update configuration.
     */
    private static readonly DEFAULT_CONFIG: Required<AutoUpdateConfig> = {
        iconDelayMs: 24 * 60 * 60 * 1000, // 24 hours
        idleThresholdMs: 30 * 60 * 1000, // 30 minutes
        checkIntervalMs: 20 * 1000, // 20 seconds
    };

    /**
     * Callback to invoke when update is about to be applied.
     */
    private readonly onUpdateApplyStart: () => void;

    /**
     * Callback to invoke when update application fails.
     */
    private readonly onUpdateApplyFailed: () => void;

    /**
     * Creates AutoUpdateHandler instance.
     *
     * @param options Configuration options.
     * @param options.stateManager State manager for persistence.
     * @param options.onUpdateApplyStart Callback when update application starts.
     * @param options.onUpdateApplyFailed Callback when update application fails.
     */
    constructor(options: {
        stateManager: AutoUpdateStateManager;
        onUpdateApplyStart: () => void;
        onUpdateApplyFailed: () => void;
    }) {
        this.stateManager = options.stateManager;
        this.onUpdateApplyStart = options.onUpdateApplyStart;
        this.onUpdateApplyFailed = options.onUpdateApplyFailed;
        // Config will be loaded via init()
        this.config = AutoUpdateHandler.DEFAULT_CONFIG;
    }

    /**
     * Initializes the manager by loading configuration from storage.
     * Should be called before start().
     */
    private async init(): Promise<void> {
        await this.loadConfig();
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

            logger.info('[ext.AutoUpdateHandler.loadConfig]: Using custom config from storage:', customConfig);

            this.config = {
                ...AutoUpdateHandler.DEFAULT_CONFIG,
                ...customConfig,
            };
        } catch (error) {
            logger.error('[ext.AutoUpdateHandler.loadConfig]: Failed to load config:', error);
        }
    }

    /**
     * Starts auto-update monitoring.
     * Creates IdleDetector and begins periodic checks for idle conditions.
     *
     * @param loadedNavigationTimestamp Initial timestamp from storage after SW restart.
     */
    private startMonitoring(loadedNavigationTimestamp?: number): void {
        // Avoid multiple intervals
        if (this.checkIntervalId !== undefined) {
            logger.debug('[ext.AutoUpdateHandler.startMonitoring]: Auto-update check already running');
            return;
        }

        // Create idle detector with callback to save state on navigation
        const onNavigation = (timestamp: number): void => {
            this.stateManager.set(AutoUpdateStateField.lastNavigationTimestamp, timestamp);
        };

        this.idleDetector = new IdleDetector({
            onNavigation,
            initialTimestamp: loadedNavigationTimestamp,
        });

        // Start periodic check for auto-update conditions
        // eslint-disable-next-line no-restricted-globals
        this.checkIntervalId = self.setInterval(
            () => this.checkConditions(),
            this.config.checkIntervalMs,
        );

        logger.trace(`[ext.AutoUpdateHandler.startMonitoring]: Auto-update monitoring started. Check interval: ${this.config.checkIntervalMs}ms, Idle threshold: ${this.config.idleThresholdMs}ms, Icon delay: ${this.config.iconDelayMs}ms`);
    }

    /**
     * Stops auto-update monitoring and cleans up resources.
     */
    private stopMonitoring(): void {
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

        logger.trace('[ext.AutoUpdateHandler.stopMonitoring]: Auto-update monitoring stopped');
    }

    /**
     * Gets the icon delay in milliseconds.
     *
     * @returns Icon delay in milliseconds.
     */
    public get iconDelayMs(): number {
        return this.config.iconDelayMs;
    }

    /**
     * Checks if idle conditions are met and applies update if ready.
     * Called periodically by internal interval.
     */
    private async checkConditions(): Promise<void> {
        try {
            // Ensure next version is still available
            const nextVersion = this.stateManager.get(AutoUpdateStateField.nextVersion);
            if (!nextVersion) {
                logger.debug('[ext.AutoUpdateHandler.checkConditions]: No next version found, stopping');
                this.stopMonitoring();
                return;
            }

            // Ensure idle detector is initialized
            if (!this.idleDetector) {
                logger.error('[ext.AutoUpdateHandler.checkConditions]: Idle detector is not initialized');
                return;
            }

            const idleDuration = this.idleDetector.getIdleDuration();

            // Check if browser is idle and should apply update
            const idleThreshold = this.config.idleThresholdMs;
            if (idleDuration < idleThreshold) {
                logger.trace(`[ext.AutoUpdateHandler.checkConditions]: Browser is not idle, skipping update. Idle duration: ${idleDuration}ms, threshold: ${idleThreshold}ms`);
                return;
            }

            logger.info(`[ext.AutoUpdateHandler.checkConditions]: Idle threshold reached, applying update. Idle duration: ${idleDuration}ms`);

            // Stop monitoring and apply update
            this.stopMonitoring();
            await this.applyUpdate();
        } catch (error) {
            logger.error('[ext.AutoUpdateHandler.checkConditions]: Failed to check conditions:', error);
        }
    }

    /**
     * Applies automatic update and reloads extension.
     * Clears state and removes manual update markers to avoid collisions.
     */
    private async applyUpdate(): Promise<void> {
        this.onUpdateApplyStart();
        try {
            // Clear state
            await this.stateManager.clear();

            // To avoid possible collisions with manual update, e.g. do not
            // open popup or show notification after silent auto-update.
            await browserStorage.remove(MANUAL_EXTENSION_UPDATE_KEY);

            // Set flag to prevent double injection of content scripts after update
            await ContentScriptInjector.setUpdateFlag();

            // Reload extension
            chrome.runtime.reload();
        } catch (e) {
            logger.error(`[ext.AutoUpdateHandler.applyUpdate]: Failed to reload: ${e}`);
            this.onUpdateApplyFailed();
        }
    }

    /**
     * Clears update state and stops monitoring.
     * Called when manual update is triggered to prevent auto-update interference.
     */
    public async clearState(): Promise<void> {
        this.stopMonitoring();
        await this.stateManager.clear();
    }

    /**
     * Handles update available event for automatic checks.
     * Sets timestamp, saves state, and starts monitoring.
     *
     * @param loadedNavigationTimestamp Timestamp from storage if SW restarted.
     */
    public async onUpdateAvailable(
        loadedNavigationTimestamp?: number,
    ): Promise<void> {
        // Set timestamp when update became available. If SW restart occurred
        // before update was applied, this timestamp will be restored from
        // storage for correct icon delay calculation.
        if (this.stateManager.get(AutoUpdateStateField.updateAvailableTimestamp) === undefined) {
            this.stateManager.set(AutoUpdateStateField.updateAvailableTimestamp, Date.now());
        }

        // Save state to storage for persistence across SW restarts
        this.stateManager.save();

        // Load config and start monitoring
        await this.init();
        this.startMonitoring(loadedNavigationTimestamp);

        logger.trace(`[ext.AutoUpdateHandler.onUpdateAvailable]: Auto-update monitoring started. Icon delay: ${this.config.iconDelayMs}ms, Idle threshold: ${this.config.idleThresholdMs}ms`);
    }
}
