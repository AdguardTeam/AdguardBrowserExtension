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

import throttle from 'lodash/throttle';
import { useLayoutEffect } from 'react';

import { AppearanceTheme } from '../../../common/settings';

export const useAppearanceTheme = (appearanceTheme) => {
    useLayoutEffect(() => {
        const STORAGE_KEY = 'appearance_theme';
        const DARK_THEME_CLASS = 'dark-mode';
        const LIGHT_THEME_CLASS = 'light-mode';
        const SET_TO_STORAGE_TIMEOUT = 500;

        const throttledSetToStorage = throttle((mode) => {
            localStorage.setItem(STORAGE_KEY, mode);
        }, SET_TO_STORAGE_TIMEOUT);

        let theme = appearanceTheme;
        if (!theme) {
            theme = localStorage.getItem(STORAGE_KEY);
        } else {
            throttledSetToStorage(theme);
        }

        switch (theme) {
            case AppearanceTheme.Dark: {
                document.documentElement.classList.add(DARK_THEME_CLASS);
                document.documentElement.classList.remove(LIGHT_THEME_CLASS);
                break;
            }
            case AppearanceTheme.Light: {
                document.documentElement.classList.add(LIGHT_THEME_CLASS);
                document.documentElement.classList.remove(DARK_THEME_CLASS);
                break;
            }
            default: {
                document.documentElement.classList.remove(DARK_THEME_CLASS);
                document.documentElement.classList.remove(LIGHT_THEME_CLASS);
            }
        }
    }, [appearanceTheme]);
};
