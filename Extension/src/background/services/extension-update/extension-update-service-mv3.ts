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
import {
    ExtensionUpdateFSMEvent,
    ExtensionUpdateFSMState,
    MANUAL_EXTENSION_UPDATE_KEY,
    ManualExtensionUpdatePage,
    MIN_UPDATE_DISPLAY_DURATION_MS,
} from '../../../common/constants';
import { logger } from '../../../common/logger';
import { MessageType } from '../../../common/messages';
import { sleepIfNecessary } from '../../../common/sleep-utils';
import { getCrxUrl } from '../../../common/update-mv3';
import { PagesApi } from '../../api';
import { messageHandler } from '../../message-handler';
import { Prefs } from '../../prefs';
import { browserStorage } from '../../storages';
import { getRunInfo } from '../../utils/run-info';
import { Version } from '../../utils/version';
import { createPromiseWithTimeout } from '../../utils/timeouts';

import { ManualExtensionUpdateDataValidator, type ManualExtensionUpdateData } from './types';
import { extensionUpdateActor } from './extension-update-machine';

/**
 * Max time to wait for chrome.runtime.requestUpdateCheck() before giving up.
 */
const UPDATE_CHECK_TIMEOUT_MS = 15 * 1000; // 15 seconds

/**
 * Service for checking and updating the extension.
 *
 * Needed for MV3.
 */
export class ExtensionUpdateService {
    /**
     * Regular expression to match the version from the latest version URL.
     */
    private static readonly LATEST_VERSION_URL_REGEXP = /_([0-9_]+)\.crx$/;

    /**
     * Initializes the service.
     */
    public static init(): void {
        extensionUpdateActor.start();

        messageHandler.addListener(
            MessageType.CheckExtensionUpdateFromPopup,
            ExtensionUpdateService.manualCheckExtensionUpdateFromPopup,
        );
        messageHandler.addListener(
            MessageType.CheckExtensionUpdateFromOptions,
            ExtensionUpdateService.manualCheckExtensionUpdateFromOptions,
        );

        messageHandler.addListener(
            MessageType.UpdateExtensionFromPopup,
            ExtensionUpdateService.manualUpdateExtensionFromPopup,
        );
        messageHandler.addListener(
            MessageType.UpdateExtensionFromOptions,
            ExtensionUpdateService.manualUpdateExtensionFromOptions,
        );
    }

    /**
     * Checks for extension updates initiated from popup.
     */
    private static async manualCheckExtensionUpdateFromPopup(): Promise<void> {
        const start = Date.now();
        const isAvailable = await ExtensionUpdateService.manualCheckExtensionUpdate();

        // wait for more smooth user experience
        // NOTE: it has to be done here and not in the UI components
        // because UI notifications strictly depend on the state machine states
        await sleepIfNecessary(start, MIN_UPDATE_DISPLAY_DURATION_MS);

        if (isAvailable) {
            await ExtensionUpdateService.manualUpdateExtension(ManualExtensionUpdatePage.Popup);
        } else {
            extensionUpdateActor.send({ type: ExtensionUpdateFSMEvent.NoUpdateAvailable });
        }
    }

    /**
     * Checks for extension updates initiated from options page.
     *
     * @returns True if update is available, false otherwise.
     */
    private static async manualCheckExtensionUpdateFromOptions(): Promise<boolean> {
        const start = Date.now();
        const isAvailable = await ExtensionUpdateService.manualCheckExtensionUpdate();

        if (!isAvailable) {
            // wait for more smooth user experience
            // NOTE: it has to be done here and not in the UI components
            // because UI notifications strictly depend on the state machine states
            await sleepIfNecessary(start, MIN_UPDATE_DISPLAY_DURATION_MS);
            extensionUpdateActor.send({ type: ExtensionUpdateFSMEvent.NoUpdateAvailable });
        }

        return isAvailable;
    }

    /**
     * Checks for extension updates initiated from options page.
     */
    private static async manualUpdateExtensionFromOptions(): Promise<void> {
        await ExtensionUpdateService.manualUpdateExtension(ManualExtensionUpdatePage.Options);
    }

