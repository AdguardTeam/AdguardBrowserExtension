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
import { debounce } from 'lodash-es';

import { ADGUARD_SETTINGS_KEY } from '../../common/constants';
import { type StorageInterface } from '../../common/storage';
import { type Settings, type SettingOption } from '../schema';

import { browserStorage } from './shared-instances';

/**
 * Storage for app settings.
 */
class SettingsStorage implements StorageInterface<SettingOption, Settings[SettingOption]> {
    static saveTimeoutMs = 100;

    /**
     * Saves settings in browser.storage.local with {@link saveTimeoutMs} debounce.
     */
    private save = debounce(() => {
        browserStorage.set(ADGUARD_SETTINGS_KEY, this.settings);
    }, SettingsStorage.saveTimeoutMs);

    private settings: Settings | undefined;

    /**
     * Sets setting to storage.
     *
     * @param key Setting key.
     * @param value Setting value.
     *
     * @throws Error if settings are not initialized.
     */
    public set<T extends SettingOption>(key: T, value: Settings[T]): void {
        if (!this.settings) {
            throw SettingsStorage.createNotInitializedError();
        }

        this.settings[key] = value;
        this.save();
    }

    /**
     * Returns setting from storage.
     *
     * @param key Setting key.
     *
     * @returns Setting value.
     *
     * @throws Error if settings are not initialized.
     */
    public get<T extends SettingOption>(key: T): Settings[T] {
        if (!this.settings) {
            throw SettingsStorage.createNotInitializedError();
        }

        return this.settings[key];
    }

    /**
     * Remove setting from storage.
     *
     * @param key Setting key.
     *
     * @throws Error if settings are not initialized.
     */
    public remove(key: SettingOption): void {
        if (!this.settings) {
            throw SettingsStorage.createNotInitializedError();
        }

        if (this.settings[key]) {
            delete this.settings[key];
            this.save();
        }
    }

    /**
     * Returns current settings.
     *
     * @returns Current settings.
     *
     * @throws Error if settings are not initialized.
     */
    public getData(): Settings {
        if (!this.settings) {
            throw SettingsStorage.createNotInitializedError();
        }

        return this.settings;
    }

    /**
     * Set settings to memory cache.
     *
     * @param settings Settings data.
     */
    public setCache(settings: Settings): void {
        this.settings = settings;
    }

    /**
     * Set settings to cache and save in browser.storage.local.
     *
     * @param settings Settings data.
     */
    public setData(settings: Settings): void {
        this.setCache(settings);
        this.save();
    }

    /**
     * Helper function to create a basic {@link Error} with a custom message.
     *
     * @returns A basic {@link Error} with a custom message.
     */
    private static createNotInitializedError(): Error {
        return new Error('settings is not initialized');
    }
}

export const settingsStorage = new SettingsStorage();
