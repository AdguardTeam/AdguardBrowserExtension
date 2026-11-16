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
    afterAll,
    beforeAll,
    beforeEach,
    describe,
    expect,
    it,
} from 'vitest';

import { APP_MESSAGE_HANDLER_NAME, MessageType } from '../../Extension/src/common/messages/constants';
import { unpackE2EArtifact } from '../../tools/browser-test/e2e/artifacts';
import {
    type E2ESession,
    closeE2ESession,
    launchE2ESession,
    openE2ESurface,
} from '../../tools/browser-test/e2e/session';
import {
    E2EBrowserEngine,
    type E2EMatrixEntry,
    E2ESurfaceId,
} from '../../tools/browser-test/e2e/types';
import { logInfo, logSection } from '../../tools/browser-test/logger';

import {
    READ_CUSTOM_FILTERS_ARGS,
    addCustomFilterViaUi,
    addCustomFilterViaUiExpectingError,
    readCustomFilters,
    readFilterContent,
    sendExtensionMessage,
    waitForValue,
} from './helpers/custom-filter-helpers';
import {
    expectNoErrors,
    getE2EEnv,
    getE2EMatrix,
    getE2ESession,
    getSurface,
} from './helpers/e2e-helpers';
import { E2EFixtureServer } from './helpers/fixture-server';
import { BEFORE_ALL_TIMEOUT_MS, OPTIONS_PAGE_READY_SELECTOR } from './helpers/user-rules-helpers';

const e2eEnv = getE2EEnv();
// These checks use the Chromium extension APIs through the Playwright page
// handle. The Firefox Selenium matrix does not cover them.
const e2eMatrix = getE2EMatrix()
    .filter((entry) => entry.engine === E2EBrowserEngine.PlaywrightChromium);

logSection(`E2E filters-downloader tests (${e2eEnv})`);
logInfo(`Selected matrix: ${e2eMatrix.map((entry) => entry.id).join(', ')}`);

if (e2eMatrix.length === 0) {
    logInfo('[filters-downloader] No Chromium entries in matrix — skipping');
    // Register a skipped suite so Vitest does not fail this file with
    // "No test suite found in file" when only Firefox entries are selected.
    describe.skip('[filters-downloader] no Chromium entries in matrix', () => {});
}

/**
 * Timeout for opening the options page and waiting for its first render, in
 * milliseconds.
 */
const OPTIONS_READY_TIMEOUT_MS = 60_000;

/**
 * Timeout for waiting until the background applies a filter update, in
 * milliseconds.
 */
const UPDATE_TIMEOUT_MS = 20_000;

/**
 * Filter header used by fixture filters.
 */
const FILTER_DESCRIPTION = 'E2E fixture filter';

/**
 * Error message pattern for the network failure that the retry test
 * intentionally triggers.
 */
const EXPECTED_NETWORK_ERROR_PATTERN = /net::ERR_|NetworkError|Failed to fetch/;

/**
 * Duration of the network failure in the retry test, in milliseconds.
 *
 * The downloader waits one second before its single retry. The failure must be
 * shorter than that delay, but long enough to abort a browser-level resend of
 * the failed request.
 */
const NETWORK_FAILURE_DURATION_MS = 900;

/**
 * Options for a fixture filter.
 */
type FixtureFilterOptions = {
    /**
     * Filter title.
     */
    title: string;

    /**
     * Filter version.
     */
    version: string;

    /**
     * Filter rules.
     */
    rules: string[];
};

/**
 * Builds filter text with standard metadata headers.
 *
 * @param options Filter options.
 *
 * @returns Filter text.
 */
const createFilterText = ({
    title,
    version,
    rules,
}: FixtureFilterOptions): string => {
    const header = [
        `! Title: ${title}`,
        `! Description: ${FILTER_DESCRIPTION}`,
        `! Version: ${version}`,
        '! Expires: 1 day',
        '! TimeUpdated: 2026-01-01T00:00:00+00:00',
    ];

    return [...header, ...rules].join('\n');
};

