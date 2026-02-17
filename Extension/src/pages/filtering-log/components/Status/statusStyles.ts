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

import { StatusMode } from '../../filteringLogStatus';

/**
 * Color variants for status display.
 */
export enum StatusColor {
    Gray = 'gray',
    Orange = 'orange',
    Red = 'red',
    Green = 'green',
}

/**
 * Maps status mode to corresponding color.
 */
export const colorMap: Record<StatusMode, StatusColor> = {
    [StatusMode.Regular]: StatusColor.Gray,
    [StatusMode.Modified]: StatusColor.Orange,
    [StatusMode.Blocked]: StatusColor.Red,
    [StatusMode.Allowed]: StatusColor.Green,
    [StatusMode.AllowedStealth]: StatusColor.Green,
};

/**
 * Returns CSS class name for status item.
 *
 * @param color Status color.
 *
 * @returns CSS class name string.
 */
export const getItemClassName = (color: StatusColor | undefined): string => {
    return color
        ? `status__item status__item--${color}`
        : 'status__item';
};

/**
 * Returns CSS class names for status badge.
 *
 * @param color Status color.
 *
 * @returns CSS class name string.
 */
export const getBadgeClassNames = (color: StatusColor | undefined): string => {
    return color
        ? `status__badge status__badge--${color}`
        : 'status__badge';
};
