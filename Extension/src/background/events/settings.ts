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
 * Type-safe mediator for setting options change events
 */
export class SettingsEvents {
    private listenersMap = new Map();

    public addListener<T extends SettingOption>(type: T, listener: SettingsListener<T>): void {
        if (this.listenersMap.has(type)) {
            throw new Error(`${type} listener has already been registered`);
        }
        this.listenersMap.set(type, listener);
    }

    public async publishEvent<T extends SettingOption>(type: T, value: Settings[T]): Promise<void> {
        const listener = this.listenersMap.get(type) as SettingsListener<T>;
        if (listener) {
            return Promise.resolve(listener(value));
        }
    }

    public removeListeners(): void {
        this.listenersMap.clear();
    }
}

export const settingsEvents = new SettingsEvents();
