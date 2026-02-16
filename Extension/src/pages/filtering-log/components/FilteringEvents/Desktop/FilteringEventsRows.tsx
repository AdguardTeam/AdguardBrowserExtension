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
import { observer } from 'mobx-react';
import { FixedSizeList } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

import { type UIFilteringLogEvent } from '../../../../../background/api';

import { ColumnsProvider } from './ColumnsContext';
import { VirtualizedRow } from './VirtualizedRow';
import { TableInnerWrapper } from './TableInnerWrapper';
import { type Column } from './types';
import { ITEM_HEIGHT_PX } from './constants';

type FilteringEventsRowsProps = {
    events: UIFilteringLogEvent[];
    columns: Column[];
    handleRowClick: (e: React.MouseEvent | React.KeyboardEvent) => void;
};

/**
 * Desktop virtualized table of filtering log events.
 *
 * @param props Component props.
 * @param props.events List of filtering log events to display.
 * @param props.columns Column configurations for the table.
 * @param props.handleRowClick Click handler for table rows.
 *
 * @returns Virtualized events table.
 */
export const FilteringEventsRows = observer(({
    events,
    columns,
    handleRowClick,
}: FilteringEventsRowsProps) => {
    const isLogEventsEmpty = events.length === 0;

    return (
        /**
         * FixedSizeList does not support passing props to innerElementType component.
         * We use React Context API to bypass this limitation.
         *
         * @see {@link https://github.com/bvaughn/react-window/issues/404}
         */
        <ColumnsProvider value={{ columns, isLogEventsEmpty }}>
            <AutoSizer>
                {({
                    height,
                    width,
                }) => {
                    return (
                        <FixedSizeList
                            className="list"
                            height={height || 0}
                            width={width || 0}
                            itemCount={events.length}
                            itemData={{
                                events,
                                columns,
                                handleRowClick,
                            }}
                            innerElementType={TableInnerWrapper}
                            itemSize={ITEM_HEIGHT_PX}
                        >
                            {VirtualizedRow}
                        </FixedSizeList>
                    );
                }}
            </AutoSizer>
        </ColumnsProvider>
    );
});
