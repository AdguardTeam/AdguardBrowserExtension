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

import {
    useContext,
    useEffect,
    useRef,
} from 'react';

import browser, { type Runtime } from 'webextension-polyfill';

import { ExtensionUpdateFSMState, NotifierType } from '../../../common/constants';
import { logger } from '../../../common/logger';
import { MessageType } from '../../../common/messages';
import { translator } from '../../../common/translators/translator';
import { NotificationType } from '../../common/types';
import { type LongLivedConnectionCallbackMessage, messenger } from '../../services/messenger';
import { popupStore } from '../stores/PopupStore';

const NOTIFIER_EVENTS = [
    NotifierType.ExtensionUpdateStateChange,
];

export const useMessageHandler = () => {
    const store = useContext(popupStore);

    const reloadingRef = useRef<boolean>(false);
    const callbackRef = useRef<(() => void) | null>(null);

    const handleExtensionUpdateStateChange = (state: ExtensionUpdateFSMState) => {
        switch (state) {
            case ExtensionUpdateFSMState.Checking:
                store.setUpdateNotification({
                    type: NotificationType.Loading,
                    animationCondition: true,
                    text: translator.getMessage('update_checking_in_progress'),
                });
                break;
            case ExtensionUpdateFSMState.NotAvailable:
                store.setUpdateNotification({
                    type: NotificationType.Success,
                    text: translator.getMessage('update_not_needed'),
                });
                break;
            // it is possible when popup is opened by user
            // after the update check was triggered on the options page,
            // so "checking" popup notification should be reset
            case ExtensionUpdateFSMState.Available:
                store.setUpdateNotification(null);
                store.setIsExtensionUpdateAvailable(true);
                break;
            case ExtensionUpdateFSMState.Updating:
                store.setUpdateNotification({
                    type: NotificationType.Loading,
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
                // do nothing since notification should be shown
                // for a limited list of states
                break;
        }
    };

    const messageHandler = async (message: LongLivedConnectionCallbackMessage) => {
        const { type, data } = message;

        if (type !== NotifierType.ExtensionUpdateStateChange) {
            logger.warn(`[ext.useMessageHandler]: Undefined message type: ${type}`);
            return;
        }

        const [state] = data;
        handleExtensionUpdateStateChange(state);
    };

    /**
     * Subscribe to notification from background page with this method
     * If use runtime.onMessage, then we can intercept messages from popup
     * to the message handler on background page.
     */
    const createMessageListener = async () => {
        return messenger.createEventListener(NOTIFIER_EVENTS, messageHandler);
    };

    /**
     * Handle messages from the background page.
     * This function intentionally not async to avoid interception of several
     * listeners. In order to deal with async code we return `true` as result
     * of listener to keep the message channel open until the response is sent.
     *
     * @see {@link https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/onMessage#sending_an_asynchronous_response_using_sendresponse}
     *
     * @param message Message from background page.
     * @param sender Sender of the message.
     * @param sendResponse Response function to send response back to the sender.
     *
     * @returns True if message type is UPDATE_LISTENERS to keep the message
     * channel open until the callback is invoked.
     */
    const handleBrowserMessage = (
        message: any,
        sender: Runtime.MessageSender,
        sendResponse: (response: unknown) => void,
        // eslint-disable-next-line consistent-return
    ): any => {
        const { type } = message;
        if (type === MessageType.UpdateListeners) {
            reloadingRef.current = true;
            if (callbackRef.current) {
                callbackRef.current();
            }

            createMessageListener().then((callback) => {
                callbackRef.current = callback;

                // By sending a response, we indicate that we have handled
                // the message and that the message channel can be closed.
                sendResponse(null);
            });

            // Return true to keep the message
            // channel open until the callback is invoked
            return true;
        }
    };

    useEffect(() => {
        (async () => {
            callbackRef.current = await createMessageListener();
        })();

        browser.runtime.onMessage.addListener(handleBrowserMessage);

        return () => {
            if (callbackRef.current) {
                callbackRef.current();
            }

            browser.runtime.onMessage.removeListener(handleBrowserMessage);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
};
