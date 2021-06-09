import React from 'react';
import { getbadgeClassNames, StatusColor } from './statusStyles';

export const NetworkStatus = ({ method, statusCode }) => {
    const badgeClassNames = getbadgeClassNames(StatusColor.GRAY);

    return (
        <div className="status">
            <div className="status__item">
                <div className={badgeClassNames}>
                    {statusCode || '---'}
                </div>
            </div>
            <div className="status__item">
                <div className="status__badge status__badge--transparent">
                    {method}
                </div>
            </div>
        </div>
    );
};
