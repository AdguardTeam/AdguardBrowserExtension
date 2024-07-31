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
import { RulesLimitsService } from 'rules-limits-service';

import { tabsApi as tsWebExtTabsApi } from '../../tswebextension';
import {
    ChangeApplicationFilteringPausedMessage,
    GetTabInfoForPopupMessage,
    MessageType,
} from '../../../common/messages';
import { messageHandler } from '../../message-handler';
import { SettingOption } from '../../schema';
import { UserAgent } from '../../../common/user-agent';
import {
    appContext,
    AppContextKey,
    settingsStorage,
    type PromoNotification,
} from '../../storages';
import {
    type FrameData,
    FramesApi,
    PageStatsApi,
    SettingsApi,
    promoNotificationApi,
    type GetStatisticsDataResponse,
    type SettingsData,
    UserRulesApi,
} from '../../api';

// TODO: describe all properties
/**
 * Tab info for the popup.
 */
export type GetTabInfoForPopupResponse = {
    frameInfo: FrameData,
    stats: GetStatisticsDataResponse,
    settings: SettingsData,
    areFilterLimitsExceeded: boolean,
    options: {
        showStatsSupported: boolean,
        isFirefoxBrowser: boolean
        showInfoAboutFullVersion: boolean
        isMacOs: boolean,
        isEdgeBrowser: boolean,
        notification: PromoNotification | null,
        isDisableShowAdguardPromoInfo: boolean,
        hasUserRulesToReset: boolean,
    },
};

/**
 * Handles work with popups.
 */
export class PopupService {
    /**
     * Creates listeners for getter of tab info and for popup.
     */
    static init(): void {
        messageHandler.addListener(MessageType.GetIsEngineStarted, PopupService.getIsAppInitialized);
        messageHandler.addListener(MessageType.GetTabInfoForPopup, PopupService.getTabInfoForPopup);
        messageHandler.addListener(
            MessageType.ChangeApplicationFilteringPaused,
            PopupService.onChangeFilteringPaused,
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

        if (tabContext) {
            return {
                frameInfo: FramesApi.getMainFrameData(tabContext),
                stats: PageStatsApi.getStatisticsData(),
                settings: SettingsApi.getData(),
                areFilterLimitsExceeded: __IS_MV3__
                    ? await RulesLimitsService.areFilterLimitsExceeded()
                    : false,
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
