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

import React, { forwardRef } from 'react';

import { TableHeader } from './TableHeader';
import { ITEM_HEIGHT_PX } from './constants';

/**
 * Inner wrapper for virtualized table with header.
 */
export const TableInnerWrapper = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    (props, ref) => {
        const { children, ...rest } = props;
        return (
            <div ref={ref} {...rest}>
                <TableHeader
                    style={{
                        top: 0, left: 0, width: '100%', height: ITEM_HEIGHT_PX,
                    }}
                />

                {children}
            </div>
        );
    },
);
