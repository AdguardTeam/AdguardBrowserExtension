/**
 * Copyright (c) 2015-2025 Adguard Software Ltd.
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

import { translator } from '../../../src/common/translators/translator';

const LOADER_ID = 'adg-loader-overlay';

/**
 * Creates a loader overlay element.
 *
 * @returns The created loader element
 */
const createLoader = (): HTMLElement => {
    // Create main loader container with class 'loader'
    const loader = document.createElement('div');
    loader.id = LOADER_ID;
    loader.className = 'loader';
    loader.style.cursor = 'not-allowed';
    loader.style.zIndex = '9999';

    // The loader will automatically use CSS variables that respond to theme changes

    // Create background div with class 'loader__background'
    const background = document.createElement('div');
    background.className = 'loader__background';
    background.style.position = 'fixed';
    background.style.top = '0';
    background.style.left = '0';
    background.style.width = '100%';
    background.style.height = '100%';
    background.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    background.style.display = 'flex';
    background.style.justifyContent = 'center';
    background.style.alignItems = 'center';

    // Create container div with class 'loader__container'
    const container = document.createElement('div');
    container.className = 'loader__container';
    // Use CSS variables for theme-aware colors - make sure it's not transparent
    container.style.backgroundColor = 'var(--default-page-background)';
    container.style.height = '88px';
    container.style.minWidth = '243px';
    container.style.borderRadius = '8px';
    // Ensure container is not transparent
    container.style.opacity = '1';

    // Create content div with class 'loader__content'
    const content = document.createElement('div');
    content.className = 'loader__content';
    content.style.display = 'flex';
    content.style.justifyContent = 'center';
    content.style.alignItems = 'center';
    content.style.padding = '32px';

    const spinner = document.createElement('div');
    spinner.className = 'loader__spinner';
    spinner.style.width = '20px';
    spinner.style.height = '20px';
    spinner.style.border = '1px solid var(--product-primary-50)';
    spinner.style.borderRadius = '50%';
    spinner.style.borderTopColor = 'transparent';
    spinner.style.animation = 'adg-spin 1s linear infinite';

    const text = document.createElement('div');
    text.className = 'loader__text';
    text.style.fontSize = '16px';
    text.style.lineHeight = '21px';
    text.style.color = 'var(--default-labels)';
    text.style.paddingLeft = '16px';
    text.textContent = translator.getMessage('options_loader_applying_changes');

    if (!document.getElementById('adg-loader-keyframes')) {
        const style = document.createElement('style');
        style.id = 'adg-loader-keyframes';
        style.textContent = `
            @keyframes adg-spin {
                to { transform: rotate(360deg); }
            }`;
        document.head.appendChild(style);
    }

    // Assemble the loader structure
    content.appendChild(spinner);
    content.appendChild(text);
    container.appendChild(content);
    background.appendChild(container);
    loader.appendChild(background);
    document.body.appendChild(loader);

    return loader;
};

/**
 * Shows or hides a loader overlay while waiting for a response.
 * This implementation matches the style of the Loader component from
 * src/pages/common/components/Loader/Loader.tsx and respects the current theme.
 *
 * @param show Whether to show the loader.
 */
export const toggleLoader = (show: boolean): void => {
    // Check if loader already exists
    let loader = document.getElementById(LOADER_ID);

    // If loader should be hidden and it exists, hide it and return
    if (!show && loader) {
        loader.style.display = 'none';
        return;
    }

    // If loader should be shown and it doesn't exist, create it
    if (!loader) {
        loader = createLoader();
    } else {
        // Show existing loader
        loader.style.display = 'block';
    }
};
