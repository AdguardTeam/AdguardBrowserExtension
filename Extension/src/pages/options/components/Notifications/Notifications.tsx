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

import { observer } from 'mobx-react';
import React, { useContext } from 'react';

import { rootStore } from '../../stores/RootStore';

import { Notification } from './Notification';

import './notifications.pcss';

export const Notifications = observer(() => {
    const { uiStore } = useContext(rootStore);

    const { notifications } = uiStore;

    if (notifications.length === 0) {
        return null;
    }

    /**
     * Reverse notifications to correct transition for change position
     * of notification. If we use normal, not reversed order, new notification
     * will push old notifications (up or down) on the Y axis without transition.
     */
    const reversedNotifications = notifications.slice().reverse();

    return (
        <div className="notifications">
            {reversedNotifications.map((notification) => (
                <Notification key={notification.id} {...notification} />
            ))}
        </div>
    );
});
