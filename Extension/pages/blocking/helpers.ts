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

import { AppearanceTheme } from '../../src/common/settings';

declare global {
    interface Window {
        themeManager: {
            switchTheme: (theme: BlockingPagesSupportedTheme) => void;
        };
    }
}

/**
 * Supported themes for blocking pages.
 *
 * Check them in the imported-script.js file.
 */
const enum BlockingPagesSupportedTheme {
    Auto = 'auto',
    Light = 'light',
    Dark = 'dark',
}

/**
 * Map of AppearanceTheme to BlockingPagesSupportedTheme.
 */
const themeMap = new Map<AppearanceTheme, BlockingPagesSupportedTheme>([
    [AppearanceTheme.System, BlockingPagesSupportedTheme.Auto],
    [AppearanceTheme.Light, BlockingPagesSupportedTheme.Light],
    [AppearanceTheme.Dark, BlockingPagesSupportedTheme.Dark],
]);

/**
 * Updates the theme on the blocking page.
 *
 * @param theme Extension theme.
 */
export const updateTheme = (theme: AppearanceTheme): void => {
    const blockingPageTheme = themeMap.get(theme) ?? BlockingPagesSupportedTheme.Auto;

    window.themeManager.switchTheme(blockingPageTheme);
};

/**
 * Parses 'window.location.search' value passed as `locationSearch`.
 *
 * @param locationSearch Value of `window.location.search` to parse.
 *
 * @returns Object with parsed search parameters.
 */
export const getParams = (locationSearch: string): Record<string, string> => {
    const urlSearchParams = new URLSearchParams(locationSearch);
    return Object.fromEntries(urlSearchParams.entries());
};

/**
 * Finds element by id on the page.
 *
 * @param elementId Id of the element to find.
 *
 * @returns Found element.
 *
 * @throws Error if element with id `elementId` is not found.
 */
export const getElementById = (elementId: string): HTMLElement => {
    const element = document.getElementById(elementId);

    if (!element) {
        throw new Error(`Element with id "${elementId}" not found`);
    }

    return element;
};

/**
 * Updates the text content of an element with the given ID.
 *
 * @param elementId The ID of the element to update.
 * @param text The text to set in the element.
 */
export const updatePlaceholder = (elementId: string, text: string): void => {
    const element = getElementById(elementId);

    element.textContent = text;
};

/**
 * Adds "fallback" listener to handle "Go back" button click.
 *
 * In Firefox imported-script.js may not handle "Go back" button click properly
 * because of restriction: "Scripts may only close windows that were opened by a script".
 * That's why we need to ensure that "Go back" button is handled by the page itself.
 *
 * @param isFirefox Whether the current browser is Firefox.
 * @param id The ID of the "Go back" button.
 */
export const addGoBackButtonFallbackListener = (isFirefox: boolean, id: string): void => {
    if (!isFirefox) {
        return;
    }

    const backBtn = getElementById(id);

    backBtn.addEventListener('click', () => {
        window.history.back();
    });
};
