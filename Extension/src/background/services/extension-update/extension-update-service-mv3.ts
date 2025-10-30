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
    MIN_UPDATE_DISPLAY_DURATION_MS,
} from '../../../common/constants';
import { logger } from '../../../common/logger';
import { MessageType, type UpdateExtensionMessageMv3 } from '../../../common/messages';
import { sleepIfNecessary } from '../../../common/sleep-utils';
import { getCrxUrl } from '../../../common/update-mv3';
import { PagesApi } from '../../api';
import { messageHandler } from '../../message-handler';
import { Prefs } from '../../prefs';
import { browserStorage } from '../../storages';
import { getRunInfo } from '../../utils/run-info';
import { Version } from '../../utils/version';
import { ForwardFrom } from '../../../common/forward';

import { ManualExtensionUpdateDataValidator, type ManualExtensionUpdateData } from './types';
import { extensionUpdateActor } from './extension-update-machine-mv3';

/**
 * Service for checking and updating the extension in Manifest V3.
 *
 * ## Update flow:
 *
 * ### Automatic update (Chrome native):
 * 1. Chrome detects update in Web Store and downloads it in background.
 * 2. `chrome.runtime.onUpdateAvailable` event fires.
 * 3. State machine transitions to `Available` state.
 * 4. Extension waits for user action or reload browser itself.
 * 5. After reload, service checks storage and shows success/failure notification.
 *
 * ### Manual update (user-initiated):
 * 1. User clicks "Check for updates" in popup/options.
 * 2. Service checks latest version in Chrome Web Store via HEAD request.
 * 3. If newer version exists, calls `chrome.runtime.requestUpdateCheck()`.
 * 4. Chrome downloads update → `onUpdateAvailable` fires → state becomes `Available`.
 * 4. Extension waits for user action or reload browser itself.
 * 6. After reload, service checks storage and shows success/failure notification.
 *
 * ## State machine states:
 * - `Idle` - default state, no update activity.
 * - `Checking` - checking for updates in progress.
 * - `NotAvailable` - no update found (transitions to Idle after 2s).
 * - `Available` - update downloaded and ready to install.
 * - `Updating` - extension reload in progress.
 * - `Failed` - update failed (stays until user retries).
 * - `Success` - update completed successfully (transitions to Idle after 2s).
 *
 * ## Important Notes.
 * - The `onUpdateAvailable` listener is registered in `init()`
 *   and persists throughout the extension lifecycle.
 * - If Chrome downloads an update automatically (even before user checks manually),
 *   the `onUpdateAvailable` event will fire and make the "Update" button available immediately.
 * - According to Chrome documentation, when `onUpdateAvailable` listener is present,
 *   Chrome will NOT automatically reload the extension. Instead, it waits for the extension
 *   to call `chrome.runtime.reload()` when ready (i.e., when user clicks "Update" button).
 * - This allows the user to finish their work before reloading the extension.
 */
export class ExtensionUpdateService {
    /**
     * Regular expression to match the version from the latest version URL.
     */
    private static readonly LATEST_VERSION_URL_REGEXP = /_([0-9_]+)\.crx$/;

    /**
     * Timeout for downloading the update from Chrome Web Store, 10 minutes in milliseconds.
     */
    private static readonly DOWNLOAD_UPDATE_TIMEOUT_MS = 1000 * 60 * 10;

    /**
     * Update available status.
     *
     * @see {@link https://developer.chrome.com/docs/extensions/reference/api/runtime#type-RequestUpdateCheckStatus}
     */
    private static readonly UPDATE_AVAILABLE_STATUS = 'update_available';

    /**
     * Timeout ID for checking update operation.
     */
    private static checkingUpdateTimeoutId: number | undefined;

