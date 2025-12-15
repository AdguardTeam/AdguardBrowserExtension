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

import { Logger, LogLevel } from '@adguard/logger';

import { browserStorage } from '../background/storages/shared-instances';

/**
 * Extended logger with persistent log level setting.
 * Extends the base Logger class with browser storage integration
 * for saving and retrieving log level preferences.
 */
class ExtendedLogger extends Logger {
    /**
     * Key for storing the current log level in browser storage.
     */
    private static readonly LOG_LEVEL_LOCAL_STORAGE_KEY = 'log-level';

    /**
     * Default log level based on the build configuration.
     */
    private static readonly DEFAULT_LOG_LEVEL = IS_RELEASE || IS_BETA
        ? LogLevel.Info
        : LogLevel.Debug;

    /**
     * Checks if the current log level is verbose (Debug or Verbose).
     *
     * This method is useful for determining if detailed logging should
     * be enabled across the application in different modules. Some kind of
     * "single point of truth".
     *
     * @returns True if current log level is Debug or Verbose, false otherwise.
     */
    isVerbose(): boolean {
        return this.currentLevel === LogLevel.Debug
            || this.currentLevel === LogLevel.Verbose;
    }

    /**
     * Sets log with persistent value, which will be saved, if
     * browser.storage.local is available.
     *
     * @param level Log level to set.
     */
    setLogLevel(level: LogLevel): void {
        this.currentLevel = level;

        browserStorage.set(ExtendedLogger.LOG_LEVEL_LOCAL_STORAGE_KEY, level)
            .catch((error) => {
                // eslint-disable-next-line max-len
                this.error('[ext.ExtendedLogger.setLogLevel]: failed to save log level in browser.storage.local: ', error);
            });
    }

    /**
     * Validates if the provided value is a valid LogLevel.
     *
     * @param value Value to validate.
     *
     * @returns {boolean} True if the value is a valid LogLevel, false otherwise.
     */
    private static isValidLogLevel(value: unknown): value is LogLevel {
        return typeof value === 'string' && Object.values(LogLevel).includes(value as LogLevel);
    }

    /**
     * Initializes the logger by loading the saved log level from browser storage.
     * Falls back to the default log level if retrieval fails or the stored level is invalid.
     *
     * @returns Promise that resolves when initialization is complete.
     */
    public async init(): Promise<void> {
        try {
            const logLevel = await browserStorage.get(ExtendedLogger.LOG_LEVEL_LOCAL_STORAGE_KEY);

            if (!ExtendedLogger.isValidLogLevel(logLevel)) {
                // Print a warning only if the log level is valuable.
                if (logLevel !== null && logLevel !== undefined) {
                    // eslint-disable-next-line max-len
                    this.warn('[ext.ExtendedLogger.init]: log level from browser.storage.local is not valid. Value: ', logLevel);
                }
                return;
            }

            try {
                this.setLogLevel(logLevel);
            } catch (e) {
                // eslint-disable-next-line max-len
                this.warn('[ext.ExtendedLogger.init]: failed to set log level from browser.storage.local, will set to default level. Error: ', e);
                this.setLogLevel(ExtendedLogger.DEFAULT_LOG_LEVEL);
            }
        } catch (error) {
            // eslint-disable-next-line max-len
            this.warn('[ext.ExtendedLogger.init]: failed to get log level from browser.storage.local: ', error);
        }
    }

    /**
     * Creates a new instance of ExtendedLogger.
     * Initializes the logger with the default log level based on build configuration.
     */
    constructor() {
        super();

        this.currentLevel = ExtendedLogger.DEFAULT_LOG_LEVEL;
    }
}

const logger = new ExtendedLogger();

// Expose logger to the window object,
// to have possibility to switch log level from the console.
// Example: adguard.logger.setCurrentLevel('trace');

// eslint-disable-next-line no-restricted-globals
Object.assign(self, { adguard: { ...self.adguard, logger } });

export { LogLevel, logger };