    /**
     * Updates the extension initiated from popup.
     */
    private static async manualUpdateExtensionFromPopup(): Promise<void> {
        await ExtensionUpdateService.manualUpdateExtension(ManualExtensionUpdatePage.Popup);
    }

    /**
     * Checks for extension updates.
     *
     * @returns True if update is available, false otherwise.
     */
    private static async manualCheckExtensionUpdate(): Promise<boolean> {
        const start = Date.now();
        // Drive state machine: enter Checking
        extensionUpdateActor.send({ type: ExtensionUpdateFSMEvent.Check });

        const latestChromeStoreVersion = await ExtensionUpdateService.getLatestChromeStoreVersion();
        if (!latestChromeStoreVersion) {
            logger.debug('[ext.ExtensionUpdateService.manualCheckExtensionUpdate]: Cannot retrieve latest version from Chrome Web Store');
            // do not return yet
        }

        let nextUpdateVersion: string | undefined;
        let status: chrome.runtime.RequestUpdateCheckStatus;
        try {
            // runtime.requestUpdateCheck() should be used to actually check updates
            // because new extension version may not be loaded on the computer yet
            const res = await ExtensionUpdateService.requestUpdateCheckWithTimeout(UPDATE_CHECK_TIMEOUT_MS);
            status = res.status;
            nextUpdateVersion = res.version;
        } catch (e) {
            logger.warn('[ext.ExtensionUpdateService.manualCheckExtensionUpdate]: requestUpdateCheck failed or timed out, reason:', e);
            return false;
        }

        /**
         * Check if update is available,
         * otherwise (if 'throttled' or 'no_update') return false.
         *
         * @see {@link https://developer.chrome.com/docs/extensions/reference/api/runtime#method-requestUpdateCheck}
         */
        if (status !== 'update_available') {
            logger.debug(`[ext.ExtensionUpdateService.manualCheckExtensionUpdate]: Update is not available, status: '${status}'`);
            return false;
        }

        if (!nextUpdateVersion) {
            logger.debug('[ext.ExtensionUpdateService.manualCheckExtensionUpdate]: Update version (via requestUpdateCheck) is empty');
            return false;
        }

        if (latestChromeStoreVersion && nextUpdateVersion !== latestChromeStoreVersion) {
            logger.debug(`[ext.ExtensionUpdateService.manualCheckExtensionUpdate]: Next update version '${nextUpdateVersion}' is not equal to latest version available in CWS '${latestChromeStoreVersion}'`);
        }

        const { currentAppVersion } = await getRunInfo();

        const currentVersion = new Version(currentAppVersion);
        const latestVersion = new Version(nextUpdateVersion || latestChromeStoreVersion);
        const isUpdateAvailable = latestVersion.compare(currentVersion) > 0;

        if (isUpdateAvailable) {
            // wait for more smooth user experience
            // NOTE: it has to be done here and not in the UI components
            // because UI notifications strictly depend on the state machine states
            await sleepIfNecessary(start, MIN_UPDATE_DISPLAY_DURATION_MS);
            // Drive state machine: update is available
            extensionUpdateActor.send({ type: ExtensionUpdateFSMEvent.UpdateAvailable });
            logger.debug(`[ext.ExtensionUpdateService.manualCheckExtensionUpdate]: Current version ${currentAppVersion} is lower than latest available version ${nextUpdateVersion}`);
        }

        return isUpdateAvailable;
    }

