/**
 * Copyright (c) 2015-2026 Adguard Software Ltd.
 *
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

import { translator } from './translators/translator';
import { UserAgent } from './user-agent';
import {
    Forward,
    ForwardAction,
    ForwardFrom,
} from './forward';

/**
 * Returns the CTA button text and URL based on user's OS.
 *
 * @returns Object with `text` and `url` properties.
 */
export const getCtaByOs = (): { text: string; url: string } => {
    if (UserAgent.isMacOs) {
        return {
            text: translator.getMessage('options_desktop_app_promo_button_mac'),
            url: Forward.get({
                action: ForwardAction.DesktopAppPromoMac,
                from: ForwardFrom.Options,
            }),
        };
    }

    if (UserAgent.isWindows) {
        return {
            text: translator.getMessage('options_desktop_app_promo_button_windows'),
            url: Forward.get({
                action: ForwardAction.DesktopAppPromoWindows,
                from: ForwardFrom.Options,
            }),
        };
    }

    return {
        text: translator.getMessage('options_desktop_app_promo_button_linux'),
        url: Forward.get({
            action: ForwardAction.DesktopAppPromoLinux,
            from: ForwardFrom.Options,
        }),
    };
};
