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

import { useEffect, useRef } from 'react';

import browser, { type Runtime } from 'webextension-polyfill';

import { MessageType } from '../../../common/messages';

export const useMessageHandler = (
    createMessageListener: () => Promise<() => void>,
) => {
    const reloadingRef = useRef<boolean>(false);
    const callbackRef = useRef<(() => void) | null>(null);

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
    // Call the effect only once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
};
