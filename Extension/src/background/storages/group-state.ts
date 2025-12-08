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
import {
    SettingOption,
    type Metadata,
    type GroupStateData,
    type GroupStateStorageData,
} from '../schema';
import { StringStorage } from '../utils/string-storage';

import { settingsStorage } from './settings';

/**
 * Class for synchronous control {@link GroupStateStorageData},
 * that is persisted as string in another key value storage.
 *
 * @see {@link StringStorage}
 */
export class GroupStateStorage extends StringStorage<
    SettingOption.GroupsState,
    GroupStateStorageData,
    'sync'
> {
    // default group state
    private static defaultState = {
        enabled: false,
        touched: false,
    };

    /**
     * Returns specified group state.
     *
     * @param groupId Group id.
     *
     * @returns Specified group state.
     *
     * @throws Error if group state data is not initialized.
     */
    public get(groupId: number): GroupStateData | undefined {
        if (!this.data) {
            throw GroupStateStorage.createNotInitializedError();
        }

        return this.data[groupId];
    }

    /**
     * Sets specified group state.
     *
     * @param groupId Group id.
     * @param state Group state.
     *
     * @throws Error if group state data is not initialized.
     */
    public set(groupId: number, state: GroupStateData): void {
        if (!this.data) {
            throw GroupStateStorage.createNotInitializedError();
        }

        this.data[groupId] = state;

        this.save();
    }

    /**
     * Delete specified group state.
     *
     * @param groupId Group id.
     *
     * @throws Error if group state data is not initialized.
     */
    public delete(groupId: number): void {
        if (!this.data) {
            throw GroupStateStorage.createNotInitializedError();
        }

        delete this.data[groupId];

        this.save();
    }

    /**
     * Returns list of enabled groups ids.
     *
     * @returns List of enabled groups ids.
     *
     * @throws Error if group state data is not initialized.
     */
    public getEnabledGroups(): number[] {
        if (!this.data) {
            throw GroupStateStorage.createNotInitializedError();
        }

        return Object
            .entries(this.data)
            .filter(([,state]) => state.enabled)
            .map(([id]) => Number(id));
    }

    /**
     * Enables specified groups.
     *
     * @param groupIds List of groups to enable.
     * @param touched Mark groups as touched on enabling.
     *
     * @throws Error if group state data is not initialized.
     */
    public enableGroups(groupIds: number[], touched = true): void {
        if (!this.data) {
            throw GroupStateStorage.createNotInitializedError();
        }

        for (let i = 0; i < groupIds.length; i += 1) {
            const groupId = groupIds[i];

            if (groupId !== undefined) {
                this.data[groupId] = {
                    enabled: true,
                    touched,
                };
            }
        }

        this.save();
    }

    /**
     * Disables specified groups.
     *
     * @param groupIds List of groups to disable.
     * @param touched Mark groups as touched on disabling.
     *
     * @throws Error if group state data is not initialized.
     */
    public disableGroups(groupIds: number[], touched = true): void {
        if (!this.data) {
            throw GroupStateStorage.createNotInitializedError();
        }

        for (let i = 0; i < groupIds.length; i += 1) {
            const groupId = groupIds[i];

            if (groupId !== undefined) {
                this.data[groupId] = {
                    enabled: false,
                    touched,
                };
            }
        }

        this.save();
    }

    /**
     * Sets {@link defaultState} for new groups, found in passed {@link Metadata}.
     *
     * @param states Current {@link GroupStateStorageData}.
     * @param metadata App {@link Metadata}.
     *
     * @returns Updated {@link GroupStateStorageData}.
     */
    public static applyMetadata(
        states: GroupStateStorageData,
        metadata: Metadata,
    ): GroupStateStorageData {
        const { groups } = metadata;

        groups.forEach(({ groupId }) => {
            if (!states[groupId]) {
                states[groupId] = { ...GroupStateStorage.defaultState };
            }
        });

        return states;
    }

    /**
     * Helper function to create a basic {@link Error} with a custom message.
     *
     * @returns A basic {@link Error} with a custom message.
     */
    private static createNotInitializedError(): Error {
        return new Error('Group state data is not initialized');
    }
}

/**
 * {@link GroupStateStorage} Instance, that stores
 * stringified {@link GroupStateStorageData} in {@link settingsStorage} under
 * {@link SettingOption.GroupsState} key.
 */
export const groupStateStorage = new GroupStateStorage(SettingOption.GroupsState, settingsStorage);
