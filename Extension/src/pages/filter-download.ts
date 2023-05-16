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

// @ts-ignore
import Nanobar from 'nanobar';

import { MessageType } from '../common/messages';
import { Log } from '../common/log';

import { messenger } from './services/messenger';

export class FilterDownload {
    private static nanobar = new Nanobar({
        classname: 'adg-progress-bar',
    });

    private static checkRequestTimeoutMs = 500;

    private static openThankyouPageTimeoutMs = 1000;

    public static init(): void {
        document.addEventListener('DOMContentLoaded', FilterDownload.onDOMContentLoaded);
    }

    private static onDOMContentLoaded(): void {
        FilterDownload.nanobar.go(15);

        FilterDownload.checkRequestFilterReady();
    }

    private static async checkRequestFilterReady(): Promise<void> {
        try {
            const ready = await messenger.sendMessage(MessageType.CheckRequestFilterReady);

            if (ready) {
                FilterDownload.onEngineLoaded();
            } else {
                setTimeout(FilterDownload.checkRequestFilterReady, FilterDownload.checkRequestTimeoutMs);
            }
        } catch (e) {
            Log.error(e);
            // retry request, if message handler is not ready
            setTimeout(FilterDownload.checkRequestFilterReady, FilterDownload.checkRequestTimeoutMs);
        }
    }

    private static onEngineLoaded(): void {
        FilterDownload.nanobar.go(100);
        setTimeout(() => {
            if (window) {
                messenger.sendMessage(MessageType.OpenThankyouPage);
            }
        }, FilterDownload.openThankyouPageTimeoutMs);
    }
}
