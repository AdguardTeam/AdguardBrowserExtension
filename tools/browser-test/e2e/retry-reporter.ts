/**
 * Copyright (c) 2015-2026 Adguard Software Ltd.
 *
 * @file Vitest reporter that lists E2E tests which needed a retry.
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

import { type Reporter, type TestCase } from 'vitest/node';

import { logInfo } from '../logger';

/**
 * Vitest reporter that records retried tests and prints them at the end of the
 * run, so a test that failed once and then passed is not recorded only as a
 * plain pass in the JUnit report.
 */
export default class RetryReporter implements Reporter {
    /**
     * Tests that needed at least one retry, keyed by full test name.
     */
    private readonly retriedTests = new Map<string, number>();

    /**
     * Records a test that needed a retry.
     *
     * @param testCase Finished test case.
     */
    onTestCaseResult(testCase: TestCase): void {
        const retryCount = testCase.diagnostic()?.retryCount ?? 0;

        if (retryCount === 0) {
            return;
        }

        this.retriedTests.set(testCase.fullName, retryCount);
    }

    /**
     * Prints the retried tests, if any.
     */
    onTestRunEnd(): void {
        if (this.retriedTests.size === 0) {
            return;
        }

        const summary = [...this.retriedTests]
            .map(([name, retryCount]) => `- ${name} (retried ${retryCount}x)`)
            .join('\n');

        logInfo(`[e2e] retried tests:\n${summary}`);
    }
}
