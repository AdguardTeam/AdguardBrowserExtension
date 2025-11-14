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

import {
    type ChangeApplicationFilteringPausedMessage,
    MessageType,
    type GetTabInfoForPopupMessage,
} from '../../../../common/messages';
import { messageHandler } from '../../../message-handler';
import { SettingOption } from '../../../schema';
import {
    appContext,
    AppContextKey,
    settingsStorage,
    type PromoNotification,
} from '../../../storages';
import {
    type FrameData,
    SettingsApi,
    type GetStatisticsDataResponse,
    type SettingsData,
    FramesApi,
    PageStatsApi,
    promoNotificationApi,
    UserRulesApi,
} from '../../../api';
import { tabsApi as tsWebExtTabsApi } from '../../../tswebextension';
import { UserAgent } from '../../../../common/user-agent';

/**
 * Tab info for the popup.
 */
export type GetTabInfoForPopupResponse = {
    /**
     * Info about main frame for the tab.
     */
    frameInfo: FrameData;

    /**
     * Page statistics.
     *
     * Related to all visited pages, not just the current tab.
     */
    stats: GetStatisticsDataResponse;

    /**
     * Current settings.
     */
    settings: SettingsData;

    /**
     * Various options.
     */
    options: {
        // TODO: consider removing if not used
        /**
         * Whether stats are supported.
         */
        showStatsSupported: boolean;

        // TODO: consider removing if not used
        /**
         * Whether the browser is Firefox.
         */
        isFirefoxBrowser: boolean;

        /**
         * Whether to show info about full version,
         * i.e. a link to the page where the extension and apps are compared.
         */
        showInfoAboutFullVersion: boolean;

        // TODO: consider removing if not used
        /**
         * Whether the OS is macOS.
         */
        isMacOs: boolean;

        /**
         * Whether the browser is Edge.
         */
        isEdgeBrowser: boolean;

        /**
         * Promo notification.
         */
        notification: PromoNotification | null;

        // TODO: consider removing if not used
        /**
         * Whether to disable the "Show Adguard" promo info.
         */
        isDisableShowAdguardPromoInfo: boolean;

        /**
         * Whether the user rules for the page present.
         * If true, they can be reset.
         */
        hasUserRulesToReset: boolean;
    };
};

/**
 * Handles work with popups.
 */
export abstract class PopupServiceCommon {
    /**
     * Creates listeners for getter of tab info and for popup.
     */
    static init(): void {
        messageHandler.addListener(MessageType.GetIsAppInitialized, PopupServiceCommon.getIsAppInitialized);
        messageHandler.addListener(MessageType.GetTabInfoForPopup, PopupServiceCommon.getTabInfoForPopup);
        messageHandler.addListener(
            MessageType.ChangeApplicationFilteringPaused,
            PopupServiceCommon.onChangeFilteringPaused,
        );
    }

    /**
     * Returns the state of the application initialization.
     *
     * @returns True if the application is initialized, false otherwise.
     */
    static getIsAppInitialized(): boolean {
        return appContext.get(AppContextKey.IsInit);
    }

    /**
     * Returns tab info: frame info, stats form {@link PageStatsApi},
     * current settings and some other options.
     *
     * @param message Message of type {@link GetTabInfoForPopupMessage}.
     * @param message.data Contains tab id.
     *
     * @returns If found - tab context {@link GetTabInfoForPopupResponse},
     * or undefined if not found.
     */
    static async getTabInfoForPopup(
        { data }: GetTabInfoForPopupMessage,
    ): Promise<GetTabInfoForPopupResponse | undefined> {
        const { tabId } = data;

        const tabContext = tsWebExtTabsApi.getTabContext(tabId);

        if (!tabContext) {
            return;
        }

        return {
            frameInfo: FramesApi.getMainFrameData(tabContext),
            stats: PageStatsApi.getStatisticsData(),
            settings: SettingsApi.getData(),
            options: {
                showStatsSupported: true,
                isFirefoxBrowser: UserAgent.isFirefox,
                showInfoAboutFullVersion: !settingsStorage.get(SettingOption.DisableShowAdguardPromoInfo),
                isMacOs: UserAgent.isMacOs,
                isEdgeBrowser: UserAgent.isEdge || UserAgent.isEdgeChromium,
                notification: await promoNotificationApi.getCurrentNotification(),
                isDisableShowAdguardPromoInfo: settingsStorage.get(SettingOption.DisableShowAdguardPromoInfo),
                hasUserRulesToReset: await UserRulesApi.hasRulesForUrl(tabContext.info.url),
            },
        };
    }

    /**
     * Called when protection pausing or resuming is requested.
     *
     * @param message Message of {@link ChangeApplicationFilteringPausedMessage}.
     * @param message.data State of protection.
     */
    private static async onChangeFilteringPaused({ data }: ChangeApplicationFilteringPausedMessage): Promise<void> {
        const { state } = data;

        await SettingsApi.setSetting(SettingOption.DisableFiltering, state);
    }
}
