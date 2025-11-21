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

import fs from 'node:fs';
import path from 'node:path';

import {
    chromium,
    type Page,
    type Worker,
} from 'playwright';
import { program } from 'commander';
import builder from 'junit-report-builder';
import unzipper from 'unzipper';

/**
 * Direct import from tsurlfilter instead of tswebextension, because tsurlfilter
 * has exported cjs builds, which is required in node environment.
 */
import { FilterListPreprocessor } from '@adguard/tsurlfilter';

import { BuildTargetEnv } from '../../constants';
import { BUILD_PATH } from '../constants';
import { EXTENSION_INITIALIZED_EVENT } from '../../Extension/src/common/constants';
import { sleep } from '../common/sleep';

import {
    USER_DATA_PATH,
    DEFAULT_EXTENSION_CONFIG,
    TESTCASES_BASE_URL,
} from './test-constants';
import {
    addQunitListeners,
    type SerializedConfiguration,
    setTsWebExtensionConfig,
    waitUntilExtensionInitialized,
} from './page-injections';
import { getTestcases, getRuleText } from './requests';
import { filterCompatibleTestcases, type Testcase } from './testcase';
import {
    logTestResult,
    logTestTimeout,
    logTestUnknownError,
    logInfo,
    logSuccess,
    logError,
    logSection,
    TestStatus,
    type TestDetails,
} from './logger';
import { Product } from './product';
import { enableUserScriptsPermission, testUserScriptsAvailability } from './user-scripts-api';

// https://playwright.dev/docs/service-workers-experimental
process.env.PW_EXPERIMENTAL_SERVICE_WORKER_NETWORK_EVENTS = '1';

const TESTS_TIMEOUT_MS = 5 * 1000;

const EXTENSION_INITIALIZATION_TIMEOUT_MS = 10 * 1000;

const TEST_REPORT_PATH = 'tests-reports/integration-tests.xml';

const PRODUCT_MV3 = Product.Mv3;

enum UserScriptsMode {
    ENABLED = 'USERSCRIPTS_ENABLED',
    DISABLED = 'USERSCRIPTS_DISABLED',
}

type TestRunOptions = {
    /**
     * Enable debug mode with pause page for test with specified id.
     */
    debugTestId: string;
    /**
     * UserScripts mode for testing. If not specified, both modes will be tested.
     * Can be string from CLI or enum value after parsing.
     */
    userscriptsMode: UserScriptsMode | string;
};

/**
 * Opens the page, waits for the `networkidle` event, and then waits when
 * 'testDetails' will be exposed in window object, convert it to JSON
 * and returns it.
 *
 * @param page Page of playwright.
 * @param testPageUrl URL address of tests.
 * @param debugMode Should page be stopped after evaluated tests via connecting
 * debugger or not.
 *
 * @returns Promise which will be resolved with test details object, containing
 * info about run tests.
 */
const waitForTests = async (
    page: Page,
    testPageUrl: string,
    debugMode?: boolean,
): Promise<TestDetails> => {
    await page.goto(testPageUrl, { waitUntil: 'networkidle' });

    const testDetailsObject = await page.waitForFunction(
        // Waits until `window.testDetails` is defined.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (): TestDetails => (<any>window).testDetails,
        undefined,
        { timeout: 0 },
    );

    if (debugMode) {
        await page.pause();
        await sleep(TESTS_TIMEOUT_MS * 1000);
    }

    const testDetails = await testDetailsObject.jsonValue();

    return testDetails;
};

/**
 * Prepares and passes user-defined rules to the service worker.
 *
 * This function preprocesses user rules to avoid doing so during `backgroundPage.evaluate`.
 * After preprocessing, it serializes non-primitive objects to ensure proper deserialization
 * and prepares a configuration object for the service worker.
 *
 * @param backgroundPage The service worker where the configuration will be passed.
 * @param userrulesStr The raw string of user-defined rules to preprocess and serialize.
 *
 * @returns A promise that resolves when the configuration is successfully passed.
 */
const passUserRulesToServiceWorker = async (
    backgroundPage: Worker,
    userrulesStr: string,
): Promise<void> => {
    // Preprocess user rules earlier in order not to do it during
    // backgroundPage.evaluate().
    const userrules = {
        ...FilterListPreprocessor.preprocess(userrulesStr),
        trusted: true,
    };

    // After preprocessing we should manual serialize them to avoid system
    // serialization non-primitive objects with JSON, because it can not be
    // deserialized on the page and data will be broken.
    const serializedFilterList = userrules.filterList.map((item: Uint8Array) => Array.from(item));

    const configuration: SerializedConfiguration = {
        ...DEFAULT_EXTENSION_CONFIG,
        userrules: {
            ...userrules,
            filterList: serializedFilterList,
        },
    };

    // Update tsWebExtension config
    await backgroundPage.evaluate<void, SerializedConfiguration>(
        setTsWebExtensionConfig,
        configuration,
    );
};

