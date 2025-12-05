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

import { tabsApi as tsWebExtTabsApi } from 'tswebextension';

import {
    settingsStorage,
    type IconData,
    type IconVariants,
} from '../../../storages';
import { SettingOption } from '../../../schema';
import { iconsCache, TabsApi as CommonTabsApi } from '../../../../common/api/extension';
import { logger } from '../../../../common/logger';
import { FramesApi, type FrameData } from '../frames';
import { promoNotificationApi } from '../promo-notification';
import { browserAction } from '../browser-action';
import { translator } from '../../../../common/translators/translator';

/**
 * The Icons API is responsible for managing the extension's action state.
 */
export abstract class IconsApiCommon {
    /**
     * Badge background color.
     */
    private readonly BADGE_COLOR = '#555';

    /**
     * Icon variants for the promo notification, if any is available.
     */
    protected promoIcons: IconVariants | null = null;

    /**
     * Initializes Icons API.
     */
    public async init(): Promise<void> {
        await this.setPromoIconIfAny();

        // Preset corrected icon during initialization
        await this.update();
    }

    /**
     * Set one icon for all tabs based on the current extension state and
     * promo notification (if any). After that updates icon for current tab
     * based on tab context data.
     */
    public async update(): Promise<void> {
        const icon = await this.pickIconVariant();
        // Update all tabs icons
        const allTabs = await browser.tabs.query({});

        await Promise.allSettled(allTabs.map(async (tab) => {
            if (!tab.id) {
                return;
            }
            try {
                logger.trace(`[ext.IconsApiCommon.update]: updating icon for tab ${tab.id}`, icon);
                await IconsApiCommon.setActionIcon(icon, tab.id);
            } catch (e) {
                logger.debug(`[ext.IconsApiCommon.update]: failed to update icon for tab ${tab.id}:`, e);
            }
        }));

        const activeTab = await CommonTabsApi.getActive();
        const tabId = activeTab?.id;
        if (!tabId) {
            return;
        }

        const tabContext = tsWebExtTabsApi.getTabContext(tabId);
        if (!tabContext) {
            return;
        }

        const frameData = FramesApi.getMainFrameData(tabContext);

        try {
            await this.updateTabAction(tabId, frameData);
        } catch (e) {
            logger.info(`[ext.IconsApiCommon.update]: failed to update tab icon for active tab ${tabId}:`, e);
        }
    }

    /**
     * Updates extension icon for specified tab.
     *
     * @param tabId Tab's id.
     * @param frameData The information from {@link FrameData} is needed
     * to estimate the current status of the background extension
     * in the specified tab.
     */
    public async updateTabAction(
        tabId: number,
        frameData: FrameData,
    ): Promise<void> {
        /**
         * TODO: Check, whether we should call this method since it will update
         * the icon on every tab for each call if the promo notification is not
         * active.
         */
        try {
            await this.resetPromoIconIfAny(tabId, frameData);
        } catch { /* do nothing */ }

        const {
            documentAllowlisted,
            applicationFilteringDisabled,
            totalBlockedTab,
        } = frameData;

        const isDisabled = documentAllowlisted || applicationFilteringDisabled;

        // Determine extension's action new state based on the tab state
        const icon = await this.pickIconVariant(isDisabled);
        const badgeText = IconsApiCommon.getBadgeText(totalBlockedTab, isDisabled);

        try {
            await IconsApiCommon.setActionIcon(icon, tabId);

            if (badgeText.length !== 0) {
                await browserAction.setBadgeBackgroundColor({ color: this.BADGE_COLOR });
                await browserAction.setBadgeText({ tabId, text: badgeText });
            }
        } catch (e) {
            logger.info(`[ext.IconsApiCommon.updateTabAction]: failed to update tab icon for tab ${tabId}:`, e);
        }
    }

    /**
     * Cleans up the promo icon variants. If the tab data is provided,
     * updates the icon for the specified tab.
     *
     * @param tabId Tab's id.
     * @param frameData Tab's {@link FrameData}.
     */
    public async dismissPromoIcon(tabId?: number, frameData?: FrameData): Promise<void> {
        this.promoIcons = null;

        const icon = await this.pickIconVariant();

        // Get rid of promo icon on all tabs, this prevents icon flickering on tab change
        await IconsApiCommon.setActionIcon(icon);

        // Update action icon for the specified tab if any
        if (tabId && frameData) {
            const isDisabled = frameData.documentAllowlisted || frameData.applicationFilteringDisabled;
            const disabledIcon = await this.pickIconVariant(isDisabled);
            await IconsApiCommon.setActionIcon(disabledIcon, tabId);
        }
    }

    /**
     * Sets the icon and tooltip for the extension action.
     *
     * @param icon Icon data object.
     * @param icon.iconPaths Icons to set.
     * @param icon.tooltip Tooltip text.
     * @param tabId Tab's id, if not specified, the icon and tooltip will be set for all tabs.
     */
    private static async setActionIcon({ iconPaths, tooltip }: IconData, tabId?: number): Promise<void> {
        try {
            const appName = translator.getMessage('name');
            const title = tooltip
                ? `${appName}\n${tooltip}`
                : appName;

            await Promise.all([
                browserAction.setIcon({ imageData: await iconsCache.getIconImageData(iconPaths), tabId }),
                browserAction.setTitle({ title, tabId }),
            ]);
        } catch (e) {
            logger.info('[ext.IconsApiCommon.setActionIcon]: Failed to set icon or tooltip:', e);
        }
    }

    /**
     * Picks the icon variant based on the current extension state.
     * Fallbacks to default icon variants if the promo icons are not set.
     *
     * This method must be implemented by concrete classes (MV2/MV3)
     * as they have different logic for icon selection.
     *
     * @param isDisabled Is website allowlisted or app filtering disabled.
     *
     * @returns Icon variant to display.
     */
    protected abstract pickIconVariant(isDisabled?: boolean): Promise<IconData>;

    /**
     * Calculates the badge text based on the tab state.
     *
     * @param totalBlockedTab Number of blocked requests.
     * @param isDisabled Is website allowlisted or app filtering disabled.
     *
     * @returns Badge text to display.
     */
    private static getBadgeText(totalBlockedTab: number, isDisabled: boolean): string {
        let totalBlocked: number;

        if (!isDisabled && !settingsStorage.get(SettingOption.DisableShowPageStats)) {
            totalBlocked = totalBlockedTab;
        } else {
            totalBlocked = 0;
        }

        if (totalBlocked === 0) {
            return '';
        }

        if (totalBlocked > 99) {
            return '\u221E'; // infinity symbol
        }

        return String(totalBlocked);
    }

    /**
     * If promo icons variants are not set,
     * fetches icon variants from the promo notification api (if any),
     * otherwise does nothing.
     */
    private async setPromoIconIfAny(): Promise<void> {
        if (this.promoIcons) {
            return;
        }
        const notification = await promoNotificationApi.getCurrentNotification();
        if (notification && notification.icons) {
            this.promoIcons = notification.icons;
        }
    }

    /**
     * Always fetches icon variants from the promo notification api,
     * and sets the promo icons if any,
     * otherwise promo icon is dismissed.
     *
     * @param tabId Tab's id.
     * @param frameData Tab's {@link FrameData}.
     */
    private async resetPromoIconIfAny(tabId: number, frameData: FrameData): Promise<void> {
        const notification = await promoNotificationApi.getCurrentNotification();
        if (notification && notification.icons) {
            this.promoIcons = notification.icons;
        } else {
            await this.dismissPromoIcon(tabId, frameData);
        }
    }
}