    /**
     * Initializes the service.
     *
     * IMPORTANT.
     * The `onUpdateAvailable` listener is registered here
     * and persists for the entire extension lifecycle.
     * This means:
     * - If Chrome downloads an update automatically, this listener will fire
     *   and make the "Update" button available in the UI.
     * - The user can then reload the extension at their convenience by clicking "Update".
     * - Chrome will NOT automatically reload the extension when this listener is present.
     */
    public static init(): void {
        extensionUpdateActor.start();

        // Register listener that will be called when Chrome finishes downloading an update.
        // This can happen either:
        // 1. After manual check via requestUpdateCheck() (user clicked "Check for Updates")
        // 2. Automatically when Chrome detects and downloads an update in background
        chrome.runtime.onUpdateAvailable.addListener(ExtensionUpdateService.onUpdateAvailable);

        messageHandler.addListener(MessageType.CheckExtensionUpdateMv3, ExtensionUpdateService.checkExtensionUpdate);
        messageHandler.addListener(MessageType.UpdateExtensionMv3, ExtensionUpdateService.updateExtension);
    }

    /**
     * Handles the onUpdateAvailable event from Chrome runtime.
     *
     * This listener is called by Chrome when an extension update has been downloaded
     * and is ready to be installed. This can happen in the following scenarios:
     *
     * 1. **After manual check**: User clicked "Check for Updates" → requestUpdateCheck()
     *    found an update → Chrome downloaded it → this listener fires.
     *
     * 2. **Automatic update check**: Chrome detected and downloaded an update in background
     *    (even if user never clicked "Check for Updates") → this listener fires.
     *
     * When this listener fires:
     * - FSM transitions to `Available` state.
     * - UI shows "Update" button to the user.
     * - Chrome waits for the extension to call chrome.runtime.reload() (will NOT reload automatically).
     * - User can reload the extension at their convenience by clicking "Update" button.
     *
     * @see {@link https://developer.chrome.com/docs/extensions/reference/api/runtime#event-onUpdateAvailable}
     *
     * @param details Update details from Chrome.
     */
    private static onUpdateAvailable(details: chrome.runtime.UpdateAvailableDetails): void {
        logger.debug(`[ext.ExtensionUpdateService.onUpdateAvailable]: Update became available, version: ${details.version}`);
        // Send UpdateAvailable event to FSM → FSM transitions to Available state → UI shows Update button
        extensionUpdateActor.send({ type: ExtensionUpdateFSMEvent.UpdateAvailable });
        chrome.runtime.onUpdateAvailable.removeListener(ExtensionUpdateService.onUpdateAvailable);

        // Clear the checking update timeout if it was set
        // eslint-disable-next-line no-restricted-globals
        self.clearTimeout(ExtensionUpdateService.checkingUpdateTimeoutId);
        ExtensionUpdateService.checkingUpdateTimeoutId = undefined;
    }

    /**
     * Checks for extension updates initiated from popup.
     *
     * If update is available, Chrome will download it in background
     * and call onUpdateAvailable listener, which will send UpdateAvailable event
     * to FSM, that is why this method returns void.
     *
     * For whole checking step we set a timeout, because it consists of multiple steps
     * with not-determined duration.
     */
    private static async checkExtensionUpdate(): Promise<void> {
        const start = Date.now();

        // We set timeout for the whole update check operation since it consists
        // of multiple steps with not-determined duration.
        // eslint-disable-next-line no-restricted-globals
        ExtensionUpdateService.checkingUpdateTimeoutId = self.setTimeout(() => {
            extensionUpdateActor.send({ type: ExtensionUpdateFSMEvent.UpdateFailed });
            // It is okay to set long timeout right in the service worker since
            // we rely on onUpdateAvailable event from Chrome anyway.
        }, ExtensionUpdateService.DOWNLOAD_UPDATE_TIMEOUT_MS);

        extensionUpdateActor.send({ type: ExtensionUpdateFSMEvent.Check });

        const isUpdateAvailableInCws = await ExtensionUpdateService.isUpdateAvailableInCws();

        // Before requesting update check, ensure that update is available in CWS
        // to avoid unnecessary requestUpdateCheck calls since it is rate-limited.
        let shouldWaitForUpdateEvent;
        if (isUpdateAvailableInCws) {
            shouldWaitForUpdateEvent = await ExtensionUpdateService.requestUpdateCheck();
        }

        // wait for more smooth user experience
        // NOTE: it has to be done here and not in the UI components
        // because UI notifications strictly depend on the state machine states
        await sleepIfNecessary(start, MIN_UPDATE_DISPLAY_DURATION_MS);

        // Here we should wait for onUpdateAvailable event from Chrome when
        // browser will download the update in background.
        if (isUpdateAvailableInCws && shouldWaitForUpdateEvent) {
            // Do nothing, just wait for onUpdateAvailable event from Chrome.
        } else {
            extensionUpdateActor.send({ type: ExtensionUpdateFSMEvent.NoUpdateAvailable });
        }
    }

