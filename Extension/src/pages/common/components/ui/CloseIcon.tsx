/**
 * Copyright (c) 2015-2026 Adguard Software Ltd.
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

import React from 'react';

import cn from 'classnames';

import { Icon } from './Icon';

/**
 * Unified close (×) icon used across the extension for dismiss buttons,
 * search clear buttons, and other close actions.
 *
 * Defaults to a 24×24 gray icon. Pass an optional {@link className} to
 * override sizing or color (e.g. {@code color: inherit} to let a parent
 * button control the icon tint).
 *
 * @param props Component props.
 * @param props.className Optional additional CSS class for theming.
 *
 * @returns An icon hidden from screen readers.
 */
export const CloseIcon = ({ className }: { className?: string }) => (
    <Icon
        id="#cross"
        className={cn('icon--24', !className && 'icon--gray-default', className)}
        aria-hidden="true"
    />
);
