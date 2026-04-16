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

import {
    describe,
    it,
    expect,
} from 'vitest';

import {
    parseLastModifiedHeader,
    isValidTimestamp,
    convertToISOString,
} from '../../../../Extension/src/background/utils/date-utils';

describe('date-utils', () => {
    describe('parseLastModifiedHeader', () => {
        it('should parse valid RFC 7231 date', () => {
            const header = 'Wed, 21 Oct 2015 07:28:00 GMT';
            const result = parseLastModifiedHeader(header);

            expect(result).toBe(new Date('2015-10-21T07:28:00.000Z').getTime());
        });

        it('should parse another valid RFC 7231 date', () => {
            const header = 'Mon, 01 Jan 2024 12:00:00 GMT';
            const result = parseLastModifiedHeader(header);

            expect(result).toBe(new Date('2024-01-01T12:00:00.000Z').getTime());
        });

        it('should return null for undefined header', () => {
            const result = parseLastModifiedHeader(undefined);

            expect(result).toBeNull();
        });

        it('should return null for empty string', () => {
            const result = parseLastModifiedHeader('');

            expect(result).toBeNull();
        });

        it('should return null for invalid date format', () => {
            const header = 'not a valid date';
            const result = parseLastModifiedHeader(header);

            expect(result).toBeNull();
        });

        it('should return null for malformed date', () => {
            const header = 'Wed, 32 Oct 2015 07:28:00 GMT';
            const result = parseLastModifiedHeader(header);

            expect(result).toBeNull();
        });

        it('should return null for date in the future', () => {
            const futureDate = new Date(Date.now() + 10 * 60 * 1000);
            const header = futureDate.toUTCString();
            const result = parseLastModifiedHeader(header);

            expect(result).toBeNull();
        });

        it('should accept date within clock skew tolerance', () => {
            const nearFutureDate = new Date(Date.now() + 2 * 60 * 1000);
            const header = nearFutureDate.toUTCString();
            const result = parseLastModifiedHeader(header);

            expect(result).not.toBeNull();
            expect(result).toBeGreaterThan(0);
        });
    });

    describe('isValidTimestamp', () => {
        it('should return true for valid timestamp', () => {
            const timestamp = new Date('2024-01-01T00:00:00.000Z').getTime();

            expect(isValidTimestamp(timestamp)).toBe(true);
        });

        it('should return true for current timestamp', () => {
            const timestamp = Date.now();

            expect(isValidTimestamp(timestamp)).toBe(true);
        });

        it('should return false for NaN', () => {
            expect(isValidTimestamp(NaN)).toBe(false);
        });

        it('should return false for Infinity', () => {
            expect(isValidTimestamp(Infinity)).toBe(false);
        });

        it('should return false for negative Infinity', () => {
            expect(isValidTimestamp(-Infinity)).toBe(false);
        });

        it('should return false for zero', () => {
            expect(isValidTimestamp(0)).toBe(false);
        });

        it('should return false for negative timestamp', () => {
            expect(isValidTimestamp(-1000)).toBe(false);
        });

        it('should return false for timestamp far in the future', () => {
            const farFuture = Date.now() + 10 * 60 * 1000;

            expect(isValidTimestamp(farFuture)).toBe(false);
        });

        it('should return true for timestamp within clock skew tolerance', () => {
            const nearFuture = Date.now() + 2 * 60 * 1000;

            expect(isValidTimestamp(nearFuture)).toBe(true);
        });
    });

    describe('convertToISOString', () => {
        it('should convert timestamp to ISO 8601 string', () => {
            const timestamp = new Date('2024-01-01T12:00:00.000Z').getTime();
            const result = convertToISOString(timestamp);

            expect(result).toBe('2024-01-01T12:00:00.000Z');
        });

        it('should convert another timestamp correctly', () => {
            const timestamp = new Date('2015-10-21T07:28:00.000Z').getTime();
            const result = convertToISOString(timestamp);

            expect(result).toBe('2015-10-21T07:28:00.000Z');
        });

        it('should handle epoch timestamp', () => {
            const timestamp = 0;
            const result = convertToISOString(timestamp);

            expect(result).toBe('1970-01-01T00:00:00.000Z');
        });
    });

    describe('integration tests', () => {
        it('should parse Last-Modified header and convert to ISO string', () => {
            const header = 'Wed, 21 Oct 2015 07:28:00 GMT';
            const timestamp = parseLastModifiedHeader(header);

            expect(timestamp).not.toBeNull();

            if (timestamp !== null) {
                const isoString = convertToISOString(timestamp);
                expect(isoString).toBe('2015-10-21T07:28:00.000Z');
            }
        });

        it('should validate parsed timestamp', () => {
            const header = 'Mon, 01 Jan 2024 12:00:00 GMT';
            const timestamp = parseLastModifiedHeader(header);

            expect(timestamp).not.toBeNull();

            if (timestamp !== null) {
                expect(isValidTimestamp(timestamp)).toBe(true);
            }
        });
    });
});
