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

import { logger } from '../common/logger';

import { messenger } from './services/messenger';

export class PostInstall {
    private static nanobar = new Nanobar({
        classname: 'adg-progress-bar',
    });

    private static checkRequestTimeoutMs = 500;

    private static openThankyouPageTimeoutMs = 1000;

    public static init(): void {
        document.addEventListener('DOMContentLoaded', PostInstall.onDOMContentLoaded);
    }

    private static onDOMContentLoaded(): void {
        PostInstall.nanobar.go(15);

        PostInstall.checkRequestFilterReady();
    }

    private static async checkRequestFilterReady(): Promise<void> {
        try {
            const ready = await messenger.checkRequestFilterReady();

            if (ready) {
                PostInstall.onEngineLoaded();
            } else {
                setTimeout(PostInstall.checkRequestFilterReady, PostInstall.checkRequestTimeoutMs);
            }
        } catch (e) {
            logger.error('[ext.PostInstall.checkRequestFilterReady]: failed to check request filter ready', e);
            // retry request, if message handler is not ready
            setTimeout(PostInstall.checkRequestFilterReady, PostInstall.checkRequestTimeoutMs);
        }
    }

    private static onEngineLoaded(): void {
        PostInstall.nanobar.go(100);
        setTimeout(() => {
            if (window) {
                messenger.openThankYouPage();
            }
        }, PostInstall.openThankyouPageTimeoutMs);
    }
}
