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

/**
 * Update API is a facade for migrations to make sure that the application
 * runs on the latest schema.
 */
export class UpdateApi {
    private static schemaMigrationMap: Record<string, () => Promise<void>> = {
        '0': UpdateApi.migrateFromV0toV1,
    };

    /**
     * Runs app updates depends on previous and current data schema.
     *
     * @param runInfo Info about extension start up.
     * @param runInfo.clientId Client id.
     * @param runInfo.currentAppVersion Current extension version.
     * @param runInfo.currentSchemaVersion Current data schema version.
     * @param runInfo.previousSchemaVersion Previous data schema version.
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

        try {
            // if schema version changes, process migration
            for (let schema = previousSchemaVersion; schema < currentSchemaVersion; schema += 1) {
                const schemaMigrationAction = this.schemaMigrationMap[schema];

                if (!schemaMigrationAction) {
                    throw new Error(`Can't find schema migration action from ${previousSchemaVersion} `
                        + `to ${currentSchemaVersion}.`);
                }

                // eslint-disable-next-line no-await-in-loop
                await UpdateApi.runSchemaMigration(schemaMigrationAction, schema, schema + 1);
            }
        } catch (e) {
            Log.error('Error while migrate: ', e);
            Log.info('Reset settings...');
            await storage.set(ADGUARD_SETTINGS_KEY, defaultSettings);
        }
    }

    /**
     * Runs schema migration.
     *
     * @param schemaMigrationAction Schema migration action.
     * @param previousSchemaVersion Previous data schema version.
     * @param currentSchemaVersion Current data schema version.
     */
    private static async runSchemaMigration(
        schemaMigrationAction: () => Promise<void>,
        previousSchemaVersion: number,
        currentSchemaVersion: number,
    ): Promise<void> {
        try {
            await schemaMigrationAction();
        } catch (e: unknown) {
            const errMessage = `Error while schema migrating from ${previousSchemaVersion} `
                + `to ${currentSchemaVersion}: ${e instanceof Error ? e.message : e}`;
            Log.error(errMessage);

            throw new Error(errMessage, { cause: e });
        }
    }

    /**
     * Run data migration from schema v0 to schema v1.
     */
    private static async migrateFromV0toV1(): Promise<void> {
        // In the v4.0.171 we have littered window.localStorage with proms used in the promo notifications module,
        // now we are clearing them

        window.localStorage.removeItem(VIEWED_NOTIFICATIONS_KEY);
        window.localStorage.removeItem(LAST_NOTIFICATION_TIME_KEY);

        // In the v4.2.0 we are refactoring storage data structure

        // get current settings
        const storageData = await storage.get(ADGUARD_SETTINGS_KEY);

        // check if current settings is record
        const currentSettings = zod.record(zod.unknown()).parse(storageData);

        // delete app version from settings
        if (currentSettings?.[APP_VERSION_KEY]) {
            delete currentSettings[APP_VERSION_KEY];
        }

        // delete metadata from settings (new one will be loaded while filter initialization)
        if (currentSettings?.[SettingOption.I18nMetadata]) {
            delete currentSettings[SettingOption.I18nMetadata];
        }

        if (currentSettings?.[SettingOption.Metadata]) {
            delete currentSettings[SettingOption.Metadata];
        }

        // move them to new fields
        if (currentSettings?.['default-whitelist-mode'] !== undefined) {
            currentSettings[SettingOption.DefaultAllowlistMode] = currentSettings['default-whitelist-mode'];
            delete currentSettings['default-whitelist-mode'];
        }

        if (currentSettings?.['white-list-domains'] !== undefined) {
            currentSettings[SettingOption.AllowlistDomains] = currentSettings['white-list-domains'];
            delete currentSettings['white-list-domains'];
        }

        // New group state 'toggled' field added in 4.2
        // zod 'parse then transform' approach is used to transform data to actual schema
        if (typeof currentSettings?.[SettingOption.GroupsState] === 'string') {
            // create data transformer
            const groupsStateTransformer = zod.record(
                zod.object({
                    enabled: zod.boolean(),
                }).transform(({ enabled }) => ({
                    enabled,
                    toggled: enabled,
                })),
            );

            const currentGroupsStateData = JSON.parse(currentSettings[SettingOption.GroupsState]);
            currentSettings[SettingOption.GroupsState] = JSON.stringify(
                groupsStateTransformer.parse(currentGroupsStateData),
            );
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
     * Moves data from settings to root storage.
     *
     * @param key Settings key.
     * @param currentSettings Current settings object.
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
     * Purge data, which don't need to save while app updating.
     */
    private static async clearCache(): Promise<void> {
        await SafebrowsingApi.clearCache();
    }
}
