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
import browser, { type Runtime } from 'webextension-polyfill';

import { type EngineMessage } from 'engine';

import {
    type MessageType,
    type Message,
    type ExtractedMessage,
    type ValidMessageTypes,
    type ExtractMessageResponse,
    APP_MESSAGE_HANDLER_NAME,
} from './constants';

type MessageListener<T extends ValidMessageTypes> = (
    message: ExtractedMessage<T>,
    sender: Runtime.MessageSender,
) => Promise<ExtractMessageResponse<T>> | ExtractMessageResponse<T>;

/**
 * Type guard for messages that have a 'type' field with possible {@link MessageType}.
 *
 * @note Added to no bring here huge zod library.
 *
 * @param message Unknown message.
 *
 * @returns True if message has 'type' field with possible {@link MessageType}.
 */
export const messageHasTypeField = (message: unknown): message is { type: MessageType } => {
    return typeof message === 'object' && message !== null && 'type' in message;
};

/**
 * Type guard for messages that have a 'type' field and 'data' field and looks like {@link Message}.
 *
 * @note Added to no bring here huge zod library.
 *
 * @param message Unknown message.
 *
 * @returns True if message has 'type' and 'data' fields and looks like {@link Message}.
 */
export const messageHasTypeAndDataFields = (message: unknown): message is Message => {
    return messageHasTypeField(message) && 'data' in message;
};

/**
 * API for handling Messages via {@link browser.runtime.onMessage}
 */
export abstract class MessageHandler {
    protected listeners = new Map<ValidMessageTypes, MessageListener<ValidMessageTypes>>();

    constructor() {
        this.handleMessage = this.handleMessage.bind(this);
    }

    public init(): void {
        browser.runtime.onMessage.addListener(this.handleMessage);
    }

    /**
     * Add message listener.
     * Listeners limited to 1 per message type to prevent race
     * condition while response processing.
     *
     * TODO: implement listeners priority execution strategy
     *
     * @param type - {@link ValidMessageTypes}
     * @param listener - {@link MessageListener}
     *
     * @throws error, if message listener already added
     */
    public addListener<T extends ValidMessageTypes>(
        type: T,
        listener: MessageListener<T>,
    ): void {
        if (this.listeners.has(type)) {
            throw new Error(`Message handler: ${type} listener has already been registered`);
        }

        // Cast through unknown to help TS understand that the listener is of
        // the correct type. It will check types at compile time.
        this.listeners.set(type, listener as unknown as MessageListener<ValidMessageTypes>);
    }

    /**
     * Removes message listener.
     *
     * @param type - {@link ValidMessageTypes}
     */
    public removeListener<T extends ValidMessageTypes>(type: T): void {
        this.listeners.delete(type);
    }

    /**
     * Removes all listeners
     */
    public removeListeners(): void {
        this.listeners.clear();
    }

    /**
     * Check if the message is of type {@link Message}.
     *
     * @param message Message of basic type {@link Message} or {@link EngineMessage}.
     *
     * @returns True if the message is of type {@link Message}.
     */
    protected static isValidMessageType(message: Message | EngineMessage): message is Message {
        return message.handlerName === APP_MESSAGE_HANDLER_NAME && 'type' in message;
    }

    /**
     * Handles data from {@link browser.runtime.onMessage} and match specified listener.
     *
     * @param message - {@link Message}
     * @param sender - An object containing information about the script context that sent a message or request.
     */
    protected abstract handleMessage(
        message: Message | unknown,
        sender: Runtime.MessageSender
    ): Promise<unknown> | undefined;
}
