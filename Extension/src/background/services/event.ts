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
import { listeners } from '../notifier';
import { messageHandler } from '../message-handler';
import {
    RemoveListenerMessage,
    CreateEventListenerMessage,
    MessageType,
} from '../../common/messages';

export type CreateEventListenerResponse = {
    listenerId: number,
};

export class EventService {
    // TODO: types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private eventListeners = new Map<number, any>();;

    constructor() {
        this.createEventListener = this.createEventListener.bind(this);
        this.removeEventListener = this.removeEventListener.bind(this);
    }

    public init(): void {
        messageHandler.addListener(MessageType.CreateEventListener, this.createEventListener);
        messageHandler.addListener(MessageType.RemoveListener, this.removeEventListener);
    }

    private createEventListener(
        message: CreateEventListenerMessage,
        sender: Runtime.MessageSender,
    ): CreateEventListenerResponse {
        const { events } = message.data;

        const listenerId = listeners.addSpecifiedListener(events, (...args) => {
            const sender = this.eventListeners.get(listenerId);
            if (sender) {
                browser.tabs.sendMessage(sender.tab.id, {
                    type: MessageType.NotifyListeners,
                    data: args,
                });
            }
        });

        this.eventListeners.set(listenerId, sender);
        return { listenerId };
    }

    private removeEventListener(message: RemoveListenerMessage): void {
        const { listenerId } = message.data;

        listeners.removeListener(listenerId);
        this.eventListeners.delete(listenerId);
    }
}

export const eventService = new EventService();
