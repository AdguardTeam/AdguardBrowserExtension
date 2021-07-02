import React from 'react';
import { getBadgeClassNames, StatusColor } from './statusStyles';

export const NetworkStatus = ({ method, statusCode, isThirdParty }) => {
    const badgeClassNames = getBadgeClassNames(StatusColor.GRAY);

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
            {isThirdParty && (
                <div className="status__item">
                    <div className="tag tag--third_party tag--party">
                        3P
                    </div>
                </div>
            )}
        </div>
    );
};
