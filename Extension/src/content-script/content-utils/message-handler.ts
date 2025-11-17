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
import { type Runtime } from 'webextension-polyfill';

import { MessageType } from '@adguard/tswebextension';

import { MessageHandler } from '../../common/messages/message-handler';
import { type Message } from '../../common/messages/constants';
import { logger } from '../../common/logger';

export class ContentScriptMessageHandler extends MessageHandler {
    /**
     * For these messages we have separate handlers in the content script,
     * provided from tswebextension.
     */
    private static ExcludedAssistantMessages = new Set([
        MessageType.InitAssistant,
        MessageType.CloseAssistant,
    ]);

    /**
     * Checks if the message is internal assistant message. If it is, we should
     * not handle it in the content script.
     *
     * @param message Message to check.
     * @param message.type Type of the message.
     *
     * @returns {boolean} True if the message is internal assistant message.
     */
    private static isInternalAssistantMessage(message: { type: MessageType }): boolean {
        return ContentScriptMessageHandler.ExcludedAssistantMessages.has(message.type);
    }

    protected handleMessage(
        message: Message,
        sender: Runtime.MessageSender,
    ): Promise<unknown> | undefined {
        // Check type.
        if (!ContentScriptMessageHandler.isValidMessageType(message)) {
            // Do not print errors for internal assistant messages.
            if (!ContentScriptMessageHandler.isInternalAssistantMessage(message)) {
                logger.error('[ext.ContentScriptMessageHandler.handleMessage]: invalid message:', message);
            }
            return;
        }

        const listener = this.listeners.get(message.type);

        if (listener) {
            return Promise.resolve(listener(message, sender));
        }
    }
}

export const messageHandler = new ContentScriptMessageHandler();