/**
 * Executes a test case on a given page, including loading and applying user rules,
 * handling exceptions, and managing test outcomes.
 *
 * This function processes a test case, applies user-defined rules to the service worker,
 * navigates to the test page, and monitors test execution. It records the results, including
 * success, failure, or timeout, and logs detailed outcomes for further analysis.
 *
 * @param backgroundPage The service worker responsible for processing rules.
 * @param page The Playwright page where the test case will be executed.
 * @param testcase The test case to run, including rules and test configurations.
 * @param userScriptsMode The userscripts mode (ENABLED or DISABLED) for this test run.
 * @param debugMode Optional flag for enabling debug mode with extended timeouts
 * and stopping page after evaluated tests via connecting debugger.
 *
 * @returns A promise that resolves to `true` if the test passes or `false` otherwise.
 */
const runTest = async (
    backgroundPage: Worker,
    page: Page,
    testcase: Testcase,
    userScriptsMode: UserScriptsMode,
    debugMode?: boolean,
): Promise<boolean> => {
    // TODO: implement separate e2e test for popups
    if (!testcase.rulesUrl) {
        throw new Error('Test case does not contains any rules.');
    }

    // load rules text for current testcase
    const userrules = await getRuleText(testcase.rulesUrl);

    await passUserRulesToServiceWorker(backgroundPage, userrules);

    let testPageUrl = `${TESTCASES_BASE_URL}/${testcase.link}`;

    const productExceptionsData = testcase.exceptions?.find((ex) => Object.keys(ex)[0] === PRODUCT_MV3);
    if (productExceptionsData && productExceptionsData[PRODUCT_MV3].length > 0) {
        testPageUrl += `?exceptions=${productExceptionsData[PRODUCT_MV3].join(',')}`;
    }

    // Wait for a test details only if the tests are not CSP tests,
    // as they do not work correctly in playwright.
    const openPageAndWaitForTests = waitForTests(page, testPageUrl, debugMode);

    const timeoutForTests = page
        .waitForTimeout(debugMode ? TESTS_TIMEOUT_MS * 1000 : TESTS_TIMEOUT_MS)
        .then(() => TestStatus.Timeout);

    // Create a test suite
    const testSuite = builder
        .testSuite()
        .name(`[${userScriptsMode}] ${testcase.title}`);

    let res: TestDetails | TestStatus;
    try {
        res = await Promise.race([
            timeoutForTests,
            openPageAndWaitForTests,
        ]);
    } catch (e: unknown) {
        logTestUnknownError(testcase.title, e);

        testSuite.time(0);

        testSuite
            .testCase()
            .name(`${testcase.title} - unknown error`)
            .time(0)
            .failure();

        return false;
    }

    if (res === TestStatus.Timeout) {
        logTestTimeout(testcase.title, TESTS_TIMEOUT_MS);

        testSuite.time(TESTS_TIMEOUT_MS / 1000);

        testSuite
            .testCase()
            .name(`${testcase.title} - timeout`)
            .time(TESTS_TIMEOUT_MS / 1000)
            .failure();

        return false;
    }

    const testDetails = res as TestDetails;
    // Log test results to console.
    logTestResult(testDetails);

    testSuite.time(testDetails.runtime / 1000);

    testDetails.tests.forEach((t) => {
        const testCase = testSuite
            .testCase()
            .name(t.name)
            .time(t.runtime / 1000);

        if (t.errors.length > 0 && t.errors[0]) {
            testCase.error(
                t.errors[0].message,
                undefined,
                t.errors[0].stack,
            );
        }

        switch (t.status) {
            case TestStatus.Failed: {
                testCase.failure();
                break;
            }
            case TestStatus.Skipped: {
                testCase.skipped();
                break;
            }
            default: {
                break;
            }
        }
    });

    return true;
};

/**
 * Unzips the extension from the ZIP file. We should test ZIP version, because
 * we will upload extension in ZIP format to Chrome Web Store and in this way we
 * will ensure that the extension works correctly.
 *
 * @param pathToZip Path to the ZIP file.
 *
 * @returns Path to the directory with the extracted extension.
 */
