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

import { Version } from '../../../../Extension/src/background/utils';

describe('version', () => {
    describe('parses parts from semver string', () => {
        const cases = [
            { value: '1', expected: [1, 0, 0, 0] },
            { value: '1.2', expected: [1, 2, 0, 0] },
            { value: '1.2.3.4', expected: [1, 2, 3, 4] },
        ];

        it.each(cases)('parses parts from $value', ({ value, expected }) => {
            expect(new Version(value).data).toStrictEqual(expected);
        });
    });

    describe('throws parse error', () => {
        const createFoundEmptyPartCase = (value: string): { value: string; expected: string } => {
            return { value, expected: `Found empty part in string '${value}'` };
        };

        const createCannotParseCase = (value: string): { value: string; expected: string } => {
            return { value, expected: `Can not parse '${value}' string` };
        };

        const createCannotParseLeadingZero = (value: string): { value: string; expected: string } => {
            return { value, expected: `Can not parse ${value}. Leading zeros are not allowed in the version parts` };
        };

        const cases = [
            createFoundEmptyPartCase(''),
            createFoundEmptyPartCase('1.2.'),
            createFoundEmptyPartCase('1..2'),
            createFoundEmptyPartCase('.1.2'),
            createCannotParseCase('test'),
            createCannotParseCase('1.test.2.1'),
            createCannotParseLeadingZero('01.1.2'),
        ];

        it.each(cases)('throws parse error, if argument is $value', ({ value, expected }) => {
            expect(() => new Version(value)).toThrow(expected);
        });
    });

    describe('compares versions', () => {
        const cases = [
            { left: '1.0.0.0', right: '2.0.0.0', expected: -1 },
            { left: '2.0.0.0', right: '1.0.0.0', expected: 1 },
            { left: '1.0.0.0', right: '1.0.0.0', expected: 0 },
            { left: '1.0.0.1', right: '1.0.0.2', expected: -1 },
            { left: '1.2', right: '1.0.2', expected: 1 },
            { left: '1.2.0.0', right: '1.2.0', expected: 0 },
            { left: '1.2.1.0', right: '1.2.0', expected: 1 },
            { left: '1.0.0.0.1', right: '1.0.0.0', expected: 0 },
            // compare versions with 3 parts
            { left: '2.0.0', right: '1.0.0', expected: 1 },
            { left: '1.0.0', right: '2.0.0', expected: -1 },
            { left: '1.0.0', right: '1.0.0', expected: 0 },
            { left: '1.0.1', right: '1.0.0', expected: 1 },
            { left: '1.0.11', right: '1.0.9', expected: 1 },
        ];

        it.each(cases)('compares $left with $right', ({ left, right, expected }) => {
            expect(new Version(left).compare(new Version(right))).toBe(expected);
        });
    });

    it('throws error, if versions cannot be compared', () => {
        const version = new Version('1.2.3.4');
        const invalidVersion = 'invalid' as unknown as Version;

        const expectedErrorMessage = 'Can not compare versions';

        expect(() => version.compare(invalidVersion)).toThrow(expectedErrorMessage);
    });
});