    /**
     * Checks if update is available in Chrome Web Store.
     *
     * @returns True if update is available, false otherwise.
     */
    private static async isUpdateAvailableInCws(): Promise<boolean> {
        const latestChromeStoreVersion = await ExtensionUpdateService.getLatestChromeStoreVersion();
        if (!latestChromeStoreVersion) {
            logger.debug('[ext.ExtensionUpdateService.isUpdateAvailableInCws]: Cannot retrieve latest version from Chrome Web Store');

            return false;
        }

        const { currentAppVersion } = await getRunInfo();

        const currentVersion = new Version(currentAppVersion);
        const latestVersion = new Version(latestChromeStoreVersion);
        const isUpdateAvailable = latestVersion.compare(currentVersion) > 0;

        if (!isUpdateAvailable) {
            logger.debug(`[ext.ExtensionUpdateService.isUpdateAvailableInCws]: No update available, current version ${currentAppVersion}, latest version in CWS ${latestChromeStoreVersion}`);
        }

        return isUpdateAvailable;
    }

    /**
     * Checks for extension updates.
     *
     * If update is available, Chrome will download it in background, we should
     * wait for onUpdateAvailable event.
     *
     * @returns True if should wait for onUpdateAvailable event, false otherwise.
     */
    private static async requestUpdateCheck(): Promise<boolean> {
        let nextUpdateVersion: string | undefined;
        let status: chrome.runtime.RequestUpdateCheckStatus;
        try {
            /**
             * `runtime.requestUpdateCheck()` should be used to actually check updates
             * because new extension version may not be loaded on the computer yet.
             *
             * If update is available, Chrome will start downloading it in background
             * and will call onUpdateAvailable listener when download is complete.
             *
             * @see {@link https://developer.chrome.com/docs/extensions/reference/api/runtime#method-requestUpdateCheck}
             */
            const res = await chrome.runtime.requestUpdateCheck();

            logger.debug('[ext.ExtensionUpdateService.requestUpdateCheck]: requestUpdateCheck result:', res);

            status = res.status;
            nextUpdateVersion = res.version;
        } catch (e) {
            logger.warn('[ext.ExtensionUpdateService.requestUpdateCheck]: requestUpdateCheck failed or timed out, reason:', e);
            return false;
        }

        /**
         * Check if update is available,
         * otherwise (if 'throttled' or 'no_update') return false.
         *
         * @see {@link https://developer.chrome.com/docs/extensions/reference/api/runtime#method-requestUpdateCheck}
         */
        if (status !== ExtensionUpdateService.UPDATE_AVAILABLE_STATUS) {
            logger.debug(`[ext.ExtensionUpdateService.requestUpdateCheck]: Update is not available, status: '${status}'`);
            return false;
        }

        if (!nextUpdateVersion) {
            logger.debug('[ext.ExtensionUpdateService.requestUpdateCheck]: Update version (via requestUpdateCheck) is empty');
            return false;
        }

        const { currentAppVersion } = await getRunInfo();

        const currentVersion = new Version(currentAppVersion);
        const latestVersion = new Version(nextUpdateVersion);
        const isUpdateAvailable = latestVersion.compare(currentVersion) > 0;

        if (isUpdateAvailable) {
            logger.debug(`[ext.ExtensionUpdateService.requestUpdateCheck]: Update is available, current version ${currentAppVersion}, next version ${nextUpdateVersion}`);
            logger.debug('[ext.ExtensionUpdateService.requestUpdateCheck]: Chrome will download update in background and call onUpdateAvailable when ready');
        }

        return isUpdateAvailable;
    }

