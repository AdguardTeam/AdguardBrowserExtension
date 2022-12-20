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

export const enum AppContextKey {
    IsInit = 'isInit',
    ClientId = 'clientId',
}

export type AppContextData = {
    [AppContextKey.IsInit]: boolean,
    [AppContextKey.ClientId]?: string,
};

/**
 * Memory storage for app global context
 */
export class AppContext {
    // Initialize with default data
    private data: AppContextData = {
        [AppContextKey.IsInit]: false,
    };

    /**
     * Gets app context value
     *
     * @param key - context key
     * @returns context value
     */
    public get<T extends AppContextKey>(key: T): AppContextData[T] {
        return this.data[key];
    }

    /**
     * Sets app context value
     *
     * @param key - context key
     * @param value - context value
     */
    public set<T extends AppContextKey>(key: T, value: AppContextData[T]): void {
        this.data[key] = value;
    }
}

export const appContext = new AppContext();
