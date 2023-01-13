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

/**
 * Sleeps given period of milliseconds
 *
 * @param ms - milliseconds
 */
export async function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

/**
 * Sleeps necessary period of time if minimum duration didn't pass since entry time
 *
 * @param entryTimeMs
 * @param minDurationMs
 */
export async function sleepIfNecessary(
    entryTimeMs: number,
    minDurationMs: number,
): Promise<void> {
    if (Date.now() - entryTimeMs < minDurationMs) {
        await sleep(minDurationMs - (Date.now() - entryTimeMs));
    }
}

/**
 * Executes async function with at least required time
 *
 * @param fn - function to execute
 * @param minDurationMs - minimum executing time
 */
// TODO: generic types
export function addMinDurationTime(
    fn: (...args: unknown[]) => Promise<unknown>,
    minDurationMs: number,
): (...args: unknown[]) => Promise<unknown> {
    return async (...args: unknown[]) => {
        const start = Date.now();

        try {
            const response = await fn(...args);
            await sleepIfNecessary(start, minDurationMs);
            return response as unknown;
        } catch (e) {
            await sleepIfNecessary(start, minDurationMs);
            throw e;
        }
    };
}
