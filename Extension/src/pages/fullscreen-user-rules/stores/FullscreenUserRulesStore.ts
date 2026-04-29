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
    runInAction,
} from 'mobx';
import { nanoid } from 'nanoid';

import { type SettingsData } from '../../../background/api/settings';
import { messenger } from '../../services/messenger';
import { logger } from '../../../common/logger';
import { translator } from '../../../common/translators/translator';
import { type SettingOption, type Settings } from '../../../background/schema';
import { type NotificationParams, NotificationType } from '../../common/types';
import { type TelemetryEventName, type TelemetryActionToScreenMap } from '../../../common/telemetry';

/**
 * Notification with id.
 */
type NotificationParamsWithId = NotificationParams & {
    /**
     * Unique notification id.
     */
    id: string;
};

/**
 * Store for the fullscreen user rules page.
 *
 * Encapsulates all UI state (loader, notifications) and settings interactions
 * so the page does not depend on the options-page RootStore. This reduces the
 * fullscreen-user-rules bundle size (AG-48937).
 */
export class FullscreenUserRulesStore {
    /**
     * Extension settings data.
     */
    @observable
    settings: SettingsData | null = null;

    /**
     * Loader visibility state.
     */
    @observable
    showLoader = false;

    /**
     * Notifications list.
     */
    @observable
    notifications: NotificationParamsWithId[] = [];

    /**
     * Whether anonymized usage data collection is allowed.
     */
    @observable
    private allowAnonymizedUsageData = false;

    constructor() {
        makeObservable(this);

        this.setShowLoader = this.setShowLoader.bind(this);
    }

    /**
     * Fetches fullscreen user rules data from the background page
     * and updates settings and telemetry consent flag.
     */
    @action
    async getFullscreenUserRulesData(): Promise<void> {
        const { settings } = await messenger.getUserRulesEditorData();
        runInAction(() => {
            this.settings = settings;
            this.allowAnonymizedUsageData = settings.values[
                settings.names.AllowAnonymizedUsageData
            ];
        });
    }

    /**
     * Appearance theme from settings.
     */
    @computed
    get appearanceTheme() {
        if (!this.settings) {
            return null;
        }

        return this.settings.values[this.settings.names.AppearanceTheme];
    }

    /**
     * Setting ID for user filter enabled toggle.
     */
    @computed
    get userFilterEnabledSettingId(): SettingOption.UserFilterEnabled | null {
        if (!this.settings) {
            logger.debug('[ext.FullscreenUserRulesStore.userFilterEnabledSettingId]: settings is not initialized yet');
            return null;
        }
        return this.settings.names.UserFilterEnabled;
    }

    /**
     * Sets the loader visibility state.
     *
     * @param value Loader visibility state.
     */
    @action
    setShowLoader(value = false): void {
        this.showLoader = value;
    }

    /**
     * Adds a notification to the list.
     *
     * @param params Notification parameters.
     *
     * @returns Notification id or null if duplicate.
     */
    @action
    addNotification(params: NotificationParams): string | null {
        const isNotificationAlreadyPresent = this.notifications
            .some((notification) => {
                return notification.type === params.type
                    && notification.text === params.text;
            });

        if (isNotificationAlreadyPresent) {
            return null;
        }
        const id = nanoid();
        this.notifications.push({
            id,
            ...params,
        });
        return id;
    }

    /**
     * Adds an error notification about rule limits exceeded.
     *
     * The notification will have a button to open the rules limits tab.
     *
     * @param text Notification text.
     */
    @action
    addRuleLimitsNotification(text: string): void {
        const buttons = [{
            title: translator.getMessage('options_rule_limits'),
            onClick: messenger.openRulesLimitsTab,
        }];
        this.addNotification({
            type: NotificationType.Error,
            text,
            buttons,
        });
    }

    /**
     * Removes a notification from the list.
     *
     * @param id Notification id.
     */
    @action
    removeNotification(id: string): void {
        this.notifications = this.notifications
            .filter((notification) => notification.id !== id);
    }

    /**
     * Updates a setting value locally and sends it to the background.
     * Reverts the local value on failure.
     *
     * @param settingId Setting key.
     * @param value New value.
     */
    @action
    async updateSetting<T extends SettingOption>(
        settingId: T,
        value: Settings[T],
    ): Promise<void> {
        if (!this.settings) {
            logger.debug('[ext.FullscreenUserRulesStore.updateSetting]: settings is not initialized yet');
            return;
        }

        const previousValue = this.settings.values[settingId];
        this.settings.values[settingId] = value;

        try {
            await messenger.changeUserSetting(settingId, value);
        } catch (e) {
            // Revert optimistic UI update on failure
            runInAction(() => {
                if (this.settings) {
                    this.settings.values[settingId] = previousValue;
                }
            });
            throw e;
        }
    }

    /**
     * Checks MV3 rule limitations and shows a notification if dynamic rules
     * are over the limit. No-op on MV2; overridden in MV3 subclass.
     */
    // eslint-disable-next-line class-methods-use-this
    @action
    async checkLimitations(): Promise<void> {
        // No-op. Overridden in MV3 subclass.
    }

    /**
     * Sends a custom telemetry event to the background if usage data collection
     * is allowed.
     *
     * @param eventName Name of the custom telemetry event.
     * @param screenName Name of the screen where the event occurred.
     */
    async sendTelemetryCustomEvent(
        eventName: TelemetryEventName,
        screenName: TelemetryActionToScreenMap[TelemetryEventName],
    ): Promise<void> {
        try {
            if (!this.allowAnonymizedUsageData) {
                return;
            }

            await messenger.sendTelemetryCustomEvent(screenName, eventName);
        } catch (e) {
            logger.debug('[ext.FullscreenUserRulesStore.sendTelemetryCustomEvent]: Failed to send custom telemetry event', e);
        }
    }
}
