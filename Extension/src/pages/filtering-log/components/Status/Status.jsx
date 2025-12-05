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

import React from 'react';

import cn from 'classnames';
import { format } from 'date-fns';

import { translator } from '../../../../common/translators/translator';
import { Icon } from '../../../common/components/ui/Icon';
import { Popover } from '../../../common/components/ui/Popover';
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
    const statusToShow = statusCode || '----';

    // This text is rendered only for Screen readers as summary of the status
    let requestStatusSummary = `${timeString}.`;

    if (areNetworkBadgesVisible) {
        requestStatusSummary += ` ${translator.getMessage('filtering_log_tag_request_status')}: ${statusTooltipText}.`;

        if (!isBlocked) {
            requestStatusSummary += ` ${translator.getMessage('filtering_log_badge_tooltip_http_status_code')}: ${statusToShow}.`;
        }
    }

    if (method) {
        requestStatusSummary += ` ${translator.getMessage('filtering_log_badge_tooltip_http_req_method')}: ${method}.`;
    }

    if (requestThirdParty) {
        requestStatusSummary += ` ${translator.getMessage('filtering_log_badge_tooltip_third_party')}.`;
    }

    return (
        <div className="status-wrapper">
            <span className="sr-only">
                {requestStatusSummary}
            </span>
            <div className="status" aria-hidden="true">
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
                                <div className="status__icon--wrapper">
                                    <Icon
                                        id={statusCode ? '#transfer-status' : '#arrow-status'}
                                        className="status__icon"
                                        aria-hidden="true"
                                    />
                                </div>
                            </Popover>
                        </div>
                        <div className={cn(itemClassNames, 'status__item_centered')}>
                            {isBlocked ? (
                                <Popover text={translator.getMessage('filtering_log_status_blocked')}>
                                    <div className="status__icon--wrapper">
                                        <Icon
                                            id="#ban"
                                            className="status__icon"
                                            aria-hidden="true"
                                        />
                                    </div>
                                </Popover>
                            ) : (
                                <Popover text={translator.getMessage('filtering_log_badge_tooltip_http_status_code')}>
                                    <div className={badgeClassNames}>
                                        {statusToShow}
                                    </div>
                                </Popover>
                            )}
                        </div>
                    </>
                )}
                {method && (
                    <div className="status__item">
                        <Popover text={translator.getMessage('filtering_log_badge_tooltip_http_req_method')}>
                            <div className="status__badge status__badge--transparent">
                                {method}
                            </div>
                        </Popover>
                    </div>
                )}
                {requestThirdParty && (
                    <div className="status__item">
                        <Popover text={translator.getMessage('filtering_log_badge_tooltip_third_party')}>
                            <div className="tag tag--third_party tag--party tag--third_party--info">
                                3P
                            </div>
                        </Popover>
                    </div>
                )}
            </div>
        </div>
    );
};
