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
import browser, { Runtime } from 'webextension-polyfill';

import { notifier } from '../notifier';
import { messageHandler } from '../message-handler';
import {
    RemoveListenerMessage,
    CreateEventListenerMessage,
    MessageType,
    NotifyListenersMessage,
} from '../../common/messages';

export type CreateEventListenerResponse = {
    listenerId: number,
};

/**
 * The EventService class operates with event listeners: creates or removes them.
 */
export class EventService {
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
     * Creates new event listener and returs its id.
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

            browser.tabs.sendMessage(sender.tab.id, message);
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
