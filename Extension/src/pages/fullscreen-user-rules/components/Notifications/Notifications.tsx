/**
 * Copyright (c) 2015-2026 Adguard Software Ltd.
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

import { observer } from 'mobx-react';
import React, { useContext } from 'react';

import { fullscreenUserRulesStore } from 'fullscreen-user-rules-store';

import { Notification } from '../../../common/components/Notification';

import '../../../common/components/Notification/notifications.pcss';

/**
 * Notifications component for the fullscreen user rules page.
 *
 * Reuses the shared Notification component from the options page and injects
 * onRemove from fullscreenUserRulesStore instead of rootStore.
 */
export const FullscreenNotifications = observer(() => {
    const store = useContext(fullscreenUserRulesStore);

    const { notifications } = store;

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
                <Notification
                    key={notification.id}
                    onRemove={(id) => store.removeNotification(id)}
                    {...notification}
                />
            ))}
        </div>
    );
});
