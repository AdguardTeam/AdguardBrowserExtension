import React from 'react';
import cn from 'classnames';
import { Icon } from '../../../common/components/ui/Icon';
import './status.pcss';
import { StatusMode, getStatusMode } from '../../filteringLogStatus';
import { colorMap, getItemClassName, getbadgeClassNames } from './statusStyles';

export const Status = (props) => {
    const {
        statusCode,
        timestamp,
        method,
        requestUrl,
    } = props;

    const timeString = new Date(timestamp).toLocaleTimeString();
    const mode = getStatusMode(props);
    const color = colorMap[mode];
    const itemClassNames = getItemClassName(color);
    const badgeClassNames = getbadgeClassNames(color);
    const isBlocked = mode === StatusMode.BLOCKED;

    return (
        <div className="status-wrapper">
            <div className="status">
                {/* Time string may have different width
                    Preventing layout shift with fixed value
                */}
                <div className="status__item status__item_width60">
                    {timeString}
                </div>
                {requestUrl && (
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
            </div>
        </div>
    );
};
