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

import { notifier } from '../notifier';
import { messageHandler } from '../message-handler';
import {
    type RemoveListenerMessage,
    type CreateEventListenerMessage,
    MessageType,
    type NotifyListenersMessage,
} from '../../common/messages';

export type CreateEventListenerResponse = {
    listenerId: number;
};

/**
 * The EventService class operates with event listeners: creates or removes them.
 */
class EventService {
    // TODO: types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private eventListeners = new Map<number, any>();

    /**
     * Creates new {@link EventService}.
     */
    constructor() {
        this.createEventListener = this.createEventListener.bind(this);
        this.removeEventListener = this.removeEventListener.bind(this);
    }

    /**
     * Registers event listeners in the {@link messageHandler} with background messages.
     */
    public init(): void {
        messageHandler.addListener(MessageType.CreateEventListener, this.createEventListener);
        messageHandler.addListener(MessageType.RemoveListener, this.removeEventListener);
    }

    /**
     * Creates new event listener and returns its id.
     *
     * @param message Item of {@link CreateEventListenerMessage}.
     * @param sender Item of {@link Runtime.MessageSender}.
     *
     * @returns The identifier of the event listener enclosed in the {@link CreateEventListenerResponse} type.
     */
    private createEventListener(
        message: CreateEventListenerMessage,
        sender: Runtime.MessageSender,
    ): CreateEventListenerResponse {
        const { events } = message.data;

        const listenerId = notifier.addSpecifiedListener(events, (...data) => {
            const sender = this.eventListeners.get(listenerId);
            if (!sender) {
                return;
            }

            const message: NotifyListenersMessage = {
                type: MessageType.NotifyListeners,
                data,
            };

            // sender.tab is only present for content scripts
            if (sender.tab && sender.tab.id) {
                browser.tabs.sendMessage(sender.tab.id, message);
            } else {
                // for extension pages, e.g. popup or options, sender.tab is undefined,
                // so runtime messaging is used
                browser.runtime.sendMessage(message);
            }
        });

        this.eventListeners.set(listenerId, sender);
        return { listenerId };
    }

    /**
     * Removes listener for provided message.
     *
     * @param message Message of type {@link RemoveListenerMessage}.
     */
    private removeEventListener(message: RemoveListenerMessage): void {
        const { listenerId } = message.data;

        notifier.removeListener(listenerId);
        this.eventListeners.delete(listenerId);
    }
}

export const eventService = new EventService();
