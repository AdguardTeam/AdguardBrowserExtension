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
    PROTOCOL_VERSION,
    RootOption,
    configValidator,
    type Config,
    GeneralSettingsOption,
    generalSettingsConfigValidator,
    type GeneralSettingsConfig,
    ExtensionSpecificSettingsOption,
    extensionSpecificSettingsConfigValidator,
    type ExtensionSpecificSettingsConfig,
    CustomFilterOption,
    customFiltersConfigValidator,
    UserFilterOption,
    userFilterValidator,
    type UserFilterConfig,
    AllowlistOption,
    allowlistValidator,
    type AllowlistConfig,
    FiltersOption,
    filtersConfigValidator,
    type FiltersConfig,
    StealthOption,
    stealthConfigValidator,
    type StealthConfig,
} from './configuration';

export { SchemaPreprocessor } from './preprocessor';

export {
    metadataValidator,
    type Metadata,
    baseMetadataValidator,
    regularFilterMetadataValidator,
    type RegularFilterMetadata,
    tagMetadataValidator,
    type TagMetadata,
    groupMetadataValidator,
    type GroupMetadata,
} from './metadata';

export {
    i18nMetadataValidator,
    type I18nMetadata,
    type FiltersI18n,
    type GroupsI18n,
    type TagsI18n,
    regularFilterI18nMetadataValidator,
    type RegularFilterI18nMetadata,
    tagI18nMetadataValidator,
    type TagI18nMetadata,
    groupI18nMetadataValidator,
    type GroupI18nMetadata,
} from './i18n-metadata';

export {
    filterVersionStorageDataValidator,
    type FilterVersionStorageData,
    type FilterVersionData,
} from './filter-version';

export { filterStateStorageDataValidator, type FilterStateData, type FilterStateStorageData } from './filter-state';

export { groupStateStorageDataValidator, type GroupStateStorageData, type GroupStateData } from './group-state';

export { type TrustedDomainData } from './trusted-domains';

export {
    pageStatsValidator,
    type PageStats,
    type PageStatsData,
    type PageStatsDataItem,
} from './page-stats';

export { hitStatsStorageDataValidator, type HitStatsStorageData, type HitStats } from './hit-stats';

export {
    customFilterMetadataStorageDataValidator,
    type CustomFilterMetadata,
    type CustomFilterMetadataStorageData,
} from './custom-filter-metadata';

export { localScriptRulesValidator, type LocalScriptRules } from './local-script-rules';

export { notificationTextRecordValidator, type NotificationTextRecord } from './notification';

export { safebrowsingStorageDataValidator, type SafebrowsingCacheData } from './safebrowsing';

export { annoyancesConsentStorageDataValidator, type AnnoyancesConsentStorageData } from './annoyances-consent';

export {
    appearanceValidator,
    settingsValidator,
    type Settings,
    SettingOption,
} from './settings';