    /**
     * Updates the extension.
     *
     * @param fromPage Page from which the update was triggered.
     */
    private static async manualUpdateExtension(fromPage: ManualExtensionUpdatePage): Promise<void> {
        const start = Date.now();
        // Drive state machine: start updating
        extensionUpdateActor.send({ type: ExtensionUpdateFSMEvent.Update });

        let isExtensionUpdated = false;

        try {
            const { currentAppVersion } = await getRunInfo();
            const manualExtensionDataToSave: ManualExtensionUpdateData = {
                initVersion: currentAppVersion,
                pageToOpenAfterReload: fromPage,
                isOk: true,
            };
            // IMPORTANT: saving to storage should be done before the extension reload
            await browserStorage.set(MANUAL_EXTENSION_UPDATE_KEY, JSON.stringify(manualExtensionDataToSave));

            // wait for more smooth user experience
            // NOTE: it has to be done here and not in the UI components
            // because UI notifications strictly depend on the state machine states
            await sleepIfNecessary(start, MIN_UPDATE_DISPLAY_DURATION_MS);

            ExtensionUpdateService.reloadExtension();
            isExtensionUpdated = true;
        } catch (e) {
            await browserStorage.remove(MANUAL_EXTENSION_UPDATE_KEY);
            isExtensionUpdated = false;
            logger.error(`[ext.ExtensionUpdateService.manualUpdateExtension]: Failed to reload extension: ${e}`);
        }

        // IMPORTANT: only failure of the update is handled here
        // since its success is handled after the extension reload
        if (!isExtensionUpdated) {
            // wait for more smooth user experience
            // NOTE: it has to be done here and not in the UI components
            // because UI notifications strictly depend on the state machine states
            await sleepIfNecessary(start, MIN_UPDATE_DISPLAY_DURATION_MS);
            extensionUpdateActor.send({ type: ExtensionUpdateFSMEvent.UpdateFailed });
        }
    }

    /**
     * Reloads the extension.
     *
     * IMPORTANT:
     * `chrome.runtime.reload` should be used,
     * otherwise service worker may be inactive after reload
     * if `browser.runtime.reload` from webextension-polyfill is used.
     */
    private static reloadExtension(): void {
        chrome.runtime.reload();
    }

    /**
     * Wraps chrome.runtime.requestUpdateCheck() with a timeout.
     *
     * @param timeoutMs Max time in milliseconds to wait before rejecting.
     *
     * @returns Promise that resolves to the result of requestUpdateCheck
     * or rejects if the timeout is reached.
     */
    private static async requestUpdateCheckWithTimeout(
        timeoutMs: number,
    ): Promise<{ status: chrome.runtime.RequestUpdateCheckStatus; version?: string }> {
        return createPromiseWithTimeout(
            chrome.runtime.requestUpdateCheck(),
            timeoutMs,
            `requestUpdateCheck timed out after ${timeoutMs} ms`,
        );
    }

    /**
     * Retrieves manual extension update data from storage.
     *
     * @returns Manual extension update data or null if not found.
     */
    private static async retrieveManualExtensionUpdateData(): Promise<ManualExtensionUpdateData | null> {
        const manualExtensionUpdateStr = await browserStorage.get(MANUAL_EXTENSION_UPDATE_KEY);

        if (typeof manualExtensionUpdateStr !== 'string') {
            return null;
        }

        try {
            const parsedData = ManualExtensionUpdateDataValidator.parse(JSON.parse(manualExtensionUpdateStr));
            return parsedData;
        } catch (e) {
            logger.debug('[ext.ExtensionUpdateService.retrieveManualExtensionUpdateData]: Failed to parse manual extension update data: ', e);
            return null;
        }
    }

    /**
     * Handles extension reload after update.
     *
     * NOTE: It is possible that the extension version is not actually updated
     * so "failed" notification should be shown.
     *
     * @param isUpdate Whether the extension version was updated.
     */
    public static async handleExtensionReloadOnUpdate(isUpdate: boolean): Promise<void> {
        const manualExtensionUpdateData = await ExtensionUpdateService.retrieveManualExtensionUpdateData();

        if (!manualExtensionUpdateData) {
            logger.debug('[ext.ExtensionUpdateService.handleExtensionReloadOnUpdate]: No manual extension update data found');
            return;
        }

        const { initVersion, pageToOpenAfterReload } = manualExtensionUpdateData;

        if (isUpdate) {
            logger.info(`[ext.ExtensionUpdateService.handleExtensionReloadOnUpdate]: The extension was updated from ${initVersion}`);
        }

        if (!pageToOpenAfterReload) {
            logger.warn('[ext.ExtensionUpdateService.handleExtensionReloadOnUpdate]: No pageToOpenAfterReload found');
            await browserStorage.remove(MANUAL_EXTENSION_UPDATE_KEY);
            return;
        }

        /**
         * Note 1:
         * MANUAL_EXTENSION_UPDATE_KEY is not removed here
         * and it will be removed after the needed page is opened.
         * It is needed for the notification showing.
         *
         * Note 2:
         * If `pageToOpenAfterReload` is present in the storage,
         * it means that the extension update was triggered by a user.
         * Due to the Note 1, if this data is present and it is not an update (isUpdate === false),
         * it means that the update failed, and `isOk` should be set to `false`
         * before the page is opened, so it is to be retrieved on the page
         * to show the "failed update" notification.
         */
        if (!isUpdate) {
            await browserStorage.set(
                MANUAL_EXTENSION_UPDATE_KEY,
                JSON.stringify({
                    initVersion,
                    pageToOpenAfterReload,
                    isOk: false,
                }),
            );
        }

        if (pageToOpenAfterReload === ManualExtensionUpdatePage.Options) {
            logger.info('[ext.ExtensionUpdateService.handleExtensionReloadOnUpdate]: Opening options page...');
            await PagesApi.openFiltersOnSettingsPage();
        } else if (pageToOpenAfterReload === ManualExtensionUpdatePage.Popup) {
            logger.info('[ext.ExtensionUpdateService.handleExtensionReloadOnUpdate]: Opening popup...');
            await PagesApi.openExtensionPopup();
        }
    }

