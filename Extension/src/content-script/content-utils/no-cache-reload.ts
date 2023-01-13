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

/**
 * Reloads current page with empty cache
 *
 * Called while fallback tab reloading vai content script
 */
// TODO:
// Fallback tab reload via content script was implemented in previous version.
// First, check if following logic is not legacy.
// If it's actual, move it in tswebextension, else remove.
export function noCacheReload() {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', document.location.href);
    xhr.setRequestHeader('Pragma', 'no-cache');
    xhr.setRequestHeader('Expires', '-1');
    xhr.setRequestHeader('Expires', 'no-cache');

    const reload = () => {
        document.location.reload();
    };

    xhr.onload = reload;
    xhr.onerror = reload;
    xhr.onabort = reload;
    xhr.send(null);
}
