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
import { type ListChildComponentProps } from 'react-window';

import { Row } from './Row';

/**
 * Virtualized row wrapper component.
 *
 * @param props List child component props from react-window.
 * @param props.index Row index.
 * @param props.style Row style.
 * @param props.data Row data containing events, columns, and handleRowClick.
 *
 * @returns Virtualized row component.
 */
export const VirtualizedRow = ({
    index,
    style,
    data,
}: ListChildComponentProps) => {
    const { events, columns, handleRowClick } = data;
    const event = events[index];

    return (
        <Row
            index={index}
            event={event}
            columns={columns}
            onClick={handleRowClick}
            style={style}
        />
    );
};
