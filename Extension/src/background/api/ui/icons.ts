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

import { SettingOption } from '../../schema';
import { settingsStorage } from '../../storages';
import { getIconImageData } from '../../../common/api/extension';
import type { IconData } from '../../storages';

import { FrameData } from './frames';
import { promoNotificationApi } from './promo-notification';

const defaultIconVariants = {
    enabled: {
        '19': browser.runtime.getURL('assets/icons/green-19.png'),
        '38': browser.runtime.getURL('assets/icons/green-38.png'),
    },
    disabled: {
        '19': browser.runtime.getURL('assets/icons/gray-19.png'),
        '38': browser.runtime.getURL('assets/icons/gray-38.png'),
    },
};

/**
 * The Icons API is responsible for managing the extension's action state.
 */
class IconsApi {
    /**
     * Badge background color.
     */
    private readonly BADGE_COLOR = '#555';

    /**
     * Icon variants for the promo notification, if any is available.
     */
    private promoIcons: Record<string, IconData> | null = null;

    /**
     * Initializes Icons API.
     */
    public async init(): Promise<void> {
        await this.setPromoIconIfAny();

        if (this.promoIcons?.enabled) {
            // Pre-set promo icon to avoid flicker on tabs change
            const icon = this.pickIconVariant();
            await IconsApi.setActionIcon(icon);
        }
    }

    /**
     * Updates current extension icon for specified tab.
     *
     * @param tabId Tab's id.
     * @param frameData The information from {@link FrameData} is needed
     * to estimate the current status of the background extension
     * in the specified tab.
     * @param frameData.documentAllowlisted Is website allowlisted.
     * @param frameData.applicationFilteringDisabled Is app filtering disabled globally.
     * @param frameData.totalBlockedTab Number of blocked requests.
     */
    public async updateTabAction(
        tabId: number,
        {
            documentAllowlisted,
            applicationFilteringDisabled,
            totalBlockedTab,
        }: FrameData,
    ): Promise<void> {
        const isDisabled = documentAllowlisted || applicationFilteringDisabled;

        try {
            await this.setPromoIconIfAny();
        } catch { /* do nothing */ }

        // Determine extension's action new state based on the current tab state
        const icon = this.pickIconVariant(isDisabled);
        const badgeText = IconsApi.getBadgeText(totalBlockedTab, isDisabled);

        try {
            await IconsApi.setActionIcon(icon, tabId);

            if (badgeText.length !== 0) {
                await browser.browserAction.setBadgeBackgroundColor({ color: this.BADGE_COLOR });
                await browser.browserAction.setBadgeText({ tabId, text: badgeText });
            }
        } catch (e) { /* do nothing */ }
    }

    /**
     * Cleans up the promo icon variants. If the current tab action data is provided,
     * updates the icon for the current tab.
     *
     * @param tabId Tab's id.
     * @param frameData Tab's {@link FrameData}.
     */
    public async dismissPromoIcon(tabId?: number, frameData?: FrameData): Promise<void> {
        this.setPromoIcons(null);

        // Get rid of promo icon on all tabs, this prevents icon flickering on tab change
        await IconsApi.setActionIcon(this.pickIconVariant());

        // Update current tab action
        if (tabId && frameData) {
            const isDisabled = frameData.documentAllowlisted || frameData.applicationFilteringDisabled;
            await IconsApi.setActionIcon(this.pickIconVariant(isDisabled), tabId);
        }
    }

    /**
     * Sets the icon for the extension action.
     *
     * @param icon Icon to set.
     * @param tabId Tab's id, if not specified, the icon will be set for all tabs.
     */
    private static async setActionIcon(icon: IconData, tabId?: number): Promise<void> {
        await browser.browserAction.setIcon({ imageData: await getIconImageData(icon), tabId });
    }

    /**
     * Picks the icon variant based on the current tab state.
     * Fallbacks to default icon variants if the current icon variants are not provided.
     *
     * @param isDisabled Is website allowlisted or app filtering disabled.
     * @returns Icon variant to display.
     */
    private pickIconVariant(isDisabled = false): IconData {
        return isDisabled
            ? this.promoIcons?.disabled || defaultIconVariants.disabled
            : this.promoIcons?.enabled || defaultIconVariants.enabled;
    }

    /**
     * Calculates the badge text based on the current tab state.
     *
     * @param totalBlockedTab Number of blocked requests.
     * @param isDisabled Is website allowlisted or app filtering disabled.
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
     * Sets the promo icon variants.
     *
     * @param iconVariants Icon variants to set.
     */
    private setPromoIcons(iconVariants: Record<string, IconData> | null): void {
        this.promoIcons = iconVariants;
    }

    /**
     * Fetches the current icon variants from the promo notification api, if any.
     * Does nothing if the icon variants are already set.
     */
    private async setPromoIconIfAny(): Promise<void> {
        if (this.promoIcons) {
            return;
        }
        const notification = await promoNotificationApi.getCurrentNotification();
        if (notification && notification.icons) {
            this.setPromoIcons(notification.icons);
        }
    }
}

export const iconsApi = new IconsApi();
