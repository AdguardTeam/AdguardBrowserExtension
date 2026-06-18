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

import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { nanoid } from 'nanoid';

import { popupStore } from '../../stores/PopupStore';

import { Notification } from './Notification';

/**
 * Displays the extension update check result notification in the popup.
 *
 * The notification visibility duration is owned by the FSM, which uses
 * `after` transitions with MIN_UPDATE_DISPLAY_DURATION_MS on transient
 * states (NotAvailable, Success). This component simply renders whatever
 * the store's `updateNotification` computed property provides.
 */
export const UpdateNotification = observer(() => {
    const store = useContext(popupStore);
    const { updateNotification } = store;

    if (!updateNotification) {
        return null;
    }

    return (
        <Notification
            key={nanoid()}
            {...updateNotification}
        />
    );
});
