import React from 'react';
import cn from 'classnames';
import { format } from 'date-fns';

import { Icon } from '../../../common/components/ui/Icon';
import { StatusMode, getStatusMode } from '../../filteringLogStatus';
import { colorMap, getItemClassName, getBadgeClassNames } from './statusStyles';

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
                            <Icon id={statusCode ? '#transfer-status' : '#arrow-status'} classname="status__icon" />
                        </div>
                        <div className={cn(itemClassNames, 'status__item_centered')}>
                            {isBlocked ? (
                                <Icon id="#ban" classname="status__icon" />
                            ) : (
                                <div className={badgeClassNames}>
                                    {statusCode || '---'}
                                </div>
                            )}
                        </div>
                    </>
                )}
                {method && (
                    <div className="status__item">
                        <div className="status__badge status__badge--transparent">
                            {method}
                        </div>
                    </div>
                )}
                {requestThirdParty && (
                    <div className="status__item">
                        <div className="tag tag--third_party tag--party">
                            3P
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
