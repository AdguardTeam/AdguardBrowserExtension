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

import { ExtensionUpdateFSMEvent, ExtensionUpdateFSMState } from '../../../common/constants';
import { logger } from '../../../common/logger';
import { MessageType } from '../../../common/messages/constants';
import { messageHandler } from '../../message-handler';
import { Prefs } from '../../prefs';
import { Version } from '../../utils/version';

import { type ManualUpdateMetadata, AutoUpdateStateField } from './types';
import { extensionUpdateActor } from './extension-update-machine-mv3';
import { AutoUpdateStateManager } from './auto-update-state-manager-mv3';
import { AutoUpdateHandler } from './auto-update-handler-mv3';
import { ManualUpdateHandler } from './manual-update-handler-mv3';

/**
 * Service for checking and updating the extension in Manifest V3.
 *
 * ## Update flow:
 *
 * ### Automatic update (Chrome native):
 * 1. Chrome detects update and downloads it in background.
 * 2. `chrome.runtime.onUpdateAvailable` event fires → state becomes `Available`.
 * 3. Before applying, checks AdGuard Backend API (fail-open: updates proceed even on 204 or errors).
 * 4. Extension reloads automatically after `IDLE_THRESHOLD_MS` of inactivity,
 *    or shows update icon after `ICON_DELAY_MS` and waits for user action.
 * 5. After reload, custom filters are updated in App.asyncInit(),
 *    then shows success/failure notification.
 *
 * ### Manual update (user-initiated):
 * 1. User clicks "Check for updates" → checks AdGuard Backend API.
 * 2. If backend confirms update, calls `chrome.runtime.requestUpdateCheck()`.
 * 3. Chrome downloads update → `onUpdateAvailable` fires → state becomes `Available`.
 * 4. Fire-and-forget backend analytics call (does not gate the update).
 * 5. User clicks "Update" button → extension reloads.
 * 6. After reload, custom filters are updated in App.asyncInit(),
 *    then shows success/failure notification.
 * 7. If no extension update found, custom filters are still updated (awaited).
 *
 * ### Chrome extensions page update:
 * 1. User clicks "Update" on chrome://extensions/.
 * 2. Chrome directly updates and reloads the extension.
 * 3. After reload, custom filters are updated in App.asyncInit().
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
 */
export class ExtensionUpdateService {
    /**
     * State manager for save current update state during SW restarts.
     */
    private static stateManager = new AutoUpdateStateManager();

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
     * Whether post-reload refresh and notification metadata are ready for UI consumption.
     */
    private static isReloadHandlingComplete = false;

    /**
     * Post-reload result that could not be sent while the FSM was not Idle.
     * The machine handles `Init` only in Idle, so an event sent in any other
     * state is dropped; the result is flushed when the FSM returns to Idle.
     */
    private static pendingReloadResult: { isUpdateFailedAfterReload: boolean } | null = null;

    /**
     * Whether the FSM idle-flush subscription is already set up.
     */
    private static isFsmIdleFlushSubscribed = false;

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
        ExtensionUpdateService.isReloadHandlingComplete = false;
        extensionUpdateActor.start();

