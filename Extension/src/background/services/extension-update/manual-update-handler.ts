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

import { MANUAL_EXTENSION_UPDATE_KEY, MIN_UPDATE_DISPLAY_DURATION_MS } from '../../../common/constants';
import { logger } from '../../../common/logger';
import { sleepIfNecessary } from '../../../common/sleep-utils';
import { ForwardFrom } from '../../../common/forward';
import { FilterUpdateApi, PagesApi } from '../../api';
import { browserStorage } from '../../storages';
import { getRunInfo } from '../../utils/run-info';
import { Version } from '../../utils/version';
import { ContentScriptInjector } from '../../content-script-injector';

import { type ManualUpdateMetadata, ManualUpdateMetadataValidator } from './types';
import { CwsVersionChecker } from './cws-version-checker';
import { type AutoUpdateStateManager } from './auto-update-state-manager';
import { AutoUpdateStateField } from './types';

/**
 * Handles manual extension update workflow initiated by user.
 *
 * Responsibilities:
 * - Check for updates via Chrome API.
 * - Verify update availability in CWS.
 * - Apply manual updates with proper state management.
 * - Store and retrieve manual update data across reloads.
 * - Handle post-update page navigation.
 *
 * ## State Management Architecture:
 *
 * This handler uses **direct browserStorage** for ManualUpdateMetadata
 * instead of AutoUpdateStateManager because they serve different purposes:
 *
 * **AutoUpdateStateManager** (shared with AutoUpdateHandler):
 * - Purpose: Update availability tracking and auto-update orchestration.
 * - Lifecycle: Created on `onUpdateAvailable`, cleared when update applied.
 * - Contains: SharedUpdateState + AutoUpdateSpecificState.
 * - Why StateManager: Throttled writes, auto-validation, SW resilience.
 *
 * **ManualUpdateMetadata** (this handler only):
 * - Purpose: Post-reload navigation and notification metadata.
 * - Lifecycle: Created before reload, retrieved once by UI, then deleted.
 * - Why direct storage: One-time use, no throttling needed, independent lifecycle.
 *
 * These are separate concerns with different lifecycles and should remain separate.
 */
export class ManualUpdateHandler {
    /**
     * Chrome status indicating update is available.
     */
    private static readonly UPDATE_AVAILABLE_STATUS = 'update_available';

    /**
     * Timeout for the whole update check operation (in milliseconds).
     * Chrome can take a while to check, download and call onUpdateAvailable.
     *
     * 10 minutes should be enough for Chrome to download the update.
     */
    private static readonly DOWNLOAD_UPDATE_TIMEOUT_MS = 1000 * 60 * 10;

    /**
     * State manager for isManualCheck flag.
     */
    private readonly stateManager: AutoUpdateStateManager;

    /**
     * Callback when update check starts.
     */
    private readonly onUpdateCheckStart: () => void;

    /**
     * Callback when update check completes.
     */
    private readonly onUpdateCheckComplete: (hasUpdate: boolean) => void;

    /**
     * Callback when update application starts.
     */
    private readonly onUpdateApplyStart: () => void;

    /**
     * Callback when update application fails.
     */
    private readonly onUpdateApplyFailed: () => void;

    /**
     * Timeout ID for checking update operation.
     */
    private checkingUpdateTimeoutId: number | undefined;

    /**
     * Creates ManualUpdateHandler instance.
     *
     * @param options Configuration options.
     * @param options.stateManager State manager for isManualCheck flag.
     * @param options.onUpdateCheckStart Callback when check starts.
     * @param options.onUpdateCheckComplete Callback when check completes.
     * @param options.onUpdateApplyStart Callback when update application starts.
     * @param options.onUpdateApplyFailed Callback when update application fails.
     */
    constructor(options: {
        stateManager: AutoUpdateStateManager;
        onUpdateCheckStart: () => void;
        onUpdateCheckComplete: (hasUpdate: boolean) => void;
        onUpdateApplyStart: () => void;
        onUpdateApplyFailed: () => void;
    }) {
        this.stateManager = options.stateManager;
        this.onUpdateCheckStart = options.onUpdateCheckStart;
        this.onUpdateCheckComplete = options.onUpdateCheckComplete;
        this.onUpdateApplyStart = options.onUpdateApplyStart;
        this.onUpdateApplyFailed = options.onUpdateApplyFailed;
    }

