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

import { ExtensionsIds } from '../../../../../constants';
import { logger } from '../../../common/logger';
import { getCrxUrl } from '../../../common/update-mv3';
import { Prefs } from '../../prefs';
import { getRunInfo } from '../../utils/run-info';
import { Version } from '../../utils/version';

/**
 * Service responsible for checking extension version availability in Chrome Web Store (CWS).
 *
 * This class handles:
 * - Fetching the latest version from CWS.
 * - Comparing current version with CWS version.
 * - Extension ID validation.
 * - Dev build mocking for testing.
 */
export class CwsVersionChecker {
    /**
     * Regular expression to match the version from the latest version URL.
     */
    private static readonly LATEST_VERSION_URL_REGEXP = /_([0-9_]+)\.crx$/;

    /**
     * Checks if update is available in Chrome Web Store.
     *
     * @returns True if update is available, false otherwise.
     */
    public static async isUpdateAvailable(): Promise<boolean> {
        const latestChromeStoreVersion = await CwsVersionChecker.getLatestVersion();
        if (!latestChromeStoreVersion) {
            logger.debug('[ext.CwsVersionChecker.isUpdateAvailable]: Cannot retrieve latest version from Chrome Web Store');

            return false;
        }

        const { currentAppVersion } = await getRunInfo();

        const currentVersion = new Version(currentAppVersion);
        const latestVersion = new Version(latestChromeStoreVersion);
        const isUpdateAvailable = latestVersion.compare(currentVersion) > 0;

        if (!isUpdateAvailable) {
            logger.debug(`[ext.CwsVersionChecker.isUpdateAvailable]: No update available, current version ${currentAppVersion}, latest version in CWS ${latestChromeStoreVersion}`);
        }

        return isUpdateAvailable;
    }

    /**
     * Returns the latest version of the extension available in the Chrome Web Store.
     *
     * @returns Extension version available in the Chrome Web Store, or null if not found.
     */
    private static async getLatestVersion(): Promise<string | null> {
        const isDevBuild = !IS_RELEASE && !IS_BETA;

        // In dev builds, to simplify testing, we can mock that update is always available in CWS
        if (isDevBuild && CwsVersionChecker.shouldMockVersion()) {
            return CwsVersionChecker.getMockedVersion();
        }

        const extensionId = Prefs.id;

        if (!CwsVersionChecker.isValidExtensionId(extensionId)) {
            logger.warn(`[ext.CwsVersionChecker.getLatestVersion]: Invalid extension ID: '${extensionId}'`);
            return null;
        }

        const updateUrl = getCrxUrl(extensionId);

        logger.debug(`[ext.CwsVersionChecker.getLatestVersion]: Checking for updates at ${updateUrl}...`);

        let response: Response;
        try {
            // HEAD is needed to minimize the extension update response size. AG-46443
            response = await fetch(updateUrl, { method: 'HEAD' });
        } catch (e) {
            logger.debug(`[ext.CwsVersionChecker.getLatestVersion]: Failed to fetch update for "${updateUrl}": ${e}`);
            return null;
        }

        if (response.status !== 200) {
            logger.debug(`[ext.CwsVersionChecker.getLatestVersion]: No update found for "${updateUrl}", status: ${response.status}`);
            return null;
        }

        const latestVersionUrl = response.url;

        if (!latestVersionUrl) {
            logger.debug(`[ext.CwsVersionChecker.getLatestVersion]: No redirect location header found for "${extensionId}"`);
            return null;
        }

        const match = latestVersionUrl.match(CwsVersionChecker.LATEST_VERSION_URL_REGEXP);

        if (!match || !match[1]) {
            logger.debug('[ext.CwsVersionChecker.getLatestVersion]: Could not parse version from redirect URL.');
            return null;
        }

        // '5_1_111_0' -> '5.1.111.0'
        const latestExtensionVersionInStore = match[1].replace(/_/g, '.');

        return latestExtensionVersionInStore;
    }

    /**
     * Validates if the given extension ID is a known AdGuard extension ID.
     *
     * @param extensionId Extension ID to validate.
     *
     * @returns True if extension ID is valid, false otherwise.
     */
    private static isValidExtensionId(extensionId: string): boolean {
        const possibleExtensionIds = Object.values(ExtensionsIds).filter((id) => !!id);
        return possibleExtensionIds.includes(extensionId);
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

        logger.debug(`[ext.CwsVersionChecker.getMockedVersion]: Mocking latest CWS version as ${stringifiedVersion}`);

        return stringifiedVersion;
    }
}
