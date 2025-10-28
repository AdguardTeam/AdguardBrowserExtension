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

import { throttle } from 'lodash-es';

import { ExtensionsIds } from '../../../../../constants';
import {
    ExtensionUpdateFSMEvent,
    ExtensionUpdateFSMState,
    MANUAL_EXTENSION_UPDATE_KEY,
    MIN_UPDATE_DISPLAY_DURATION_MS,
    AUTO_UPDATE_STATE_KEY_MV3,
    AUTO_UPDATE_CONFIG_KEY_MV3,
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

import {
    ManualExtensionUpdateDataValidator,
    AutoUpdateStateValidator,
    AutoUpdateConfigValidator,
    type ManualExtensionUpdateData,
} from './types';
import { extensionUpdateActor } from './extension-update-machine';

/**
 * Service for checking and updating the extension in Manifest V3.
 *
 * ## Update flow:
 *
 * ### Automatic update (Chrome native):
 * 1. Chrome detects update in Web Store and downloads it in background.
 * 2. `chrome.runtime.onUpdateAvailable` event fires.
 * 3. State machine transitions to `Available` state.
 * 4. Extension waits for user action or reloads itself automatically.
 * 5. After reload, service checks storage and shows success/failure notification.
 *
 * ### Manual update (user-initiated):
 * 1. User clicks "Check for updates" in popup/options.
 * 2. Service checks latest version in Chrome Web Store via HEAD request.
 * 3. If newer version exists, calls `chrome.runtime.requestUpdateCheck()`.
 * 4. Chrome downloads update → `onUpdateAvailable` fires → state becomes `Available`.
 * 5. Extension waits for user action.
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
 *
 * ## Auto-update behavior:
 * - Update icon appears only after 24 hours (configurable) since update became available.
 * - Update applies automatically after 30 minutes (configurable) of browser inactivity.
 * - Browser inactivity is tracked via webNavigation.onCommitted events.
 * - Config can be overridden via chrome.storage.local (key: 'auto-update-config-mv3').
 * - Config is loaded once during initialization and cached in memory.
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
     * Throttle interval for saveAutoUpdateState, 5 seconds in milliseconds.
     */
    private static readonly SAVE_AUTO_UPDATE_STATE_THROTTLE_MS = 5 * 1000;

    /**
     * Timeout ID for checking update operation.
     */
    private static checkingUpdateTimeoutId: number | undefined;

    /**
     * Interval ID for periodic auto-update check.
     */
    private static autoUpdateCheckIntervalId: number | undefined;

    /**
     * Timestamp when update became available.
     */
    private static updateAvailableTimestamp: number | null = null;

    /**
     * Timestamp of last navigation event.
     */
    private static lastNavigationTimestamp: number | null = null;

    /**
     * Flag indicating if last update check was manual (user-initiated).
     */
    private static isManualCheck: boolean = false;

    /**
     * Cached auto-update configuration.
     *
     * Can be manually overridden via chrome.storage.local.
     */
    private static autoUpdateConfig = {
        /**
         * Time to wait before showing the update icon after update becomes available.
         * Default: 24 hours in milliseconds.
         */
        ICON_DELAY_MS: 24 * 60 * 60 * 1000,

        /**
         * Time of inactivity (no tab navigation events) before automatically applying update.
         * Default: 30 minutes in milliseconds.
         */
        IDLE_THRESHOLD_MS: 30 * 60 * 1000,

        /**
         * Interval for checking if conditions are met to apply auto-update.
         * Default: 20 seconds in milliseconds to prevent fall into service worker
         * restart case, where TTL of SW will be less that the interval.
         * See https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle#idle-shutdown.
         */
        CHECK_INTERVAL_MS: 20 * 1000,
    };

    /**
     * Throttled version of saveAutoUpdateState to avoid excessive storage writes.
     */
    private static saveAutoUpdateStateThrottled = throttle(
        () => ExtensionUpdateService.saveAutoUpdateState(),
        ExtensionUpdateService.SAVE_AUTO_UPDATE_STATE_THROTTLE_MS,
    );

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
    public static async init(): Promise<void> {
        extensionUpdateActor.start();

        // Register listener that will be called when Chrome finishes downloading an update.
        // This can happen either:
        // 1. After manual check via requestUpdateCheck() (user clicked "Check for Updates")
        // 2. Automatically when Chrome detects and downloads an update in background
        chrome.runtime.onUpdateAvailable.addListener(ExtensionUpdateService.onUpdateAvailable);

        messageHandler.addListener(MessageType.CheckExtensionUpdateMv3, ExtensionUpdateService.checkExtensionUpdate);
        messageHandler.addListener(MessageType.UpdateExtensionMv3, ExtensionUpdateService.updateExtension);

        // Load configuration from storage
        await ExtensionUpdateService.loadAutoUpdateConfig();

        // Load persisted state if any
        await ExtensionUpdateService.loadAutoUpdateState();

        // Start checking for "idle" condition and icon delay if update is pending
        ExtensionUpdateService.initChecksForAutoUpdate();
    }

    /**
     * Loads auto-update configuration from storage on initialization.
     * Reads from chrome.storage.local to allow runtime configuration for testing.
     */
    private static async loadAutoUpdateConfig(): Promise<void> {
        try {
            const configStr = await browserStorage.get(AUTO_UPDATE_CONFIG_KEY_MV3);

            if (typeof configStr !== 'string') {
                return;
            }

            const customConfig = AutoUpdateConfigValidator.parse(JSON.parse(configStr));

            logger.info('[ext.ExtensionUpdateService.loadAutoUpdateConfig]: Using custom config from storage:', customConfig);

            ExtensionUpdateService.autoUpdateConfig = {
                ...ExtensionUpdateService.autoUpdateConfig,
                ...customConfig,
            };
        } catch (error) {
            logger.warn('[ext.ExtensionUpdateService.loadAutoUpdateConfig]: Failed to parse config from storage:', error);
        }
    }

    /**
     * Handles the onUpdateAvailable event from Chrome runtime.
     *
     * This listener is called by Chrome when an extension update has been downloaded
     * and is ready to be installed. This can happen in the following scenarios:
     *
     * 1. **After manual check**: User clicked "Check for Updates" → requestUpdateCheck()
     *    found an update → Chrome downloaded it → this listener fires.
     *    In this case, update icon appears immediately.
     *
     * 2. **Automatic update check**: Chrome detected and downloaded an update in background
     *    (even if user never clicked "Check for Updates") → this listener fires.
     *    In this case, update icon appears after iconDelayMs.
     *
     * 3. **After service worker restart**: If update was already available before restart,
     *    the persisted state is loaded from storage in `loadAutoUpdateState()` and
     *    `initChecksForAutoUpdate()` restores the update state, periodic checks, and
     *    navigation tracking to continue the auto-update process seamlessly.
     *
     * When this listener is registered, Chrome will NOT automatically reload the extension.
     * Instead, it waits for the extension to call chrome.runtime.reload() explicitly.
     *
     * @param details Details about the available update.
     */
    private static async onUpdateAvailable(details: chrome.runtime.UpdateAvailableDetails): Promise<void> {
        logger.info(
            '[ext.ExtensionUpdateService.onUpdateAvailable]:',
            `Update became available, version: ${details.version}, manual check: ${ExtensionUpdateService.isManualCheck}`,
        );

        // Send UpdateAvailable event to FSM → FSM transitions to Available state → UI shows Update button
        extensionUpdateActor.send({ type: ExtensionUpdateFSMEvent.UpdateAvailable });
        chrome.runtime.onUpdateAvailable.removeListener(ExtensionUpdateService.onUpdateAvailable);

        // Clear the checking update timeout if it was set
        // eslint-disable-next-line no-restricted-globals
        self.clearTimeout(ExtensionUpdateService.checkingUpdateTimeoutId);
        ExtensionUpdateService.checkingUpdateTimeoutId = undefined;

        // TODO: Add saving onUpdateAvailable event to storage in a separate
        // field to not override updateAvailableTimestamp for auto-update case.
        // AG-47051
        if (ExtensionUpdateService.isManualCheck) {
            logger.trace(
                '[ext.ExtensionUpdateService.onUpdateAvailable]:',
                'Manual check - update icon will be shown immediately',
            );
            return;
        }

        // Store timestamp when update became available.
        const now = Date.now();
        ExtensionUpdateService.updateAvailableTimestamp = now;
        ExtensionUpdateService.lastNavigationTimestamp = now;

        // Save state to storage for persistence across service worker restarts.
        await ExtensionUpdateService.saveAutoUpdateState();

        // Start periodic check for auto-update conditions.
        ExtensionUpdateService.startAutoUpdateCheck();

        // Set up navigation tracking via webNavigation events.
        ExtensionUpdateService.setupNavigationTracking();

        logger.trace(
            '[ext.ExtensionUpdateService.onUpdateAvailable]:',
            `Auto-update tracking started. Icon delay: ${ExtensionUpdateService.autoUpdateConfig.ICON_DELAY_MS}ms, Inactivity threshold: ${ExtensionUpdateService.autoUpdateConfig.IDLE_THRESHOLD_MS}ms`,
        );
    }

    /**
     * Checks for extension updates initiated from popup.
     *
     * If update is available, Chrome will download it in background
     * and call onUpdateAvailable listener, which will send UpdateAvailable event
     * to FSM, that is why this method returns void.
     *
     * For whole checking step we set a timeout, because it consists
     * of multiple steps with not-determined duration.
     */
    private static async checkExtensionUpdate(): Promise<void> {
        // Mark this as manual check
        ExtensionUpdateService.isManualCheck = true;

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

            // Reset manual check flag
            ExtensionUpdateService.isManualCheck = false;
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
     * @param message Message containing the page from which the update was initiated.
     * @param message.data Data object containing update information.
     * @param message.data.from The page from which the update was initiated.
     */
    private static async updateExtension(
        { data: { from } }: UpdateExtensionMessageMv3,
    ): Promise<void> {
        const start = Date.now();

        extensionUpdateActor.send({ type: ExtensionUpdateFSMEvent.Update });

        // Clear auto-update state on manual update
        ExtensionUpdateService.clearAutoUpdateState();

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
        try {
            const manualExtensionUpdateStr = await browserStorage.get(MANUAL_EXTENSION_UPDATE_KEY);

            if (typeof manualExtensionUpdateStr !== 'string') {
                return null;
            }

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
     * @returns Extension version available in the Chrome Web Store, or null if not found.
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
            const mockedVersion = new Version(`${currentVersion.data.join('.')}.${updatedLastVersionPart}`);

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
     * Retrieves manual extension update data from storage.
     *
     * IMPORTANT!
     * After retrieving the data from storage, it is removed.
     *
     * @returns Manual extension update data or null if not found.
     */
    public static async getManualExtensionUpdateData(): Promise<ManualExtensionUpdateData | null> {
        const manualExtensionUpdateData = await ExtensionUpdateService.retrieveManualExtensionUpdateData();

        await browserStorage.remove(MANUAL_EXTENSION_UPDATE_KEY);

        return manualExtensionUpdateData;
    }

    /**
     * Updates last navigation timestamp.
     */
    private static updateLastNavigationTimestamp(): void {
        ExtensionUpdateService.lastNavigationTimestamp = Date.now();

        logger.trace('[ext.ExtensionUpdateService.updateLastNavigationTimestamp]: Navigation event detected, updating timestamp:', new Date(ExtensionUpdateService.lastNavigationTimestamp).toISOString());

        // Save to storage on every navigation to persist across service worker restarts.
        // Do not await intentionally.
        ExtensionUpdateService.saveAutoUpdateStateThrottled().catch((error) => {
            // Log to debug channel to prevent show error in production.
            logger.debug('[ext.ExtensionUpdateService.updateLastNavigationTimestamp]: Failed to save navigation timestamp:', error);
        });
    }

    /**
     * Sets up navigation tracking via webNavigation.onCommitted event.
     */
    private static setupNavigationTracking(): void {
        logger.debug('[ext.ExtensionUpdateService.setupNavigationTracking]: Setting up navigation tracking');

        chrome.webNavigation.onCommitted.addListener(() => {
            ExtensionUpdateService.updateLastNavigationTimestamp();
        });
    }

    /**
     * Loads persisted auto-update state from storage.
     */
    private static async loadAutoUpdateState(): Promise<void> {
        try {
            const stateStr = await browserStorage.get(AUTO_UPDATE_STATE_KEY_MV3);

            if (typeof stateStr !== 'string') {
                return;
            }

            const state = AutoUpdateStateValidator.parse(JSON.parse(stateStr));

            // Update in-memory cache
            ExtensionUpdateService.updateAvailableTimestamp = state.updateAvailableTimestamp;
            ExtensionUpdateService.lastNavigationTimestamp = state.lastNavigationTimestamp;
        } catch (error) {
            logger.error('[ext.ExtensionUpdateService.loadAutoUpdateState]: Failed to load auto-update state:', error);
        }
    }

    /**
     * Initializes periodic checks for automatic extension update:
     * interval check for auto-update and navigation tracking.
     */
    private static initChecksForAutoUpdate(): void {
        if (ExtensionUpdateService.updateAvailableTimestamp === null) {
            logger.debug('[ext.ExtensionUpdateService.initChecksForAutoUpdate]: Update available timestamp is not set, skipping auto-update check setup');
            return;
        }

        // To show update button in the popup and in the settings since update
        // is available and for correct check for showing icon when iconDelayMs
        // passed.
        extensionUpdateActor.send({ type: ExtensionUpdateFSMEvent.UpdateAvailable });
        chrome.runtime.onUpdateAvailable.removeListener(ExtensionUpdateService.onUpdateAvailable);

        // Resume periodic check for auto-update conditions
        ExtensionUpdateService.startAutoUpdateCheck();

        // Set up navigation tracking via webNavigation events.
        ExtensionUpdateService.setupNavigationTracking();
    }

    /**
     * Saves auto-update state to storage.
     * We need to store this state to persist across service worker restarts,
     * since service worker can restart in less time than configured idle threshold,
     * so both updateAvailableTimestamp and lastNavigationTimestamp are important
     * to save in storage, e.g.:
     * - 10:00 `onUpdateAvailable` received;
     * - 10:05 `lastNavigationTimestamp` last updated;
     * - 10:10 service worker restarts and loads auto-update state;
     * - 10:35 service worker detects idle state and performs auto-update
     *   (30 minutes after last activity).
     *
     * Without saving these timestamps to storage, we could potentially wait forever
     * for idle state and never perform auto-update.
     */
    private static async saveAutoUpdateState(): Promise<void> {
        if (ExtensionUpdateService.updateAvailableTimestamp === null) {
            return;
        }

        const state = {
            updateAvailableTimestamp: ExtensionUpdateService.updateAvailableTimestamp,
            lastNavigationTimestamp: ExtensionUpdateService.lastNavigationTimestamp,
        };

        try {
            await browserStorage.set(AUTO_UPDATE_STATE_KEY_MV3, JSON.stringify(state));
        } catch (error) {
            logger.debug('[ext.ExtensionUpdateService.saveAutoUpdateState]: Failed to save auto-update state:', error);
        }
    }

    /**
     * Clears auto-update state.
     */
    private static async clearAutoUpdateState(): Promise<void> {
        ExtensionUpdateService.updateAvailableTimestamp = null;
        ExtensionUpdateService.stopAutoUpdateCheck();

        try {
            await browserStorage.remove(AUTO_UPDATE_STATE_KEY_MV3);
        } catch (error) {
            logger.error('[ext.ExtensionUpdateService.clearAutoUpdateState]: Failed to clear storage:', error);
        }
    }

    /**
     * Starts periodic check for auto-update conditions.
     */
    private static startAutoUpdateCheck(): void {
        // Avoid multiple intervals
        if (ExtensionUpdateService.autoUpdateCheckIntervalId !== undefined) {
            return;
        }

        // eslint-disable-next-line no-restricted-globals
        ExtensionUpdateService.autoUpdateCheckIntervalId = self.setInterval(
            () => ExtensionUpdateService.checkAutoUpdateConditions(),
            ExtensionUpdateService.autoUpdateConfig.CHECK_INTERVAL_MS,
        );
    }

    /**
     * Stops periodic auto-update check.
     */
    private static stopAutoUpdateCheck(): void {
        // eslint-disable-next-line no-restricted-globals
        self.clearInterval(ExtensionUpdateService.autoUpdateCheckIntervalId);
        ExtensionUpdateService.autoUpdateCheckIntervalId = undefined;
    }

    /**
     * Checks if browser is idle (no navigation events) and should apply update.
     */
    private static async checkAutoUpdateConditions(): Promise<void> {
        try {
            if (ExtensionUpdateService.lastNavigationTimestamp === null) {
                logger.trace('[ext.ExtensionUpdateService.checkAutoUpdateConditions]: No navigation timestamp found, stopping auto-update check');
                ExtensionUpdateService.stopAutoUpdateCheck();
                return;
            }

            const now = Date.now();
            const timeSinceLastNavigation = now - ExtensionUpdateService.lastNavigationTimestamp;

            // Check if browser is idle and should apply update
            if (timeSinceLastNavigation < ExtensionUpdateService.autoUpdateConfig.IDLE_THRESHOLD_MS) {
                logger.trace('[ext.ExtensionUpdateService.checkAutoUpdateConditions]: Browser is not idle, skipping update. Time since last navigation:', timeSinceLastNavigation, 'ms');
                return;
            }

            logger.debug('[ext.ExtensionUpdateService.checkAutoUpdateConditions]: Inactivity threshold reached, applying update');
            await ExtensionUpdateService.clearAutoUpdateState();
            // To avoid possible collisions.
            await browserStorage.remove(MANUAL_EXTENSION_UPDATE_KEY);
            ExtensionUpdateService.applyAutoUpdate();
        } catch (error) {
            logger.error('[ext.ExtensionUpdateService.checkAutoUpdateConditions]: Failed to check auto-update conditions:', error);
        }
    }

    /**
     * Applies extension update automatically.
     */
    private static applyAutoUpdate(): void {
        extensionUpdateActor.send({ type: ExtensionUpdateFSMEvent.Update });

        try {
            ExtensionUpdateService.reloadExtension();
        } catch (e) {
            logger.error(`[ext.ExtensionUpdateService.applyAutoUpdate]: Failed to reload: ${e}`);
            extensionUpdateActor.send({ type: ExtensionUpdateFSMEvent.UpdateFailed });
        }
    }

    /**
     * Checks if update icon should be shown based on delay period.
     *
     * For manual checks: Icon is shown immediately.
     * For automatic checks: Icon is shown after iconDelayMs.
     *
     * Uses in-memory cache to avoid storage reads on every icon update (called for each tab).
     * State is loaded from storage on init and updated on events.
     *
     * @returns True if icon should be shown, false otherwise.
     */
    public static shouldShowUpdateIcon(): boolean {
        if (!ExtensionUpdateService.isUpdateAvailable || ExtensionUpdateService.updateAvailableTimestamp === null) {
            return false;
        }

        // If last check was manual, show icon immediately.
        if (ExtensionUpdateService.isManualCheck) {
            return true;
        }

        // For automatic checks, wait for delay period.
        const timeSinceUpdateAvailable = Date.now() - ExtensionUpdateService.updateAvailableTimestamp;
        const config = ExtensionUpdateService.autoUpdateConfig;

        logger.trace('[ext.ExtensionUpdateService.shouldShowUpdateIcon]: Time since update available:', timeSinceUpdateAvailable);

        return timeSinceUpdateAvailable >= config.ICON_DELAY_MS;
    }
}
