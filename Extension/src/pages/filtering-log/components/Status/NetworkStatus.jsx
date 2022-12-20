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