const unzipExtension = async (pathToZip: string): Promise<string> => {
    // Path to the ZIP file
    const zipPath = path.join(pathToZip, 'chrome-mv3.zip');
    // Directory to extract the ZIP
    const unpackedPath = path.join(pathToZip, 'chrome-mv3');

    // Always remove old extraction to ensure fresh state
    if (fs.existsSync(unpackedPath)) {
        fs.rmSync(unpackedPath, { recursive: true, force: true });
    }

    // Create directory for extraction
    fs.mkdirSync(unpackedPath, { recursive: true });

    logInfo(`Extracting extension from ${zipPath} to ${unpackedPath}`);

    // Unzip the extension
    await fs.createReadStream(zipPath)
        .pipe(unzipper.Extract({ path: unpackedPath }))
        .promise();

    return unpackedPath;
};

/**
 * Gets the extension ID from the service worker context.
 *
 * @param backgroundPage The service worker where extension ID will be retrieved.
 *
 * @returns A promise that resolves to the extension ID string.
 */
const getExtensionId = async (backgroundPage: Worker): Promise<string> => {
    return backgroundPage.evaluate((): string => {
        return chrome.runtime.id;
    });
};

/**
 * Runs integration tests in specified `testMode`.
 *
 * @param testMode 'dev', 'beta' or 'release', depending on which build
 * should be tested.
 * @param options Some setting for run tests, see {@link TestRunOptions}.
 *
 * @returns True if all tests have passed or false if any tests have failed
 * or timed out.
 */
const runTests = async (
    testMode: BuildTargetEnv,
    options?: Partial<TestRunOptions>,
): Promise<boolean> => {
    // Determine which modes to run
    const modesToRun = options?.userscriptsMode
        ? [options.userscriptsMode as UserScriptsMode]
        : [UserScriptsMode.DISABLED, UserScriptsMode.ENABLED];

    let allTestsPassed = true;

    // Run tests for each mode
    for (const userScriptsMode of modesToRun) {
        logSection(`Running tests in ${userScriptsMode} mode`);

        const modeTestsPassed = await runTestsForMode(testMode, userScriptsMode, options);
        if (!modeTestsPassed) {
            allTestsPassed = false;
        }
    }

    // Always write report after all tests are run
    builder.writeTo(TEST_REPORT_PATH);

    return allTestsPassed;
};

/**
 * Runs integration tests for a specific userscripts mode.
 *
 * @param testMode 'dev', 'beta' or 'release', depending on which build
 * should be tested.
 * @param userScriptsMode The userscripts mode to run tests in.
 * @param options Some setting for run tests, see {@link TestRunOptions}.
 *
 * @returns True if all tests have passed or false if any tests have failed
 * or timed out.
 */
