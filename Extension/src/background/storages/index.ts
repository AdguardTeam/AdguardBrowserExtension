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

// entry point of `storages` layer
// `storages` contains app data storage models based on `schema` layer

export { appContext, AppContextKey } from './app';
export { allowlistDomainsStorage } from './allowlist';
export { customFilterMetadataStorage } from './custom-filter-metadata';
export { editorStorage } from './editor';
export { FilterStateStorage, filterStateStorage } from './filter-state';
export { FilterVersionStorage, filterVersionStorage } from './filter-version';
export { FiltersStorage } from './filters';
export { RawFiltersStorage, RAW_FILTER_KEY_PREFIX } from './raw-filters';
export { GroupStateStorage, groupStateStorage } from './group-state';
export { i18nMetadataStorage } from './i18n-metadata';
export { invertedAllowlistDomainsStorage } from './inverted-allowlist';
export { MetadataStorage, metadataStorage } from './metadata';
export { settingsStorage } from './settings';
export { SbCache, sbCache, sbRequestCache } from './safebrowsing';
export { PageStatsStorage, pageStatsStorage } from './page-stats';
export {
    notificationStorage,
    type IconData,
    type IconVariants,
    type PromoNotification,
} from './notification';
export { trustedDomainsStorage } from './trusted-domains';
export { hitStatsStorage } from './hit-stats';
export { annoyancesConsentStorage } from './annoyances-consent';
export { browserStorage, hybridStorage } from './shared-instances';
