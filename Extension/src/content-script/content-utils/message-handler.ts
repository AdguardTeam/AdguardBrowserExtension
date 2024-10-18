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

import { MessageHandler, Message } from '../../common/messages';
import { logger } from '../../common/logger';

export class ContentScriptMessageHandler extends MessageHandler {
    protected handleMessage(
        message: Message,
        sender: Runtime.MessageSender,
    ): Promise<unknown> | undefined {
        // Check type
        if (!ContentScriptMessageHandler.isValidMessageType(message)) {
            logger.error('Invalid message in ContentScriptMessageHandler:', message);
            return;
        }

        const listener = this.listeners.get(message.type);

        if (listener) {
            return Promise.resolve(listener(message, sender));
        }
    }
}

export const messageHandler = new ContentScriptMessageHandler();