const runTestsForMode = async (
    testMode: BuildTargetEnv,
    userScriptsMode: UserScriptsMode,
    options?: Partial<TestRunOptions>,
): Promise<boolean> => {
    logInfo(`Preparing to run tests in ${testMode} mode with userscripts ${userScriptsMode}`);

    // Always clean browser cache to ensure consistent test environment
    logInfo('Cleaning browser user data directory...');
    try {
        if (fs.existsSync(USER_DATA_PATH)) {
            fs.rmSync(USER_DATA_PATH, { recursive: true, force: true });
            logInfo(`Cleared browser cache at: ${USER_DATA_PATH}`);
        }
    } catch (error) {
        logError('Failed to clean browser cache', error);
        // Continue anyway, as this is not critical
    }

    const extensionPath = await unzipExtension(path.join(BUILD_PATH, testMode));

    logInfo(`Extension unzipped from ${BUILD_PATH}/${testMode} to: ${extensionPath}`);

    const runOptions = {
        channel: 'chromium',
        args: [
            `--disable-extensions-except=${extensionPath}`,
            `--load-extension=${extensionPath}`,
        ],
    };

    if (options?.debugTestId !== undefined) {
        Object.assign(runOptions, { headless: false });
    } else {
        runOptions.args.push('--headless=new');
    }

    // Launch browser with installed extension
    const browserContext = await chromium.launchPersistentContext(USER_DATA_PATH, runOptions);

    let [backgroundPage] = browserContext.serviceWorkers();
    if (!backgroundPage) {
        backgroundPage = await browserContext.waitForEvent('serviceworker');
    }

    try {
        await Promise.race([
            await backgroundPage.evaluate<void, string>(
                waitUntilExtensionInitialized,
                EXTENSION_INITIALIZED_EVENT,
            ),
            new Promise((resolve, reject) => {
                setTimeout(reject, EXTENSION_INITIALIZATION_TIMEOUT_MS);
            }),
        ]);
    } catch (e) {
        logError('Extension initialization failed (possible due to timeout)', e);
        await browserContext.close();
        return false;
    }

    const page = await browserContext.newPage();

    // Only setup userScripts for ENABLED mode
    if (userScriptsMode === UserScriptsMode.ENABLED) {
        // Get extension ID
        const extensionId = await getExtensionId(backgroundPage);

        // Enable userScripts permission through extension settings
        logInfo('Enabling userScripts permission...');
        const permissionEnabled = await enableUserScriptsPermission(page, extensionId);

        if (permissionEnabled) {
            logSuccess('UserScripts permission enabled');
        } else {
            logInfo('UserScripts permission might already be enabled or not available');
        }

        // Test userScripts API availability before running test cases
        logInfo('Testing userScripts API availability...');
        const userScriptsAvailable = await testUserScriptsAvailability(
            backgroundPage,
            page,
            options?.debugTestId !== undefined,
        );

        if (!userScriptsAvailable) {
            logError('UserScripts API is not available or not working properly');
            await browserContext.close();
            return false;
        }

        logSuccess('UserScripts API is available and working');
    } else {
        logInfo('Skipping userScripts setup for DISABLED mode');
    }

    const testcases = (await getTestcases()).filter(({ id }) => id === 36);

    const compatibleTestcases = filterCompatibleTestcases(testcases, PRODUCT_MV3);

    // register function, that transfer args from page to playwright context
    // installed function survive navigations.
    await page.exposeFunction('logTestResult', logTestResult);

    // extends QUnit instance on creation by custom event listeners,
    // that triggers exposed function
    await page.addInitScript(addQunitListeners, 'logTestResult');

    let allTestsPassed = true;

    const filteredTestsCases = options?.debugTestId !== undefined
        ? compatibleTestcases.filter(({ id }) => id === Number.parseInt(options.debugTestId!, 10))
        : compatibleTestcases;

    if (filteredTestsCases.length === 0 && options?.debugTestId !== undefined) {
        throw Error(`Not found compatible test for provided id: ${options.debugTestId}`);
    }

    // run testcases
    // eslint-disable-next-line no-restricted-syntax
    for (const testcase of filteredTestsCases) {
        const testSuccess = await runTest(
            backgroundPage,
            page,
            testcase,
            userScriptsMode,
            options?.debugTestId !== undefined,
        );

        if (!testSuccess) {
            allTestsPassed = false;
        }
    }

    await browserContext.close();

    return allTestsPassed;
};

/**
 * Parses and validates userscripts mode from CLI options.
 *
 * @param options CLI options that may contain userscriptsMode.
 *
 * @returns The parsed options with validated userscriptsMode.
 */
const parseUserScriptsMode = (options?: Partial<TestRunOptions>): Partial<TestRunOptions> => {
    if (options?.userscriptsMode) {
        const mode = options.userscriptsMode.toLowerCase();
        if (mode === 'enabled') {
            options.userscriptsMode = UserScriptsMode.ENABLED;
        } else if (mode === 'disabled') {
            options.userscriptsMode = UserScriptsMode.DISABLED;
        } else {
            program.error('Invalid userscripts mode. Use `enabled` or `disabled`');
        }
    }
    return options || {};
};

/**
 * Common action handler for running tests with error handling.
 *
 * @param testMode The build target environment to test.
 * @param options CLI options.
 */
const runTestsCommand = async (
    testMode: BuildTargetEnv,
    options?: Partial<TestRunOptions>,
): Promise<void> => {
    const parsedOptions = parseUserScriptsMode(options);
    const success = await runTests(testMode, parsedOptions);

    if (!success) {
        program.error('Some tests failed. Check detailed info in the up log.');
    }
};

program
    .command('dev')
    .option('-d, --debug <TEST_ID>', 'enable debug mode with pause for specified id')
    .option('-u, --userscripts-mode <MODE>', 'userscripts mode: `enabled` or `disabled` (default: both)')
    .description('run tests in dev mode')
    .action((options?: Partial<TestRunOptions>) => runTestsCommand(BuildTargetEnv.Dev, options));

program
    .command('beta')
    .option('-d, --debug <TEST_ID>', 'enable debug mode with pause for specified id')
    .option('-u, --userscripts-mode <MODE>', 'userscripts mode: `enabled` or `disabled` (default: both)')
    .description('run tests in beta mode')
    .action((options?: Partial<TestRunOptions>) => runTestsCommand(BuildTargetEnv.Beta, options));

program
    .command('release')
    .option('-d, --debug <TEST_ID>', 'enable debug mode with pause for specified id')
    .option('-u, --userscripts-mode <MODE>', 'userscripts mode: `enabled` or `disabled` (default: both)')
    .description('run tests in release mode')
    .action((options?: Partial<TestRunOptions>) => runTestsCommand(BuildTargetEnv.Release, options));

program.parse(process.argv);
