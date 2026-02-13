/**
 * Copyright (c) 2015-2025 Adguard Software Ltd.
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
    makeObservable,
    observable,
} from 'mobx';
import { type GetExtensionStatusForPopupResponse } from 'popup-service';

import { messenger } from '../../../services/messenger';
import { translator } from '../../../../common/translators/translator';
import { MIN_UPDATE_DISPLAY_DURATION_MS } from '../../../../common/constants';
import { logger } from '../../../../common/logger';
import { sleepIfNecessary } from '../../../../common/sleep-utils';
import { NotificationType } from '../../../common/types';
import { type NotificationParams } from '../../../common/types';

import { PopupStoreCommon } from './PopupStore-common';

export class PopupStore extends PopupStoreCommon {
    @observable
    areFilterLimitsExceeded = false;

    @observable
    updateNotification: NotificationParams | null = null;

    @observable
    isExtensionUpdateAvailable = false;

    /**
     * Whether the extension update is checking or is updating now.
     */
    @observable
    isExtensionCheckingUpdateOrUpdating = false;

    constructor() {
        super();
        makeObservable(this);
    }

    /** @inheritdoc */
    override async getPopupData(): Promise<void> {
        await super.getPopupData();

        const options = await messenger.getExtensionStatusForPopup();

        this.configureExtensionUpdates(options);
    }

    /**
     * Retrieves extension status including filter limits, update availability,
     * and update notifications. Sets up success/failure notifications for
     * extension updates that occurred during popup reload.
     */
    @action
    private configureExtensionUpdates(options: GetExtensionStatusForPopupResponse): void {
        const {
            areFilterLimitsExceeded,
            isExtensionUpdateAvailable,
            isExtensionReloadedOnUpdate,
            isSuccessfulExtensionUpdate,
        } = options;

        this.areFilterLimitsExceeded = areFilterLimitsExceeded;
        this.setIsExtensionUpdateAvailable(isExtensionUpdateAvailable);

        // notification about successful or failed update should be shown after the popup is opened.
        // and it cannot be done by notifier (from the background page)
        // because event may be dispatched _before_ the popup is opened,
        // i.e. listener may not be registered yet.
        if (!isExtensionReloadedOnUpdate) {
            return;
        }

        if (isSuccessfulExtensionUpdate) {
            this.setUpdateNotification({
                type: NotificationType.Success,
                text: translator.getMessage('update_success_text'),
            });
        } else {
            this.setUpdateNotification({
                type: NotificationType.Error,
                text: translator.getMessage('update_failed_text'),
                button: {
                    title: translator.getMessage('update_failed_try_again_btn'),
                    onClick: this.checkUpdates,
                },
            });
        }
    }

    /**
     * Checks for updates and if update is available, starts the update process.
     */
    @action
    checkUpdates = async () => {
        const start = Date.now();

        try {
            this.setUpdateNotification(null);
            await messenger.checkUpdates();
        } catch (error: unknown) {
            logger.debug('[ext.PopupStore]: failed to check updates in popup: ', error);
        }

        // Ensure minimum duration for smooth UI experience
        await sleepIfNecessary(start, MIN_UPDATE_DISPLAY_DURATION_MS);
    };

    @action
    setUpdateNotification(notification: NotificationParams | null): void {
        this.updateNotification = notification;
    }

    @action
    setIsExtensionUpdateAvailable(isUpdateAvailable: boolean): void {
        this.isExtensionUpdateAvailable = isUpdateAvailable;
    }

    @action
    setIsExtensionCheckingUpdateOrUpdating(value: boolean): void {
        this.isExtensionCheckingUpdateOrUpdating = value;
    }
}
