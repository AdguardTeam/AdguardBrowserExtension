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
import { MessageType } from '../../common/messages';
import { messageHandler } from './message-handler';
import { Popups } from './popups';
// TODO: Check if following message is deprecated.
// import { noCacheReload } from './no-cache-reload';

export class ContentUtils {
    public static init(): void {
        if (window !== window.top) {
            return;
        }

        if (!(document instanceof Document)) {
            return;
        }

        messageHandler.init();

        messageHandler.addListener(MessageType.ShowAlertPopup, Popups.showAlertPopup);
        messageHandler.addListener(MessageType.ShowVersionUpdatedPopup, Popups.showVersionUpdatedPopup);

        // TODO:
        // Fallback tab reload via content script was implemented in previous version.
        // First, check if following logic is not legacy.
        // If it's actual, move it in tswebextension, else remove.
        //
        // messageHandler.addListener(MessageType.NoCacheReload, noCacheReload);
        // messageHandler.addListener(MessageType.UpdateTabUrl, ({ data: { url }}) => {
        //     window.location = url;
        // });
    }
}
