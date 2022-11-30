/**
 * @file
 * This file is part of Adguard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * Adguard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Adguard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Adguard Browser Extension. If not, see <http://www.gnu.org/licenses/>.
 */
import zod from 'zod';

import { Log } from '../../../common/log';
import { storage } from '../../storages';
import {
    ADGUARD_SETTINGS_KEY,
    APP_VERSION_KEY,
    CLIENT_ID_KEY,
    LAST_NOTIFICATION_TIME_KEY,
    PAGE_STATISTIC_KEY,
    SB_LRU_CACHE_KEY,
    SB_SUSPENDED_CACHE_KEY,
    SCHEMA_VERSION_KEY,
    VIEWED_NOTIFICATIONS_KEY,
} from '../../../common/constants';

import { SettingOption, settingsValidator } from '../../schema';
import { SafebrowsingApi } from '../safebrowsing';
import { RunInfo } from '../../utils';
import { defaultSettings } from '../../../common/settings';
import { InstallApi } from '../install';

export class UpdateApi {
    private static schemaMigrationMap: Record<string, () => Promise<void>> = {
        [UpdateApi.createSchemaMigrationKey(0, 1)]: UpdateApi.migrateFromV0toV1,
    };

    /**
     * Runs app updates depends on previous and current data scheme
     *
     * @param runInfo - info about extension start up
     * @param runInfo.clientId - client id
     * @param runInfo.currentAppVersion - current extension version
     * @param runInfo.currentSchemaVersion - current data schema version
     * @param runInfo.previousSchemaVersion - previous data schema version
     */
    public static async update({
        clientId,
        currentAppVersion,
        currentSchemaVersion,
        previousSchemaVersion,
    }: RunInfo): Promise<void> {
        // check clientId existence
        if (clientId) {
            await storage.set(CLIENT_ID_KEY, clientId);
        } else {
            await storage.set(CLIENT_ID_KEY, InstallApi.genClientId());
        }

        // set actual schema and app version
        await storage.set(SCHEMA_VERSION_KEY, currentSchemaVersion);
        await storage.set(APP_VERSION_KEY, currentAppVersion);

        // clear persisted caches
        await UpdateApi.clearCache();

        // if schema version changes, process migration
        if (previousSchemaVersion !== currentSchemaVersion) {
            await UpdateApi.runSchemaMigration(previousSchemaVersion, currentSchemaVersion);
        }
    }

    /**
     * Create scheme migration key for mapping update strategy
     *
     * @param previousSchemaVersion - previous data schema version
     * @param currentSchemaVersion - current data schema version
     * @returns scheme migration key
     */
    private static createSchemaMigrationKey(
        previousSchemaVersion: number,
        currentSchemaVersion: number,
    ): string {
        return `${previousSchemaVersion}-${currentSchemaVersion}`;
    }

    /**
     * Run scheme migration
     *
     * @param previousSchemaVersion - previous data schema version
     * @param currentSchemaVersion - current data schema version
     */
    private static async runSchemaMigration(
        previousSchemaVersion: number,
        currentSchemaVersion: number,
    ): Promise<void> {
        const schemaMigrationKey = UpdateApi.createSchemaMigrationKey(previousSchemaVersion, currentSchemaVersion);
        const schemaMigrationAction = UpdateApi.schemaMigrationMap[schemaMigrationKey];

        try {
            if (!schemaMigrationAction) {
                throw new Error('can`t find schema migration action');
            }

            await schemaMigrationAction();
        } catch (e) {
            Log.error(`Error while schema migrating from ${
                previousSchemaVersion
            } to ${
                currentSchemaVersion
            }: ${
                e instanceof Error ? e.message : e
            }`);

            Log.info('Reset settings...');
            await storage.set(ADGUARD_SETTINGS_KEY, defaultSettings);
        }
    }

    /**
     * Run data migration from scheme v0 to scheme v1
     */
    private static async migrateFromV0toV1(): Promise<void> {
        // In the v4.0.171 we have littered window.localStorage with proms used in the promo notifications module,
        // now we are clearing them

        window.localStorage.removeItem(VIEWED_NOTIFICATIONS_KEY);
        window.localStorage.removeItem(LAST_NOTIFICATION_TIME_KEY);

        // In the v4.2.0 we refactoring storage data structure

        // get current settings
        const storageData = await storage.get(ADGUARD_SETTINGS_KEY);

        // check if current settings is record
        const currentSettings = zod.record(zod.unknown()).parse(storageData);

        // delete app version from settings
        if (currentSettings[APP_VERSION_KEY]) {
            delete currentSettings[APP_VERSION_KEY];
        }

        // delete metadata from settings (new one will be loaded while filter initialization)
        if (currentSettings?.[SettingOption.I18nMetadata]) {
            delete currentSettings[SettingOption.I18nMetadata];
        }

        if (currentSettings?.[SettingOption.Metadata]) {
            delete currentSettings[SettingOption.Metadata];
        }

        // mode notification data from settings to root storage
        await UpdateApi.moveStorageData(VIEWED_NOTIFICATIONS_KEY, currentSettings);
        await UpdateApi.moveStorageData(LAST_NOTIFICATION_TIME_KEY, currentSettings);

        // move client id from settings to root storage
        await UpdateApi.moveStorageData(CLIENT_ID_KEY, currentSettings);

        // move page stats to root storage
        await UpdateApi.moveStorageData(PAGE_STATISTIC_KEY, currentSettings);

        // move safebrowsing from settings data to root storage
        await UpdateApi.moveStorageData(SB_SUSPENDED_CACHE_KEY, currentSettings);
        await UpdateApi.moveStorageData(SB_LRU_CACHE_KEY, currentSettings);

        // merge current with default settings and validate
        const settings = settingsValidator.parse({ ...defaultSettings, ...currentSettings });

        // set new settings to storage
        await storage.set(ADGUARD_SETTINGS_KEY, settings);
    }

    /**
     * Moves data from settings to root storage
     *
     * @param key - settings key
     * @param currentSettings - current settings object
     */
    private static async moveStorageData(
        key: string,
        currentSettings: Record<string, unknown>,
    ): Promise<void> {
        const data = currentSettings?.[key];

        if (data) {
            delete currentSettings[key];
            await storage.set(key, data);
        }
    }

    /**
     * Purge data, which don't need to save while app updating
     */
    private static async clearCache(): Promise<void> {
        await SafebrowsingApi.clearCache();
    }
}
