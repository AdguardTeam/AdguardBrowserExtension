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
    getDefaultExportFixture,
    filterNameFixture,
    filterTextWithMetadataFixture,
    getDefaultSettingsConfigFixtureMV2,
    getDefaultSettingsConfigFixtureMV3,
    getFilterTextFixture,
    getEmptyPageStatsDataFixture,
    getEmptyStatisticDataFixture,
    getSettingsV1,
    getSettingsV2,
    getExportedSettingsV2,
    getMetadataFixture,
    getI18nMetadataFixture,
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
} from './fixtures';

export {
    mockLocalStorage,
    mockFilterPath,
    mockXhrRequests,
    MockedTsWebExtension,
    MockedTsWebExtensionMV3,
    createMockTabsApi,
    createMockDefaultFilteringLog,
    createMockCompaniesDbService,
    SettingsApi,
    PageStatsApi,
} from './mocks';
