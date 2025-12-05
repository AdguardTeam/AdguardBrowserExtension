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
/* eslint-disable no-console */

import chalk from 'chalk';

import { getZodErrorMessage } from '../../Extension/src/common/error';

export const enum TestStatus {
    Passed = 'passed',
    Failed = 'failed',
    Skipped = 'skipped',
    Timeout = 'timeout',
}

/**
 * Colorize status text.
 *
 * @param status Test status.
 *
 * @returns Colorized status text.
 */
export const colorizeStatusText = (status: TestStatus): string => {
    if (status === TestStatus.Passed) {
        return chalk.green(status);
    }
    if (status === TestStatus.Skipped) {
        // some tests may be skipped due to exceptions
        return chalk.yellow(status);
    }
    return chalk.red(status);
};

/**
 * Colorize title text.
 *
 * @param title Test title.
 *
 * @returns Colorized title text.
 */
export const colorizeTitleText = (title: string): string => chalk.bold.inverse(title);

/**
 * Colorize duration time.
 *
 * @param duration Test duration time.
 *
 * @returns Colorized duration time.
 */
export const colorizeDurationTime = (duration: number | string): string => chalk.yellow(duration);

/**
 * Describes test details object from QUnit.
 */
export interface TestDetails {
    name: string;
    tests: {
        name: string;
        status: TestStatus;
        /**
         * @note IMPORTANT: Time in MS.
         */
        runtime: number;
        errors: {
            message: string;
            stack: string;
        }[];
    }[];
    status: TestStatus;
    testCounts: {
        passed: number;
        failed: number;
        skipped: number;
        total: number;
    };
    /**
     * @note IMPORTANT: Time in MS.
     */
    runtime: number;
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
    console.log(`Caught unknown error during waiting for tests: ${getZodErrorMessage(error)} \n`);

    console.log('\n');
};

/**
 * Log info message with optional formatting.
 *
 * @param message Message to log.
 * @param options Optional formatting options.
 * @param options.title Whether to format message as title.
 * @param options.newline Whether to add newline after message.
 */
export const logInfo = (message: string, options?: { title?: boolean; newline?: boolean }): void => {
    const formattedMessage = options?.title ? colorizeTitleText(message) : message;
    console.log(formattedMessage);

    if (options?.newline) {
        console.log('\n');
    }
};

/**
 * Log success message with green checkmark.
 *
 * @param message Message to log.
 * @param options Optional formatting options.
 * @param options.newline Whether to add newline after message.
 */
export const logSuccess = (message: string, options?: { newline?: boolean }): void => {
    console.log(`${chalk.green('✓')} ${message}`);

    if (options?.newline) {
        console.log('\n');
    }
};

/**
 * Log error message with red formatting.
 *
 * @param message Message to log.
 * @param error Optional error object.
 * @param options Optional formatting options.
 * @param options.newline Whether to add newline after message.
 */
export const logError = (message: string, error?: unknown, options?: { newline?: boolean }): void => {
    const errorText = error ? `: ${getZodErrorMessage(error)}` : '';
    console.error(`${chalk.red('✗')} ${message}${errorText}`);

    if (options?.newline) {
        console.log('\n');
    }
};

/**
 * Log warning message with yellow formatting.
 *
 * @param message Message to log.
 * @param options Optional formatting options.
 * @param options.newline Whether to add newline after message.
 */
export const logWarning = (message: string, options?: { newline?: boolean }): void => {
    console.log(`${chalk.yellow('⚠')} ${message}`);

    if (options?.newline) {
        console.log('\n');
    }
};

/**
 * Log section header with decorative formatting.
 *
 * @param title Section title.
 */
export const logSection = (title: string): void => {
    console.log(`\n=== ${colorizeTitleText(title)} ===`);
};
