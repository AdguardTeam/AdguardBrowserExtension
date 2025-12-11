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
    FiltersApi,
    type FilterMetadata,
    CommonFilterApi,
    CustomFilterApi,
    type GetCustomFilterInfoResult,
    AllowlistApi,
    UserRulesApi,
    FilterUpdateApi,
    type FilterUpdateOptions,
    type FilterUpdateOptionsList,
    Categories,
    type CategoriesFilterData,
    type CategoriesGroupData,
    type CategoriesData,
    HitStatsApi,
    annoyancesConsent,
    // TODO: revert if Quick Fixes filter is back
    // QuickFixesRulesApi,
} from './filters';
export {
    network,
    type ExtensionXMLHttpRequest,
    type ResponseLikeXMLHttpRequest,
    type FilterHitStats,
    type FiltersHitStats,
    NetworkSettings,
} from './network';
export {
    filteringLogApi,
    type FilteringEventRuleData,
    type FilteringLogEvent,
    type UIFilteringLogEvent,
    type FilteringLogTabInfo,
} from './filtering-log';
export { SettingsApi, type SettingsData } from './settings';
export {
    UiApi,
    PagesApi,
    toasts,
    promoNotificationApi,
    FramesApi,
    type FrameData,
    AssistantApi,
    iconsApi,
    defaultIconVariants,
    ContextMenuApi,
    browserAction,
} from './ui';
export { WindowsApi, TabsApi, getIconImageData } from '../../common/api/extension';
export { InstallApi } from './install';
export { UpdateApi } from './update';
export { SafebrowsingApi } from './safebrowsing';
export { DocumentBlockApi } from './document-block';
export { PageStatsApi, PopupStatsCategories, type GetStatisticsDataResponse } from './page-stats';
export { TelemetryApi } from './TelemetryApi';
