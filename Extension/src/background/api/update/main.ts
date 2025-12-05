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
import zod from 'zod';
import isString from 'lodash-es/isString';
import isUndefined from 'lodash-es/isUndefined';
import isObject from 'lodash-es/isObject';
import { trimEnd } from 'lodash-es';

import { logger } from '../../../common/logger';
import { getZodErrorMessage } from '../../../common/error';
import {
    RAW_FILTER_KEY_PREFIX,
    FiltersStorage,
    SbCache,
    hybridStorage,
    browserStorage,
    RawFiltersStorage,
} from '../../storages';
import {
    ADGUARD_SETTINGS_KEY,
    APP_VERSION_KEY,
    AntiBannerFiltersId,
    CLIENT_ID_KEY,
    FILTER_LIST_EXTENSION,
    NEWLINE_CHAR_REGEX,
    PAGE_STATISTIC_KEY,
    RULES_LIMITS_KEY,
    SCHEMA_VERSION_KEY,
    SEPARATE_ANNOYANCE_FILTER_IDS,
} from '../../../common/constants';
import {
    appearanceValidator,
    type PageStats,
    pageStatsValidator,
    SchemaPreprocessor,
    SettingOption,
} from '../../schema';
import { type RunInfo } from '../../utils/run-info';
import { IDBUtils } from '../../utils/indexed-db';
import { defaultSettings } from '../../../common/settings';
import { InstallApi } from '../install';
import { PopupStatsCategories } from '../page-stats';
import { HybridStorage } from '../../storages/hybrid-storage';

// These imports are used for migrations before v11.
import {
    FiltersStorage as FiltersStorageV1,
    BINARY_FILTER_KEY_PREFIX,
    CONVERSION_MAP_PREFIX,
    FILTER_KEY_PREFIX,
    SOURCE_MAP_PREFIX,
} from './assets/old-filters-storage-v1';
import { HybridStorage as HybridStorageV1 } from './assets/old-hybrid-storage-v1';

/**
 * Update API is a facade for handling migrations for the settings object from
 * browser.storage, to make sure that the application runs on the latest schema.
 */
export class UpdateApi {
    private static readonly schemaMigrationMap: Record<string, () => Promise<void>> = {
        '0': UpdateApi.migrateFromV0toV1,
        '1': UpdateApi.migrateFromV1toV2,
        '2': UpdateApi.migrateFromV2toV3,
        '3': UpdateApi.migrateFromV3toV4,
        '4': UpdateApi.migrateFromV4toV5,
        '5': UpdateApi.migrateFromV5toV6,
        '6': UpdateApi.migrateFromV6toV7,
        '7': UpdateApi.migrateFromV7toV8,
        '8': UpdateApi.migrateFromV8toV9,
        '9': UpdateApi.migrateFromV9toV10,
        '10': UpdateApi.migrateFromV10toV11,
        '11': UpdateApi.migrateFromV11toV12,
        '12': UpdateApi.migrateFromV12toV13,
        '14': UpdateApi.migrateFromV13toV14,
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
            await browserStorage.set(CLIENT_ID_KEY, clientId);
        } else {
            await browserStorage.set(CLIENT_ID_KEY, InstallApi.genClientId());
        }

        // set actual schema and app version
        await browserStorage.set(SCHEMA_VERSION_KEY, currentSchemaVersion);
        await browserStorage.set(APP_VERSION_KEY, currentAppVersion);

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
            logger.error('[ext.UpdateApi.runMigrations]: error while migrate:', getZodErrorMessage(e));
            logger.info('[ext.UpdateApi.runMigrations]: Reset settings...');
            await browserStorage.set(ADGUARD_SETTINGS_KEY, defaultSettings);
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
            const errMessage = `Error while schema migrating from ${previousSchemaVersion} to ${currentSchemaVersion}: ${getZodErrorMessage(e)}`;
            logger.error('[ext.UpdateApi.runSchemaMigration]:', errMessage);

