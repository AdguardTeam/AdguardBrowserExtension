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

import cn from 'classnames';
import { format } from 'date-fns';

import { type UIFilteringLogEvent } from '../../../../../background/api';
import { Icon } from '../../../../common/components/ui/Icon';
import { getStatusMode } from '../../../filteringLogStatus';
import { colorMap, getItemClassName } from '../../Status/statusStyles';
import { areNetworkBadgesVisible } from '../../Status/Status';
import { urlAccessor } from '../FilteringEvents';

import styles from '../filtering-events-mobile.module.pcss';

/**
 * CSS class names for row highlighting.
 */
const RowClassName = {
    Yellow: styles.yellow,
    Red: styles.red,
    Green: styles.green,
    LightGreen: styles.lightGreen,
};

/**
 * Maps status mode to row CSS class name.
 */
const rowClassNameMap: Record<string, string | null | undefined> = {
    regular: null,
    modified: RowClassName.Yellow,
    blocked: RowClassName.Red,
    allowed: RowClassName.LightGreen,
    'allowed-stealth': RowClassName.Green,
};

/**
 * Returns metadata parts for mobile row display.
 *
 * @param event Filtering log event.
 * @param showNetworkBadges Whether to show network badges.
 *
 * @returns Array of metadata strings.
 */
function getMetaParts(
    event: UIFilteringLogEvent,
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
    }

    const type = event.requestType || '';

    if (type !== '') {
        metaParts.push(type);
    }

    if (event.frameDomain) {
        metaParts.push(event.frameDomain);
    }

    return metaParts;
}

/**
 * Mobile row component for filtering log event.
 *
 * @param props Component props.
 *
 * @returns Mobile row component.
 */
export const MobileRow = observer(({
    event,
    onClick,
}: {
    event: UIFilteringLogEvent;
    onClick: (e: React.MouseEvent | React.KeyboardEvent) => void;
}) => {
    const { statusCode } = event;

    const timeString = event.timestamp ? format(event.timestamp, 'HH:mm:ss') : '--:--:--';
    const url = urlAccessor(event);

    const mode = getStatusMode(event);
    const color = colorMap[mode];
    const showNetworkBadges = areNetworkBadgesVisible(event.requestUrl, mode);
    const metaParts = getMetaParts(event, showNetworkBadges);

    const itemClassNames = getItemClassName(color);

    const className = cn(
        styles.row,
        rowClassNameMap[mode],
    );

    return (
        <button
            type="button"
            className={className}
            id={event.eventId}
            onClick={onClick}
        >
            <div className={cn(styles.requestStatusIcon, itemClassNames)}>
                {showNetworkBadges && (
                    <Icon
                        id={statusCode ? '#transfer-status' : '#arrow-status'}
                        className={cn(styles.requestStatusIcon, itemClassNames)}
                        aria-hidden="true"
                    />
                )}
            </div>
            <div className={styles.content}>
                <div className={styles.url}>{url}</div>
                <div className={styles.metaParts}>{metaParts.join(' • ')}</div>
            </div>
            <div className={styles.time}>{timeString}</div>
        </button>
    );
});
