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
import { debounce } from 'lodash-es';

import type { TabContext } from '../../tswebextension';
import { MessageType, sendMessage } from '../../../common/messages';

import { ContextMenuApi } from './context-menu';
import { FrameData, FramesApi } from './frames';
import { IconsApi } from './icons';

/**
 * The UI API provides a singleton to update the tab icon and the counters of
 * blocked requests on the tab.
 */
export class UiApi {
    /**
     * Throttle to update tab's information.
     */
    private static readonly UPDATE_THROTTLE_MS = 100;

    /**
     * Update tab icon and total blocked count with throttle.
     */
    private static debouncedUpdate = debounce((tabId: number, frameData: FrameData) => {
        IconsApi.updateTabIcon(tabId, frameData);
        UiApi.broadcastTotalBlockedMessage(frameData);
    }, UiApi.UPDATE_THROTTLE_MS);

    /**
     * Updates the tab icon and the blocked requests counter on the provided tab
     * with debounce {@link UiApi.UPDATE_THROTTLE_MS}.
     *
     * @param tabContext Updated {@link TabContext}.
     */
    public static async update(tabContext: TabContext): Promise<void> {
        const tabId = tabContext.info.id;

        const frameData = FramesApi.getMainFrameData(tabContext);

        await ContextMenuApi.throttledUpdateMenu(frameData);

        UiApi.debouncedUpdate(tabId, frameData);
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
