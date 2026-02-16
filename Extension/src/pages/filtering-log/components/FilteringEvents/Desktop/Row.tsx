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

import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import cn from 'classnames';

import { type UIFilteringLogEvent } from '../../../../../background/api';
import { rootStore } from '../../../stores/RootStore';
import { translator } from '../../../../../common/translators/translator';
import { getRowClassName } from '../FilteringEvents';

import { type Column } from './types';
import { ITEM_HEIGHT_PX } from './constants';

type CellProps = {
    column: Column;
    event: UIFilteringLogEvent;
};

/**
 * Table cell component.
 *
 * @param props Cell props.
 * @param props.column Column configuration.
 * @param props.event Filtering log event data.
 *
 * @returns Table cell component.
 */
const Cell = ({ column, event }: CellProps): React.JSX.Element => {
    const { accessor } = column;
    const content = typeof accessor === 'function'
        ? accessor(event)
        : event[accessor];

    return (
        <div
            role="cell"
            className="td"
            style={{ width: column.getWidth() }}
        >
            {content}
        </div>
    );
};

type RowProps = {
    index: number;
    event: UIFilteringLogEvent;
    columns: Column[];
    onClick: (e: React.MouseEvent | React.KeyboardEvent) => void;
    style: React.CSSProperties;
};

/**
 * Table row component for filtering log event.
 *
 * @param props Row props.
 * @param props.index Row index in the list.
 * @param props.event Filtering log event data.
 * @param props.columns Column configurations.
 * @param props.onClick Click handler for the row.
 * @param props.style CSS properties for row positioning.
 *
 * @returns Table row component.
 */
export const Row = observer(({
    index,
    event,
    columns,
    onClick,
    style,
}: RowProps) => {
    const { logStore } = useContext(rootStore);

    const className = cn(
        'tr tr--tbody',
        { 'tr--active': event.eventId === logStore.selectedEvent?.eventId },
        getRowClassName(event),
    );

    return (
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/interactive-supports-focus
        <div
            role="row"
            style={{
                ...style,
                top: `${parseFloat(String(style.top ?? 0)) + ITEM_HEIGHT_PX}px`,
            }}
            id={event.eventId}
            onClick={onClick}
            className={className}
            // Set row index explicitly for screen readers, because table
            // is virtualized and not all of the rows are rendered at the same time.
            // Add 2 to index to include the header row and make it 1-based index.
            aria-rowindex={index + 2}
        >
            {columns.map((column) => (
                <Cell key={column.id} column={column} event={event} />
            ))}
            {/* This cell is available only for screen readers to notify
                users that they can open details of this log with keyboard. */}
            <div role="cell" className="sr-only">
                <button type="button" onClick={onClick}>
                    {translator.getMessage('filtering_table_open_details')}
                </button>
            </div>
        </div>
    );
});
