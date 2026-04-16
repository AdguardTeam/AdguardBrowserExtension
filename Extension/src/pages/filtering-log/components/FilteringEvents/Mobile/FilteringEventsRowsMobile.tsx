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

import React, { useContext, useRef } from 'react';
import { observer } from 'mobx-react';

import { useVirtualizer } from '@tanstack/react-virtual';

import { rootStore } from '../../../stores/RootStore';

import { MobileRow } from './MobileRow';
import { ESTIMATED_ITEM_SIZE_PX, OVERSCAN_COUNT } from './constants';

import styles from '../filtering-events-mobile.module.pcss';

/**
 * Mobile virtualized list of filtering log events.
 *
 * @param props Component props.
 *
 * @returns Virtualized mobile events list.
 */
export const FilteringEventsRowsMobile = observer((
    {
        handleRowClick,
    }: {
        handleRowClick: (e: React.MouseEvent | React.KeyboardEvent) => void;
    },
) => {
    const { logStore } = useContext(rootStore);
    const events = logStore.events;
    const parentRef = useRef<HTMLDivElement>(null);

    const virtualizer = useVirtualizer({
        count: events.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => ESTIMATED_ITEM_SIZE_PX,
        overscan: OVERSCAN_COUNT,
    });

    const items = virtualizer.getVirtualItems();

    if (events.length === 0) {
        return null;
    }

    return (
        <div className={styles.container} ref={parentRef}>
            <div
                className={styles.virtualList}
                style={{
                    height: `${virtualizer.getTotalSize()}px`,
                }}
            >
                {items.map((item) => {
                    const event = events[item.index];
                    if (!event) {
                        return null;
                    }
                    return (
                        <div
                            key={String(item.key)}
                            data-index={item.index}
                            ref={virtualizer.measureElement}
                            className={styles.virtualItem}
                            style={{
                                transform: `translateY(${item.start}px)`,
                            }}
                        >
                            <MobileRow
                                event={event}
                                onClick={handleRowClick}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
});
