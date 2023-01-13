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

import browser from 'webextension-polyfill';
import {
    MessageType,
    ExtractedMessage,
    APP_MESSAGE_HANDLER_NAME,
} from './constants';

export type MessageWithoutHandlerName<T> = { type: T } & Omit<ExtractedMessage<T>, 'handlerName'>;

/**
 * {@link sendMessage} sends app message via {@link browser.runtime.sendMessage} and
 * gets response from another extension page message handler
 *
 * @param message - partial {@link Message} record without {@link Message.handlerName} field
 *
 * @returns message handler response
 */
export async function sendMessage<T extends MessageType>(
    message: MessageWithoutHandlerName<T>,
): Promise<unknown> {
    try {
        return await browser.runtime.sendMessage({
            handlerName: APP_MESSAGE_HANDLER_NAME,
            ...message,
        });
    } catch (e) {
        // do nothing
    }
}

/**
 * {@link sendTabMessage} sends message to specified tab via {@link browser.tabs.sendMessage} and
 * gets response from it
 *
 * @param tabId - tab id
 * @param message - partial {@link Message} record without {@link Message.handlerName} field
 *
 * @returns tab message handler response
 */
export async function sendTabMessage<T extends MessageType>(
    tabId: number,
    message: MessageWithoutHandlerName<T>,
): Promise<unknown> {
    return browser.tabs.sendMessage(tabId, {
        handlerName: APP_MESSAGE_HANDLER_NAME,
        ...message,
    });
}
