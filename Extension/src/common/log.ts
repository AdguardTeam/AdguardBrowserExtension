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
import { format } from 'date-fns';

/**
 * Number presentation of log levels. Order is important. Higher number, more messages to be visible.
 */
export const enum LogLevel {
    Error = 1,
    Warn,
    Info,
    Debug,
}

/**
 * Methods supported by console. Used to manage levels.
 */
export const enum LogMethod {
    Log = 'log',
    Info = 'info',
    Error = 'error',
}

/**
 * String presentation of log levels, for convenient users usage.
 */
enum LogLevelString {
    Error = 'error',
    Warn = 'warn',
    Info = 'info',
    Debug = 'debug',
}

/**
 * Simple logger with log levels
 */
export class Log {
    private static currentLevelValue = LogLevel.Info;

    /**
     * Print debug messages. Usually used for technical information.
     *
     * @param args Printed arguments.
     */
    public static debug(...args: unknown[]): void {
        Log.print(LogLevel.Debug, LogMethod.Log, args);
    }

    /**
     * Print messages you want to disclose to users.
     *
     * @param args Printed arguments.
     */
    public static info(...args: unknown[]): void {
        Log.print(LogLevel.Info, LogMethod.Info, args);
    }

    /**
     * Print warn messages.
     *
     * @param args Printed arguments.
     */
    public static warn(...args: unknown[]): void {
        Log.print(LogLevel.Warn, LogMethod.Info, args);
    }

    /**
     * Print error messages
     *
     * @param args Printed arguments.
     */
    public static error(...args: unknown[]): void {
        Log.print(LogLevel.Error, LogMethod.Error, args);
    }

    /**
     * Setter for log level. With this method log level can be updated dynamically.
     *
     * @param logLevel Log level.
     */
    public static set currentLevel(logLevel: LogLevelString) {
        switch (logLevel) {
            case LogLevelString.Error:
                Log.currentLevelValue = LogLevel.Error;
                break;
            case LogLevelString.Warn:
                Log.currentLevelValue = LogLevel.Warn;
                break;
            case LogLevelString.Info:
                Log.currentLevelValue = LogLevel.Info;
                break;
            case LogLevelString.Debug:
                Log.currentLevelValue = LogLevel.Debug;
                break;
            default:
                throw new Error(`Logger supports only next levels: ${[Object.values(LogLevelString).join(', ')]}`);
        }
    }

    /**
     * Converts error to string.
     *
     * @param error Error to print.
     * @private
     */
    private static errorToString(error: Error): string {
        return `${error.toString()}\nStack trace:\n${error.stack}`;
    }

    /**
     * Wrapper over log methods.
     *
     * @param level Log level.
     * @param method Log method.
     * @param args
     * @private
     */
    private static print(
        level: LogLevel,
        method: LogMethod,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        args: any[],
    ): void {
        // check log level
        if (Log.currentLevelValue < level) {
            return;
        }
        if (!args || args.length === 0 || !args[0]) {
            return;
        }

        const formattedArgs = args.map(value => {
            if (value instanceof Error) {
                return Log.errorToString(value);
            }

            if (typeof value.message === 'string') {
                return value.message;
            }

            if (typeof value === 'object') {
                return JSON.stringify(value);
            }

            return String(value);
        });

        const formattedTime = `${format(Date.now(), "yyyy-MM-dd'T'HH:mm:ss:SSS")}:`;

        // eslint-disable-next-line no-console
        console[method](formattedTime, ...formattedArgs);
    }

    /**
     * Exposes logger globally, so user be able to update log level and print more info.
     *
     * @param window DOM Window object.
     */
    static expose(window: Window) {
        const adguard = window.adguard ?? {};
        window.adguard = adguard;

        adguard.Log = Log;
    }
}

declare global {
    interface Window {
        adguard: {
            Log: Log;
        }
    }
}

Log.expose(window);
