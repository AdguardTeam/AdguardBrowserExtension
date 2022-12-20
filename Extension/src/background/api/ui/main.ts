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
import { BACKGROUND_TAB_ID, TabContext } from '@adguard/tswebextension';
import { debounce } from 'lodash';
import { MessageType, sendMessage } from '../../../common/messages';

import { ContextMenuApi } from './context-menu';
import { FrameData, FramesApi } from './frames';
import { IconsApi } from './icons';

export class UiApi {
    public static async update(tabContext: TabContext): Promise<void> {
        const tabId = tabContext?.info?.id;

        if (!tabId || tabId === BACKGROUND_TAB_ID) {
            return;
        }

        const frameData = FramesApi.getMainFrameData(tabContext);

        await ContextMenuApi.updateMenu(frameData);

        debounce(() => {
            IconsApi.updateTabIcon(tabId, frameData);
            UiApi.broadcastTotalBlockedMessage(frameData);
        }, 100)();
    }

    private static async broadcastTotalBlockedMessage({ totalBlocked, totalBlockedTab }: FrameData): Promise<void> {
        try {
            sendMessage<MessageType.UpdateTotalBlocked>({
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
