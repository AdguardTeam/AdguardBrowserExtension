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
import { tabsApi as tsWebExtTabsApi, isHttpOrWsRequest } from '../../tswebextension';
import {
    ChangeApplicationFilteringDisabledMessage,
    GetTabInfoForPopupMessage,
    MessageType,
} from '../../../common/messages';
import { messageHandler } from '../../message-handler';
import { SettingOption } from '../../schema';
import { UserAgent } from '../../../common/user-agent';
import { settingsStorage, Notification } from '../../storages';
import {
    FrameData,
    FramesApi,
    PageStatsApi,
    SettingsApi,
    promoNotificationApi,
    GetStatisticsDataResponse,
    SettingsData,
    PartialTabContext,
} from '../../api';

export type GetTabInfoForPopupResponse = {
    frameInfo: FrameData,
    stats: GetStatisticsDataResponse,
    settings: SettingsData,
    options: {
        showStatsSupported: boolean,
        isFirefoxBrowser: boolean
        showInfoAboutFullVersion: boolean
        isMacOs: boolean,
        isEdgeBrowser: boolean,
        notification: Notification | null,
        isDisableShowAdguardPromoInfo: boolean,
        hasCustomRulesToReset: boolean,
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
        messageHandler.addListener(MessageType.GetTabInfoForPopup, PopupService.getTabInfoForPopup);
        messageHandler.addListener(
            MessageType.ChangeApplicationFilteringDisabled,
            PopupService.onChangeFilteringDisable,
        );
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
        const { tabId, tabUrl } = data;

        let tabContext: PartialTabContext | undefined = tsWebExtTabsApi.getTabContext(tabId);

        // FIXME: Tmp solution for internal tabs until AG-32609 is done.
        if (!isHttpOrWsRequest(tabUrl)) {
            tabContext = {
                info: { url: tabUrl },
                frames: new Map(),
                blockedRequestCount: 0,
                mainFrameRule: null,
            };
        }

        if (tabContext) {
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
                    hasCustomRulesToReset: false,
                    // hasCustomRulesToReset: await UserRulesApi.hasRulesForUrl(tabContext.info.url),
                },
            };
        }
    }

    /**
     * Called when protection enabling or disabling is requested.
     *
     * @param message Message of {@link ChangeApplicationFilteringDisabledMessage}.
     * @param message.data State of protection.
     */
    private static async onChangeFilteringDisable({ data }: ChangeApplicationFilteringDisabledMessage): Promise<void> {
        const { state } = data;

        await SettingsApi.setSetting(SettingOption.DisableFiltering, state);
    }
}
