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

import { logger } from '../common/logger';
import { NotifierType } from '../common/constants';

type Listener = (...args: unknown[]) => unknown;

/**
 * The Notifier class contains all events, their listeners and handlers,
 * as well as manages the work with them: add, delete, notify.
 */
class Notifier {
    private listenerId = 0;

    private eventNotifierEventsMap: Record<string, string> = {};

    private listenersMap: Record<number, Listener> = {};

    private listenersEventsMap: Record<number, unknown[]> = {};

    /**
     * Make accessible only constants without functions. They will be passed to content-page.
     */
    events = NotifierType;

    /**
     * Creates new item of {@link Notifier}.
     */
    constructor() {
        Object.entries(NotifierType).forEach(([key, value]) => {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            this[key] = value;
            this.eventNotifierEventsMap[value] = key;
        });
    }

    /**
     * Subscribes listener to the specified events.
     *
     * @param events Event type listener will be notified of.
     * @param listener Listener callback.
     *
     * @returns Listener id.
     *
     * @throws Error if listener is not a function.
     */
    addSpecifiedListener(events: unknown[], listener: Listener): number {
        if (typeof listener !== 'function') {
            throw new Error('Illegal listener');
        }
        const listenerId = this.listenerId + 1;
        this.listenerId = listenerId;
        this.listenersMap[listenerId] = listener;
        this.listenersEventsMap[listenerId] = events;
        return listenerId;
    }

    /**
     * Subscribe specified listener to all events.
     *
     * @param listener Listener callback.
     *
     * @returns Listener id.
     *
     * @throws Error if listener is not a function.
     */
    addListener(listener: Listener): number {
        if (typeof listener !== 'function') {
            throw new Error('Illegal listener');
        }
        const listenerId = this.listenerId + 1;
        this.listenerId = listenerId;
        this.listenersMap[listenerId] = listener;
        return listenerId;
    }

    /**
     * Unsubscribe listener.
     *
     * @param listenerId Listener id.
     */
    removeListener(listenerId: number): void {
        delete this.listenersMap[listenerId];
        delete this.listenersEventsMap[listenerId];
    }

    /**
     * Notifies listeners about the events passed as arguments of this function.
     *
     * @param args Notifier event types.
     *
     * @throws Error if some event is illegal.
     */
    notifyListeners(...args: [NotifierType, ...unknown[]]): void {
        const [event] = args;
        if (!event || !(event in this.eventNotifierEventsMap)) {
            throw new Error(`Illegal event: ${event}`);
        }

        Object.entries(this.listenersMap).forEach(([listenerId, listener]) => {
            const events = this.listenersEventsMap[Number(listenerId)];
            if (events && events.length > 0 && events.indexOf(event) < 0) {
                return;
            }
            try {
                listener.apply(listener, args);
            } catch (ex) {
                logger.error(`[ext.Notifier.notifyListeners]: error invoking listener for ${event} cause:`, ex);
            }
        });
    }
}

export const notifier = new Notifier();
