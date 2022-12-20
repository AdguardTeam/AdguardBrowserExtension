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

import { StatusMode } from '../../filteringLogStatus';

/**
 * @typedef {object} StatusColor
 * @property {string} GRAY
 * @property {string} ORANGE
 * @property {string} RED
 * @property {string} GREEN
 */
export const StatusColor = {
    GRAY: 'gray',
    ORANGE: 'orange',
    RED: 'red',
    GREEN: 'green',
};

export const colorMap = {
    [StatusMode.REGULAR]: StatusColor.GRAY,
    [StatusMode.MODIFIED]: StatusColor.ORANGE,
    [StatusMode.BLOCKED]: StatusColor.RED,
    [StatusMode.ALLOWED]: StatusColor.GREEN,
};

export const getItemClassName = (color) => {
    return color
        ? `status__item status__item--${color}`
        : 'status__item';
};

export const getBadgeClassNames = (color) => {
    return color
        ? `status__badge status__badge--${color}`
        : 'status__badge';
};
