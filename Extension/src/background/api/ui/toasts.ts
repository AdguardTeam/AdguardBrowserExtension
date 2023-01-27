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
import { sendTabMessage, MessageType } from '../../../common/messages';
import {
    Forward,
    ForwardAction,
    ForwardFrom,
} from '../../../common/forward';

enum StylesAssetsPath {
    AlertPopup = '/assets/css/alert-popup.css',
    AlertContainer = '/assets/css/alert-container.css',
    UpdateContainer = '/assets/css/update-container.css',
}

/**
 * Toasts class handles work with different popups and alert messages.
 */
export class Toasts {
    private static readonly MAX_TRIES = 500;

    private static readonly TRIES_TIMEOUT_MS = 5000; // 5 sec

    private styles: Map<StylesAssetsPath, string | undefined> = new Map();

    /**
     * Downloads styles assets from {@link StylesAssetsPath}.
     */
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

    /**
     * Shows alert message.
     *
     * @param title Title.
     * @param text Text.
     * @param triesCount Number of tries to show. If this value exceeds {@link Toasts#maxTries}
     * then the window will not be displayed.
     */
    public async showAlertMessage(title: string, text: string | string[], triesCount = 1): Promise<void> {
        try {
            if (triesCount > Toasts.MAX_TRIES) {
                // Give up
                Log.warn('Reached max tries on attempts to show alert popup');
                return;
            }

            const tab = await TabsApi.getActive();
            const alertStyles = this.styles.get(StylesAssetsPath.AlertPopup);
            const alertContainerStyles = this.styles.get(StylesAssetsPath.AlertContainer);

            if (!alertStyles || !alertContainerStyles) {
                Log.error('Alert assets is not loaded!');
                return;
            }

            if (tab?.id) {
                await sendTabMessage(tab.id, {
                    type: MessageType.ShowAlertPopup,
                    data: {
                        isAdguardTab: TabsApi.isAdguardExtensionTab(tab),
                        title,
                        text,
                        alertStyles,
                        alertContainerStyles,
                    },
                });
            }
        } catch (e) {
            setTimeout(() => {
                this.showAlertMessage(title, text, triesCount + 1);
            }, Toasts.TRIES_TIMEOUT_MS);
        }
    }

    /**
     * Show message about enabled filters.
     *
     * @param filters Enabled filters.
     */
    public showFiltersEnabledAlertMessage(filters: FilterMetadata[]): void {
        const { title, text } = Toasts.getFiltersEnabledResultMessage(filters);

        this.showAlertMessage(title, text);
    }

    /**
     * Show message about result of updating filters.
     *
     * @param success Whether the update was successful or not.
     * @param filters List of filters to update.
     */
    public showFiltersUpdatedAlertMessage(success: boolean, filters?: FilterMetadata[]): void {
        const { title, text } = Toasts.getFiltersUpdateResultMessage(success, filters);

        this.showAlertMessage(title, text);
    }

    /**
     * Shows application updated popup.
     *
     * @param currentVersion App current semver string.
     * @param previousVersion App previous semver string.
     * @param triesCount Count of show popup tries.
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

        try {
            if (triesCount > Toasts.MAX_TRIES) {
                // Give up
                Log.warn('Reached max tries on attempts to show application update popup');
                return;
            }

            const tab = await TabsApi.getActive();
            const alertStyles = this.styles.get(StylesAssetsPath.AlertPopup);
            const iframeStyles = this.styles.get(StylesAssetsPath.UpdateContainer);

            if (!alertStyles || !iframeStyles) {
                Log.error('Update popup assets is not loaded!');
                return;
            }

            if (tab?.id) {
                await sendTabMessage(tab.id, {
                    type: MessageType.ShowVersionUpdatedPopup,
                    data: {
                        isAdguardTab: TabsApi.isAdguardExtensionTab(tab),
                        title: translator.getMessage(
                            'options_popup_version_update_title_text',
                            { current_version: currentVersion },
                        ),
                        description: Toasts.getUpdateDescriptionMessage(currentVersion, previousVersion),
                        changelogHref: Forward.get({
                            action: ForwardAction.GithubVersion,
                            from: ForwardFrom.VersionPopup,
                        }),
                        changelogText: translator.getMessage('options_popup_version_update_changelog_text'),
                        showPromoNotification: !!promoNotification,
                        offer,
                        offerDesc,
                        offerButtonText,
                        offerButtonHref,
                        disableNotificationText: translator.getMessage(
                            'options_popup_version_update_disable_notification',
                        ),
                        alertStyles,
                        iframeStyles,
                    },
                });
            }
        } catch (e) {
            setTimeout(() => {
                this.showApplicationUpdatedPopup(currentVersion, previousVersion, triesCount + 1);
            }, Toasts.TRIES_TIMEOUT_MS);
        }
    }

    /**
     * Returns message with enabled filters.
     *
     * @param enabledFilters List of enabled filters.
     *
     * @returns Title and text lines for message.
     */
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

    /**
     * Returns message with result of updating filters.
     *
     * @param success Whether the update was successful or not.
     * @param updatedFilters List of filters to update.
     *
     * @returns Title and text lines for message.
     */
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
     * Depending on version numbers select proper message for description.
     *
     * @param currentVersion Current semver of app.
     * @param previousVersion Previous semver of app.
     *
     * @returns Message text.
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
