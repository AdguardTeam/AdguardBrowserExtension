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

import { translator } from '../../../../common/translators/translator';
import { Icon } from '../../../common/components/ui/Icon';
import { popupStore } from '../../stores/PopupStore';

import { Notification } from './Notification';

import './notification.pcss';

/**
 * The component needed to show a notification about the rule limits
 * exceeded in popup.
 */
export const UpdateNotification = () => {
    const store = useContext(popupStore);

    const { checkUpdatesMV3 } = store;

    const handleTryAgainClick = async () => {
        await checkUpdatesMV3();
    };

    return (
        <Notification
            icon={(
                <Icon
                    id="#info"
                    classname="icon--24 icon--red-default"
                />
            )}
            title={translator.getMessage('popup_limits_exceeded_warning')}
            button={{
                text: translator.getMessage('options_rule_limits'),
                onClick: handleTryAgainClick,
            }}
        />
    );
};
