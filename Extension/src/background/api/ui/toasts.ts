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
import browser from 'webextension-polyfill';
import { Log } from '../../../common/log';
import { BrowserUtils } from '../../utils/browser-utils';

import { translator } from '../../../common/translators/translator';
import { notificationTextRecordValidator } from '../../schema';
import { TabsApi } from '../extension';
import { notificationApi } from './notification';
import { FilterMetadata } from '../filters';

enum StylesAssetsPath {
    AlertPopup = '/assets/css/alert-popup.css',
    AlertContainer = '/assets/css/alert-container.css',
    UpdateContainer = '/assets/css/update-container.css',
}

export class Toasts {
    private static maxTries = 500; // 2500 sec

    private static triesTimeout = 5000; // 5 sec

    private styles: Map<StylesAssetsPath, string | undefined> = new Map();

    public async init(): Promise<void> {
        const tasks = Object.values(StylesAssetsPath)
            .map(async (path) => {
                const url = browser.runtime.getURL(path);
                const response = await fetch(url);
                const styles = await response.text();
                this.styles.set(path, styles);
            });

        await Promise.all(tasks);
    }

    public async showAlertMessage(title: string, text: string | string[], triesCount = 1): Promise<void> {
        try {
            if (triesCount > Toasts.maxTries) {
                // Give up
                Log.warn('Reached max tries on attempts to show alert popup');
                return;
            }

            const tab = await TabsApi.getActive();

            if (tab?.id) {
                await browser.tabs.sendMessage(tab.id, {
                    type: 'show-alert-popup',
                    isAdguardTab: TabsApi.isAdguardExtensionTab(tab),
                    title,
                    text,
                    alertStyles: this.styles.get(StylesAssetsPath.AlertPopup),
                    alertContainerStyles: this.styles.get(StylesAssetsPath.AlertContainer),
                });
            }
        } catch (e) {
            setTimeout(() => {
                this.showAlertMessage(title, text, triesCount + 1);
            }, Toasts.triesTimeout);
        }
    }

    public showFiltersEnabledAlertMessage(filters: FilterMetadata[]): void {
        const { title, text } = Toasts.getFiltersEnabledResultMessage(filters);

        this.showAlertMessage(title, text);
    }

    public showFiltersUpdatedAlertMessage(success: boolean, filters?: FilterMetadata[]): void {
        const { title, text } = Toasts.getFiltersUpdateResultMessage(success, filters);

        this.showAlertMessage(title, text);
    }

    /**
     * Shows application updated popup
     *
     * @param currentVersion -  app current semver string
     * @param previousVersion -  app previous semver string
     * @param triesCount - count of show popup tries
     */
    public async showApplicationUpdatedPopup(
        currentVersion: string,
        previousVersion: string,
        triesCount = 1,
    ): Promise<void> {
        const promoNotification = await notificationApi.getCurrentNotification();
        if (!promoNotification
            && BrowserUtils.getMajorVersionNumber(
                currentVersion,
            ) === BrowserUtils.getMajorVersionNumber(previousVersion)
            && BrowserUtils.getMinorVersionNumber(
                currentVersion,
            ) === BrowserUtils.getMinorVersionNumber(previousVersion)
        ) {
            // In case of no promo available or versions equivalence
            return;
        }

        let offer = translator.getMessage('options_popup_version_update_offer');
        let offerDesc = '';
        // eslint-disable-next-line max-len
        let offerButtonHref = 'https://link.adtidy.org/forward.html?action=learn_about_adguard&from=version_popup&app=browser_extension';
        let offerButtonText = translator.getMessage('options_popup_version_update_offer_button_text');

        if (promoNotification) {
            // check if promo notification is NotificationTextRecord
            const res = notificationTextRecordValidator.safeParse(promoNotification?.text);
            if (res.success) {
                const text = res.data;
                offer = text.title;
                offerButtonText = text.btn;
                offerButtonHref = `${promoNotification.url}&from=version_popup`;

                if (text.desc) {
                    offerDesc = text.desc;
                }
            }
        }

        const message = {
            type: 'show-version-updated-popup',
            title: translator.getMessage(
                'options_popup_version_update_title_text',
                { current_version: currentVersion },
            ),
            description: Toasts.getUpdateDescriptionMessage(currentVersion, previousVersion),
            // eslint-disable-next-line max-len
            changelogHref: 'https://link.adtidy.org/forward.html?action=github_version_popup&from=version_popup&app=browser_extension',
            changelogText: translator.getMessage('options_popup_version_update_changelog_text'),
            showPromoNotification: !!promoNotification,
            offer,
            offerDesc,
            offerButtonText,
            offerButtonHref,
            disableNotificationText: translator.getMessage('options_popup_version_update_disable_notification'),
            alertStyles: this.styles.get(StylesAssetsPath.AlertPopup),
            updateContainerStyles: this.styles.get(StylesAssetsPath.UpdateContainer),
        };

        try {
            if (triesCount > Toasts.maxTries) {
                // Give up
                Log.warn('Reached max tries on attempts to show application update popup');
                return;
            }

            const tab = await TabsApi.getActive();
            if (tab?.id) {
                await browser.tabs.sendMessage(tab.id, message);
            }
        } catch (e) {
            setTimeout(() => {
                this.showApplicationUpdatedPopup(currentVersion, previousVersion, triesCount + 1);
            }, Toasts.triesTimeout);
        }
    }

    private static getFiltersEnabledResultMessage(enabledFilters: FilterMetadata[]): {
        title: string,
        text: string[],
    } {
        const title = translator.getMessage('alert_popup_filter_enabled_title');

        const text = enabledFilters
            .sort((a, b) => a.displayNumber - b.displayNumber)
            .map(filter => translator.getMessage('alert_popup_filter_enabled_desc', { filter_name: filter.name }));

        return {
            title,
            text,
        };
    }

    private static getFiltersUpdateResultMessage(
        success: boolean,
        updatedFilters?: FilterMetadata[],
    ): {
        title: string,
        text: string,
    } {
        if (!success || !updatedFilters) {
            return {
                title: translator.getMessage('options_popup_update_title_error'),
                text: translator.getMessage('options_popup_update_error'),
            };
        }

        const title = '';

        if (updatedFilters.length === 0) {
            return {
                title,
                text: translator.getMessage('options_popup_update_not_found'),
            };
        }

        let text = updatedFilters
            .sort((a, b) => {
                if (a.groupId === b.groupId) {
                    return a.displayNumber - b.displayNumber;
                }
                return Number(a.groupId === b.groupId);
            })
            .map(filter => `${filter.name}`)
            .join(', ');

        if (updatedFilters.length > 1) {
            text += ` ${translator.getMessage('options_popup_update_filters')}`;
        } else {
            text += ` ${translator.getMessage('options_popup_update_filter')}`;
        }

        return {
            title,
            text,
        };
    }

    /**
     * Depending on version numbers select proper message for description
     *
     * @param currentVersion - current semver of app
     * @param previousVersion - previous semver of app
     *
     * @returns message text
     */
    private static getUpdateDescriptionMessage(currentVersion: string, previousVersion: string): string {
        if ((
            BrowserUtils.getMajorVersionNumber(currentVersion) > BrowserUtils.getMajorVersionNumber(previousVersion)
        ) || (
            BrowserUtils.getMinorVersionNumber(currentVersion) > BrowserUtils.getMinorVersionNumber(previousVersion)
        )) {
            return translator.getMessage('options_popup_version_update_description_major');
        }

        return translator.getMessage('options_popup_version_update_description_minor');
    }
}

export const toasts = new Toasts();