            throw new Error(errMessage, { cause: e });
        }
    }

    /**
     * Legacy deserialization function for Uint8Array.
     *
     * Helper function to deserialize Uint8Array members of an object.
     * This workaround is needed because by default chrome.storage API doesn't support Uint8Array,
     * and we use it to store serialized filter lists.
     *
     * @param value Object to deserialize.
     *
     * @returns Deserialized object.
     */
    private static deserialize = (value: unknown): unknown => {
        const isObj = isObject(value);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (isObj && (value as any).__type === 'Uint8Array') {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return new Uint8Array((value as any).data);
        }

        if (Array.isArray(value)) {
            return value.map(this.deserialize);
        }

        if (isObj) {
            const deserializedObject: { [key: string]: unknown } = {};
            // eslint-disable-next-line no-restricted-syntax
            for (const [key, val] of Object.entries(value)) {
                deserializedObject[key] = this.deserialize(val);
            }
            return deserializedObject;
        }

        return value;
    };

    /**
     * Run data migration from schema v13 to schema v14.
     *
     * Adds the new {SettingOption.PreserveLogEnabled} setting with default value false.
     *
     * For the extension update to v5.3.0.
     */
    private static async migrateFromV13toV14(): Promise<void> {
        const settings = await browserStorage.get(ADGUARD_SETTINGS_KEY);

        if (!UpdateApi.isObject(settings)) {
            throw new Error('Settings is not an object');
        }
        settings[SettingOption.PreserveLogEnabled] = false;

        await browserStorage.set(ADGUARD_SETTINGS_KEY, settings);
    }

    /**
     * Run data migration from schema v12 to schema v13.
     *
     * Adds the new {SettingOption.AllowAnonymizedUsageData} setting with default value false.
     *
     * For the extension update to v5.2.600.X.
     */
    private static async migrateFromV12toV13(): Promise<void> {
        const settings = await browserStorage.get(ADGUARD_SETTINGS_KEY);

        if (!UpdateApi.isObject(settings)) {
            throw new Error('Settings is not an object');
        }
        settings[SettingOption.AllowAnonymizedUsageData] = false;

        await browserStorage.set(ADGUARD_SETTINGS_KEY, settings);
    }

    /**
     * Run data migration from schema v11 to schema v12.
     *
     * For MV3 — No action needed (Quick Fixes filter has been removed).
     *
     * For MV2 — AdGuard DNS filter and AdGuard Annoyances filter are migrated.
     *
     * For the extension update to v5.2.0.
     */
    private static async migrateFromV11toV12(): Promise<void> {
        // No action needed for MV3
        if (__IS_MV3__) {
            return;
        }

        const settings = await browserStorage.get(ADGUARD_SETTINGS_KEY);

        if (!UpdateApi.isObject(settings)) {
            throw new Error('Settings is not an object');
        }

        let updatedSettings = await UpdateApi.migrateCombinedAnnoyancesFilter(settings);
        await FiltersStorage.remove(AntiBannerFiltersId.AnnoyancesCombinedFilterId);
        await RawFiltersStorage.remove(AntiBannerFiltersId.AnnoyancesCombinedFilterId);

        updatedSettings = await UpdateApi.removeDnsFilter(updatedSettings);
        await FiltersStorage.remove(AntiBannerFiltersId.DnsFilterId);
        await RawFiltersStorage.remove(AntiBannerFiltersId.DnsFilterId);

        await browserStorage.set(ADGUARD_SETTINGS_KEY, updatedSettings);
    }

    /**
     * Run data migration from schema v10 to schema v11.
     *
     * For the extension update to v5.1.62.
     */
    private static async migrateFromV10toV11(): Promise<void> {
        let entries: Record<string, unknown> = {};

        // Part 1. Migrate serialized data.
        // Some date, like typed arrays, are not JSON serializable. In IDB, we can store such data without any problems.
        // But if IDB is not supported, hybrid storage falls back to browser.storage.local,
        // where we only can store JSON-serializable data.
        // To be able to store such data in browser.storage.local, we serialize such data when using hybrid storage.
        // However, in the latest version, we introduced a more robust way to serialize data:
        // instead of the legacy custom implementation, we use SuperJSON.
        // We migrate old serialized data to the new format in this migration, but only if IDB is not supported.
        if (!await HybridStorage.isIDBSupported()) {
            entries = await browserStorage.entries();

            // Get relevant keys.
            const keys = Object.keys(entries).filter((key) => [
                RAW_FILTER_KEY_PREFIX,
                BINARY_FILTER_KEY_PREFIX,
                FILTER_KEY_PREFIX,
                CONVERSION_MAP_PREFIX,
                SOURCE_MAP_PREFIX,
            ].some((prefix) => key.startsWith(prefix)));

            if (keys.length > 0) {
                const migrationData: Record<string, unknown> = {};

                keys.forEach((key) => {
                    const val = entries[key];
                    // Deserialize data using the legacy deserialization function.
                    const deserializeResult = UpdateApi.deserialize(val);

                    migrationData[key] = deserializeResult;
                });

                // This will automatically serialize data using SuperJSON.
                const transactionResult = await hybridStorage.setMultiple(migrationData);

                if (!transactionResult) {
                    logger.error('[ext.UpdateApi.migrateFromV10toV11]: failed to save migrated data');
                }
            } else {
                logger.debug('[ext.UpdateApi.migrateFromV10toV11]: no serialized data to migrate');
            }
        } else {
            logger.debug('[ext.UpdateApi.migrateFromV10toV11]: IDB is supported, no need to migrate serialized data');
        }

        // Part 2. Migrate filters keys.
        // To provide better integration with preprocessed filters, we changed keys for filters data:
        // filterrules_<id>.txt -> rawFilterList_<id>
        // binaryfilterrules_<id>.txt -> filterList_<id>
        // conversionmap_<id>.txt -> conversionMap_<id>
        // sourcemap_<id>.txt -> sourceMap_<id>
        entries = await hybridStorage.entries();

        /**
         * Mapping of old key prefixes to new key prefixes.
         */
        const filtersKeyPrefixesMap: ReadonlyMap<string, string> = new Map<string, string>([
            [FILTER_KEY_PREFIX, FiltersStorage.KEY_RAW_FILTER_LIST],
            [BINARY_FILTER_KEY_PREFIX, FiltersStorage.KEY_FILTER_LIST],
            [CONVERSION_MAP_PREFIX, FiltersStorage.KEY_CONVERSION_MAP],
            [SOURCE_MAP_PREFIX, FiltersStorage.KEY_SOURCE_MAP],
        ]);
        const filtersKeyPrefixesEntries = Array.from(filtersKeyPrefixesMap.entries());
        const migrationData: Record<string, unknown> = {};
        const keysToRemove: string[] = [];
        const keys = Object.keys(entries);

        keys.forEach((key) => {
            filtersKeyPrefixesEntries.forEach(([oldPrefix, newPrefix]) => {
                if (key.startsWith(oldPrefix)) {
                    const newKey = trimEnd(
                        key.replace(oldPrefix, `${newPrefix}${FiltersStorage.KEY_COMBINER}`),
                        FILTER_LIST_EXTENSION,
                    );
                    migrationData[newKey] = entries[key];
                    keysToRemove.push(key);
                }
            });
        });

        await hybridStorage.setMultiple(migrationData);

        if (keysToRemove.length > 0) {
            await hybridStorage.removeMultiple(keysToRemove);
        }
    }

    /**
     * Run data migration from schema v9 to schema v10.
     *
     * For the extension update to v5.0.187.
     *
     * For MV2 version we will run empty migration since we don't need
     * to do anything, just increase the schema version.
     *
     * For MV3 version we need to again remove Quick Fixes filter state.
     */
    private static async migrateFromV9toV10(): Promise<void> {
        // This migration should be done only for MV3 version.
        if (!__IS_MV3__) {
            return;
        }

        await UpdateApi.removeQuickFixesFilter();
    }

    /**
     * Run data migration from schema v8 to schema v9.
     *
     * For the extension update to v5.0.185.
     *
     * For MV2 version we will run empty migration since we don't need
     * to do anything, just increase the schema version.
     *
     * In this update we re-added AdGuard Quick Fixes filter
     * and want to enable it by default for all users.
     */
    private static async migrateFromV8toV9(): Promise<void> {
        // This migration should be done only for MV3 version.
        if (!__IS_MV3__) {
            return;
        }

        // We cannot load and enable filter here, because filter's API is not
        // initialized yet. So we just set the filter state to enabled
        // and loaded.
        // After that it will be renew from the local copy of filters
        // - which will create all needed filter's objects in memory to correct
        // work.
        await UpdateApi.addQuickFixesFilter(true);
    }

    /**
     * Run data migration from schema v7 to schema v8.
     *
     * For the extension update to v5.0.183.
     *
     * For MV2 version we will run empty migration since we don't need
     * to do anything, just increase the schema version.
     *
     * For MV3 version we need to remove deprecated Quick Fixes filter state.
     */
    private static async migrateFromV7toV8(): Promise<void> {
        // This migration should be done only for MV3 version.
        if (!__IS_MV3__) {
            return;
        }

        await UpdateApi.removeQuickFixesFilter();
    }

    /**
     * Run data migration from schema v6 to schema v7.
     *
     * For the extension update to
     * - v5.0.78-beta;
     * - v5.0.91.
     *
     * IMPORTANT: should not be combined with {@link migrateFromV5toV6} just because it is
     * for the same *release* version — the related changes became available
     * in *different beta* versions, so they should be run separately.
     *
     * For MV2 version we will run empty migration since we don't need
     * to do anything, just increase the schema version.
     *
     * In this update we added new filter - AdGuard Quick Fixes and want
     * to enable it by default for all users.
     */
    private static async migrateFromV6toV7(): Promise<void> {
        // This migration should be done only for MV3 version.
        if (!__IS_MV3__) {
            return;
        }

        // We cannot load and enable filter here, because filter's API is not
        // initialized yet. So we just set the filter state to enabled
        // and loaded.
        // After that it will be renew from the local copy of filters
        // - which will create all needed filter's objects in memory to correct
        // work.
        await UpdateApi.addQuickFixesFilter(true);
    }

    /**
     * Run data migration from schema v5 to schema v6.
     *
     * For the extension update to
     * - v5.0.49-beta;
     * - v5.0.91.
     */
    private static async migrateFromV5toV6(): Promise<void> {
        const rawOldPageStatistics = await browserStorage.get(PAGE_STATISTIC_KEY);

        if (typeof rawOldPageStatistics !== 'string') {
            logger.debug('[ext.UpdateApi.migrateFromV5toV6]: missing page statistics, nothing to migrate');
            return;
        }

        let oldPageStatisticsStr = rawOldPageStatistics;
        if (
            (oldPageStatisticsStr.startsWith('"') && oldPageStatisticsStr.endsWith('"'))
            || (oldPageStatisticsStr.startsWith("'") && oldPageStatisticsStr.endsWith("'"))
        ) {
            // beautify the string before parsing
            oldPageStatisticsStr = oldPageStatisticsStr.slice(1, -1);
        }

        let oldPageStatistics: PageStats;
        try {
            const oldPageStatisticsObj = JSON.parse(oldPageStatisticsStr);
            oldPageStatistics = pageStatsValidator.parse(oldPageStatisticsObj);
        } catch (e: unknown) {
            logger.debug('[ext.UpdateApi.migrateFromV5toV6]: nothing to migrate, since page statistics cannot be parsed:', getZodErrorMessage(e));
            return;
        }

        if (!oldPageStatistics.data) {
            logger.debug('[ext.UpdateApi.migrateFromV5toV6]: no page statistics data to migrate');
            return;
        }

        /**
         * Mapping of old group ids to new categories: where
         * - key — filters group id (old stats format),
         * - value — category name (new stats format).
         */
        const STATS_CATEGORIES_MIGRATION_MAP: Record<string, string> = {
            '0': PopupStatsCategories.Advertising,
            '1': PopupStatsCategories.Advertising,
            '2': PopupStatsCategories.Trackers,
            '3': PopupStatsCategories.SocialMedia,
            '4': PopupStatsCategories.Advertising,
            '5': PopupStatsCategories.Advertising,
            '6': PopupStatsCategories.Advertising,
            '7': PopupStatsCategories.Advertising,
        };

        /**
         * Migrate old stats data item (where filters group ids were used)
         * to the new format (where stats categories are used based on companiesdb).
         *
         * @param oldDataItem Old stats data item for `hours`, `days`, and `months`.
         *
         * @returns Migrated stats data item.
         *
         * @example
         * `{"0":10,"1":10,"2":10,"3":10,"4":10,"5":10,"6":10,"7":10,"total":80}`
         * ↓↓↓
         * `{"Advertising":60,"Trackers":10,"SocialMedia":10,"total":80}`
         */
        const migrateStatsDataItem = (oldDataItem: Record<string, number>): Record<string, number> => {
            let total = 0;
            const newDataItem: Record<string, number> = {};

            const oldKeys = Object.keys(oldDataItem);
            oldKeys.forEach((key) => {
                if (key === 'total') {
                    return;
                }

                const statsCount = oldDataItem[key];
                if (typeof statsCount === 'undefined') {
                    return;
                }

                const category = STATS_CATEGORIES_MIGRATION_MAP[key];
                if (category) {
                    newDataItem[category] = (newDataItem[category] || 0) + statsCount;
                } else {
                    logger.debug(`[ext.UpdateApi.migrateFromV5toV6]: unknown category for old group id: ${key}, migrated into "Other"`);
                    const prevCount = newDataItem[PopupStatsCategories.Other] || 0;
                    newDataItem[PopupStatsCategories.Other] = prevCount + statsCount;
                }

                total += statsCount;
            });

            newDataItem.total = total;

            return newDataItem;
        };

        const newPageStatisticsData = {
            hours: oldPageStatistics.data.hours.map(migrateStatsDataItem),
            days: oldPageStatistics.data.days.map(migrateStatsDataItem),
            months: oldPageStatistics.data.months.map(migrateStatsDataItem),
            updated: oldPageStatistics.data.updated,
        };

        const newPageStatistics = {
            totalBlocked: oldPageStatistics.totalBlocked,
            data: newPageStatisticsData,
        };

        await browserStorage.set(PAGE_STATISTIC_KEY, JSON.stringify(newPageStatistics));
    }

    /**
     * Run data migration from schema v4 to schema v5.
     *
     * For the extension update to:
     * - v5.0.43-beta;
     * - v5.0.91.
     */
    private static async migrateFromV4toV5(): Promise<void> {
        const settings = await browserStorage.get(ADGUARD_SETTINGS_KEY);

        if (!UpdateApi.isObject(settings)) {
            throw new Error('Settings is not an object');
        }

        const filtersStateData = settings['filters-state'];

        if (typeof filtersStateData !== 'string') {
            throw new Error('Cannot read filters state data');
        }

        const filtersState = zod.record(
            zod.string(),
            zod.object({
                enabled: zod.boolean(),
                installed: zod.boolean(),
                loaded: zod.boolean(),
            }),
        ).parse(JSON.parse(filtersStateData));

        const groupsStateData = settings['groups-state'];

        if (typeof groupsStateData !== 'string') {
            throw new Error('Cannot read groups state data');
        }

        const groupsState = zod.record(
            zod.string(),
            zod.object({
                enabled: zod.boolean(),
                touched: zod.boolean(),
            }),
        ).parse(JSON.parse(groupsStateData));

        // AdGuard Annoyances filters group id.
        const annoyancesGroupId = '4';

        /**
         * AdGuard Annoyances filter has been splitted into 5 other filters:
         * Cookie Notices, Popups, Mobile App Banners, Other Annoyances
         * and Widgets - which we should enable if the Annoyances filter is enabled.
         */
        const deprecatedAnnoyancesFilterId = '14';

        /**
         * AdGuard Annoyances filter has been splitted into 5 other filters:
         * Cookie Notices, Popups, Mobile App Banners, Other Annoyances
         * and Widgets - which we should enable if the Annoyances filter is enabled.
         */
        const annoyancesFiltersIds = ['18', '19', '20', '21', '22'];

        // AdGuard Annoyances filters group state.
        const annoyancesGroup = groupsState[annoyancesGroupId] ?? {
            enabled: false,
            touched: false,
        };

        // AdGuard Annoyances filters states.
        const annoyancesFiltersState = Object.fromEntries(
            annoyancesFiltersIds.map((filterId) => {
                const state = filtersState[filterId] ?? {
                    loaded: false,
                    enabled: false,
                    touched: false,
                };
                return [filterId, state];
            }),
        );

        const deprecatedAnnoyancesFilter = filtersState[deprecatedAnnoyancesFilterId];

        if (UpdateApi.isObject(deprecatedAnnoyancesFilter)) {
            // If the deprecated Annoyances filter is enabled, we should enable new groups and filters.
            if (deprecatedAnnoyancesFilter.enabled) {
                annoyancesGroup.enabled = true;
                annoyancesFiltersIds.forEach((id) => {
                    annoyancesFiltersState[id]!.enabled = true;
                });
            }
            // delete deprecated filter state;
            delete filtersState[deprecatedAnnoyancesFilterId];
        }

        // Set updated states and new metadata to the settings.

        groupsState[annoyancesGroupId] = annoyancesGroup;
        Object.assign(filtersState, annoyancesFiltersState);

        settings['groups-state'] = JSON.stringify(groupsState);
        settings['filters-state'] = JSON.stringify(filtersState);

        await browserStorage.set(ADGUARD_SETTINGS_KEY, settings);

        // Sets default rules limits.
        await browserStorage.set(RULES_LIMITS_KEY, JSON.stringify([]));
    }

    /**
     * Run data migration from schema v3 to schema v4.
     *
     * @throws If previous data schema is invalid or saving data to the hybrid storage fails.
     */
    private static async migrateFromV3toV4(): Promise<void> {
        // Get all entries from the `browser.browserStorage.local`.
        const entries = await browserStorage.entries();

        // Find all keys that are related to filters.
        const keys = Object.keys(entries);
        const rawFilterKeys = keys.filter((key) => key.startsWith(RAW_FILTER_KEY_PREFIX));
        const filterKeys = keys.filter((key) => key.startsWith(FILTER_KEY_PREFIX));

        // Check if there are no filters to migrate.
        if (rawFilterKeys.length === 0 && filterKeys.length === 0) {
            logger.debug('[ext.UpdateApi.migrateFromV3toV4]: no filters to migrate from storage to hybrid storage');
            return;
        }

        // Prepare data to migrate.
        const migrationData: Record<string, string> = {};

        const filterSchema = zod.union([
            zod.string(),
            zod.array(zod.string()),
        ]);

        // Migrate filters.
        filterKeys.forEach((key) => {
            const filterId = FiltersStorageV1.extractFilterIdFromFilterKey(key);
            if (filterId === null) {
                logger.debug(`[ext.UpdateApi.migrateFromV3toV4]: failed to extract filter ID from the key: ${key}, skipping`);
                return;
            }

            const filterParsingResult = filterSchema.safeParse(entries[key]);

            if (!filterParsingResult.success) {
                logger.debug(`[ext.UpdateApi.migrateFromV3toV4]: failed to parse data from filter ID ${filterId} from the old storage: ${getZodErrorMessage(filterParsingResult.error)}`);
                return;
            }

            const lines = Array.isArray(filterParsingResult.data)
                ? filterParsingResult.data
                : filterParsingResult.data.split(NEWLINE_CHAR_REGEX);

            Object.assign(migrationData, FiltersStorageV1.prepareFilterForStorage(filterId, lines));
        });

        // Migrate raw filters.
        rawFilterKeys.forEach((key) => {
            const filterId = RawFiltersStorage.extractFilterIdFromFilterKey(key);
            if (filterId === null) {
                logger.debug(`[ext.UpdateApi.migrateFromV3toV4]: failed to extract raw filter ID from the key: ${key}, skipping`);
                return;
            }

            const filterParsingResult = zod.string().safeParse(entries[key]);

            if (!filterParsingResult.success) {
                logger.debug(`[ext.UpdateApi.migrateFromV3toV4]: failed to parse data from raw filter ID ${filterId} from the old storage: ${getZodErrorMessage(filterParsingResult.error)}`);
                return;
            }

            migrationData[key] = filterParsingResult.data;
        });

        // Delete filters from the `browser.browserStorage.local` after successful migration.
        await browserStorage.removeMultiple([...rawFilterKeys, ...filterKeys]);

        const hybridStorageV1 = new HybridStorageV1();

        // Save migrated data to the hybrid storage with a single transaction.
        const transactionResult = await hybridStorageV1.setMultiple(migrationData);
        if (!transactionResult) {
            throw new Error('Failed to migrate filters from storage to hybrid storage, transaction failed');
        }

        logger.debug('[ext.UpdateApi.migrateFromV3toV4]: filters successfully migrated from storage to hybrid storage');

        // We use passthrough to keep all other data as is, in this case we only need to update check times.
        const filterVersionDataValidatorV3 = zod.object({
            lastCheckTime: zod.number(),
            lastScheduledCheckTime: zod.number().optional(),
        }).passthrough();

        const filtersVersionDataValidatorV3 = zod.record(
            SchemaPreprocessor.numberValidator,
            filterVersionDataValidatorV3,
        );

        const storageData = await browserStorage.get(ADGUARD_SETTINGS_KEY);
        const settings = zod.record(zod.unknown()).parse(storageData);
        const rawFiltersVersion = settings[SettingOption.FiltersVersion];

        if (isString(rawFiltersVersion)) {
            const filtersVersionParsed = filtersVersionDataValidatorV3.safeParse(JSON.parse(rawFiltersVersion));

            if (filtersVersionParsed.success) {
                const filtersVersion = filtersVersionParsed.data;

                Object.values(filtersVersion).forEach((filterData) => {
                    if (isUndefined(filterData.lastScheduledCheckTime)) {
                        filterData.lastScheduledCheckTime = filterData.lastCheckTime;
                    }
                });

                settings[SettingOption.FiltersVersion] = JSON.stringify(filtersVersion);

                await browserStorage.set(ADGUARD_SETTINGS_KEY, settings);

                logger.debug('[ext.UpdateApi.migrateFromV3toV4]: filters version data successfully migrated from the old storage');
            } else {
                logger.debug(`[ext.UpdateApi.migrateFromV3toV4]: failed to parse filters version data from the old storage: ${getZodErrorMessage(filtersVersionParsed.error)}`);
            }
        } else {
            logger.debug('[ext.UpdateApi.migrateFromV3toV4]: filters version data is not a string, skipping migration');
        }
    }

    /**
     * Run data migration from schema v2 to schema v3.
     */
    private static async migrateFromV2toV3(): Promise<void> {
        /**
         * From v4.2.144 we don't store filter rules in indexed DB, die to bug
         * https://bugzilla.mozilla.org/show_bug.cgi?id=1841806.
         */

        let db: IDBDatabase | null = null;

        try {
            db = await IDBUtils.connect('AdguardRulesStorage');
            const data = await IDBUtils.getAll(db, 'AdguardRulesStorage');

            const lists = zod
                .object({
                    key: zod.string(),
                    value: zod.string(),
                })
                .array()
                .parse(data);

            const results = await Promise.allSettled(
                lists.map(async ({ key, value }) => browserStorage.set(key, value.split(/\r?\n/))),
            );

            results.forEach((result) => {
                if (result.status === 'rejected') {
                    logger.info(`[ext.UpdateApi.migrateFromV2toV3]: failed to migrate user rules: ${getZodErrorMessage(result.reason)}`);
                }
            });
        } catch (e: unknown) {
            logger.info('[ext.UpdateApi.migrateFromV2toV3]: failed to migrate user rules', getZodErrorMessage(e));
        } finally {
            if (db) {
                db.close();
            }
        }

        /**
         * Add missed trusted flags for custom filters.
         */
        const storageData = await browserStorage.get('adguard-settings');
        const settings = zod.record(zod.unknown()).parse(storageData);
        const customFilters = settings['custom-filters'];

        if (typeof customFilters === 'string') {
            const customFiltersDataTransformer = zod
                .object({
                    trusted: zod.boolean().optional(),
                })
                .passthrough()
                .transform(({ trusted, ...rest }) => ({
                    ...rest,
                    trusted: Boolean(trusted),
                }))
                .array();

            const customFiltersData = JSON.parse(customFilters);
            settings['custom-filters'] = JSON.stringify(customFiltersDataTransformer.parse(customFiltersData));

            await browserStorage.set('adguard-settings', settings);
        }
    }

    /**
     * Run data migration from schema v1 to schema v2.
     */
    private static async migrateFromV1toV2(): Promise<void> {
        // From v4.2.135 we store timestamp of expiration time for safebrowsing cache records.
        const storageData = await browserStorage.get('sb-lru-cache');

        if (typeof storageData !== 'string') {
            return;
        }

        // parse v1 safebrowsing cache data
        const sbStorageDataV1 = zod
            .object({
                key: zod.string(),
                value: zod.string(),
            })
            .strict()
            .array()
            .parse(JSON.parse(storageData));

        const now = Date.now();

        type SafeBrowsingDataV2 = {
            list: string;
            expires?: number;
        };

        type SafeBrowsingStorageDataV2 = {
            key: string;
            value: SafeBrowsingDataV2;
        }[];

        // transform v1 safebrowsing storage data to v2
        const sbStorageDataV2: SafeBrowsingStorageDataV2 = sbStorageDataV1.map(({ key, value }) => {
            const safebrowsingCacheRecord: SafeBrowsingDataV2 = { list: value };

            if (safebrowsingCacheRecord.list !== 'allowlist') {
                safebrowsingCacheRecord.expires = now + SbCache.CACHE_TTL_MS;
            }

            return {
                key,
                value: safebrowsingCacheRecord,
            };
        });

        await browserStorage.set('sb-lru-cache', JSON.stringify(sbStorageDataV2));
    }

    /**
     * Run data migration from schema v0 to schema v1.
     */
    private static async migrateFromV0toV1(): Promise<void> {
        // In the v4.0.171 we have littered window.localStorage with proms used in the promo notifications module,
        // now we are clearing them

        if (typeof window !== 'undefined') {
            // there is no window in the mv3 extension service worker
            window.localStorage.removeItem('viewed-notifications');
            window.localStorage.removeItem('viewed-notification-time');
        }

        // In the v4.2.0 we are refactoring storage data structure

        // get current settings
        const storageData = await browserStorage.get('adguard-settings');

        // check if current settings is record
        const currentSettings = zod
            .record(zod.unknown())
            .parse(storageData);

        // delete app version from settings
        if (currentSettings['app-version']) {
            delete currentSettings['app-version'];
        }

        // delete metadata from settings (new one will be loaded while filter initialization)
        if (currentSettings['filters-i18n-metadata']) {
            delete currentSettings['filters-i18n-metadata'];
        }

        if (currentSettings['filters-metadata']) {
            delete currentSettings['filters-metadata'];
        }

        // TODO: use zod preprocessors instead direct remapping and data transformation

        // rename fields
        let keyToCheck = 'default-whitelist-mode';
        if (currentSettings[keyToCheck] !== undefined) {
            currentSettings['default-allowlist-mode'] = currentSettings[keyToCheck];
            delete currentSettings[keyToCheck];
        }

        keyToCheck = 'white-list-domains';
        if (currentSettings[keyToCheck] !== undefined) {
            currentSettings['allowlist-domains'] = currentSettings[keyToCheck];
            delete currentSettings[keyToCheck];
        }

        keyToCheck = 'stealth_disable_stealth_mode';
        if (currentSettings[keyToCheck] !== undefined) {
            currentSettings['stealth-disable-stealth-mode'] = currentSettings[keyToCheck];
            delete currentSettings[keyToCheck];
        }

        keyToCheck = 'custom_filters';
        if (currentSettings[keyToCheck] !== undefined) {
            currentSettings['custom-filters'] = currentSettings[keyToCheck];
            delete currentSettings[keyToCheck];
        }

        // New group state 'touched' field added in 4.2
        // zod 'parse then transform' approach is used to transform data to actual schema
        if (typeof currentSettings['groups-state'] === 'string') {
            // create data transformer
            const groupsStateTransformer = zod.record(
                zod.object({
                    enabled: zod.boolean().optional(),
                }).passthrough().transform((data) => {
                    const enabled = Boolean(data.enabled);
                    return {
                        ...data,
                        enabled,
                        touched: enabled,
                    };
                }),
            );

            const currentGroupsStateData = JSON.parse(currentSettings['groups-state']);
            currentSettings['groups-state'] = JSON.stringify(
                groupsStateTransformer.parse(currentGroupsStateData),
            );
        }

        // Check non exists fields in filters-state
        if (typeof currentSettings['filters-state'] === 'string') {
            const filtersStateTransformer = zod.record(
                zod.object({
                    enabled: zod.boolean().optional(),
                    installed: zod.boolean().optional(),
                }).passthrough().transform(({ installed, enabled, ...rest }) => ({
                    ...rest,
                    enabled: Boolean(enabled),
                    installed: Boolean(installed),
                })),
            );

            const filtersState = JSON.parse(currentSettings['filters-state']);

            currentSettings['filters-state'] = JSON.stringify(filtersStateTransformer.parse(filtersState));
        }

        // Check not exists fields in custom filters
        if (typeof currentSettings['custom-filters'] === 'string') {
            const customFiltersDataTransformer = zod
                .object({
                    trusted: zod.boolean().optional(),
                    timeUpdated: zod.number().or(zod.string()).optional(),
                })
                .passthrough()
                .transform((data) => {
                    const trusted = Boolean(data.trusted);
                    const timeUpdated = typeof data.timeUpdated === 'undefined' ? 0 : Number(data.timeUpdated);

                    // Remove deprecated field.
                    if (data.languages !== undefined) {
                        delete data.languages;
                    }

                    return {
                        ...data,
                        trusted,
                        timeUpdated,
                    };
                })
                .array();

            const customFilters = JSON.parse(currentSettings['custom-filters']);

            currentSettings['custom-filters'] = JSON.stringify(customFiltersDataTransformer.parse(customFilters));
        }

        // Check not exists fields in filters version for custom filters
        if (typeof currentSettings['filters-version'] === 'string') {
            const filtersVersionsTransformer = zod.record(zod.object({
                lastUpdateTime: zod.number().optional(),
            }).passthrough().transform(({ lastUpdateTime, ...rest }) => ({
                ...rest,
                lastUpdateTime: lastUpdateTime ?? 0,
            })));

            const filtersVersion = JSON.parse(currentSettings['filters-version']);

            currentSettings['filters-version'] = JSON.stringify(filtersVersionsTransformer.parse(filtersVersion));
        }

        // mode notification data from settings to root storage
        await UpdateApi.moveStorageData('viewed-notifications', currentSettings);
        await UpdateApi.moveStorageData('viewed-notification-time', currentSettings);

        // move client id from settings to root storage
        await UpdateApi.moveStorageData('client-id', currentSettings);

        // move page stats to root storage
        await UpdateApi.moveStorageData('page-statistic', currentSettings);

        // move safebrowsing from settings data to root storage
        await UpdateApi.moveStorageData('safebrowsing-suspended-from', currentSettings);
        await UpdateApi.moveStorageData('sb-lru-cache', currentSettings);

        const settingsValidator = zod.object({
            'appearance-theme': zod.preprocess((value: unknown) => {
                if (typeof value === 'string' && value.includes('\"')) {
                    return JSON.parse(value);
                }
                return value;
            }, appearanceValidator),
            'disable-show-page-statistic': SchemaPreprocessor.booleanValidator,
            'detect-filters-disabled': SchemaPreprocessor.booleanValidator,
            'safebrowsing-disabled': SchemaPreprocessor.booleanValidator,
            'filters-update-period': SchemaPreprocessor.numberValidator,
            'use-optimized-filters': SchemaPreprocessor.booleanValidator,
            'hits-count-disabled': SchemaPreprocessor.booleanValidator,
            'context-menu-disabled': SchemaPreprocessor.booleanValidator,
            'show-info-about-adguard-disabled': SchemaPreprocessor.booleanValidator,
            'show-app-updated-disabled': SchemaPreprocessor.booleanValidator,
            'hide-rate-block': SchemaPreprocessor.booleanValidator,
            'user-rules-editor-wrap': SchemaPreprocessor.booleanValidator,
            'allowlist-domains': zod.string(),
            'block-list-domains': zod.string(),
            'allowlist-enabled': SchemaPreprocessor.booleanValidator,
            'default-allowlist-mode': SchemaPreprocessor.booleanValidator,
            'stealth-disable-stealth-mode': SchemaPreprocessor.booleanValidator,
            'stealth-hide-referrer': SchemaPreprocessor.booleanValidator,
            'stealth-hide-search-queries': SchemaPreprocessor.booleanValidator,
            'stealth-send-do-not-track': SchemaPreprocessor.booleanValidator,
            'stealth-block-webrtc': SchemaPreprocessor.booleanValidator,
            'stealth-remove-x-client': SchemaPreprocessor.booleanValidator,
            'stealth-block-third-party-cookies': SchemaPreprocessor.booleanValidator,
            'stealth-block-third-party-cookies-time': SchemaPreprocessor.numberValidator,
            'stealth-block-first-party-cookies': SchemaPreprocessor.booleanValidator,
            'stealth-block-first-party-cookies-time': SchemaPreprocessor.numberValidator,
            'user-filter-enabled': SchemaPreprocessor.booleanValidator,
            'filters-state': zod.string().optional(),
            'filters-version': zod.string().optional(),
            'groups-state': zod.string().optional(),
            'custom-filters': zod.string().optional(),
            'adguard-disabled': SchemaPreprocessor.booleanValidator,
        });

        // merge current with default settings and validate
        const settings = settingsValidator.parse({ ...defaultSettings, ...currentSettings });

        // set new settings to storage
        await browserStorage.set('adguard-settings', settings);
    }

    /**
     * Adds the removed Quick Fixes filter to settings and storages.
     *
     * @note
     * We cannot load and enable filter here, because filter's API is not
     * initialized yet. So we just set the filter state to enabled
     * and loaded.
     * After that it will be renew from the local copy of filters - which will
     * create all needed filter's objects in memory to correct work.
     *
     * @param useOldStorage Whether to use the old storage API, which was used
     * before the migration to the new one migration#11 @see {@link UpdateApi.migrateFromV10toV11}.
     *
     * @returns A promise that resolves when complete.
     *
     * @throws Error if settings are invalid or data cannot be read.
     */
    private static async addQuickFixesFilter(useOldStorage: boolean = false): Promise<void> {
        const settings = await browserStorage.get(ADGUARD_SETTINGS_KEY);

        if (!UpdateApi.isObject(settings)) {
            throw new Error('Settings is not an object');
        }

        const filtersStateData = settings['filters-state'];

        if (typeof filtersStateData !== 'string') {
            throw new Error('Cannot read filters state data');
        }

        const filtersState = zod.record(
            zod.string(),
            zod.object({
                enabled: zod.boolean(),
                installed: zod.boolean(),
                loaded: zod.boolean(),
            }),
        ).parse(JSON.parse(filtersStateData));

        // Little hack to mark filter as enabled before it is actually loaded.
        // Object.assign(filtersState, {
        //     [AntiBannerFiltersId.QuickFixesFilterId]: {
        //         // Enabled by default.
        //         enabled: true,
        //         // Installed is false, because otherwise this filter state
        //         // will be marked as "obsoleted" (because this filter not
        //         // exists in metadata yet) and will be removed from the memory.
        //         installed: false,
        //         // Mark as loaded to update filter from local resources and
        //         // create filter object in memory.
        //         loaded: true,
        //     },
        // });

        settings['filters-state'] = JSON.stringify(filtersState);

        // Set empty filter to create it in the memory.
        // Right after launch it will be updated to the newest version from remote.
        if (useOldStorage) {
            await FiltersStorageV1.set(AntiBannerFiltersId.QuickFixesFilterId, []);
        } else {
            await FiltersStorage.set(AntiBannerFiltersId.QuickFixesFilterId, '');
        }
        await RawFiltersStorage.set(AntiBannerFiltersId.QuickFixesFilterId, '');

        await browserStorage.set(ADGUARD_SETTINGS_KEY, settings);
    }

    /**
     * Removes the deprecated Quick Fixes filter from settings and storages.
     *
     * @returns A promise that resolves when complete.
     *
     * @throws Error if settings are invalid or data cannot be read.
     */
    private static async removeQuickFixesFilter(): Promise<void> {
        const settings = await browserStorage.get(ADGUARD_SETTINGS_KEY);

        if (!UpdateApi.isObject(settings)) {
            throw new Error('Settings is not an object');
        }

        const filtersStateData = settings['filters-state'];

        if (typeof filtersStateData !== 'string') {
            throw new Error('Cannot read filters state data');
        }

        const filtersState = zod.record(
            zod.string(),
            zod.object({
                enabled: zod.boolean(),
                installed: zod.boolean(),
                loaded: zod.boolean(),
            }),
        ).parse(JSON.parse(filtersStateData));

        const groupsStateData = settings['groups-state'];

        if (typeof groupsStateData !== 'string') {
            throw new Error('Cannot read groups state data');
        }

        const deprecatedQuickFixesFilter = filtersState[AntiBannerFiltersId.QuickFixesFilterId];

        if (UpdateApi.isObject(deprecatedQuickFixesFilter)) {
            // delete the deprecated filter state
            delete filtersState[AntiBannerFiltersId.QuickFixesFilterId];
        }

        settings['filters-state'] = JSON.stringify(filtersState);

        // Remove deprecated Quick Fixes filter from the storages.
        await FiltersStorageV1.remove(AntiBannerFiltersId.QuickFixesFilterId);
        await FiltersStorage.remove(AntiBannerFiltersId.QuickFixesFilterId);
        await RawFiltersStorage.remove(AntiBannerFiltersId.QuickFixesFilterId);

        await browserStorage.set(ADGUARD_SETTINGS_KEY, settings);
    }

    /**
     * Replaces the deprecated combined big Annoyances filter
     * with separate smaller annoyances filters.
     *
     * Please note that separated annoyances filters will:
     * - be marked as 'enabled';
     * - not be marked as 'loaded'.
     *
     * @param settings The settings object.
     *
     * @returns The updated settings object.
     *
     * @throws Error if settings are invalid or data cannot be read.
     */
    private static async migrateCombinedAnnoyancesFilter(
        settings: Record<string, unknown>,
    ): Promise<Record<string, unknown>> {
        const filtersStateData = settings['filters-state'];

        if (typeof filtersStateData !== 'string') {
            throw new Error('Cannot read filters state data');
        }

        const filtersState = zod.record(
            zod.string(),
            zod.object({
                enabled: zod.boolean(),
                installed: zod.boolean(),
                loaded: zod.boolean(),
            }),
        ).parse(JSON.parse(filtersStateData));

        const groupsStateData = settings['groups-state'];

        if (typeof groupsStateData !== 'string') {
            throw new Error('Cannot read groups state data');
        }

        const groupsState = zod.record(
            zod.string(),
            zod.object({
                enabled: zod.boolean(),
                touched: zod.boolean(),
            }),
        ).parse(JSON.parse(groupsStateData));

        // AdGuard Annoyances filters states.
        const annoyancesFiltersState = Object.fromEntries(
            SEPARATE_ANNOYANCE_FILTER_IDS.map((filterId) => {
                const state = filtersState[filterId] ?? {
                    loaded: false,
                    enabled: false,
                    touched: false,
                };
                return [filterId, state];
            }),
        );

        const deprecatedAnnoyancesFilter = filtersState[AntiBannerFiltersId.AnnoyancesCombinedFilterId];

        if (UpdateApi.isObject(deprecatedAnnoyancesFilter)) {
            // If the deprecated Annoyances filter is enabled, we should enable new groups and filters.
            if (deprecatedAnnoyancesFilter.enabled) {
                SEPARATE_ANNOYANCE_FILTER_IDS.forEach((id) => {
                    annoyancesFiltersState[id]!.enabled = true;
                });
            }
            // delete deprecated filter state;
            delete filtersState[AntiBannerFiltersId.AnnoyancesCombinedFilterId];
        }

        // Set updated states and new metadata to the settings.

        Object.assign(filtersState, annoyancesFiltersState);

        settings['groups-state'] = JSON.stringify(groupsState);
        settings['filters-state'] = JSON.stringify(filtersState);

        return settings;
    }

    /**
     * Removes the deprecated DNS filter from settings.
     *
     * @param settings The settings object.
     *
     * @returns The updated settings object.
     *
     * @throws Error if settings are invalid or data cannot be read.
     */
    private static async removeDnsFilter(settings: Record<string, unknown>): Promise<Record<string, unknown>> {
        const filtersStateData = settings['filters-state'];

        if (typeof filtersStateData !== 'string') {
            throw new Error('Cannot read filters state data');
        }

        const filtersState = zod.record(
            zod.string(),
            zod.object({
                enabled: zod.boolean(),
                installed: zod.boolean(),
                loaded: zod.boolean(),
            }),
        ).parse(JSON.parse(filtersStateData));

        const groupsStateData = settings['groups-state'];

        if (typeof groupsStateData !== 'string') {
            throw new Error('Cannot read groups state data');
        }

        const deprecatedDnsFilter = filtersState[AntiBannerFiltersId.DnsFilterId];

        if (UpdateApi.isObject(deprecatedDnsFilter)) {
            // delete the deprecated filter state
            delete filtersState[AntiBannerFiltersId.DnsFilterId];
        }

        settings['filters-state'] = JSON.stringify(filtersState);

        return settings;
    }

    /**
     * Moves data from settings to root browserStorage.
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
            await browserStorage.set(key, data);
        }
    }

    /**
     * Checks if value is an object.
     *
     * @param value Unknown value to check.
     *
     * @returns True if value is an object, false otherwise.
     */
    private static isObject(value: unknown): value is Record<string, unknown> {
        return value != null && value.constructor.name === 'Object';
    }
}
