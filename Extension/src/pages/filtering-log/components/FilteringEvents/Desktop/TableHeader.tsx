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

import React, { useContext, type CSSProperties } from 'react';

import { translator } from '../../../../../common/translators/translator';

import { ColumnsContext } from './ColumnsContext';

/**
 * Table header component with column headers and resizers.
 *
 * @param props Table header props.
 * @param props.style CSS properties for header positioning.
 *
 * @returns Table header component.
 */
export const TableHeader = ({ style }: {
    style: CSSProperties;
}) => {
    const { columns, isLogEventsEmpty } = useContext(ColumnsContext);

    /**
     * WAI ARIA attributes are hidden if the table is empty, this needed
     * to properly announce FilteringEventsEmpty component, otherwise
     * screen readers will ignore this block.
     */
    return (
        <div
            role="row"
            className="thead"
            style={style}
            aria-hidden={isLogEventsEmpty}
            // Set row index explicitly for screen readers, because table
            // is virtualized and not all of the rows are rendered at the same time.
            // Header row is always first row in the table (1-based index).
            aria-rowindex={isLogEventsEmpty ? undefined : 1}
        >
            <div className="tr">
                {
                    columns.map((column) => (
                        <div
                            role="columnheader"
                            className="th"
                            key={column.id}
                            style={{ width: column.getWidth() }}
                        >
                            {column.Header}
                            <div
                                aria-hidden="true"
                                className="resizer"
                                key={column.id}
                                style={{ cursor: 'col-resize' }}
                                {...column.getResizerProps()}
                            />
                        </div>
                    ))
                }
                {/* This column is available only for screen readers to notify
                    users that they can open details of this log with keyboard. */}
                <div role="columnheader" className="sr-only">
                    {translator.getMessage('filtering_table_action')}
                </div>
            </div>
        </div>
    );
};