    /**
     * Returns the latest version of the extension available in the Chrome Web Store.
     *
     * @returns Extension version available in the Chrome Web Store.
     *
     * @throws Error if fetching the version fails.
     */
    private static async getLatestChromeStoreVersion(): Promise<string | null> {
        const extensionId = Prefs.id;

        const possibleExtensionIds = Object.values(ExtensionsIds).filter((id) => !!id);

        if (!possibleExtensionIds.includes(extensionId)) {
            logger.debug(`[ext.ExtensionUpdateService.getLatestChromeStoreVersion]: Invalid extension ID: '${extensionId}'`);
            return null;
        }

        const updateUrl = getCrxUrl(extensionId);

        logger.debug(`[ext.ExtensionUpdateService.getLatestChromeStoreVersion]: Checking for updates at ${updateUrl}...`);

        let response: Response;
        try {
            response = await fetch(updateUrl, {
                // HEAD is needed to minimize the extension update response size. AG-46443
                method: 'HEAD',
            });
        } catch (e) {
            logger.debug(`[ext.ExtensionUpdateService.getLatestChromeStoreVersion]: Failed to fetch update for "${updateUrl}": ${e}`);
            return null;
        }

        if (response.status !== 200) {
            logger.debug(`[ext.ExtensionUpdateService.getLatestChromeStoreVersion]: No update found for "${updateUrl}", status: ${response.status}`);
            return null;
        }

        const latestVersionUrl = response.url;

        if (!latestVersionUrl) {
            logger.debug(`[ext.ExtensionUpdateService.getLatestChromeStoreVersion]: No redirect location header found for "${extensionId}"`);
            return null;
        }

        const match = latestVersionUrl.match(this.LATEST_VERSION_URL_REGEXP);

        if (!match || !match[1]) {
            logger.debug('[ext.ExtensionUpdateService.getLatestChromeStoreVersion]: Could not parse version from redirect URL.');
            return null;
        }

        const latestExtensionVersionInStore = match[1]
            // '5_1_111_0' -> '5.1.111.0'
            .replace(/_/g, '.')
            // '5.1.111.0' -> '5.1.111'
            .replace(/\.0$/g, '');

        return latestExtensionVersionInStore;
    }

    /**
     * Returns boolean value indicating if extension update is available.
     *
     * @returns True if update is available, false otherwise.
     */
    public static getIsUpdateAvailable(): boolean {
        const currentState = extensionUpdateActor.getSnapshot().value;
        return currentState === ExtensionUpdateFSMState.Available;
    }

    /**
     * Returns boolean value indicating if extension update was done manually previously.
     *
     * IMPORTANT!
     * After retrieving the value from the storage, it is removed.
     *
     * @returns True if extension was updated and reloaded previously, false otherwise.
     */
    public static async getManualExtensionUpdateData(): Promise<ManualExtensionUpdateData | null> {
        const manualExtensionUpdateData = await ExtensionUpdateService.retrieveManualExtensionUpdateData();

        await browserStorage.remove(MANUAL_EXTENSION_UPDATE_KEY);

        return manualExtensionUpdateData;
    }
}
