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

import { ExtensionUpdateService } from 'extension-update-service';

import { RulesLimitsService } from 'rules-limits-service';

import {
    appContext,
    AppContextKey,
    settingsStorage,
    type IconData,
    type IconVariants,
} from '../../storages';
import { SettingOption } from '../../schema';
import { getIconImageData, TabsApi as CommonTabsApi } from '../../../common/api/extension';
import { logger } from '../../../common/logger';

import { FramesApi, type FrameData } from './frames';
import { promoNotificationApi } from './promo-notification';
import { browserAction } from './browser-action';

/**
 * Result of the setIcon promise race.
 */
const enum SetIconResult {
    Resolved = 'resolved',
    Timeout = 'timeout',
}

export const defaultIconVariants: IconVariants = {
    enabled: {
        '19': browser.runtime.getURL('assets/icons/on-19.png'),
        '38': browser.runtime.getURL('assets/icons/on-38.png'),
    },
    disabled: {
        '19': browser.runtime.getURL('assets/icons/off-19.png'),
        '38': browser.runtime.getURL('assets/icons/off-38.png'),
    },
    warning: {
        '19': browser.runtime.getURL('assets/icons/warning-19.png'),
        '38': browser.runtime.getURL('assets/icons/warning-38.png'),
    },
    updateAvailable: {
        '19': browser.runtime.getURL('assets/icons/update-available-19.png'),
        '38': browser.runtime.getURL('assets/icons/update-available-38.png'),
    },
    loading: {
        '19': browser.runtime.getURL('assets/icons/loading-19.png'),
        '38': browser.runtime.getURL('assets/icons/loading-38.png'),
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
    private promoIcons: IconVariants | null = null;

    /**
     * AG-38219 Flag to indicate if setIcon promise doesn't resolve (360 Browser).
     * If true, we skip awaiting setIcon calls.
     */
    private static setIconTimeoutDetected = false;

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
                logger.trace(`[ext.IconsApi.update]: updating icon for tab ${tab.id}`, icon);
                await IconsApi.setActionIcon(icon, tab.id);
            } catch (e) {
                logger.debug(`[ext.IconsApi.update]: failed to update icon for tab ${tab.id}:`, e);
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
            await iconsApi.updateTabAction(tabId, frameData);
        } catch (e) {
            logger.info(`[ext.IconsApi.update]: failed to update tab icon for active tab ${tabId}:`, e);
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
        const badgeText = IconsApi.getBadgeText(totalBlockedTab, isDisabled);

        try {
            await IconsApi.setActionIcon(icon, tabId);

            if (badgeText.length !== 0) {
                await browserAction.setBadgeBackgroundColor({ color: this.BADGE_COLOR });
                await browserAction.setBadgeText({ tabId, text: badgeText });
            }
        } catch (e) {
            logger.info(`[ext.IconsApi.updateTabAction]: failed to update tab icon for tab ${tabId}:`, e);
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
        await IconsApi.setActionIcon(icon);

        // Update action icon for the specified tab if any
        if (tabId && frameData) {
            const isDisabled = frameData.documentAllowlisted || frameData.applicationFilteringDisabled;
            const disabledIcon = await this.pickIconVariant(isDisabled);
            await IconsApi.setActionIcon(disabledIcon, tabId);
        }
    }

    /**
     * Timeout in milliseconds to wait for setIcon promise to resolve.
     */
    private static readonly SET_ICON_TIMEOUT_MS = 100;

    /**
     * Sets the icon for the extension action.
     *
     * @param icon Icon to set.
     * @param tabId Tab's id, if not specified, the icon will be set for all tabs.
     */
    private static async setActionIcon(icon: IconData, tabId?: number): Promise<void> {
        /**
         * AG-38219 For some reason browserAction.setIcon() promise is not resolved
         * in 360 browser MV3, the icon still sets correctly.
         * We use a timeout to avoid waiting indefinitely for the promise to resolve.
         * Once timeout is detected, we skip awaiting setIcon calls.
         */
        const setIconPromise = browserAction
            .setIcon({ imageData: await getIconImageData(icon), tabId })
            .then(() => SetIconResult.Resolved);

        if (IconsApi.setIconTimeoutDetected) {
            return;
        }

        let timeoutId: ReturnType<typeof setTimeout> | undefined;

        const timeoutPromise = new Promise<SetIconResult.Timeout>((resolve) => {
            timeoutId = setTimeout(() => resolve(SetIconResult.Timeout), IconsApi.SET_ICON_TIMEOUT_MS);
        });

        const result = await Promise.race([setIconPromise, timeoutPromise]);

        if (result === SetIconResult.Timeout) {
            logger.info('[ext.IconsApi.setActionIcon]: setIcon promise did not resolve in time, likely 360 Browser. Skipping await for future calls.');
            IconsApi.setIconTimeoutDetected = true;
        }
        clearTimeout(timeoutId);
    }

    /**
     * Picks the icon variant based on the current extension state.
     * Fallbacks to default icon variants if the promo icons are not set.
     *
     * Order of priority:
     * 1. Loading icon if the extension is not initialized yet.
     * 2. Warning icon if MV3 filter limits are exceeded.
     * 3. Promo notification icons if any.
     * 4. Update available icon if an update is available (MV3 only).
     * 5. Enabled/Disabled icon based on the isDisabled parameter.
     *
     * @param isDisabled Is website allowlisted or app filtering disabled.
     *
     * @returns Icon variant to display.
     */
    private async pickIconVariant(isDisabled = false): Promise<IconData> {
        if (!appContext.get(AppContextKey.IsInit)) {
            return defaultIconVariants.loading;
        }

        const isMv3LimitsExceeded = __IS_MV3__
            ? await RulesLimitsService.areFilterLimitsExceeded()
            : false;

        if (isMv3LimitsExceeded) {
            return defaultIconVariants.warning;
        }

        // prioritize promo icons over the update-available icon,
        // i.e. PromoNotification is rendered on top of other notifications as well
        if (this.promoIcons) {
            return isDisabled
                ? this.promoIcons.disabled
                : this.promoIcons.enabled;
        }

        // Check if update icon should be shown based on delay period
        if (__IS_MV3__ && ExtensionUpdateService.shouldShowUpdateIcon()) {
            return defaultIconVariants.updateAvailable;
        }

        return isDisabled
            ? defaultIconVariants.disabled
            : defaultIconVariants.enabled;
    }

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

export const iconsApi = new IconsApi();
