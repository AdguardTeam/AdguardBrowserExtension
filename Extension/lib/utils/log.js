/**
 * This file is part of Adguard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * Adguard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Adguard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Adguard Browser Extension.  If not, see <http://www.gnu.org/licenses/>.
 */

/* eslint-disable no-console */

/**
 * Simple logger with log levels
 */
adguard.console = (function () {
    // Redefine if you need it
    const CURRENT_LEVEL = 'INFO';

    const LEVELS = {
        ERROR: 1,
        WARN: 2,
        INFO: 3,
        DEBUG: 4,
    };

    /**
     * Pretty-print javascript error
     */
    const errorToString = function (error) {
        return `${error.toString()}\nStack trace:\n${error.stack}`;
    };

    const getLocalTimeString = (date) => {
        const ONE_MINUTE_MS = 60 * 1000;
        const timeZoneOffsetMs = date.getTimezoneOffset() * ONE_MINUTE_MS;
        const localTime = new Date(date - timeZoneOffsetMs);
        return localTime.toISOString().replace('Z', '');
    };

    /**
     * Prints log message
     */
    const print = function (level, method, args) {
        // check log level
        if (LEVELS[CURRENT_LEVEL] < LEVELS[level]) {
            return;
        }
        if (!args || args.length === 0 || !args[0]) {
            return;
        }

        const str = `${args[0]}`;
        args = Array.prototype.slice.call(args, 1);
        let formatted = str.replace(/{(\d+)}/g, (match, number) => {
            if (typeof args[number] !== 'undefined') {
                let value = args[number];
                if (value instanceof Error) {
                    value = errorToString(value);
                } else if (value && value.message) {
                    value = value.message;
                } else if (typeof value === 'object') {
                    value = JSON.stringify(value);
                }
                return value;
            }

            return match;
        });

        formatted = `${getLocalTimeString(new Date())}: ${formatted}`;
        console[method](formatted);
    };

    /**
     * Expose public API
     */
    return {
        debug(...args) {
            print('DEBUG', 'log', args);
        },

        info(...args) {
            print('INFO', 'info', args);
        },

        warn(...args) {
            print('WARN', 'info', args);
        },

        error(...args) {
            print('ERROR', 'error', args);
        },
    };
})();
