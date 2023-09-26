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
import browser from 'webextension-polyfill';

const uiLanguage = browser.i18n.getUILanguage();

// eslint-disable-next-line max-len
// TODO: Do something similar to https://github.com/AdguardTeam/AdGuardVPNExtension/blob/57bd6b2d33ff3400d51ac23b6b0aaf6966e8082c/src/common/i18n.ts
export const i18n = {
    getMessage: browser.i18n.getMessage,
    getUILanguage: () => {
        return uiLanguage.substring(0, 2);
    },
    getBaseMessage: (key: string): string => key,
    // TODO: export 'Locales' type from '@adguard/translate'
    getBaseUILanguage: (): string => 'en',
};
