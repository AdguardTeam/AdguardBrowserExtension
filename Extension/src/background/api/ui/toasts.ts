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

import { logger } from '../../../common/logger';
import { BrowserUtils } from '../../utils/browser-utils';
import { translator } from '../../../common/translators/translator';
import { notificationTextRecordValidator } from '../../schema';
import { TabsApi } from '../../../common/api/extension';
import { type FilterMetadata } from '../filters';
import { sendTabMessage, MessageType } from '../../../common/messages';
import {
    Forward,
    ForwardAction,
    ForwardFrom,
} from '../../../common/forward';
import { getFiltersUpdateResultMessage } from '../../../common/toast-helper';

import { promoNotificationApi } from './promo-notification';

enum StylesAssetsPath {
    AlertPopup = '/assets/css/alert-popup.css',
    AlertContainer = '/assets/css/alert-container.css',
    UpdateContainer = '/assets/css/update-container.css',
    RulesLimitsPopup = '/assets/css/rules-limits-popup.css',
    RulesLimitsContainer = '/assets/css/rules-limits-container.css',
}

/**
 * Toasts class handles work with different popups and alert messages.
 */
class Toasts {
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
     * Shows alert message about rule limits exceeded.
     *
     * @param triesCount Number of tries to show. If this value exceeds {@link Toasts#maxTries}
     * then the window will not be displayed.
     */
    public async showRuleLimitsAlert(triesCount = 1): Promise<void> {
        try {
            if (triesCount > Toasts.MAX_TRIES) {
                // Give up
                logger.warn('[ext.Toasts.showRuleLimitsAlert]: reached max tries on attempts to show rule limits alert popup.');
                return;
            }

            const alertStyles = this.styles.get(StylesAssetsPath.RulesLimitsPopup);
            const alertContainerStyles = this.styles.get(StylesAssetsPath.RulesLimitsContainer);

            if (!alertStyles || !alertContainerStyles) {
                logger.error('[ext.Toasts.showRuleLimitsAlert]: alert assets is not loaded!');
                return;
            }

            const tab = await TabsApi.getActive();
            if (tab?.id) {
                const mainText = translator.getMessage('snack_on_websites_limits_exceeded_warning');
                const linkText = translator.getMessage('options_rule_limits');

                await sendTabMessage(tab.id, {
                    type: MessageType.ShowRuleLimitsAlert,
                    data: {
                        // TODO: Remove isAdguardTab because we don't inject content-script
                        // in our settings page and so that we don't have listener
                        // for these messages.
                        isAdguardTab: TabsApi.isAdguardExtensionTab(tab),
                        mainText,
                        linkText,
                        alertStyles,
                        alertContainerStyles,
                    },
                });
            }
        } catch (e) {
            // eslint-disable-next-line no-restricted-globals
            self.setTimeout(() => {
                this.showRuleLimitsAlert(triesCount + 1);
            }, Toasts.TRIES_TIMEOUT_MS);
        }
    }

    /**
     * TODO: Continue to use only one method for showing alerts (with new design).
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
                logger.warn('[ext.Toasts.showAlertMessage]: reached max tries on attempts to show alert popup');
                return;
            }

            const tab = await TabsApi.getActive();
            const alertStyles = this.styles.get(StylesAssetsPath.AlertPopup);
            const alertContainerStyles = this.styles.get(StylesAssetsPath.AlertContainer);

            if (!alertStyles || !alertContainerStyles) {
                logger.error('[ext.Toasts.showAlertMessage]: alert assets styles are not loaded!');
                return;
            }

            if (tab?.id) {
                await sendTabMessage(tab.id, {
                    type: MessageType.ShowAlertPopup,
                    data: {
                        // TODO: Remove isAdguardTab because we don't inject content-script
                        // in our settings page and so that we don't have listener
                        // for these messages.
                        isAdguardTab: TabsApi.isAdguardExtensionTab(tab),
                        title,
                        text,
                        alertStyles,
                        alertContainerStyles,
                    },
                });
            }
        } catch (e) {
            // eslint-disable-next-line no-restricted-globals
            self.setTimeout(() => {
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
        const { title, text } = getFiltersUpdateResultMessage(success, filters);

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
        if (!BrowserUtils.isSemver(currentVersion)) {
            logger.warn(`[ext.Toasts.showApplicationUpdatedPopup]: invalid current version provided '${currentVersion}'`);
            return;
        }

        if (!BrowserUtils.isSemver(previousVersion)) {
            logger.warn(`[ext.Toasts.showApplicationUpdatedPopup]: invalid previous version provided '${previousVersion}'`);
            return;
        }

        const {
            getMajorVersionNumber,
            getMinorVersionNumber,
            getPatchVersionNumber,
            getBuildVersionNumber,
        } = BrowserUtils;

        const promoNotification = await promoNotificationApi.getCurrentNotification();
        const majorVersionNotChanged = getMajorVersionNumber(currentVersion) === getMajorVersionNumber(previousVersion);
        const minorVersionNotChanged = getMinorVersionNumber(currentVersion) === getMinorVersionNumber(previousVersion);
        const patchVersionNotChanged = getPatchVersionNumber(currentVersion) === getPatchVersionNumber(previousVersion);
        const isAutoBuildUpdate = majorVersionNotChanged && minorVersionNotChanged && patchVersionNotChanged
            && (getBuildVersionNumber(currentVersion) > getBuildVersionNumber(previousVersion));

        // Do not show popup for auto build updates.
        if (isAutoBuildUpdate) {
            return;
        }

        // In case of no promo available or versions equivalence (major and minor).
        if (!promoNotification && majorVersionNotChanged && minorVersionNotChanged) {
            return;
        }

        let offer = translator.getMessage('options_popup_version_update_offer');
        let offerDesc = '';
        let offerButtonHref = Forward.get({
            action: ForwardAction.LearnAboutAdGuard,
            from: ForwardFrom.VersionPopup,
        });
        let offerButtonText = translator.getMessage('options_popup_version_update_offer_button_text');
        let offerBgImage = '';

        if (promoNotification) {
            // check if promo notification is NotificationTextRecord
            const res = notificationTextRecordValidator.safeParse(promoNotification.text);
            if (res.success) {
                const text = res.data;
                offer = text.title;
                offerButtonText = text.btn;
                offerButtonHref = `${promoNotification.url}&from=version_popup`;

                if (text.desc) {
                    offerDesc = text.desc;
                }
            }

            const bgImageOnUpdate = promoNotification.bgImageOnUpdate || promoNotification.bgImage;

            if (bgImageOnUpdate) {
                try {
                    // dynamically load svg image if offer should look different for different locales; AG-31141
                    const response = await fetch(bgImageOnUpdate);
                    const svgStr = await response.text();
                    offerBgImage = `data:image/svg+xml;base64,${btoa(svgStr)}`;
                } catch (e) {
                    logger.warn('[ext.Toasts.showApplicationUpdatedPopup]: failed to load promo notification background image:', e);
                }
            }
        }

        try {
            if (triesCount > Toasts.MAX_TRIES) {
                // Give up
                logger.warn('[ext.Toasts.showApplicationUpdatedPopup]: reached max tries on attempts to show application update popup');
                return;
            }

            const tab = await TabsApi.getActive();
            const alertStyles = this.styles.get(StylesAssetsPath.AlertPopup);
            const iframeStyles = this.styles.get(StylesAssetsPath.UpdateContainer);

            if (!alertStyles || !iframeStyles) {
                logger.error('[ext.Toasts.showApplicationUpdatedPopup]: update popup assets styles are not loaded!');
                return;
            }

            if (tab?.id) {
                await sendTabMessage(tab.id, {
                    type: MessageType.ShowVersionUpdatedPopup,
                    data: {
                        // TODO: Remove isAdguardTab because we don't inject content-script
                        // in our settings page and so that we don't have listener
                        // for these messages.
                        isAdguardTab: TabsApi.isAdguardExtensionTab(tab),
                        title: translator.getMessage(
                            'options_popup_version_update_title_text',
                            { current_version: currentVersion },
                        ),
                        description: Toasts.getUpdateDescriptionMessage(currentVersion, previousVersion),
                        changelogHref: Forward.get({
                            action: IS_RELEASE ? ForwardAction.GithubVersion : ForwardAction.GithubVersionBeta,
                            from: ForwardFrom.VersionPopup,
                        }),
                        changelogText: translator.getMessage('options_popup_version_update_changelog_text'),
                        showPromoNotification: !!promoNotification,
                        offer,
                        offerDesc,
                        offerButtonText,
                        offerButtonHref,
                        offerBgImage,
                        disableNotificationText: translator.getMessage(
                            'options_popup_version_update_disable_notification',
                        ),
                        alertStyles,
                        iframeStyles,
                    },
                });
            }
        } catch (e) {
            // eslint-disable-next-line no-restricted-globals
            self.setTimeout(() => {
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
        title: string;
        text: string[];
    } {
        const title = translator.getMessage('alert_popup_filter_enabled_title');

        const text = enabledFilters
            .sort((a, b) => a.displayNumber - b.displayNumber)
            .map((filter) => translator.getMessage('alert_popup_filter_enabled_desc', { filter_name: filter.name }));

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
