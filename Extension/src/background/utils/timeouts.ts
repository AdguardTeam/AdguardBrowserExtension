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

/**
 * Creates a promise with a timeout.
 *
 * @param promise Promise to execute.
 * @param timeoutMs Promise execution limit in milliseconds. Reject promise after it.
 * @param errorMessage Message of error, thrown after timeout.
 *
 * @returns Promise resolved with result of the `promise`
 * or rejected with error if `promise` is not resolved after `timeoutMs`.
 */
export async function createPromiseWithTimeout<T>(
    promise: Promise<T>,
    timeoutMs = 5000,
    errorMessage = 'Promise execution timeout',
): Promise<T> {
    return Promise.race([
        promise,
        rejectAfterTimeout(timeoutMs, errorMessage),
    ]);
}

/**
 * Rejects promise after timeout.
 *
 * @param timeoutMs Timeout in milliseconds.
 * @param message Message of error, thrown after timeout.
 *
 * @throws Error after timeout.
 */
async function rejectAfterTimeout(timeoutMs: number, message: string): Promise<never> {
    return new Promise((resolve, reject) => {
        // eslint-disable-next-line no-restricted-globals
        self.setTimeout(() => {
            reject(new Error(message));
        }, timeoutMs);
    });
}