        if (!ExtensionUpdateService.isFsmIdleFlushSubscribed) {
            ExtensionUpdateService.isFsmIdleFlushSubscribed = true;
            // The machine handles `Init` only in Idle, so a post-reload result
            // produced while the FSM is in another state is queued by
            // sendReloadResult() and flushed here when the FSM returns to Idle.
            extensionUpdateActor.subscribe((state) => {
                if (state.value === ExtensionUpdateFSMState.Idle) {
                    ExtensionUpdateService.flushPendingReloadResult();
                }
            });
        }

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
            onUpdateApplyFailed: (): void => {
                extensionUpdateActor.send({ type: ExtensionUpdateFSMEvent.UpdateFailed });
            },
            // We do not set onUpdateApplyComplete since no logic is needed
            // after auto-update is applied.
        });

        // Register listener that will be called when Chrome finishes downloading an update.
        // This can happen either:
        // 1. After manual check via requestUpdateCheck() (user clicked "Check for Updates")
        // 2. Automatically when Chrome detects and downloads an update in background
        chrome.runtime.onUpdateAvailable.addListener(ExtensionUpdateService.onUpdateAvailable);

        messageHandler.addListener(
            MessageType.CheckExtensionUpdateMv3,
            ExtensionUpdateService.manualUpdateHandler.check.bind(
                ExtensionUpdateService.manualUpdateHandler,
            ),
        );
        messageHandler.addListener(
            MessageType.UpdateExtensionMv3,
            (message) => ExtensionUpdateService.manualUpdateHandler.applyUpdate.call(
                ExtensionUpdateService.manualUpdateHandler,
                message.data.from,
                () => ExtensionUpdateService.clearAutoUpdateState(),
            ),
        );

        // Load persisted state if any saved before SW restart
        const state = await ExtensionUpdateService.stateManager.init();

        // Determine whether an update is pending.
        let isUpdateAvailable = false;

        if (state && state.nextVersion) {
            // Check if the persisted nextVersion is not newer than the current version.
            // If Chrome applied the update during browser shutdown (bypassing our
            // applyUpdate/clearAutoUpdateState flow), the persisted state becomes
            // stale and must be cleared to avoid showing a false update indicator.
            try {
                const persisted = new Version(state.nextVersion);
                const current = new Version(Prefs.version);
                if (persisted.compare(current) <= 0) {
                    logger.info(`[ext.ExtensionUpdateService.init]: Clearing stale update state: persisted nextVersion ${state.nextVersion} is not newer than current version ${Prefs.version}`);
                    await ExtensionUpdateService.stateManager.clear();
                } else {
                    isUpdateAvailable = true;
                }
            } catch (e) {
                logger.error(`[ext.ExtensionUpdateService.init]: Failed to compare versions, clearing state defensively: ${e}`);
                await ExtensionUpdateService.stateManager.clear();
            }
        }

        // Send Init event once per service worker lifecycle with the persisted
        // update availability. The manual reload result is sent later by
        // handleExtensionReloadOnUpdate() once the post-reload custom filter
        // refresh completes. An event with all flags false causes no FSM
        // transition, so it is safe to send while that refresh is pending.
        extensionUpdateActor.send({
            type: ExtensionUpdateFSMEvent.Init,
            isUpdateAvailable,
            isReloadedOnUpdate: false,
            isUpdateFailedAfterReload: false,
        });

        // If update was already available before SW restart, manually trigger
        // `onUpdateAvailable` to restore the update process (auto-update handler setup,
        // icon timing, navigation listener), independently of update source (manual or automatic).
        if (isUpdateAvailable && state?.nextVersion) {
            ExtensionUpdateService.onUpdateAvailable(
                { version: state.nextVersion },
                state.lastNavigationTimestamp,
            );
        }
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
        details: chrome.runtime.UpdateAvailableDetails,
        loadedNavigationTimestampMs?: number,
    ): Promise<void> {
        const { version } = details;

        logger.info(
            '[ext.ExtensionUpdateService.onUpdateAvailable]:',
            `Update became available, version: ${version}, manual check: ${ExtensionUpdateService.stateManager.get(AutoUpdateStateField.isManualCheck)}`,
        );

        // Send UpdateAvailable event to FSM → FSM transitions to Available state → UI shows Update button
        extensionUpdateActor.send({ type: ExtensionUpdateFSMEvent.UpdateAvailable });

        // Store version in state
        ExtensionUpdateService.stateManager.set(AutoUpdateStateField.nextVersion, version);

        // Delegate to appropriate handler based on check type
        if (ExtensionUpdateService.stateManager.get(AutoUpdateStateField.isManualCheck)) {
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
     * @param isCustomFiltersUpdateSuccessful Whether the post-reload custom filter refresh succeeded.
     * Defaults to true.
     *
     * @returns Promise that resolves when handling completes.
     */
    public static async handleExtensionReloadOnUpdate(
        isUpdate: boolean,
        isCustomFiltersUpdateSuccessful = true,
    ): Promise<void> {
        let manualUpdateData: ManualUpdateMetadata | null = null;

        try {
            manualUpdateData = await ManualUpdateHandler.handleReload(
                isUpdate,
                isCustomFiltersUpdateSuccessful,
            );
        } catch (e) {
            // Reload handling persists the update result before opening pages,
            // and page APIs no longer throw out of it, so a rejection here
            // means a storage failure. Fall back to the persisted metadata, so
            // the manual update result is still reported for this service
            // worker lifecycle. If the metadata cannot be read either, no Init
            // event is sent: the all-false Init from init() already left the
            // FSM in Idle, and the result stays in storage for the next start.
            logger.error('[ext.ExtensionUpdateService.handleExtensionReloadOnUpdate]: failed to handle extension reload:', e);
            try {
                manualUpdateData = await ExtensionUpdateService.peekManualExtensionUpdateData();
            } catch (peekError) {
                logger.error('[ext.ExtensionUpdateService.handleExtensionReloadOnUpdate]: failed to read manual update data after a reload handling error:', peekError);
            }
            // When the update cycle failed, the rejected handleReload may have
            // failed to persist isOk = false, so the peeked value can still
            // hold the provisional success. Report the failure in memory, as
            // the broken storage cannot be fixed from here. The version
            // comparison matches the one in handleReload, so a later start
            // after a successful update does not force a false failure. A
            // successful cycle keeps its persisted value: handleReload only
            // writes on failure, so nothing trustworthy could have been lost.
            if (
                manualUpdateData
                && (!isCustomFiltersUpdateSuccessful || manualUpdateData.initVersion === Prefs.version)
            ) {
                manualUpdateData.isOk = false;
            }
        } finally {
            ExtensionUpdateService.isReloadHandlingComplete = true;
        }

        if (manualUpdateData) {
            ExtensionUpdateService.sendReloadResult(!manualUpdateData.isOk);
        }
    }

    /**
     * Sends the post-reload result to the FSM, or queues it while the FSM is
     * not Idle.
     *
     * The machine handles `Init` only in Idle, so an event sent in any other
     * state (a manual check or `onUpdateAvailable` arrived during the refresh)
     * would be dropped for the whole service worker lifecycle. The queued
     * result is flushed by the idle-flush subscription from {@link ExtensionUpdateService.init}.
     *
     * @param isUpdateFailedAfterReload Whether the reloaded update failed.
     */
    private static sendReloadResult(isUpdateFailedAfterReload: boolean): void {
        if (ExtensionUpdateService.snapshot === ExtensionUpdateFSMState.Idle) {
            extensionUpdateActor.send({
                type: ExtensionUpdateFSMEvent.Init,
                isUpdateAvailable: false,
                isReloadedOnUpdate: true,
                isUpdateFailedAfterReload,
            });
            return;
        }

        ExtensionUpdateService.pendingReloadResult = { isUpdateFailedAfterReload };
        logger.debug('[ext.ExtensionUpdateService.sendReloadResult]: FSM is not Idle, queued the reload result until it returns to Idle');
    }

    /**
     * Flushes a queued post-reload result, if any.
     */
    private static flushPendingReloadResult(): void {
        if (!ExtensionUpdateService.pendingReloadResult) {
            return;
        }

        const { isUpdateFailedAfterReload } = ExtensionUpdateService.pendingReloadResult;
        ExtensionUpdateService.pendingReloadResult = null;
        ExtensionUpdateService.sendReloadResult(isUpdateFailedAfterReload);
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
     * Returns the current FSM state value.
     * Used by UI pages to initialize from the FSM snapshot during their initial data fetch.
     *
     * @returns The current extension update FSM state.
     */
    public static get snapshot(): ExtensionUpdateFSMState {
        return extensionUpdateActor.getSnapshot().value;
    }

    /**
     * See {@link ManualUpdateHandler.getUpdateData} description.
     *
     * @returns Manual extension update data, or null if absent or the post-reload refresh is still pending.
     */
    public static async getManualExtensionUpdateData(): Promise<ManualUpdateMetadata | null> {
        // Existing extension pages can request data before App.asyncInit finishes.
        // Keep the manual intent and provisional result until the refresh completes.
        if (!ExtensionUpdateService.isReloadHandlingComplete) {
            logger.debug('[ext.ExtensionUpdateService.getManualExtensionUpdateData]: post-reload custom filter refresh is still pending');
            return null;
        }

        return ManualUpdateHandler.getUpdateData();
    }

    /**
     * Reads manual extension update data from storage without removing it.
     *
     * See {@link ManualUpdateHandler.peekUpdateData} for details.
     *
     * Note: unlike {@link ExtensionUpdateService.getManualExtensionUpdateData},
     * this method deliberately bypasses the post-reload gate, so it may return
     * the provisional `isOk` value while the custom filter refresh is still
     * pending. Do not use it to report the update result to the user — except
     * as the fallback of {@link ExtensionUpdateService.handleExtensionReloadOnUpdate}
     * when reload handling itself failed, where the persisted value is the most
     * trustworthy result available.
     *
     * @returns Manual extension update data or null if not found or invalid.
     */
    public static async peekManualExtensionUpdateData(): Promise<ManualUpdateMetadata | null> {
        return ManualUpdateHandler.peekUpdateData();
    }

    /**
     * Checks whether a manual update was initiated and its post-reload result
     * has not been handled yet.
     *
     * Used to scope the full-download intent of a manual update to its own
     * update cycle: stale metadata from an earlier cycle must not force full
     * downloads on a later, unrelated extension update.
     *
     * @returns True if the manual update intent belongs to the current update cycle.
     */
    public static async hasPendingManualUpdateIntent(): Promise<boolean> {
        return ManualUpdateHandler.hasPendingUpdateIntent();
    }

    /**
     * Clears auto-update handler and state.
     * Called when manual update is applied to clean up any persisted state.
     */
    private static async clearAutoUpdateState(): Promise<void> {
        // Clear auto-update handler if it exists (automatic checks)
        if (ExtensionUpdateService.autoUpdateHandler) {
            // This also clears the state manager internally
            await ExtensionUpdateService.autoUpdateHandler.clearState();
            ExtensionUpdateService.autoUpdateHandler = null;
        } else {
            // For manual checks, autoUpdateHandler doesn't exist, so clear
            // state manager directly, since it contains shared state too.
            await ExtensionUpdateService.stateManager.clear();
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
        const nextVersion = ExtensionUpdateService.stateManager.get(AutoUpdateStateField.nextVersion);

        if (!ExtensionUpdateService.isUpdateAvailable || !nextVersion) {
            return false;
        }

        // If last check was manual, show icon immediately.
        if (ExtensionUpdateService.stateManager.get(AutoUpdateStateField.isManualCheck)) {
            return true;
        }

        const updateAvailableTimestamp = ExtensionUpdateService.stateManager.get(
            AutoUpdateStateField.updateAvailableTimestamp,
        );

        if (updateAvailableTimestamp === undefined) {
            logger.trace('[ext.ExtensionUpdateService.shouldShowUpdateIcon]: Update available timestamp is undefined, cannot determine if update icon should be shown');
            return false;
        }

        // For automatic checks, wait for delay period.
        const timeSinceUpdateAvailable = Date.now() - updateAvailableTimestamp;

        if (!ExtensionUpdateService.autoUpdateHandler) {
            logger.trace('[ext.ExtensionUpdateService.shouldShowUpdateIcon]: AutoUpdateHandler is not initialized, cannot determine if update icon should be shown');
            return false;
        }

        logger.trace(`[ext.ExtensionUpdateService.shouldShowUpdateIcon]: Time since update available: ${timeSinceUpdateAvailable}`);

        return timeSinceUpdateAvailable >= ExtensionUpdateService.autoUpdateHandler.iconDelayMs;
    }
}
