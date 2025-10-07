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

import { ExtensionUpdateService } from 'extension-update-service';

import { RulesLimitsService } from 'rules-limits-service';

import { ExtensionUpdateFSMEvent } from '../../../../common/constants';
import { tabsApi as tsWebExtTabsApi } from '../../../tswebextension';
import { type GetTabInfoForPopupMessage, MessageType } from '../../../../common/messages';
import { messageHandler } from '../../../message-handler';
import { SettingOption } from '../../../schema';
import { UserAgent } from '../../../../common/user-agent';
import { settingsStorage } from '../../../storages';
import {
    FramesApi,
    PageStatsApi,
    SettingsApi,
    promoNotificationApi,
    UserRulesApi,
} from '../../../api';
import { extensionUpdateActor } from '../../extension-update/extension-update-machine';

import { PopupServiceCommon, type GetTabInfoForPopupResponseCommon } from './popup-common';

/**
 * Tab info for the popup.
 */
export type GetTabInfoForPopupResponse = GetTabInfoForPopupResponseCommon & {
    options: GetTabInfoForPopupResponseCommon['options'] & {
        /**
         * Whether the rule limits are exceeded
         * and browser changed the list of enabled filters.
         */
        areFilterLimitsExceeded: boolean;

        /**
         * Whether the extension update is available after the checking.
         */
        isExtensionUpdateAvailable: boolean;

        /**
         * Whether the extension was reloaded after update.
         */
        isExtensionReloadedOnUpdate: boolean;

        /**
         * Whether the extension update was successful.
         */
        isSuccessfulExtensionUpdate: boolean;
    };
};

/**
 * Handles work with popups.
 */
export class PopupService extends PopupServiceCommon {
    /**
     * Creates listeners for getter of tab info and for popup.
     */
    static init(): void {
        PopupServiceCommon.init();
        messageHandler.addListener(MessageType.GetTabInfoForPopup, PopupService.getTabInfoForPopup);
    }

    /**
     * Returns tab info: frame info, stats form {@link PageStatsApi},
     * current settings and some other options.
     *
     * @param message Message of type {@link GetTabInfoForPopupMessage}.
     * @param message.data Contains tab id.
     *
     * @returns If found - tab context {@link GetTabInfoForPopupResponseCommon},
     * or undefined if not found.
     */
    static async getTabInfoForPopup(
        { data }: GetTabInfoForPopupMessage,
    ): Promise<GetTabInfoForPopupResponse | undefined> {
        const { tabId } = data;

        const tabContext = tsWebExtTabsApi.getTabContext(tabId);

        const isExtensionUpdateAvailable = ExtensionUpdateService.getIsUpdateAvailable();
        const manualExtensionUpdateData = await ExtensionUpdateService.getManualExtensionUpdateData();
        const isExtensionReloadedOnUpdate = manualExtensionUpdateData !== null;
        const isSuccessfulExtensionUpdate = manualExtensionUpdateData?.isOk || false;

        extensionUpdateActor.send({
            type: ExtensionUpdateFSMEvent.Init,
            isReloadedOnUpdate: isExtensionReloadedOnUpdate,
            isUpdateAvailable: isExtensionUpdateAvailable,
        });

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
                    hasUserRulesToReset: await UserRulesApi.hasRulesForUrl(tabContext.info.url),

                    areFilterLimitsExceeded: await RulesLimitsService.areFilterLimitsExceeded(),
                    isExtensionUpdateAvailable,
                    isExtensionReloadedOnUpdate,
                    isSuccessfulExtensionUpdate,
                },
            };
        }
    }
}
