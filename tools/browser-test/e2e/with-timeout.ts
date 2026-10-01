/**
 * Copyright (c) 2015-2026 Adguard Software Ltd.
 *
 * @file Shared helper that rejects a promise which does not settle in time.
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

/**
 * Rejects a promise if it does not settle before the timeout.
 *
 * Used by the E2E harness for commands that can hang without their own timeout
 * (geckodriver calls, Playwright `evaluate` probes), so a stalled page cannot
 * block a test until the Vitest timeout.
 *
 * @param promise Promise to guard.
 * @param timeoutMs Timeout in milliseconds.
 * @param message Timeout error message.
 *
 * @returns Original promise result.
 *
 * @throws Error with the given message when the promise does not settle in time.
 */
export const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> => {
    let timeoutId!: ReturnType<typeof setTimeout>;

    const timeoutPromise = new Promise<never>((resolve, reject): void => {
        timeoutId = setTimeout((): void => {
            reject(new Error(message));
        }, timeoutMs);
    });

    try {
        return await Promise.race([promise, timeoutPromise]);
    } finally {
        clearTimeout(timeoutId);
    }
};