    /**
     * Updates the extension.
     *
     * Update can be initiated in two ways:
     * 1. Manual check: User clicks "Check for updates" button,
     *    Chrome downloads update, user clicks "Update".
     * 2. Automatic: Chrome detects update, then user clicks "Update".
     *
     * @param from The page from which the update was initiated.
     * @param from.data The page from which the update was initiated.
     * @param from.data.from The page from which the update was initiated.
     */
    private static async updateExtension(
        { data: { from } }: UpdateExtensionMessageMv3,
    ): Promise<void> {
        const start = Date.now();

        extensionUpdateActor.send({ type: ExtensionUpdateFSMEvent.Update });

        let isExtensionUpdated = false;

        try {
            const { currentAppVersion } = await getRunInfo();
            const manualExtensionDataToSave: ManualExtensionUpdateData = {
                initVersion: currentAppVersion,
                pageToOpenAfterReload: from,
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
            logger.error(`[ext.ExtensionUpdateService.updateExtension]: Failed to reload extension: ${e}`);
        }

        // IMPORTANT: only failure of the update is handled here
        // since its success is handled after the extension reload
        if (!isExtensionUpdated) {
            logger.debug('[ext.ExtensionUpdateService.updateExtension]: Extension update failed');
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

        if (pageToOpenAfterReload === ForwardFrom.Options) {
            logger.info('[ext.ExtensionUpdateService.handleExtensionReloadOnUpdate]: Opening options page...');
            await PagesApi.openFiltersOnSettingsPage();
        } else if (pageToOpenAfterReload === ForwardFrom.Popup) {
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
        const isDevBuild = !IS_RELEASE && !IS_BETA;

        // In dev builds, to simplify testing, we can mock that update is always available in CWS
        // eslint-disable-next-line no-restricted-globals
        if (isDevBuild && self.adguard.mockMv3UpdateCheckInCws) {
            const { currentAppVersion } = await getRunInfo();

            const currentVersion = new Version(currentAppVersion);
            const lastVersionPart = currentVersion.data.pop();
            const updatedLastVersionPart = lastVersionPart ? lastVersionPart + 1 : 0;

            // Creating new version just for validation that version is correctly formed.
            const mockedVersion = new Version(currentVersion.data.join('.') + updatedLastVersionPart);

            const stringifiedVersion = mockedVersion.data.join('.');

            logger.debug(`[ext.ExtensionUpdateService.getLatestChromeStoreVersion]: Mocking latest CWS version as ${stringifiedVersion}`);

            return stringifiedVersion;
        }

        const extensionId = Prefs.id;

        const possibleExtensionIds = Object.values(ExtensionsIds).filter((id) => !!id);

        if (!possibleExtensionIds.includes(extensionId)) {
            logger.warn(`[ext.ExtensionUpdateService.getLatestChromeStoreVersion]: Invalid extension ID: '${extensionId}'`);
            return null;
        }

        const updateUrl = getCrxUrl(extensionId);

        logger.debug(`[ext.ExtensionUpdateService.getLatestChromeStoreVersion]: Checking for updates at ${updateUrl}...`);

        let response: Response;
        try {
            // HEAD is needed to minimize the extension update response size. AG-46443
            response = await fetch(updateUrl, { method: 'HEAD' });
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

        // '5_1_111_0' -> '5.1.111.0'
        const latestExtensionVersionInStore = match[1].replace(/_/g, '.');

        return latestExtensionVersionInStore;
    }

    /**
     * Returns boolean value indicating if extension update is available.
     *
     * @returns True if update is available, false otherwise.
     */
    public static get isUpdateAvailable(): boolean {
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
