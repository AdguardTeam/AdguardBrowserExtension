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

import path from 'node:path';

import {
    describe,
    test,
    expect,
    vi,
} from 'vitest';

import * as scannerModule from '../../../../tools/resources/dangerous-rules/scanner';
import { isMatchingCriteria } from '../../../../tools/resources/dangerous-rules/scanner';
import { findDangerousRules } from '../../../../tools/resources/dangerous-rules';

vi.mock('../../../../tools/resources/dangerous-rules/safety-checker', () => ({
    // eslint-disable-next-line @typescript-eslint/no-extraneous-class
    SafetyChecker: class {
        // eslint-disable-next-line class-methods-use-this
        async checkRuleSafety() {
            return { rule: '', type: 'not dangerous', reason: 'mock' };
        }
    },
}));

describe('scanner', () => {
    describe('isMatchingCriteria', () => {
        test('should match a line with createElement and inclusion pattern', () => {
            const line = 'document.createElement("#%# filter rule")';
            expect(isMatchingCriteria(line)).toBe(true);
        });

        test('should not match a line without inclusion pattern', () => {
            const line = 'document.createElement("div")';
            expect(isMatchingCriteria(line)).toBe(false);
        });

        test('should not match a line with exclusion pattern', () => {
            const line = '//scriptlet document.createElement("div")';
            expect(isMatchingCriteria(line)).toBe(false);
        });

        test('should match a line with setAttribute and inclusion pattern', () => {
            const line = 'element.setAttribute("#@%# filter rule", "value")';
            expect(isMatchingCriteria(line)).toBe(true);
        });
    });
});

describe('findDangerousRules – isMV3 parameter', () => {
    test('when isMV3 is true, scanner is called only for directories ending with -mv3', async () => {
        const scannerSpy = vi
            .spyOn(scannerModule, 'scanner')
            .mockResolvedValue([]);

        await findDangerousRules('fake-api-key', true);

        const calledPaths = scannerSpy.mock.calls.map(([dir]) => path.basename(dir));
        expect(calledPaths.every((name) => name.endsWith('-mv3'))).toBe(true);
        expect(calledPaths).not.toContain('firefox');
        expect(calledPaths).not.toContain('chromium');
        expect(calledPaths).not.toContain('edge');
        expect(calledPaths).not.toContain('opera');

        scannerSpy.mockRestore();
    });

    test('when isMV3 is false, scanner is called once for the full filters path', async () => {
        const scannerSpy = vi
            .spyOn(scannerModule, 'scanner')
            .mockResolvedValue([]);

        await findDangerousRules('fake-api-key', false);

        expect(scannerSpy).toHaveBeenCalledTimes(1);
        expect(path.basename(scannerSpy.mock.calls[0]![0])).toBe('filters');

        scannerSpy.mockRestore();
    });

    test('when isMV3 is omitted, scanner is called once for the full filters path', async () => {
        const scannerSpy = vi
            .spyOn(scannerModule, 'scanner')
            .mockResolvedValue([]);

        await findDangerousRules('fake-api-key');

        expect(scannerSpy).toHaveBeenCalledTimes(1);
        expect(path.basename(scannerSpy.mock.calls[0]![0])).toBe('filters');

        scannerSpy.mockRestore();
    });
});