    /**
     * Initiates manual update check from user action.
     *
     * Flow:
     * 1. Sets isManualCheck flag.
     * 2. Checks if update available in CWS.
     * 3. Calls chrome.runtime.requestUpdateCheck().
     * 4. Waits for Chrome to download update.
     * 5. Fires callbacks for FSM coordination.
     */
    public async check(): Promise<void> {
        // Mark this as manual check
        this.stateManager.set(AutoUpdateStateField.isManualCheck, true);

        const start = Date.now();

        // We set timeout for the whole update check operation since it consists
        // of multiple steps with not-determined duration.
        // eslint-disable-next-line no-restricted-globals
        this.checkingUpdateTimeoutId = self.setTimeout(() => {
            this.onUpdateApplyFailed();
            // It is okay to set long timeout right in the service worker since
            // we rely on onUpdateAvailable event from Chrome anyway.
        }, ManualUpdateHandler.DOWNLOAD_UPDATE_TIMEOUT_MS);

        this.onUpdateCheckStart();

        // Before requesting update check, ensure that update is available in CWS
        // to avoid unnecessary requestUpdateCheck calls since it is rate-limited.
        const isUpdateAvailableInCws = await ManualUpdateHandler.isUpdateAvailableInCws();

        // If update is available in CWS, request update check and wait for
        // onUpdateAvailable event.
        let shouldWaitForUpdateEvent = false;
        if (isUpdateAvailableInCws) {
            shouldWaitForUpdateEvent = await ManualUpdateHandler.requestUpdateCheck();
        }

        // Wait for more smooth user experience
        // NOTE: it has to be done here and not in the UI components
        // because UI notifications strictly depend on the state machine states
        await sleepIfNecessary(start, MIN_UPDATE_DISPLAY_DURATION_MS);

        // Here we should wait for onUpdateAvailable event from Chrome when
        // browser will download the update in background.
        if (isUpdateAvailableInCws && shouldWaitForUpdateEvent) {
            // Do nothing, just wait for onUpdateAvailable event from Chrome.
            return;
        }

        // Notify that update is not available
        this.onUpdateCheckComplete(false);

        // Reset manual check flag
        this.stateManager.set(AutoUpdateStateField.isManualCheck, false);
    }

    /**
     * Clears the checking update timeout if it was set.
     */
    private clearCheckTimeout(): void {
        // eslint-disable-next-line no-restricted-globals
        self.clearTimeout(this.checkingUpdateTimeoutId);
        this.checkingUpdateTimeoutId = undefined;
    }

    /**
     * Handles update available event for manual checks.
     * Saves state and notifies completion.
     */
    public async onUpdateAvailable(): Promise<void> {
        // Clear the checking timeout
        this.clearCheckTimeout();

        // Save state to storage for persistence across SW restarts
        this.stateManager.save();

        logger.trace('[ext.ManualUpdateHandler.onUpdateAvailable]: Update available after manual check - update icon will be shown immediately.');

        // Notify that update is available
        this.onUpdateCheckComplete(true);
    }

    /**
     * Applies manual update for extension and reloads extension.
     *
     * Flow:
     * 1. Updates custom filters before reload.
     * 2. Stores manual update data (initVersion, pageToOpenAfterReload).
     * 3. Sets content script update flag to prevent double injection.
     * 4. Clears auto update state.
     * 5. Reloads extension via chrome.runtime.reload().
     * 6. Handles update failure and notifies via callback.
     *
     * @param from Page from which update was initiated.
     * @param clearAutoUpdateState Callback to clear auto update state.
     */
    public async applyUpdate(
        from: ForwardFrom.Options | ForwardFrom.Popup,
        clearAutoUpdateState: () => Promise<void>,
    ): Promise<void> {
        const start = Date.now();

        this.onUpdateApplyStart();

        let isExtensionUpdated = false;

        try {
            await FilterUpdateApi.updateCustomFilters();
        } catch (e) {
            logger.error(`[ext.ManualUpdateHandler.applyUpdate]: Failed to update custom filters before extension reload, updating extension will continue. Origin error: ${e}`);
        }

        try {
            const { currentAppVersion } = await getRunInfo();
            const manualExtensionDataToSave: ManualUpdateMetadata = {
                initVersion: currentAppVersion,
                pageToOpenAfterReload: from,
                isOk: true,
            };
            // IMPORTANT: saving to storage should be done before the extension reload
            await browserStorage.set(MANUAL_EXTENSION_UPDATE_KEY, JSON.stringify(manualExtensionDataToSave));

            // Set flag to prevent double injection of content scripts after update
            await ContentScriptInjector.setUpdateFlag();

            // Clear auto-update state on manual update since it contains
            // `isManualCheck` flag which should be reset after update.
            await clearAutoUpdateState();

            // wait for more smooth user experience
            // NOTE: it has to be done here and not in the UI components
            // because UI notifications strictly depend on the state machine states
            await sleepIfNecessary(start, MIN_UPDATE_DISPLAY_DURATION_MS);

            ManualUpdateHandler.reloadExtension();
            isExtensionUpdated = true;
        } catch (e) {
            await browserStorage.remove(MANUAL_EXTENSION_UPDATE_KEY);
            isExtensionUpdated = false;
            logger.error(`[ext.ManualUpdateHandler.applyUpdate]: Failed to reload extension: ${e}`);
        }

        // IMPORTANT: only failure of the update is handled here
        // since its success is handled after the extension reload
        if (!isExtensionUpdated) {
            logger.debug('[ext.ManualUpdateHandler.applyUpdate]: Extension update failed');
            // wait for more smooth user experience
            // NOTE: it has to be done here and not in the UI components
            // because UI notifications strictly depend on the state machine states
            await sleepIfNecessary(start, MIN_UPDATE_DISPLAY_DURATION_MS);
            this.onUpdateApplyFailed();
        }
    }

