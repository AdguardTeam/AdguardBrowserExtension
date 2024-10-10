/* eslint-disable no-console */
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

import { Logger, LogLevel } from '@adguard/logger';

const originalTrace = console.trace;

/**
 * Overriding original `console.trace` in order to
 * achieve collapsed trace. We are overriding it globally
 * instead of passing custom `Writer` to `Logger` because
 * console is going to be used inside of engine too.
 *
 * @param {...any} args Arguments list to log.
 */
console.trace = (...args: any[]) => {
    console.groupCollapsed(...args);

    // Hiding expanded trace inside of collapsed group
    originalTrace();

    console.groupEnd();
};

declare global {
    interface Window {
        adguard: {
            logger: Logger;
        }
    }
}

class ExtendedLogger extends Logger {
    isVerbose() {
        return this.currentLevel === LogLevel.Debug;
    }
}

const logger = new ExtendedLogger();

logger.currentLevel = IS_RELEASE || IS_BETA
    ? LogLevel.Info
    : LogLevel.Trace;

// Expose logger to the window object,
// to have possibility to switch log level from the console.
// Example: adguard.logger.setLevel('debug');
// FIXME setup eslint and remove this rule
// eslint-disable-next-line no-restricted-globals
const adguard = self.adguard ?? {};
// eslint-disable-next-line no-restricted-globals
self.adguard = adguard;

adguard.logger = logger;

export { LogLevel, logger };
