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

/**
 * Common storage interface with basic operations.
 */
export interface StorageInterface<
    K extends string | number | symbol = string,
    V = unknown,
    Mode extends 'sync' | 'async' = 'sync',
> {
    set(key: K, value: V): Mode extends 'async' ? Promise<void> : void;

    get(key: K): Mode extends 'async' ? Promise<V> : V;

    remove(key: K): Mode extends 'async' ? Promise<void> : void;
}

/**
 * Extended storage interface with additional operations.
 */
export interface ExtendedStorageInterface<
    K extends string | number | symbol = string,
    V = unknown,
    Mode extends 'sync' | 'async' = 'sync',
> extends StorageInterface<K, V, Mode> {
    setMultiple(data: Record<K, V>): Mode extends 'async' ? Promise<boolean> : boolean;

    removeMultiple(keys: K[]): Mode extends 'async' ? Promise<boolean> : boolean;

    entries(): Mode extends 'async' ? Promise<Record<K, V>> : Record<K, V>;

    keys(): Mode extends 'async' ? Promise<K[]> : K[];

    has(key: K): Mode extends 'async' ? Promise<boolean> : boolean;
}
