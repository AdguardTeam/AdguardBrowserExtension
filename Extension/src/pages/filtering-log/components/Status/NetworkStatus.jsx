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

import { translator } from '../../../../common/translators/translator';
import { Popover } from '../../../common/components/ui/Popover';

import { getBadgeClassNames, StatusColor } from './statusStyles';

export const NetworkStatus = ({ method, statusCode, isThirdParty }) => {
    const badgeClassNames = getBadgeClassNames(StatusColor.GRAY);

    const statusTooltipText = translator.getMessage('filtering_log_badge_tooltip_http_status_code');
    const statusToShow = statusCode || '----';
    const methodTooltipText = translator.getMessage('filtering_log_badge_tooltip_http_req_method');
    const thirdPartyTooltipText = translator.getMessage('filtering_log_badge_tooltip_third_party');

    /**
     * Take a note that empty sr-only used to split text for screen readers,
     * otherwise, screen readers will read the whole text as one.
     */
    return (
        <div className="status">
            <div className="status__item">
                <span className="sr-only">
                    {`${statusTooltipText}: ${statusToShow}`}
                </span>
                <Popover text={statusTooltipText}>
                    <div className={badgeClassNames} aria-hidden="true">
                        {statusToShow}
                    </div>
                </Popover>
            </div>
            <div className="sr-only" />
            <div className="status__item">
                <span className="sr-only">
                    {`${methodTooltipText}: ${method}`}
                </span>
                <Popover text={methodTooltipText}>
                    <div className="status__badge status__badge--transparent" aria-hidden="true">
                        {method}
                    </div>
                </Popover>
            </div>
            {isThirdParty && (
                <>
                    <div className="sr-only" />
                    <div className="status__item">
                        <span className="sr-only">
                            {thirdPartyTooltipText}
                        </span>
                        <Popover text={thirdPartyTooltipText}>
                            <div className="tag tag--third_party tag--party tag--third_party--info" aria-hidden="true">
                                3P
                            </div>
                        </Popover>
                    </div>
                </>
            )}
        </div>
    );
};
