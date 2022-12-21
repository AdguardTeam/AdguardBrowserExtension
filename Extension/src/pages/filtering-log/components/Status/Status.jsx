/**
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
import { format } from 'date-fns';

import { Icon } from '../../../common/components/ui/Icon';
import { Popover } from '../../../common/components/ui/Popover';
import { reactTranslator } from '../../../../common/translators/reactTranslator';
import { StatusMode, getStatusMode } from '../../filteringLogStatus';
import {
    colorMap,
    getItemClassName,
    getBadgeClassNames,
} from './statusStyles';
import { getStatusTitle } from './statusTitles';

import './status.pcss';

export const Status = (props) => {
    const {
        statusCode,
        timestamp,
        method,
        requestUrl,
        requestThirdParty,
    } = props;

    const timeString = format(timestamp, 'HH:mm:ss');
    const mode = getStatusMode(props);
    const color = colorMap[mode];
    const itemClassNames = getItemClassName(color);
    const badgeClassNames = getBadgeClassNames(color);
    const isBlocked = mode === StatusMode.BLOCKED;
    const isModified = mode === StatusMode.MODIFIED;
    const areNetworkBadgesVisible = requestUrl && !isModified;
    const statusTooltipText = getStatusTitle(mode);

    return (
        <div className="status-wrapper">
            <div className="status">
                {/* Time string may have different width
                    Preventing layout shift with fixed value
                */}
                <div className="status__item status__item_width60">
                    {timeString}
                </div>
                {areNetworkBadgesVisible && (
                    <>
                        <div className={itemClassNames}>
                            <Popover text={statusTooltipText}>
                                <Icon id={statusCode ? '#transfer-status' : '#arrow-status'} classname="status__icon" />
                            </Popover>
                        </div>
                        <div className={cn(itemClassNames, 'status__item_centered')}>
                            {isBlocked ? (
                                <Popover text={reactTranslator.getMessage('filtering_log_status_blocked')}>
                                    <Icon id="#ban" classname="status__icon" />
                                </Popover>
                            ) : (
                                <Popover text={reactTranslator.getMessage('filtering_log_badge_tooltip_http_status_code')}>
                                    <div className={badgeClassNames}>
                                        {statusCode || '---'}
                                    </div>
                                </Popover>
                            )}
                        </div>
                    </>
                )}
                {method && (
                    <div className="status__item">
                        <Popover text={reactTranslator.getMessage('filtering_log_badge_tooltip_http_req_method')}>
                            <div className="status__badge status__badge--transparent">
                                {method}
                            </div>
                        </Popover>
                    </div>
                )}
                {requestThirdParty && (
                    <div className="status__item">
                        <Popover text={reactTranslator.getMessage('filtering_log_badge_tooltip_third_party')}>
                            <div className="tag tag--third_party tag--party">
                                3P
                            </div>
                        </Popover>
                    </div>
                )}
            </div>
        </div>
    );
};
