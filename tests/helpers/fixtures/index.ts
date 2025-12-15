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

export {
    getExportedSettingsProtocolV1Fixture,
    getExportedSettingsProtocolV2Fixture,
    getImportedSettingsFromV1Fixture,
} from './getCustomExportFixture';
export { getDefaultExportFixture } from './getDefaultExportFixture';
export { filterNameFixture, filterTextWithMetadataFixture } from './filterWithMetadata';
export {
    getDefaultSettingsConfigFixtureMV2,
    getDefaultSettingsConfigFixtureMV3,
} from './getDefaultSettingsConfigFixture';
export { getFilterTextFixture } from './getFilterTextFixture';
export { getEmptyPageStatsDataFixture } from './getEmptyPageStatsDataFixture';
export { getEmptyStatisticDataFixture } from './getEmptyStatisticDataFixture';
export { getSettingsV1 } from './settingsSchemaV1';
export { getSettingsV2, getExportedSettingsV2 } from './settingsSchemaV2';
export { getMetadataFixture } from './getMetadataFixture';
export { getI18nMetadataFixture } from './getI18nMetadataFixture';
export {
    getStorageFixturesV0,
    getStorageFixturesV1,
    getStorageFixturesV2,
    getStorageFixturesV3,
    getStorageFixturesV4,
    getStorageFixturesV5,
    getStorageFixturesV6,
    getStorageFixturesV7,
    getStorageFixturesV8,
    getStorageFixturesV9,
    getStorageFixturesV10,
    getStorageFixturesV11,
    getStorageFixturesV12,
    getStorageFixturesV13,
    getStorageFixturesV14,
    type StorageData,
} from './getStorageFixtures';
