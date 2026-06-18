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
    action,
    computed,
    makeObservable,
    observable,
    override,
} from 'mobx';
import { type GetExtensionStatusForPopupResponse } from 'popup-service';

import { messenger } from '../../../services/messenger';
import { translator } from '../../../../common/translators/translator';
import { ExtensionUpdateFSMState, MIN_UPDATE_DISPLAY_DURATION_MS } from '../../../../common/constants';
import { logger } from '../../../../common/logger';
import { type NotificationParams, NotificationType } from '../../../common/types';

import { PopupStoreCommon } from './PopupStore-common';

export class PopupStore extends PopupStoreCommon {
    @observable
    areFilterLimitsExceeded = false;

    /**
     * The current state of the extension update FSM.
     * All UI flags are derived from this single source of truth.
     */
    @observable
    extensionUpdateState: ExtensionUpdateFSMState = ExtensionUpdateFSMState.Idle;

    /**
     * Timestamp until which a transient notification state (Success, NotAvailable)
     * must remain visible, regardless of FSM transitions to Idle.
     * Prevents the notification from disappearing prematurely when the popup
     * is opened mid-way through the FSM's `after` delay.
     */
    private minDisplayUntil = 0;

    /**
     * Timer ID for the deferred {@link ExtensionUpdateFSMState.Idle} transition.
     *
     * Set when an Idle event is ignored because the minimum display duration
     * hasn't elapsed yet. Cleared on any new explicit state change.
     */
    private deferredIdleTimerId: ReturnType<typeof setTimeout> | undefined;

    /**
     * Whether an extension update is available for installation.
     * Derived from the FSM state.
     */
    @computed
    get isExtensionUpdateAvailable(): boolean {
        return this.extensionUpdateState === ExtensionUpdateFSMState.Available;
    }

    /**
     * Whether the extension is currently checking for updates or installing one.
     * Derived from the FSM state.
     */
    @computed
    get isExtensionCheckingUpdateOrUpdating(): boolean {
        return this.extensionUpdateState === ExtensionUpdateFSMState.Checking
            || this.extensionUpdateState === ExtensionUpdateFSMState.Updating;
    }

    /**
     * The notification to display based on the current FSM state.
     * Returns null when no notification should be shown (Idle, Available).
     */
    @override
    override get updateNotification(): NotificationParams | null {
        switch (this.extensionUpdateState) {
            case ExtensionUpdateFSMState.Checking:
                return {
                    type: NotificationType.Loading,
                    animationCondition: true,
                    text: translator.getMessage('update_checking_in_progress'),
                    closeManually: true,
                };
            case ExtensionUpdateFSMState.NotAvailable:
                return {
                    type: NotificationType.Success,
                    text: translator.getMessage('update_not_needed'),
                };
            case ExtensionUpdateFSMState.Updating:
                return {
                    type: NotificationType.Loading,
                    animationCondition: true,
                    text: translator.getMessage('update_installing_in_progress_title'),
                    closeManually: true,
                };
            case ExtensionUpdateFSMState.Failed:
                return {
                    type: NotificationType.Error,
                    text: translator.getMessage('update_failed_text'),
                    buttons: [{
                        title: translator.getMessage('update_failed_try_again_btn'),
                        onClick: this.checkUpdates,
                    }],
                };
            case ExtensionUpdateFSMState.Success:
                return {
                    type: NotificationType.Success,
                    text: translator.getMessage('update_success_text'),
                };
            default:
                return null;
        }
    }

    constructor() {
        super();
        makeObservable(this);
    }

    /** @inheritdoc */
    override async getPopupData(): Promise<void> {
        await super.getPopupData();

        const options = await messenger.getExtensionStatusForPopup();

        this.configureExtensionUpdates(options);
        this.setIsPopupDataReceived(true);
    }