    /**
     * Handles extension reload after update.
     * Opens appropriate page and shows notification.
     *
     * NOTE: It is possible that the extension version is not actually updated
     * so "failed" notification should be shown.
     *
     * @param isUpdate Whether extension was actually updated.
     */
    public static async handleReload(isUpdate: boolean): Promise<void> {
        const manualExtensionUpdateData = await ManualUpdateHandler.retrieveUpdateData();

        if (!manualExtensionUpdateData) {
            logger.debug('[ext.ManualUpdateHandler.handleReload]: No manual extension update data after reload found');
            return;
        }

        const { initVersion, pageToOpenAfterReload } = manualExtensionUpdateData;

        if (isUpdate) {
            logger.info(`[ext.ManualUpdateHandler.handleReload]: The extension was updated from ${initVersion}`);
        }

        if (!pageToOpenAfterReload) {
            logger.warn('[ext.ManualUpdateHandler.handleReload]: No pageToOpenAfterReload found');
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
            const manualExtensionUpdateData: ManualUpdateMetadata = {
                initVersion,
                pageToOpenAfterReload,
                isOk: false,
            };

            await browserStorage.set(MANUAL_EXTENSION_UPDATE_KEY, JSON.stringify(manualExtensionUpdateData));
        }

        if (pageToOpenAfterReload === ForwardFrom.Options) {
            logger.info('[ext.ManualUpdateHandler.handleReload]: Opening options page...');
            await PagesApi.openFiltersOnSettingsPage();
        } else if (pageToOpenAfterReload === ForwardFrom.Popup) {
            logger.info('[ext.ManualUpdateHandler.handleReload]: Opening popup...');
            await PagesApi.openExtensionPopup();
        }
    }

    /**
     * Retrieves manual update data and removes it from storage.
     * Called from UI to show success/failure notification.
     *
     * IMPORTANT: After retrieving the data from storage, it is removed. It is
     * needed for only one notification showing about update result.
     *
     * @returns Manual extension update data or null if not found.
     */
    public static async getUpdateData(): Promise<ManualUpdateMetadata | null> {
        const manualExtensionUpdateData = await ManualUpdateHandler.retrieveUpdateData();

        await browserStorage.remove(MANUAL_EXTENSION_UPDATE_KEY);

        return manualExtensionUpdateData;
    }

    /**
     * Checks if update is available in Chrome Web Store.
     *
     * @returns True if update is available, false otherwise.
     */
    private static async isUpdateAvailableInCws(): Promise<boolean> {
        return CwsVersionChecker.isUpdateAvailable();
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

            logger.debug('[ext.ManualUpdateHandler.requestUpdateCheck]: requestUpdateCheck result:', res);

            status = res.status;
            nextUpdateVersion = res.version;
        } catch (e) {
            logger.warn('[ext.ManualUpdateHandler.requestUpdateCheck]: requestUpdateCheck failed or timed out, reason:', e);
            return false;
        }

        /**
         * Check if update is available,
         * otherwise (if 'throttled' or 'no_update') return false.
         *
         * @see {@link https://developer.chrome.com/docs/extensions/reference/api/runtime#method-requestUpdateCheck}
         */
        if (status !== ManualUpdateHandler.UPDATE_AVAILABLE_STATUS) {
            logger.debug(`[ext.ManualUpdateHandler.requestUpdateCheck]: Update is not available, status: '${status}'`);
            return false;
        }

        if (!nextUpdateVersion) {
            logger.debug('[ext.ManualUpdateHandler.requestUpdateCheck]: Update version (via requestUpdateCheck) is empty');
            return false;
        }

        const { currentAppVersion } = await getRunInfo();

        const currentVersion = new Version(currentAppVersion);
        const latestVersion = new Version(nextUpdateVersion);
        const isUpdateAvailable = latestVersion.compare(currentVersion) > 0;

        if (isUpdateAvailable) {
            logger.debug(`[ext.ManualUpdateHandler.requestUpdateCheck]: Update is available, current version ${currentAppVersion}, next version ${nextUpdateVersion}`);
            logger.debug('[ext.ManualUpdateHandler.requestUpdateCheck]: Chrome will download update in background and call onUpdateAvailable when ready');
        }

        return isUpdateAvailable;
    }

    /**
     * Retrieves manual update data from storage without removing it.
     *
     * @returns Manual extension update data or null if not found.
     */
    private static async retrieveUpdateData(): Promise<ManualUpdateMetadata | null> {
        try {
            const manualExtensionUpdateStr = await browserStorage.get(MANUAL_EXTENSION_UPDATE_KEY);

            if (typeof manualExtensionUpdateStr !== 'string') {
                return null;
            }

            const parsedData = ManualUpdateMetadataValidator.parse(JSON.parse(manualExtensionUpdateStr));
            return parsedData;
        } catch (e) {
            logger.debug('[ext.ManualUpdateHandler.retrieveUpdateData]: Failed to parse manual extension update data: ', e);
            return null;
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
}
