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

import { logger } from '../../../common/logger';
import { UserAgent } from '../../../common/user-agent';
import { Prefs } from '../../prefs';
import { appContext, AppContextKey } from '../../storages/app';
import { getRunInfo } from '../../utils/run-info';
import { Version } from '../../utils/version';

import {
    BackendUpdateResponseValidator,
    UpdateCheckStatus,
    type UpdateCheckResult,
} from './types';

/**
 * Service responsible for checking extension update availability
 * via the AdGuard Backend API.
 *
 * This class handles:
 * - Building the backend API request URL with required parameters.
 * - Fetching the update check response from the backend.
 * - Parsing and validating the response.
 * - Comparing the backend-reported version against the current version.
 * - Dev build mocking for testing.
 *
 * The backend API returns:
 * - HTTP 200 with `{"version": "x.y.z.w"}` when an update is available.
 * - HTTP 204 No Content when no update is available.
 * - Other statuses or network errors are treated as errors.
 *
 * Callers interpret the result differently depending on the phase
 * (pre-download vs post-download) and trigger (manual vs automatic).
 *
 * @see {@link https://chrome.adtidy.org/api/v1/{browser}/check_update}
 */
export class BackendUpdateChecker {
    /**
     * Base URL for the AdGuard Backend update check API.
     */
    private static readonly BACKEND_BASE_URL = 'https://chrome.adtidy.org/api/v1';

    /**
     * Timeout for the backend API request in milliseconds.
     */
    private static readonly TIMEOUT_MS = 10_000;

    /**
     * HTTP status code for "No Content" (no update available).
     */
    private static readonly HTTP_NO_CONTENT = 204;

    /**
     * HTTP status code for "OK".
     */
    private static readonly HTTP_OK = 200;

    /**
     * Performs an update check against the AdGuard Backend API.
     *
     * @returns Discriminated result indicating the update status.
     */
    public static async checkUpdate(): Promise<UpdateCheckResult> {
        try {
            const isDevBuild = !IS_RELEASE && !IS_BETA;

            // In dev builds, to simplify testing, we can mock that update is always available
            if (isDevBuild && BackendUpdateChecker.shouldMockVersion()) {
                const mockedVersion = await BackendUpdateChecker.getMockedVersion();
                return {
                    status: UpdateCheckStatus.UpdateAvailable,
                    version: mockedVersion,
                };
            }

            const url = BackendUpdateChecker.buildUrl();

            logger.debug(`[ext.BackendUpdateChecker.checkUpdate]: Checking for updates at ${url}...`);

            let response: Response;
            try {
                response = await fetch(url, {
                    method: 'GET',
                    signal: AbortSignal.timeout(BackendUpdateChecker.TIMEOUT_MS),
                });
            } catch (e) {
                logger.debug(`[ext.BackendUpdateChecker.checkUpdate]: Failed to fetch "${url}":`, e);
                return { status: UpdateCheckStatus.Error, error: e };
            }

            // 204 No Content — no update available
            if (response.status === BackendUpdateChecker.HTTP_NO_CONTENT) {
                logger.debug('[ext.BackendUpdateChecker.checkUpdate]: Backend returned 204 (no update available)');
                return { status: UpdateCheckStatus.NoContent };
            }

            // Non-200 — treat as error
            if (response.status !== BackendUpdateChecker.HTTP_OK) {
                logger.debug(`[ext.BackendUpdateChecker.checkUpdate]: Backend returned unexpected status ${response.status}`);
                return {
                    status: UpdateCheckStatus.Error,
                    error: new Error(`Unexpected HTTP status: ${response.status}`),
                };
            }

            // 200 OK — parse and validate response body
            let json: unknown;
            try {
                json = await response.json();
            } catch (e) {
                logger.debug('[ext.BackendUpdateChecker.checkUpdate]: Failed to parse response JSON:', e);
                return { status: UpdateCheckStatus.Error, error: e };
            }

            const parseResult = BackendUpdateResponseValidator.safeParse(json);
            if (!parseResult.success) {
                logger.debug(`[ext.BackendUpdateChecker.checkUpdate]: Invalid response schema: ${parseResult.error.message}`);
                return { status: UpdateCheckStatus.Error, error: parseResult.error };
            }

            const backendVersion = parseResult.data.version;

            // Compare versions: only treat as update if backend version is strictly greater
            const { currentAppVersion } = await getRunInfo();
            const currentVersion = new Version(currentAppVersion);
            const latestVersion = new Version(backendVersion);
            const isNewer = latestVersion.compare(currentVersion) > 0;

            if (!isNewer) {
                logger.debug(`[ext.BackendUpdateChecker.checkUpdate]: No update available, current: ${currentAppVersion}, backend: ${backendVersion}`);
                return { status: UpdateCheckStatus.NoUpdate };
            }

            logger.debug(`[ext.BackendUpdateChecker.checkUpdate]: Update available, current: ${currentAppVersion}, backend: ${backendVersion}`);

            return { status: UpdateCheckStatus.UpdateAvailable, version: backendVersion };
        } catch (e) {
            logger.error('[ext.BackendUpdateChecker.checkUpdate]: Unexpected error:', e);
            return { status: UpdateCheckStatus.Error, error: e };
        }
    }

    /**
     * Builds the full backend API URL with all required query parameters.
     *
     * @returns Fully-qualified URL string.
     *
     * @throws Error if clientId is not available.
     */
    private static buildUrl(): string {
        const browserType = BackendUpdateChecker.getBrowserType();

        const clientId = appContext.get(AppContextKey.ClientId);
        if (typeof clientId !== 'string') {
            throw new Error('Client ID is not available yet');
        }

        const url = new URL(`${BackendUpdateChecker.BACKEND_BASE_URL}/${browserType}/check_update`);
        url.searchParams.set('app_id', clientId);
        url.searchParams.set('ex_id', Prefs.id);
        url.searchParams.set('version', Prefs.version);
        url.searchParams.set('browser_version', UserAgent.parser.getBrowser().version || '');

        return url.href;
    }

    /**
     * Determines the browser type for the API path variable
     * based on runtime user agent detection.
     *
     * @returns Browser type string: 'chrome', 'firefox', 'edge', or 'opera'.
     */
    private static getBrowserType(): string {
        if (UserAgent.isEdge) {
            return 'edge';
        }
        if (UserAgent.isOpera) {
            return 'opera';
        }
        if (UserAgent.isFirefox) {
            return 'firefox';
        }
        return 'chrome';
    }

    /**
     * Checks if version mocking is enabled for dev builds.
     *
     * @returns True if mocking is enabled, false otherwise.
     */
    private static shouldMockVersion(): boolean {
        // eslint-disable-next-line no-restricted-globals
        return !!self.adguard?.mockMv3UpdateCheckInCws;
    }

    /**
     * Returns a mocked version for dev builds.
     * Increments the last version part by 1.
     *
     * @returns Mocked version string.
     */
    private static async getMockedVersion(): Promise<string> {
        const { currentAppVersion } = await getRunInfo();

        const currentVersion = new Version(currentAppVersion);
        const lastVersionPart = currentVersion.data.pop();
        const updatedLastVersionPart = lastVersionPart ? lastVersionPart + 1 : 0;

        // Creating new version just for validation that version is correctly formed.
        const mockedVersion = new Version(`${currentVersion.data.join('.')}.${updatedLastVersionPart}`);

        const stringifiedVersion = mockedVersion.data.join('.');

        logger.debug(`[ext.BackendUpdateChecker.getMockedVersion]: Mocking latest backend version as ${stringifiedVersion}`);

        return stringifiedVersion;
    }
}
