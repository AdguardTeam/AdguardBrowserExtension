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

import { ExtensionUpdateFSMEvent, ExtensionUpdateFSMState } from '../../../common/constants';
import { logger } from '../../../common/logger';
import { MessageType } from '../../../common/messages';
import { messageHandler } from '../../message-handler';

import { type ManualExtensionUpdateData } from './types';
import { extensionUpdateActor } from './extension-update-machine';
import { UpdateStateManager } from './update-state-manager';
import { AutoUpdateHandler } from './auto-update-handler';
import { ManualUpdateHandler } from './manual-update-handler';

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
 * - Update icon appears only after `ICON_DELAY_MS` since update became available.
 * - Update applies automatically after `IDLE_THRESHOLD_MS` of browser inactivity.
 * - Browser inactivity is tracked via webNavigation.onCommitted events.
 * - Config can be overridden via chrome.storage.local (key: 'auto-update-config-mv3').
 * - Config is loaded once during initialization and cached in memory.
 *
 * FIXME: UPDATE DOCS
 * FIXME: Add visual scheme of architecture.
 */
export class ExtensionUpdateService {
    /**
     * State manager for save current update state during SW restarts.
     */
    private static stateManager = new UpdateStateManager();

    /**
     * Auto-update handler for orchestrating automatic updates. Will be set only
     * after receiving onUpdateAvailable event since it do not needed before.
     */
    private static autoUpdateHandler: AutoUpdateHandler | null = null;

    /**
     * Manual update handler for user-initiated updates.
     */
    private static manualUpdateHandler: ManualUpdateHandler;

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

        // Initialize manual update handler
        ExtensionUpdateService.manualUpdateHandler = new ManualUpdateHandler({
            stateManager: ExtensionUpdateService.stateManager,
            onUpdateCheckStart: (): void => {
                extensionUpdateActor.send({ type: ExtensionUpdateFSMEvent.Check });
            },
            onUpdateCheckComplete: (hasUpdate: boolean): void => {
                if (hasUpdate) {
                    // If hasUpdate, we just wait for user to click "Update" button.
                    return;
                }

                extensionUpdateActor.send({ type: ExtensionUpdateFSMEvent.NoUpdateAvailable });
            },
            onUpdateApplyStart: (): void => {
                extensionUpdateActor.send({ type: ExtensionUpdateFSMEvent.Update });
            },
            onUpdateApplyComplete: (): void => {
                // Success handled after reload in ExtensionUpdateService.handleExtensionReloadOnUpdate
            },
            onUpdateApplyFailed: (): void => {
                extensionUpdateActor.send({ type: ExtensionUpdateFSMEvent.UpdateFailed });
            },
        });

        // Register listener that will be called when Chrome finishes downloading an update.
        // This can happen either:
        // 1. After manual check via requestUpdateCheck() (user clicked "Check for Updates")
        // 2. Automatically when Chrome detects and downloads an update in background
        chrome.runtime.onUpdateAvailable.addListener(ExtensionUpdateService.onUpdateAvailable);

        messageHandler.addListener(
            MessageType.CheckExtensionUpdateMv3,
            ExtensionUpdateService.manualUpdateHandler.check,
        );
        messageHandler.addListener(
            MessageType.UpdateExtensionMv3,
            (message) => ExtensionUpdateService.manualUpdateHandler.applyUpdate(
                message.data.from,
                () => ExtensionUpdateService.clearAutoUpdateState(),
            ),
        );

        // Load persisted state if any saved before SW restart
        const state = await ExtensionUpdateService.stateManager.init();

        if (!state) {
            return;
        }

