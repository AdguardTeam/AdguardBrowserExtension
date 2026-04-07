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

import {
    describe,
    it,
    expect,
} from 'vitest';

import { FilterParser } from '../../../../../Extension/src/background/api/filters/parser';

describe('FilterParser with Last-Modified header support', () => {
    describe('parseFilterDataFromHeader', () => {
        it('should use TimeUpdated metadata when present', () => {
            const rules = [
                '! Title: Test Filter',
                '! TimeUpdated: 2024-01-01T12:00:00.000Z',
                '||example.com^',
            ];

            const result = FilterParser.parseFilterDataFromHeader(rules);

            expect(result.timeUpdated).toBe('2024-01-01T12:00:00.000Z');
        });

        it('should use Last-Modified header when TimeUpdated is missing', () => {
            const rules = [
                '! Title: Test Filter',
                '||example.com^',
            ];
            const lastModified = 'Wed, 21 Oct 2015 07:28:00 GMT';

            const result = FilterParser.parseFilterDataFromHeader(rules, lastModified);

            expect(result.timeUpdated).toBe('2015-10-21T07:28:00.000Z');
        });

        it('should prioritize TimeUpdated metadata over Last-Modified header', () => {
            const rules = [
                '! Title: Test Filter',
                '! TimeUpdated: 2024-01-01T12:00:00.000Z',
                '||example.com^',
            ];
            const lastModified = 'Wed, 21 Oct 2015 07:28:00 GMT';

            const result = FilterParser.parseFilterDataFromHeader(rules, lastModified);

            expect(result.timeUpdated).toBe('2024-01-01T12:00:00.000Z');
        });

        it('should fall back to current timestamp when both are missing', () => {
            const rules = [
                '! Title: Test Filter',
                '||example.com^',
            ];

            const beforeParse = Date.now();
            const result = FilterParser.parseFilterDataFromHeader(rules);
            const afterParse = Date.now();

            const parsedTime = new Date(result.timeUpdated).getTime();
            expect(parsedTime).toBeGreaterThanOrEqual(beforeParse);
            expect(parsedTime).toBeLessThanOrEqual(afterParse);
        });

        it('should fall back to current timestamp when Last-Modified is invalid', () => {
            const rules = [
                '! Title: Test Filter',
                '||example.com^',
            ];
            const invalidLastModified = 'not a valid date';

            const beforeParse = Date.now();
            const result = FilterParser.parseFilterDataFromHeader(rules, invalidLastModified);
            const afterParse = Date.now();

            const parsedTime = new Date(result.timeUpdated).getTime();
            expect(parsedTime).toBeGreaterThanOrEqual(beforeParse);
            expect(parsedTime).toBeLessThanOrEqual(afterParse);
        });

        it('should fall back to current timestamp when Last-Modified is in the future', () => {
            const rules = [
                '! Title: Test Filter',
                '||example.com^',
            ];
            const futureDate = new Date(Date.now() + 10 * 60 * 1000);
            const futureLastModified = futureDate.toUTCString();

            const beforeParse = Date.now();
            const result = FilterParser.parseFilterDataFromHeader(rules, futureLastModified);
            const afterParse = Date.now();

            const parsedTime = new Date(result.timeUpdated).getTime();
            expect(parsedTime).toBeGreaterThanOrEqual(beforeParse);
            expect(parsedTime).toBeLessThanOrEqual(afterParse);
        });

        it('should parse all metadata fields correctly with Last-Modified', () => {
            const rules = [
                '! Title: Custom Filter',
                '! Description: Test description',
                '! Homepage: https://example.com',
                '! Version: 1.0.0',
                '! Expires: 2 days',
                '! Diff-Path: /diff',
                '||example.com^',
            ];
            const lastModified = 'Mon, 01 Jan 2024 12:00:00 GMT';

            const result = FilterParser.parseFilterDataFromHeader(rules, lastModified);

            expect(result.name).toBe('Custom Filter');
            expect(result.description).toBe('Test description');
            expect(result.homepage).toBe('https://example.com');
            expect(result.version).toBe('1.0.0');
            expect(result.expires).toBe(172800);
            expect(result.timeUpdated).toBe('2024-01-01T12:00:00.000Z');
            expect(result.diffPath).toBe('/diff');
        });

        it('should work without Last-Modified header (backward compatibility)', () => {
            const rules = [
                '! Title: Test Filter',
                '! TimeUpdated: 2024-01-01T12:00:00.000Z',
                '||example.com^',
            ];

            const result = FilterParser.parseFilterDataFromHeader(rules);

            expect(result.timeUpdated).toBe('2024-01-01T12:00:00.000Z');
        });

        it('should handle empty TimeUpdated tag with Last-Modified', () => {
            const rules = [
                '! Title: Test Filter',
                '! TimeUpdated: ',
                '||example.com^',
            ];
            const lastModified = 'Wed, 21 Oct 2015 07:28:00 GMT';

            const result = FilterParser.parseFilterDataFromHeader(rules, lastModified);

            expect(result.timeUpdated).toBe('2015-10-21T07:28:00.000Z');
        });

        it('should handle whitespace-only TimeUpdated tag with Last-Modified', () => {
            const rules = [
                '! Title: Test Filter',
                '! TimeUpdated:    ',
                '||example.com^',
            ];
            const lastModified = 'Wed, 21 Oct 2015 07:28:00 GMT';

            const result = FilterParser.parseFilterDataFromHeader(rules, lastModified);

            expect(result.timeUpdated).toBe('2015-10-21T07:28:00.000Z');
        });
    });
});
