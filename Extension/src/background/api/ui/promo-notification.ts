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
import browser from 'webextension-polyfill';

import { UserAgent } from '../../../common/user-agent';
import {
    type PromoNotification,
    notificationStorage,
    browserStorage,
} from '../../storages';
import { type NotificationTextRecord } from '../../schema';
import { LAST_NOTIFICATION_TIME_KEY, VIEWED_NOTIFICATIONS_KEY } from '../../../common/constants';
import { I18n } from '../../utils';

import { UiApi } from './main';

/**
 * Promo notification API is needed to work with notifications.
 */
class PromoNotificationApi {
    private static readonly CHECK_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

    private static readonly MIN_PERIOD_MS = 30 * 60 * 1000; // 30 minutes

    private static readonly DELAY_MS = 30 * 1000; // clear notification in 30 seconds

    private currentNotification: PromoNotification | null = null;

    private notificationCheckTime = 0;

    private timeoutId: number | undefined = undefined;

    private isInit = false;

    /**
     * Scans notifications list and prepares them to be used (or removes expired).
     */
    public init(): void {
        notificationStorage.forEach((notification, notificationKey, map) => {
            notification.text = PromoNotificationApi.getNotificationText(notification) || null;

            const to = new Date(notification.to).getTime();
            const expired = new Date().getTime() > to;

            if (!notification.text || expired) {
                // Remove expired and invalid
                map.delete(notificationKey);
            }
        });

        this.isInit = true;
    }

    /**
     * Marks current notification as viewed.
     *
     * @param withDelay If true, do this after a 30 sec delay.
     */
    public async setNotificationViewed(withDelay: boolean): Promise<void> {
        if (!this.currentNotification) {
            return;
        }

        if (withDelay) {
            clearTimeout(this.timeoutId);

            // eslint-disable-next-line no-restricted-globals
            this.timeoutId = self.setTimeout(() => {
                this.setNotificationViewed(false);
            }, PromoNotificationApi.DELAY_MS);

            return;
        }

        const { id } = this.currentNotification;

        const viewedNotifications = await browserStorage.get(VIEWED_NOTIFICATIONS_KEY) || [];

        if (Array.isArray(viewedNotifications) && !viewedNotifications.includes(id)) {
            viewedNotifications.push(id);
            await browserStorage.set(VIEWED_NOTIFICATIONS_KEY, viewedNotifications);

            this.currentNotification = null;

            await UiApi.dismissPromo();
        }
    }

    /**
     * Finds out notification for current time and checks if notification wasn't shown yet.
     *
     * @returns Promo notification object or null if there is no promo notification to show.
     */
    public async getCurrentNotification(): Promise<PromoNotification | null> {
        // Do not display notification on Firefox
        if (UserAgent.isFirefox) {
            return null;
        }

        // Do not display notification before initialization
        if (!this.isInit) {
            return null;
        }

        const currentTime = Date.now();
        const timeSinceLastNotification = currentTime - await PromoNotificationApi.getLastNotificationTime();

        //  Do not show notification too often
        if (timeSinceLastNotification < PromoNotificationApi.MIN_PERIOD_MS) {
            return null;
        }

        // Check no more than every 10 minutes
        const timeSinceLastCheck = currentTime - this.notificationCheckTime;
        if (this.notificationCheckTime > 0 && timeSinceLastCheck <= PromoNotificationApi.CHECK_TIMEOUT_MS) {
            return this.currentNotification;
        }

        // Update the last notification check time
        this.notificationCheckTime = currentTime;

        const notificationsValues = Array.from(notificationStorage.values());

        const viewedNotifications = await browserStorage.get(VIEWED_NOTIFICATIONS_KEY) || [];

        for (let i = 0; i < notificationsValues.length; i += 1) {
            const notification = notificationsValues[i];

            if (!notification) {
                continue;
            }

            const from = new Date(notification.from).getTime();
            const to = new Date(notification.to).getTime();
            if (
                from < currentTime
                && to > currentTime
                && Array.isArray(viewedNotifications)
                && !viewedNotifications.includes(notification.id)
            ) {
                this.currentNotification = notification;
                return this.currentNotification;
            }
        }

        this.currentNotification = null;

        return this.currentNotification;
    }

    /**
     * Handles Spanish locale codes:
     * - for non-Spanish locales, returns the same code;
     * - for Latin American Spanish, e.g. 'es_mx', returns 'es_419';
     * - for Spain Spanish, e.g. 'es_es', returns 'es'.
     *
     * @param normalizedLocale Normalized locale code.
     *
     * @returns Normalized locale code.
     */
    private static handleSpanishLocale(normalizedLocale: string): string {
        const GENERAL_SPANISH_NORMALIZED_CODE = 'es';
        const SPAIN_SPANISH_NORMALIZED_CODE = 'es_es';
        const LATIN_AMERICAN_SPANISH_NORMALIZED_CODE = 'es_419';

        if (!normalizedLocale.startsWith(GENERAL_SPANISH_NORMALIZED_CODE)) {
            return normalizedLocale;
        }

        if (normalizedLocale === GENERAL_SPANISH_NORMALIZED_CODE
            || normalizedLocale === SPAIN_SPANISH_NORMALIZED_CODE) {
            return GENERAL_SPANISH_NORMALIZED_CODE;
        }

        return LATIN_AMERICAN_SPANISH_NORMALIZED_CODE;
    }

    /**
     * Handles Serbian locale codes:
     * - for non-Serbian locales, returns the same code;
     * - for any Serbian, e.g. 'sr', 'sr_latn', 'sr_cyrl_rs', returns 'sr_latn'.
     *
     * @param normalizedLocale Normalized locale code.
     *
     * @returns Normalized locale code.
     */
    private static handleSerbianLocale(normalizedLocale: string): string {
        const GENERAL_SERBIAN_LOCALE = 'sr';
        const GENERAL_SERBIAN_LATIN_LOCALE = 'sr_latn';
        if (normalizedLocale.startsWith(GENERAL_SERBIAN_LOCALE)) {
            return GENERAL_SERBIAN_LATIN_LOCALE;
        }

        return normalizedLocale;
    }

    /**
     * Scans notification locales and returns the one matching navigator.language.
     *
     * @param notification Promo notification object.
     *
     * @returns {NotificationTextRecord | undefined} Matching notification text settings or undefined.
     */
    private static getNotificationText(notification: PromoNotification): NotificationTextRecord | undefined {
        let language = I18n.normalizeLanguageCode(browser.i18n.getUILanguage());

        if (!language) {
            return;
        }

        language = PromoNotificationApi.handleSpanishLocale(language);
        language = PromoNotificationApi.handleSerbianLocale(language);

        const languageCode = language.split('_')[0];
        if (!languageCode) {
            return;
        }

        return notification.locales[language] || notification.locales[languageCode];
    }

    /**
     * Returns the last time a notification was shown.
     * If it was not shown yet, initialized with the current time.
     *
     * @returns Last notification time.
     */
    private static async getLastNotificationTime(): Promise<number> {
        let lastTime = Number(await browserStorage.get(LAST_NOTIFICATION_TIME_KEY) || 0);

        if (lastTime === 0) {
            lastTime = Date.now();
            await browserStorage.set(LAST_NOTIFICATION_TIME_KEY, lastTime);
        }

        return lastTime;
    }
}

export const promoNotificationApi = new PromoNotificationApi();
