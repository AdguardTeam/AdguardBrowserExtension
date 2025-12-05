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

/**
 * This script is injected at the top of the page
 * to display the desired color theme before the main bundle is loaded.
 */
(function () {
    const urlSearchParams = new URLSearchParams(window.location.search);
    const theme = urlSearchParams.get('theme');
    switch (theme) {
        // the color changes through the selector so that it could be rewritten by css from the main bundle
        case 'dark':
            document.body.classList.add('body_dark');
            break;
        case 'light':
            document.body.classList.add('body_light');
            break;
        // if theme parameter is missing or a system theme is selected,
        // the desired color is selected using the css media query
        case 'system':
        default:
            break;
    }
})();
