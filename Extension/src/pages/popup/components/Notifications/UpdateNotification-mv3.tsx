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
import { messenger } from '../../../services/messenger';
import { NotifierType, ExtensionUpdateFSMState } from '../../../../common/constants';
import { translator } from '../../../../common/translators/translator';
import { NotificationType } from '../../../common/types';

import { Notification } from './Notification-mv3';

/**
 * The component needed to show a notification about the extension update check
 * result in popup.
 */
export const UpdateNotification = observer(() => {
    const store = useContext(popupStore);

    const NOTIFIER_EVENTS = [NotifierType.ExtensionUpdateStateChange];

    // TODO: Move this subscription to root Popup component
    const handleExtensionUpdateStateChange = (state: ExtensionUpdateFSMState) => {
        switch (state) {
            case ExtensionUpdateFSMState.Checking:
                store.setIsExtensionCheckingUpdateOrUpdating(true);
                store.setUpdateNotification({
                    type: NotificationType.Loading,
                    animationCondition: true,
                    text: translator.getMessage('update_checking_in_progress'),
                    closeManually: true,
                });
                break;
            case ExtensionUpdateFSMState.NotAvailable:
                store.setIsExtensionCheckingUpdateOrUpdating(false);
                store.setUpdateNotification({
                    type: NotificationType.Success,
                    text: translator.getMessage('update_not_needed'),
                });
                break;
            case ExtensionUpdateFSMState.Available:
                store.setIsExtensionCheckingUpdateOrUpdating(false);
                store.setUpdateNotification(null);
                store.setIsExtensionUpdateAvailable(true);
                break;
            case ExtensionUpdateFSMState.Updating:
                store.setIsExtensionCheckingUpdateOrUpdating(true);
                store.setUpdateNotification({
                    type: NotificationType.Loading,
                    closeManually: true,
                    animationCondition: true,
                    text: translator.getMessage('update_installing_in_progress_title'),
                });
                break;
            case ExtensionUpdateFSMState.Failed:
                store.setUpdateNotification({
                    type: NotificationType.Error,
                    text: translator.getMessage('update_failed_text'),
                    button: {
                        title: translator.getMessage('update_failed_try_again_btn'),
                        onClick: store.checkUpdatesMV3,
                    },
                });
                break;
            default:
                break;
        }
    };

    const messageHandler = async (message: any) => {
        const { type, data } = message as { type: NotifierType; data: any };

        if (type !== NotifierType.ExtensionUpdateStateChange) {
            return;
        }

        const [state] = data;
        handleExtensionUpdateStateChange(state);
    };

    useMessageHandler(() => messenger.createEventListener(NOTIFIER_EVENTS, messageHandler));

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
