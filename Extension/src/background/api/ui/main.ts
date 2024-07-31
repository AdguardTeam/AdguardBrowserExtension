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
import { throttle } from 'lodash-es';

import { tabsApi as tsWebExtTabsApi } from '@adguard/tswebextension';
import type { TabContext } from '@adguard/tswebextension';

import { MessageType, sendMessage } from '../../../common/messages';
import { TabsApi } from '../../../common/api/extension';

import { ContextMenuApi } from './context-menu';
import { FrameData, FramesApi } from './frames';
import { iconsApi } from './icons';

/**
 * The UI API provides a singleton to update the tab icon and the counters of
 * blocked requests on the tab.
 */
export class UiApi {
    /**
     * Throttle to update tab's information.
     */
    private static readonly THROTTLE_DELAY_MS = 100;

    /**
     * Initializes UI service.
     */
    static async init(): Promise<void> {
        await iconsApi.init();
    }

    /**
     * Updates the tab action icon and the blocked requests counter
     * on the provided tab with throttle {@link UiApi.THROTTLE_DELAY_MS}.
     *
     * @param tabId Tab's id.
     * @param frameData The {@link FrameData} object.
     */
    private static throttledUpdateAction = throttle((tabId: number, frameData: FrameData): void => {
        iconsApi.updateTabAction(tabId, frameData);
        UiApi.broadcastTotalBlockedMessage(frameData);
    }, UiApi.THROTTLE_DELAY_MS);

    /**
     * Updates the UI on the provided tab.
     *
     * @param tabContext Updated {@link TabContext}.
     */
    public static async update(tabContext: TabContext): Promise<void> {
        const frameData = FramesApi.getMainFrameData(tabContext);

        await ContextMenuApi.throttledUpdateMenu(frameData);

        const tabId = tabContext.info.id;
        UiApi.throttledUpdateAction(tabId, frameData);
    }

    /**
     * Handles promo notification being viewed.
     */
    public static async dismissPromo(): Promise<void> {
        let frameData: FrameData | undefined;

        const tab = await TabsApi.getActive();
        const tabId = tab?.id;
        if (tabId) {
            const tabContext = tsWebExtTabsApi.getTabContext(tabId);
            if (tabContext) {
                frameData = FramesApi.getMainFrameData(tabContext);
            }
        }

        await iconsApi.dismissPromoIcon(tabId, frameData);
    }

    /**
     * Sends message with updated counters of blocked requests.
     *
     * @param frameData Broadcasted {@link FrameData}.
     * @param frameData.totalBlocked Total count of blocked requests.
     * @param frameData.totalBlockedTab Number of blocked requests.
     */
    private static async broadcastTotalBlockedMessage({ totalBlocked, totalBlockedTab }: FrameData): Promise<void> {
        try {
            await sendMessage({
                type: MessageType.UpdateTotalBlocked,
                data: {
                    totalBlocked,
                    totalBlockedTab,
                },
            });
        } catch (e) {
            // do nothing
        }
    }
}
