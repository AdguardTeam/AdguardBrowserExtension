/**
 * @file
 *
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

import browser from 'webextension-polyfill';

import { Logger, LogLevel } from '@adguard/logger';

class ExtendedLogger extends Logger {
    private static readonly LOG_LEVEL_LOCAL_STORAGE_KEY = 'log-level';

    private static readonly DEFAULT_LOG_LEVEL = IS_RELEASE || IS_BETA
        ? LogLevel.Info
        : LogLevel.Debug;

    isVerbose(): boolean {
        return this.currentLevel === LogLevel.Debug
             || this.currentLevel === LogLevel.Trace;
    }

    /**
     * Sets log with persistent value, which will be saved, if
     * browser.storage.local is available.
     *
     * @param level Log level to set
     */
    setLogLevel(level: LogLevel): void {
        this.currentLevel = level;

        if (browser.storage?.local) {
            browser.storage.local.set({ [ExtendedLogger.LOG_LEVEL_LOCAL_STORAGE_KEY]: level })
                .catch((error) => {
                    // eslint-disable-next-line max-len
                    this.error('[ext.ExtendedLogger.setLogLevel] failed to save log level in browser.storage.local: ', error);
                });
        }
    }

    private static isValidLogLevel(level: string): level is LogLevel {
        return Object.values(LogLevel).includes(level as LogLevel);
    }

    public async init(): Promise<void> {
        if (!browser.storage?.local) {
            return;
        }

        try {
            const result = await browser.storage.local.get(ExtendedLogger.LOG_LEVEL_LOCAL_STORAGE_KEY);

            if (!result[ExtendedLogger.LOG_LEVEL_LOCAL_STORAGE_KEY]
                || typeof result[ExtendedLogger.LOG_LEVEL_LOCAL_STORAGE_KEY] !== 'string') {
                // eslint-disable-next-line max-len
                this.warn('[ext.ExtendedLogger.constructor] log level from browser.storage.local is not a string. Value: ', result);
                return;
            }

            const logLevel = result[ExtendedLogger.LOG_LEVEL_LOCAL_STORAGE_KEY] as string;

            if (!ExtendedLogger.isValidLogLevel(logLevel)) {
                // eslint-disable-next-line max-len
                this.warn('[ext.ExtendedLogger.constructor] log level from browser.storage.local is not valid. Value: ', result.logLevel);
                return;
            }

            try {
                this.setLogLevel(logLevel);
            } catch (e) {
                // eslint-disable-next-line max-len
                this.warn('[ext.ExtendedLogger.constructor] failed to set log level from browser.storage.local, will set to default level. Error: ', e);
                this.setLogLevel(ExtendedLogger.DEFAULT_LOG_LEVEL);
            }
        } catch (error) {
            // eslint-disable-next-line max-len
            this.warn('[ext.ExtendedLogger.constructor] failed to get log level from browser.storage.local: ', error);
        }
    }

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
