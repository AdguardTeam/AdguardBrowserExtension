/**
 * Copyright (c) 2015-2026 Adguard Software Ltd.
 *
 * @file Unit tests for the E2E retry reporter.
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

import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';
import { type TestCase, type TestDiagnostic } from 'vitest/node';

import RetryReporter from '../../../tools/browser-test/e2e/retry-reporter';
import { logInfo } from '../../../tools/browser-test/logger';

vi.mock('../../../tools/browser-test/logger', () => ({
    logInfo: vi.fn(),
}));

/**
 * Creates a test case double with the given name and retry count.
 *
 * @param fullName Full test name.
 * @param retryCount Number of retries the test needed.
 *
 * @returns Test case double.
 */
const createTestCase = (fullName: string, retryCount: number): TestCase => ({
    fullName,
    diagnostic: (): TestDiagnostic => ({ retryCount } as TestDiagnostic),
} as unknown as TestCase);

describe('RetryReporter', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('prints the tests that needed a retry', () => {
        const reporter = new RetryReporter();

        reporter.onTestCaseResult(createTestCase('popup > renders page after reload', 1));
        reporter.onTestCaseResult(createTestCase('popup > renders page', 0));
        reporter.onTestRunEnd();

        expect(logInfo).toHaveBeenCalledTimes(1);
        expect(logInfo).toHaveBeenCalledWith(
            '[e2e] retried tests:\n- popup > renders page after reload (retried 1x)',
        );
    });

    it('prints nothing when no test was retried', () => {
        const reporter = new RetryReporter();

        reporter.onTestCaseResult(createTestCase('popup > renders page', 0));
        reporter.onTestRunEnd();

        expect(logInfo).not.toHaveBeenCalled();
    });
});
