/**
 * Copyright (c) 2015-2026 Adguard Software Ltd.
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

import { type E2EError, type E2EResultSurfaceId } from './types';

type ConsoleErrorRecordParams = {
    matrixId: string;
    surfaceId: E2EResultSurfaceId;
    source: string;
    message: string;
    url: string;
};

const ERROR_CONSOLE_TYPES = new Set([
    'error',
    'assert',
]);

/**
 * Checks whether a console message type should fail an E2E test.
 *
 * @param type Console message type.
 *
 * @returns True if the console message type is treated as an error.
 */
export const isErrorConsoleType = (type: string): boolean => ERROR_CONSOLE_TYPES.has(type);

/**
 * Creates a normalized console error record.
 *
 * @param params Console error record params.
 *
 * @returns E2E error record.
 */
export const createConsoleErrorRecord = (params: ConsoleErrorRecordParams): E2EError => ({
    ...params,
    timestamp: new Date().toISOString(),
});

/**
 * Collects E2E errors for one running scope.
 */
export class E2EErrorCollector {
    private readonly errors: E2EError[] = [];

    /**
     * Adds a collected E2E error.
     *
     * @param error E2E error record.
     */
    public add(error: E2EError): void {
        this.errors.push(error);
    }

    /**
     * Returns collected E2E errors.
     *
     * @returns E2E error records.
     */
    public getErrors(): E2EError[] {
        return [...this.errors];
    }

    /**
     * Returns errors added since the given cursor.
     *
     * @param cursor Starting index.
     *
     * @returns E2E error records added after cursor.
     */
    public sliceFrom(cursor: number): E2EError[] {
        return this.errors.slice(cursor);
    }

    /**
     * Returns current collector cursor.
     *
     * @returns Current error count.
     */
    public getCursor(): number {
        return this.errors.length;
    }
}

/**
 * Creates an E2E error from an unknown thrown value.
 *
 * @param matrixId E2E matrix id.
 * @param surfaceId E2E surface id.
 * @param source Error source identifier.
 * @param url URL where the error occurred.
 * @param error The thrown value.
 *
 * @returns E2E error record.
 */
export const createUnknownError = (
    matrixId: string,
    surfaceId: E2EResultSurfaceId,
    source: string,
    url: string,
    error: unknown,
): E2EError => ({
    matrixId,
    surfaceId,
    source,
    message: error instanceof Error ? error.message : String(error),
    url,
    timestamp: new Date().toISOString(),
});
