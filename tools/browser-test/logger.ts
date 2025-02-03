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
/* eslint-disable no-console */

import { getErrorMessage } from '../../Extension/src/common/error';

import {
    TestStatus,
    colorizeDurationTime,
    colorizeStatusText,
    colorizeTitleText,
} from './text-color';

/**
 * Describes test details object from QUnit.
 */
export interface TestDetails {
    name: string,
    tests: {
        name: string,
        status: TestStatus,
        /**
         * @note IMPORTANT: Time in MS.
         */
        runtime: number,
        errors: {
            message: string,
            stack: string,
        }[]
    }[],
    status: TestStatus,
    testCounts: {
        passed: number,
        failed: number,
        skipped: number,
        total: number
    },
    /**
     * @note IMPORTANT: Time in MS.
     */
    runtime: number
}

/**
 * Log test result to console.
 *
 * @param details Test details.
 *
 * @throws If test is not defined (just a linter case).
 */
export const logTestResult = (details: TestDetails): void => {
    const counts = details.testCounts;

    console.log(colorizeTitleText(details.name));

    console.log('Status:', colorizeStatusText(details.status));
    console.log(
        'Total %d tests: %d passed, %d failed, %d skipped',
        counts.total,
        counts.passed,
        counts.failed,
        counts.skipped,
    );
    // precision format log %.2f doesn't work in chrome
    console.log(`Duration: ${colorizeDurationTime(details.runtime.toFixed(2))}ms \n`);

    const { tests } = details;

    for (let i = 0; i < tests.length; i += 1) {
        const test = tests[i];

        if (!test) {
            throw new Error('Test is not defined');
        }

        console.log(test.name, colorizeStatusText(test.status));
    }

    console.log('\n');
};

/**
 * Log test timeout to console.
 *
 * @param testName Test name.
 * @param timeoutMs Timeout in MS.
 */
export const logTestTimeout = (testName: string, timeoutMs: number): void => {
    console.log(colorizeTitleText(testName));

    console.log('Status:', colorizeStatusText(TestStatus.Timeout));
    console.log(`After waited ${colorizeDurationTime(timeoutMs)}ms test was skipped\n`);

    console.log('\n');
};

/**
 * Log test unknown error to console.
 *
 * @param testName Test name.
 * @param error Error.
 */
export const logTestUnknownError = (testName: string, error: unknown): void => {
    console.log(colorizeTitleText(testName));

    console.log('Status:', colorizeStatusText(TestStatus.Failed));
    console.log(`Caught unknown error during waiting for tests: ${getErrorMessage(error)} \n`);

    console.log('\n');
};
