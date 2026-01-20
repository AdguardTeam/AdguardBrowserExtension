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

import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { nanoid } from 'nanoid';

import { popupStore } from '../../stores/PopupStore';

import { Notification } from './Notification-mv3';

/**
 * The component needed to show a notification about the extension update check
 * result in popup.
 *
 * FSM subscription is handled in the root Popup component.
 */
export const UpdateNotification = observer(() => {
    const store = useContext(popupStore);
    const { updateNotification } = store;

    if (!updateNotification) {
        return null;
    }

    const {
        type,
        animationCondition,
        text,
        button,
        closeManually,
    } = updateNotification;

    return (
        <Notification
            key={nanoid()}
            type={type}
            animationCondition={animationCondition}
            text={text}
            button={button}
            closeManually={closeManually}
        />
    );
});
