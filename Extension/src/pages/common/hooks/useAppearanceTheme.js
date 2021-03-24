import throttle from 'lodash/throttle';
import { useLayoutEffect } from 'react';

import { APPEARANCE_THEMES } from '../../constants';

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
            case APPEARANCE_THEMES.DARK: {
                document.documentElement.classList.add(DARK_THEME_CLASS);
                document.documentElement.classList.remove(LIGHT_THEME_CLASS);
                break;
            }
            case APPEARANCE_THEMES.LIGHT: {
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
