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

import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import { FixedSizeList, type ListChildComponentProps } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

import cn from 'classnames';
import { format } from 'date-fns';

import { type FilteringLogEvent } from '../../../../background/api';
import { rootStore } from '../../stores/RootStore';
import { Icon } from '../../../common/components/ui/Icon';
import { getStatusMode, StatusMode } from '../../filteringLogStatus';
import {
    colorMap,
    getBadgeClassNames,
    getItemClassName,
} from '../Status/statusStyles';
import { areNetworkBadgesVisible } from '../Status/Status';

import {
    getRowClassName,
    typeAccessor,
    urlAccessor,
} from './FilteringEvents';

import styles from './filtering-events-mobile.module.pcss';

const MOBILE_ITEM_HEIGHT_PX = 92;

/**
 * @typedef {object} RowClassName
 * @property {string} YELLOW
 * @property {string} RED
 * @property {string} GREEN
 * @property {string} LIGHT_GREEN
 */
const RowClassName = {
    YELLOW: styles.yellow,
    RED: styles.red,
    GREEN: styles.green,
    LIGHT_GREEN: styles.lightGreen,
};

const rowClassNameMap = {
    [StatusMode.REGULAR]: null,
    [StatusMode.MODIFIED]: RowClassName.YELLOW,
    [StatusMode.BLOCKED]: RowClassName.RED,
    [StatusMode.ALLOWED]: RowClassName.LIGHT_GREEN,
    [StatusMode.ALLOWED_STEALTH]: RowClassName.GREEN,
};

function getMetaParts(
    event: FilteringLogEvent,
    showNetworkBadges: boolean,
) {
    const metaParts = [];

    if (showNetworkBadges) {
        if (event.method) {
            metaParts.push(event.method);
        }
        if (event.requestThirdParty) {
            metaParts.push('3P');
        }
        const type = typeAccessor(event);
        if (type !== '') {
            metaParts.push(type);
        }
    }

    if (event.frameDomain) {
        metaParts.push(event.frameDomain);
    }

    return metaParts;
}

const MobileRow = observer(({
    event,
    onClick,
    style,
}: {
    event: FilteringLogEvent;
    onClick: (e: React.MouseEvent | React.KeyboardEvent) => void;
    style: React.CSSProperties;
}) => {
    const { logStore } = useContext(rootStore);

    const { statusCode } = event;

    const timeString = format(event.timestamp || 0, 'HH:mm:ss');
    const url = urlAccessor(event);

    const mode = getStatusMode(event);
    const isBlocked = mode === StatusMode.BLOCKED;
    const color = colorMap[mode];
    const showNetworkBadges = areNetworkBadgesVisible(event.requestUrl, mode);
    const metaParts = getMetaParts(event, showNetworkBadges);

    const itemClassNames = getItemClassName(color);

    const className = cn(
        styles.row,
        rowClassNameMap[mode],
    );

    return (
        <div
            role="button"
            className={className}
            tabIndex={0}
            style={style}
            id={event.eventId}
            onClick={onClick}
            onKeyDown={(e) => e.key === 'Enter' && onClick(e)}
        >
            <div className={`${styles.requestStatusIcon} ${itemClassNames}`}>
                {showNetworkBadges && (
                    <Icon
                        id={statusCode ? '#transfer-status' : '#arrow-status'}
                        className={`${styles.requestStatusIcon} ${itemClassNames}`}
                        aria-hidden="true"
                    />
                )}
            </div>
            <div className={styles.content}>
                <div className={styles.url}>{url}</div>
                <div className={styles.metaParts}>{metaParts.join(' • ')}</div>
            </div>
            <div className={styles.time}>{timeString}</div>
        </div>
    );
});

const VirtualizedMobileRow = ({
    index,
    style,
    data,
}: ListChildComponentProps) => {
    const { events, handleRowClick } = data;
    const event = events[index];

    return (
        <MobileRow
            event={event}
            onClick={handleRowClick}
            style={style}
        />
    );
};

export const FilteringEventsRowsMobile = observer((
    {
        handleRowClick,
    }: {
        handleRowClick: (e: React.MouseEvent | React.KeyboardEvent) => void;
    },
) => {
    const { logStore } = useContext(rootStore);
    const events = logStore.events;

    if (events.length === 0) {
        return null;
    }

    return (
        <div style={{ flex: 1, width: '100vw', height: '100%' }}>
            <AutoSizer>
                {({ height, width }) => (
                    <FixedSizeList
                        className="mobile-list"
                        height={height || 0}
                        width={width || 0}
                        itemCount={events.length}
                        itemData={{
                            events,
                            handleRowClick,
                        }}
                        itemSize={MOBILE_ITEM_HEIGHT_PX}
                    >
                        {VirtualizedMobileRow}
                    </FixedSizeList>
                )}
            </AutoSizer>
        </div>
    );
});
