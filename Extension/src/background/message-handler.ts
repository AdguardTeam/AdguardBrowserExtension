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
import { Runtime } from 'webextension-polyfill';
import { Engine, EngineMessage } from './engine';

import {
    Message,
    APP_MESSAGE_HANDLER_NAME,
    MessageHandler,
    MessageListener,
} from '../common/messages';

export class BackgroundMessageHandler extends MessageHandler {
    protected handleMessage<T extends Message | EngineMessage>(
        message: T,
        sender: Runtime.MessageSender,
    ): Promise<unknown> | undefined {
        if (message.handlerName === Engine.messageHandlerName) {
            return Engine.handleMessage(message, sender);
        }

        if (message.handlerName === APP_MESSAGE_HANDLER_NAME) {
            const listener = this.listeners.get(message.type) as MessageListener<T>;
            if (listener) {
                return Promise.resolve(listener(message, sender));
            }
        }
    }
}

export const messageHandler = new BackgroundMessageHandler();
