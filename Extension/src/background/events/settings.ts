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
import { SettingOption, Settings } from '../schema';

export type SettingsListener<T extends keyof Settings> = (value: Settings[T]) => void | Promise<void>;

/**
 * Type-safe mediator for setting options change events.
 */
export class SettingsEvents {
    private listenersMap = new Map();

    /**
     * Adds a listener for settings events. Only one listener per event.
     *
     * @param event Event with some generic type.
     * @param listener Listener for this event.
     *
     * @throws Basic {@link Error} if a listener was registered for the event.
     */
    public addListener<T extends SettingOption>(event: T, listener: SettingsListener<T>): void {
        if (this.listenersMap.has(event)) {
            throw new Error(`${event} listener has already been registered`);
        }
        this.listenersMap.set(event, listener);
    }

    /**
     * Publishes the event and, if a listener is found, notifies the listener.
     *
     * @param event Event with some generic type.
     * @param value Some filed in the {@link Settings} object.
     *
     * @returns Promise that resolves when the listener is notified.
     */
    public async publishEvent<T extends SettingOption>(event: T, value: Settings[T]): Promise<void> {
        const listener = this.listenersMap.get(event) as SettingsListener<T>;
        if (listener) {
            return Promise.resolve(listener(value));
        }
    }

    /**
     * Removes all listeners.
     */
    public removeListeners(): void {
        this.listenersMap.clear();
    }
}

export const settingsEvents = new SettingsEvents();