        // If update was already available before SW restart, manually trigger
        // `onUpdateAvailable` to restore the update process, independently of
        // source of update (manual or automatic).
        ExtensionUpdateService.onUpdateAvailable(
            { version: state.nextVersion },
            state.lastNavigationTimestamp,
        );
    }

    /**
     * Handles the onUpdateAvailable event from Chrome runtime.
     *
     * This listener is called by Chrome when an extension update has been downloaded
     * and is ready to be installed, or by explicitly after SW restart and update
     * is already available.
     * This can happen in the following scenarios:
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
     *    the persisted state is loaded from storage and this method is called
     *    again to restore the update state, periodic checks, and navigation
     *    listener to continue the auto-update process seamlessly if
     *    check was initiated automatically, or shows the update icon immediately
     *    if it was a manual check.
     *
     * When this listener is registered, Chrome will NOT automatically reload the extension.
     * Instead, it waits for the extension to call chrome.runtime.reload() explicitly.
     *
     * @param details Details about the available update.
     * @param details.version The version of the available update.
     * @param loadedNavigationTimestampMs Timestamp of the navigation event if
     * it was loaded from storage after SW restart.
     */
    private static async onUpdateAvailable(
        { version }: chrome.runtime.UpdateAvailableDetails,
        loadedNavigationTimestampMs?: number,
    ): Promise<void> {
        logger.info(
            '[ext.ExtensionUpdateService.onUpdateAvailable]:',
            `Update became available, version: ${version}, manual check: ${ExtensionUpdateService.stateManager.isManualCheck}`,
        );

        // Send UpdateAvailable event to FSM → FSM transitions to Available state → UI shows Update button
        extensionUpdateActor.send({ type: ExtensionUpdateFSMEvent.UpdateAvailable });

        // Store version in state
        ExtensionUpdateService.stateManager.nextVersion = version;

        // Delegate to appropriate handler based on check type
        if (ExtensionUpdateService.stateManager.isManualCheck) {
            // Manual check: delegate to manual handler
            await ExtensionUpdateService.manualUpdateHandler.onUpdateAvailable();
            return;
        }

        // Automatic check: delegate to auto handler

        // Auto-update handler should be initialized only once
        if (ExtensionUpdateService.autoUpdateHandler) {
            logger.debug('[ext.ExtensionUpdateService.onUpdateAvailable]: Auto-update handler already initialized it will be overwritten.');
        }

        ExtensionUpdateService.autoUpdateHandler = new AutoUpdateHandler({
            stateManager: ExtensionUpdateService.stateManager,
            onUpdateApplyStart: (): void => {
                extensionUpdateActor.send({ type: ExtensionUpdateFSMEvent.Update });
            },
            onUpdateApplyFailed: (): void => {
                extensionUpdateActor.send({ type: ExtensionUpdateFSMEvent.UpdateFailed });
            },
        });

        await ExtensionUpdateService.autoUpdateHandler.onUpdateAvailable(
            loadedNavigationTimestampMs,
        );
    }

    /**
     * See {@link ManualUpdateHandler.handleReload} description.
     *
     * @param isUpdate Whether the extension version was updated.
     *
     * @returns Promise that resolves when handling completes.
     */
    public static async handleExtensionReloadOnUpdate(isUpdate: boolean): Promise<void> {
        return ManualUpdateHandler.handleReload(isUpdate);
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
     * See {@link ManualUpdateHandler.getUpdateData} description.
     *
     * @returns Manual extension update data or null if not found.
     */
    public static async getManualExtensionUpdateData(): Promise<ManualExtensionUpdateData | null> {
        return ManualUpdateHandler.getUpdateData();
    }

    /**
     * Clears auto-update handler.
     */
    private static async clearAutoUpdateState(): Promise<void> {
        if (!ExtensionUpdateService.autoUpdateHandler) {
            return;
        }

        await ExtensionUpdateService.autoUpdateHandler.clearState();
        ExtensionUpdateService.autoUpdateHandler = null;
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
        if (!ExtensionUpdateService.isUpdateAvailable || ExtensionUpdateService.stateManager.nextVersion === null) {
            return false;
        }

        // If last check was manual, show icon immediately.
        if (ExtensionUpdateService.stateManager.isManualCheck) {
            return true;
        }

        if (ExtensionUpdateService.stateManager.updateAvailableTimestamp === undefined) {
            logger.trace('[ext.ExtensionUpdateService.shouldShowUpdateIcon]: Update available timestamp is undefined, cannot determine if update icon should be shown');
            return false;
        }

        // For automatic checks, wait for delay period.
        const timeSinceUpdateAvailable = Date.now() - ExtensionUpdateService.stateManager.updateAvailableTimestamp;

        if (!ExtensionUpdateService.autoUpdateHandler) {
            logger.trace('[ext.ExtensionUpdateService.shouldShowUpdateIcon]: AutoUpdateHandler is not initialized, cannot determine if update icon should be shown');
            return false;
        }

        logger.trace('[ext.ExtensionUpdateService.shouldShowUpdateIcon]: Time since update available:', timeSinceUpdateAvailable);

        return timeSinceUpdateAvailable >= ExtensionUpdateService.autoUpdateHandler.iconDelayMs;
    }
}