    /**
     * Retrieves extension status including filter limits, update availability,
     * and update notifications. Sets up success/failure notifications for
     * extension updates that occurred during popup reload.
     *
     * @param options Extension status response data.
     */
    @action
    configureExtensionUpdates(options: GetExtensionStatusForPopupResponse): void {
        const {
            areFilterLimitsExceeded,
            extensionUpdateState,
            isExtensionReloadedOnUpdate,
            isSuccessfulExtensionUpdate,
        } = options;

        this.areFilterLimitsExceeded = areFilterLimitsExceeded;
        this.extensionUpdateState = extensionUpdateState;

        /**
         * Handle post-reload notification. The FSM may have already
         * transitioned from Success/Failed back to Idle by the time the
         * popup opens. In that case, use the reload metadata to determine
         * the correct initial state and ensure the notification stays
         * visible for the minimum display duration.
         */
        if (isExtensionReloadedOnUpdate) {
            this.extensionUpdateState = isSuccessfulExtensionUpdate
                ? ExtensionUpdateFSMState.Success
                : ExtensionUpdateFSMState.Failed;
            this.minDisplayUntil = Date.now() + MIN_UPDATE_DISPLAY_DURATION_MS;
        } else if (extensionUpdateState === ExtensionUpdateFSMState.Success
            || extensionUpdateState === ExtensionUpdateFSMState.NotAvailable) {
            this.minDisplayUntil = Date.now() + MIN_UPDATE_DISPLAY_DURATION_MS;
        }

        // Schedule deferred transition back to Idle for transient states.
        // Failed state does NOT auto-transition (requires user retry).
        if (this.extensionUpdateState === ExtensionUpdateFSMState.Success
            || this.extensionUpdateState === ExtensionUpdateFSMState.NotAvailable) {
            this.scheduleDeferredIdle();
        }
    }

    /**
     * Schedules a deferred transition to {@link ExtensionUpdateFSMState.Idle}
     * after the remaining minimum display duration elapses.
     *
     * Clears any previously scheduled deferred idle timer.
     */
    private scheduleDeferredIdle(): void {
        this.clearDeferredIdleTimer();
        const remaining = this.minDisplayUntil - Date.now();
        if (remaining <= 0) {
            this.extensionUpdateState = ExtensionUpdateFSMState.Idle;
            return;
        }
        this.deferredIdleTimerId = setTimeout(() => {
            this.extensionUpdateState = ExtensionUpdateFSMState.Idle;
            this.deferredIdleTimerId = undefined;
        }, remaining);
    }

    /**
     * Clears the deferred idle timer if one is active.
     */
    private clearDeferredIdleTimer(): void {
        if (this.deferredIdleTimerId !== undefined) {
            clearTimeout(this.deferredIdleTimerId);
            this.deferredIdleTimerId = undefined;
        }
    }

    /**
     * Cleans up pending timers and other resources owned by this store.
     *
     * Must be called when the popup unmounts to prevent callbacks from
     * mutating detached store instances.
     */
    override dispose(): void {
        this.clearDeferredIdleTimer();
    }

    /**
     * Checks for extension updates.
     */
    // eslint-disable-next-line class-methods-use-this
    @action
    checkUpdates = async () => {
        try {
            await messenger.checkUpdates();
        } catch (error: unknown) {
            logger.debug('[ext.PopupStore]: failed to check updates in popup: ', error);
        }
    };

    /**
     * Handles extension update state changes from FSM events.
     * Called by the event listener when the FSM transitions to a new state.
     *
     * Ignores Idle transitions for transient states (Success, NotAvailable)
     * until the minimum display duration has elapsed. This ensures the
     * notification stays visible long enough even when the popup is opened
     * partway through the FSM's `after` delay.
     *
     * @param state The new FSM state value.
     */
    @action
    handleExtensionUpdateStateChange(state: ExtensionUpdateFSMState): void {
        // Clear any pending deferred idle — a new explicit event supersedes it.
        this.clearDeferredIdleTimer();

        if (state === ExtensionUpdateFSMState.Idle
            && Date.now() < this.minDisplayUntil) {
            this.scheduleDeferredIdle();
            return;
        }

        if (state === ExtensionUpdateFSMState.Success
            || state === ExtensionUpdateFSMState.NotAvailable) {
            this.minDisplayUntil = Date.now() + MIN_UPDATE_DISPLAY_DURATION_MS;
        }

        this.extensionUpdateState = state;
    }
}
