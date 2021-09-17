import React from 'react';

import { Popover } from '../../../common/components/ui/Popover';
import { reactTranslator } from '../../../../common/translators/reactTranslator';
import { getBadgeClassNames, StatusColor } from './statusStyles';

export const NetworkStatus = ({ method, statusCode, isThirdParty }) => {
    const badgeClassNames = getBadgeClassNames(StatusColor.GRAY);

    return (
        <div className="status">
            <div className="status__item">
                <Popover text={reactTranslator.getMessage('filtering_log_badge_tooltip_http_status_code')}>
                    <div className={badgeClassNames}>
                        {statusCode || '---'}
                    </div>
                </Popover>
            </div>
            <div className="status__item">
                <Popover text={reactTranslator.getMessage('filtering_log_badge_tooltip_http_req_method')}>
                    <div className="status__badge status__badge--transparent">
                        {method}
                    </div>
                </Popover>
            </div>
            {isThirdParty && (
                <div className="status__item">
                    <Popover text={reactTranslator.getMessage('filtering_log_badge_tooltip_third_party')}>
                        <div className="tag tag--third_party tag--party">
                            3P
                        </div>
                    </Popover>
                </div>
            )}
        </div>
    );
};
