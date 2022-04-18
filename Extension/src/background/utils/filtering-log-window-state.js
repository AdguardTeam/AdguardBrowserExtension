/**
 * This file is part of Adguard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * Adguard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Adguard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Adguard Browser Extension. If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * Object that manages filtering log size and position.
 * @constructor
 */
export const filteringLogWindowState = (function () {
    const FILTERING_LOG_WINDOW_STATE = 'filtering-log-window-state';

    const setState = (windowState) => {
        if (!windowState) {
            return;
        }
        localStorage.setItem(FILTERING_LOG_WINDOW_STATE, JSON.stringify(windowState));
    };

    const getState = () => {
        const windowState = localStorage.getItem(FILTERING_LOG_WINDOW_STATE);
        return JSON.parse(windowState);
    };

    return {
        setState,
        getState,
    };
})();
