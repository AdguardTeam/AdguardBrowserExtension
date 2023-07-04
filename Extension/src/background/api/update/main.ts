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
import { getErrorMessage } from '../../../common/error';
import { SbCache, storage } from '../../storages';
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
import {
    type SafebrowsingCacheData,
    type SafebrowsingStorageData,
    SettingOption,
    settingsValidator,
} from '../../schema';
import type { RunInfo } from '../../utils';
import { defaultSettings } from '../../../common/settings';
import { InstallApi } from '../install';

/**
 * Update API is a facade for handling migrations for the settings object from
 * browser.storage, to make sure that the application runs on the latest schema.
 */
export class UpdateApi {
    private static readonly schemaMigrationMap: Record<string, () => Promise<void>> = {
        '0': UpdateApi.migrateFromV0toV1,
        '1': UpdateApi.migrateFromV1toV2,
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

        // run migrations, if they needed.
        await UpdateApi.runMigrations(currentSchemaVersion, previousSchemaVersion);
    }

    /**
     * Checks previousSchemaVersion and if it is outdated - runs migrations.
     *
     * @param currentSchemaVersion Current data schema version.
     * @param previousSchemaVersion Previous data schema version.
     */
    private static async runMigrations(
        currentSchemaVersion: number,
        previousSchemaVersion: number,
    ): Promise<void> {
        try {
            // if schema version changes, process migration
            for (let schema = previousSchemaVersion; schema < currentSchemaVersion; schema += 1) {
                const schemaMigrationAction = UpdateApi.schemaMigrationMap[schema];

                if (!schemaMigrationAction) {
                    // eslint-disable-next-line max-len
                    throw new Error(`Cannot find schema migration action from ${previousSchemaVersion} to ${currentSchemaVersion}.`);
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
            // eslint-disable-next-line max-len
            const errMessage = `Error while schema migrating from ${previousSchemaVersion} to ${currentSchemaVersion}: ${getErrorMessage(e)}`;
            Log.error(errMessage);

            throw new Error(errMessage, { cause: e });
        }
    }

    /**
     * Run data migration from schema v1 to schema v2.
     */
    private static async migrateFromV1toV2(): Promise<void> {
        // From v4.2.135 we store timestamp of expiration time for safebrowsing cache records.
        const storageData = await storage.get(SB_LRU_CACHE_KEY);

        if (typeof storageData !== 'string') {
            return;
        }

        // parse v1 safebrowsing cache data
        const sbStorageDataV1 = zod.object({
            key: zod.string(),
            value: zod.string(),
        }).strict().array().parse(JSON.parse(storageData));

        const now = Date.now();

        // transform v1 safebrowsing storage data to v2
        const sbStorageDataV2: SafebrowsingStorageData = sbStorageDataV1.map(({ key, value }) => {
            const safebrowsingCacheRecord: SafebrowsingCacheData = { list: value };

            if (safebrowsingCacheRecord.list !== SbCache.SB_ALLOW_LIST) {
                safebrowsingCacheRecord.expires = now + SbCache.CACHE_TTL_MS;
            }

            return {
                key,
                value: safebrowsingCacheRecord,
            };
        });

        await storage.set(SB_LRU_CACHE_KEY, JSON.stringify(sbStorageDataV2));
    }

    /**
     * Run data migration from schema v0 to schema v1.
     *
     * TODO: Use string values when access to the old settings instead of
     * constants and enum values to minimize the risks when we might decide to
     * rename a field in an enumeration.
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

        // rename fields
        let keyToCheck = 'default-whitelist-mode';
        if (currentSettings?.[keyToCheck] !== undefined) {
            currentSettings[SettingOption.DefaultAllowlistMode] = currentSettings[keyToCheck];
            delete currentSettings[keyToCheck];
        }

        keyToCheck = 'white-list-domains';
        if (currentSettings?.[keyToCheck] !== undefined) {
            currentSettings[SettingOption.AllowlistDomains] = currentSettings[keyToCheck];
            delete currentSettings[keyToCheck];
        }

        keyToCheck = 'stealth_disable_stealth_mode';
        if (currentSettings?.[keyToCheck] !== undefined) {
            currentSettings[SettingOption.DisableStealthMode] = currentSettings[keyToCheck];
            delete currentSettings[keyToCheck];
        }

        keyToCheck = 'custom_filters';
        if (currentSettings?.[keyToCheck] !== undefined) {
            currentSettings[SettingOption.CustomFilters] = currentSettings[keyToCheck];
            delete currentSettings[keyToCheck];
        }

        // New group state 'touched' field added in 4.2
        // zod 'parse then transform' approach is used to transform data to actual schema
        if (typeof currentSettings?.[SettingOption.GroupsState] === 'string') {
            // create data transformer
            const groupsStateTransformer = zod.record(
                zod.object({
                    enabled: zod.boolean().optional(),
                }).transform((data) => {
                    const enabled = Boolean(data.enabled);
                    return {
                        enabled,
                        touched: enabled,
                    };
                }),
            );

            const currentGroupsStateData = JSON.parse(currentSettings[SettingOption.GroupsState]);
            currentSettings[SettingOption.GroupsState] = JSON.stringify(
                groupsStateTransformer.parse(currentGroupsStateData),
            );
        }

        // Check non exists fields in filters-state
        if (currentSettings?.['filters-state']) {
            const stringFiltersState = currentSettings['filters-state'] as string;
            const filtersState = JSON.parse(stringFiltersState);
            const keys = Object.keys(filtersState);
            for (let i = 0; i < keys.length; i += 1) {
                const key = keys[i];
                if (!key) {
                    continue;
                }

                if (filtersState[key]['installed'] === undefined) {
                    filtersState[key]['installed'] = false;
                }

                if (filtersState[key]['enabled'] === undefined) {
                    filtersState[key]['enabled'] = false;
                }
            }

            currentSettings['filters-state'] = JSON.stringify(filtersState);
        }

        // Check not exists fields in custom filters
        if (currentSettings?.['custom-filters']) {
            const stringCustomFiltersMetadata = currentSettings['custom-filters'] as string;
            const customFiltersMetadata = JSON.parse(stringCustomFiltersMetadata);
            if (Array.isArray(customFiltersMetadata)) {
                for (let i = 0; i < customFiltersMetadata.length; i += 1) {
                    const customFilterMetadata = customFiltersMetadata[i];

                    if (customFilterMetadata.trusted === undefined) {
                        customFilterMetadata.trusted = false;
                    }

                    if (!customFilterMetadata.timeUpdated) {
                        customFilterMetadata.timeUpdated = 0;
                    }

                    // Remove deprecated field.
                    if (customFilterMetadata.languages !== undefined) {
                        delete customFilterMetadata.languages;
                    }
                }
            }

            currentSettings['custom-filters'] = JSON.stringify(customFiltersMetadata);
        }

        // Check not exists fields in filters version for custom filters
        if (currentSettings?.['filters-version']) {
            const stringFiltersVersion = currentSettings['filters-version'] as string;
            const filtersVersion = JSON.parse(stringFiltersVersion);
            const keys = Object.keys(filtersVersion);
            for (let i = 0; i < keys.length; i += 1) {
                const key = keys[i];
                if (!key) {
                    continue;
                }

                if (filtersVersion[key]['lastUpdateTime'] === undefined) {
                    filtersVersion[key]['lastUpdateTime'] = 0;
                }
            }

            currentSettings['filters-version'] = JSON.stringify(filtersVersion);
        }

        // Parsing stealth cookie time values from string values (with possible
        // escaped quotes) to numeric values.
        const firstPartyCookiesTime = 'stealth-block-first-party-cookies-time';
        if (currentSettings?.[firstPartyCookiesTime] && typeof currentSettings[firstPartyCookiesTime] === 'string') {
            const rawValue = currentSettings[firstPartyCookiesTime];
            const parsedValue = Number(JSON.parse(rawValue));
            currentSettings[firstPartyCookiesTime] = parsedValue;
        }

        const thirdPartyCookiesTime = 'stealth-block-third-party-cookies-time';
        if (currentSettings?.[thirdPartyCookiesTime] && typeof currentSettings[thirdPartyCookiesTime] === 'string') {
            const rawValue = currentSettings[thirdPartyCookiesTime];
            const parsedValue = Number(JSON.parse(rawValue));
            currentSettings[thirdPartyCookiesTime] = parsedValue;
        }

        // Parsing appearance theme with escaped quotes.
        const appearanceTheme = 'appearance-theme';
        if (currentSettings?.[appearanceTheme]
            && typeof currentSettings[appearanceTheme] === 'string'
            && currentSettings[appearanceTheme].includes('\"')
        ) {
            const rawValue = currentSettings[appearanceTheme];
            // Removes escaped quotes.
            const parsedValue = JSON.parse(rawValue);
            currentSettings[appearanceTheme] = parsedValue;
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
}
