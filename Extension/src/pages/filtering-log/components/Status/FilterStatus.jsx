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
import { Icon } from '../../../common/components/ui/Icon';
import './status.pcss';
import { StatusMode } from '../../filteringLogStatus';
import { getStatusTitle } from './statusTitles';
import { colorMap, getItemClassName } from './statusStyles';

export const FilterStatus = ({ statusCode, method, mode }) => {
    const title = getStatusTitle(mode);
    const color = colorMap[mode];
    const itemClassNames = getItemClassName(color);
    const isBlocked = mode === StatusMode.BLOCKED;

    return (
        <div className="status">
            <div className={itemClassNames}>
                {title}
            </div>
            <div className={itemClassNames}>
                {isBlocked ? (
                    <Icon id="#ban" classname="status__icon" />
                ) : (
                    method && <Icon id={statusCode ? '#transfer-status' : '#arrow-status'} classname="status__icon" />
                )}
            </div>
        </div>
    );
};