e2eMatrix.forEach((entry: E2EMatrixEntry) => {
    describe(entry.id, () => {
        let e2eSession: E2ESession | undefined;
        let fixture: E2EFixtureServer;
        let attempt = 0;

        beforeAll(async () => {
            fixture = new E2EFixtureServer();
            await fixture.start();

            logInfo(`[filters-downloader] unpacking ${e2eEnv} artifact`);

            const extensionPath = await unpackE2EArtifact(entry, e2eEnv);

            e2eSession = await launchE2ESession(entry, extensionPath);
        }, BEFORE_ALL_TIMEOUT_MS);

        afterAll(async () => {
            try {
                if (e2eSession) {
                    await closeE2ESession(e2eSession);
                }
            } finally {
                if (fixture) {
                    await fixture.stop();
                }
            }
        });

        beforeEach(() => {
            fixture.reset();
            attempt += 1;
        });

        /**
         * Builds a custom filter URL with a per-attempt query parameter.
         *
         * The E2E config retries a failed test once in the same browser
         * profile. A unique URL prevents the retry from failing with
         * `errorAlreadyExists` when the first attempt already added the filter.
         *
         * @param fixturePath Fixture path starting with a slash.
         *
         * @returns Custom filter URL unique for the current attempt.
         */
        const getCustomFilterUrl = (fixturePath: string): string => {
            return `${fixture.getUrl(fixturePath)}?attempt=${attempt}`;
        };

        /**
         * Opens the options page and waits for the initial render.
         *
         * @returns Options page handle.
         *
         * @throws Error if the page does not render before the timeout. The
         * page is closed before the error is rethrown.
         */
        const openOptionsPage = async () => {
            const page = await openE2ESurface(
                getE2ESession(e2eSession),
                entry,
                getSurface(E2ESurfaceId.Options),
            );

            try {
                await page.waitForSelector(OPTIONS_PAGE_READY_SELECTOR, OPTIONS_READY_TIMEOUT_MS);
            } catch (error: unknown) {
                await page.close();
                throw error;
            }

            return page;
        };

        it('adds a custom filter and sends v3 browser request headers', async () => {
            const filterPath = '/filters/baseline.txt';
            const filterUrl = getCustomFilterUrl(filterPath);

            fixture.serveText(filterPath, createFilterText({
                title: 'E2E baseline filter',
                version: '1.0.0',
                rules: ['||valid.example^', '||valid-two.example^'],
            }));

            const page = await openOptionsPage();

            try {
                const added = await addCustomFilterViaUi(page, filterUrl);

                expect(added.filter.customUrl).toBe(filterUrl);
                expect(added.rulesCount).toBeGreaterThan(0);

                const downloadRequests = fixture
                    .getRequests(filterPath)
                    .filter((request) => request.method === 'GET');

                expect(downloadRequests.length).toBeGreaterThan(0);

                const downloadRequest = downloadRequests[0]!;

                logInfo(`[filters-downloader] baseline request headers: ${JSON.stringify(downloadRequest.headers)}`);

                // The v3 browser build uses fetch without the legacy
                // Pragma/Content-Type request headers.
                expect(downloadRequest.headers.pragma).toBeUndefined();
                expect(downloadRequest.headers['content-type']).toBeUndefined();

                expectNoErrors(await page.getErrors(), `${entry.id}/baseline page errors`);
                expectNoErrors(await page.getBackgroundErrors(), `${entry.id}/baseline background errors`);
            } finally {
                await page.close();
            }
        });

        it('shows an error and does not add a filter for an empty HTTP response', async () => {
            const filterPath = '/filters/empty.txt';
            const filterUrl = getCustomFilterUrl(filterPath);

            fixture.serveEmpty(filterPath);

            // An empty HTTP response throws `Response is empty` in both 2.4.4
            // and 3.0.0, so this is a regression check. The v3 change
            // for an empty local file (XHR) is not reachable from the custom
            // filter flow: custom filters use HTTP(S) URLs.
            const page = await openOptionsPage();

            try {
                const modalText = await addCustomFilterViaUiExpectingError(page, filterUrl);

                expect(modalText).toContain('Failed to add custom filter');

                // The modal shows a generic message, so the downloader error is
                // checked through the same message the modal sends.
                const messageResult = await page.evaluate(sendExtensionMessage, {
                    handlerName: APP_MESSAGE_HANDLER_NAME,
                    type: MessageType.LoadCustomFilterInfo,
                    data: { url: filterUrl },
                });

                expect(messageResult.error).toContain('Response is empty');

                const filters = await page.evaluate(readCustomFilters, READ_CUSTOM_FILTERS_ARGS);

                expect(filters.some((filter) => filter.customUrl === filterUrl)).toBe(false);
            } finally {
                await page.close();
            }
        });

        it('does not retry an invalid HTTP status (503) and records one request', async () => {
            const filterPath = '/filters/status-503.txt';
            const filterUrl = getCustomFilterUrl(filterPath);

            fixture.serveStatus(filterPath, 503);

            const page = await openOptionsPage();

            try {
                const modalText = await addCustomFilterViaUiExpectingError(page, filterUrl);

                expect(modalText).toContain('Failed to add custom filter');

                const requests = fixture.getRequests(filterPath);

                logInfo(`[filters-downloader] 503 request hits: ${requests.length}`);

                // An HTTP error status is not retried, only network errors are.
                expect(requests).toHaveLength(1);

                const filters = await page.evaluate(readCustomFilters, READ_CUSTOM_FILTERS_ARGS);

                expect(filters.some((filter) => filter.customUrl === filterUrl)).toBe(false);
            } finally {
                await page.close();
            }
        });

        it('retries once after a network error and adds the filter', async () => {
            const filterPath = '/filters/network-retry.txt';
            const filterUrl = getCustomFilterUrl(filterPath);

            // The fixture aborts every request inside the failure window.
            // Chromium resends a failed request immediately, so a single
            // aborted request would let the resend succeed and the downloader
            // would not retry.
            fixture.serveAbortWindow(filterPath, NETWORK_FAILURE_DURATION_MS, createFilterText({
                title: 'E2E retry filter',
                version: '1.0.0',
                rules: ['||retry.example^'],
            }));

            const page = await openOptionsPage();

            try {
                const added = await addCustomFilterViaUi(page, filterUrl);

                expect(added.filter.customUrl).toBe(filterUrl);
                expect(added.rulesCount).toBeGreaterThan(0);

                const requests = fixture.getRequests(filterPath);

                logInfo(`[filters-downloader] retry request hits: ${requests.length}`);

                // A browser-level resend adds a request, so only the lower
                // bound is fixed.
                expect(requests.length).toBeGreaterThanOrEqual(2);
                expect(requests.every((request) => request.method === 'GET')).toBe(true);

                const lastRequest = requests[requests.length - 1]!;
                const previousRequest = requests[requests.length - 2]!;

                // Every request inside the window is aborted, so the
                // successful request must be the downloader retry after its
                // one-second delay and not a browser resend.
                expect(lastRequest.timestamp - previousRequest.timestamp)
                    .toBeGreaterThanOrEqual(NETWORK_FAILURE_DURATION_MS);

                // The aborted requests are on purpose, so the expected network
                // errors are filtered out before the check.
                const pageErrors = (await page.getErrors())
                    .filter((error) => !EXPECTED_NETWORK_ERROR_PATTERN.test(error.message));
                expectNoErrors(pageErrors, `${entry.id}/retry page errors`);

                const backgroundErrors = (await page.getBackgroundErrors())
                    .filter((error) => !EXPECTED_NETWORK_ERROR_PATTERN.test(error.message));
                expectNoErrors(backgroundErrors, `${entry.id}/retry background errors`);
            } finally {
                await page.close();
            }
        });

        it('resolves include and chromium condition directives after download', async () => {
            const mainPath = '/filters/include/main.txt';
            const childPath = '/filters/include/child.txt';
            const filterUrl = getCustomFilterUrl(mainPath);

            fixture.serveText(childPath, '||included.example^\n');
            fixture.serveText(mainPath, createFilterText({
                title: 'E2E include filter',
                version: '1.0.0',
                rules: [
                    '!#include child.txt',
                    '!#if (adguard_ext_chromium)',
                    '||chromium-only.example^',
                    '!#endif',
                    '!#if (adguard_ext_firefox)',
                    '||firefox-only.example^',
                    '!#endif',
                ],
            }));

            const page = await openOptionsPage();

            try {
                const added = await addCustomFilterViaUi(page, filterUrl);

                const content = await waitForValue(
                    () => readFilterContent(page, added.filter.filterId),
                    (value) => !!value && value.includes('||included.example^'),
                    UPDATE_TIMEOUT_MS,
                );

                expect(content).toContain('||chromium-only.example^');
                expect(content).not.toContain('||firefox-only.example^');
                expect(fixture.getRequests(childPath).length).toBeGreaterThan(0);

                expectNoErrors(await page.getErrors(), `${entry.id}/include page errors`);
                expectNoErrors(await page.getBackgroundErrors(), `${entry.id}/include background errors`);
            } finally {
                await page.close();
            }
        });
    });
});
