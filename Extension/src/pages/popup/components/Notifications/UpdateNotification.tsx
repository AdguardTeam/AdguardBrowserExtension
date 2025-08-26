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

import { nanoid } from 'nanoid';

import { popupStore } from '../../stores/PopupStore';
import { useMessageHandler } from '../../hooks/useMessageHandler';

import { Notification } from './Notification';

/**
 * The component needed to show a notification about the rule limits
 * exceeded in popup.
 */
export const UpdateNotification = observer(() => {
    const store = useContext(popupStore);

    useMessageHandler();

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
