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

import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { popupStore } from '../../stores/PopupStore';

import { RuleLimitsNotification } from './RuleLimitsNotification-mv3';
import { UpdateNotification } from './UpdateNotification-mv3';

import './notifications.pcss';

export const Notifications = observer(() => {
    const store = useContext(popupStore);

    const { areFilterLimitsExceeded } = store;

    return (
        <div className="notifications">
            <UpdateNotification />
            {areFilterLimitsExceeded && <RuleLimitsNotification />}
        </div>
    );
});
