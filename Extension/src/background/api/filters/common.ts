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
import browser from 'webextension-polyfill';

import { BrowserUtils } from '../../utils/browser-utils';
import { logger } from '../../../common/logger';
import { UserAgent } from '../../../common/user-agent';
import { SettingOption, RegularFilterMetadata } from '../../schema';
import { AntiBannerFiltersId } from '../../../common/constants';
import {
    metadataStorage,
    filterStateStorage,
    settingsStorage,
    FiltersStorage,
    RawFiltersStorage,
    filterVersionStorage,
} from '../../storages';
import { network } from '../network';

import { CustomFilterApi } from './custom';
import { FiltersApi } from './main';
import type { FilterUpdateOptions } from './update';
import { FilterParser } from './parser';

/**
 * API for managing AdGuard's filters data.
 *
 * This class provides methods for reading common filter metadata from {@link metadataStorage.data.filters},
 * installation and updating common filters data, stored in next storages:
 * - {@link filterStateStorage} filters states;
 * - {@link filterVersionStorage} filters versions;
 * - {@link FiltersStorage} filter rules.
 * - {@link RawFiltersStorage} raw filter rules, before applying directives.
 */
export class CommonFilterApi {
    /**
     * Returns common filter metadata.
     *
     * @param filterId Filter id.
     *
     * @returns Common filter metadata.
     */
    public static getFilterMetadata(filterId: number): RegularFilterMetadata | undefined {
        return metadataStorage.getFilter(filterId);
    }

    /**
     * Returns common filters metadata.
     *
     * @returns Common filters metadata array.
     */
    public static getFiltersMetadata(): RegularFilterMetadata[] {
        return metadataStorage.getFilters();
    }

    /**
     * Checks if filter is common.
     *
     * @param filterId Filter id.
     *
     * @returns True, if filter is common, else returns false.
     */
    public static isCommonFilter(filterId: number): boolean {
        return !CustomFilterApi.isCustomFilter(filterId)
        && filterId !== AntiBannerFiltersId.UserFilterId
        && filterId !== AntiBannerFiltersId.AllowlistFilterId;
    }

    /**
     * Update common filter.
     *
     * @param filterUpdateOptions Filter update detail.
     *
     * @returns Updated filter metadata or null, if update is not required.
     */
    public static async updateFilter(
        filterUpdateOptions: FilterUpdateOptions,
    ): Promise<RegularFilterMetadata | null> {
        logger.info(`Update filter ${filterUpdateOptions.filterId}`);

        // We do not have to check metadata for the filters which do not update with force, because
        // they even do not trigger metadata update.
        if (filterUpdateOptions.ignorePatches) {
            const filterMetadata = CommonFilterApi.getFilterMetadata(filterUpdateOptions.filterId);

            if (!filterMetadata) {
                logger.error(`Cannot find filter ${filterUpdateOptions.filterId} metadata`);
                return null;
            }

            if (!CommonFilterApi.isFilterNeedUpdate(filterMetadata)) {
                logger.info(`Filter ${filterUpdateOptions.filterId} is already updated`);
                return null;
            }
        }

        logger.info(`Filter ${filterUpdateOptions.filterId} needs to be updated`);

        try {
            const filterMetadata = await CommonFilterApi.loadFilterRulesFromBackend(filterUpdateOptions, true);
            logger.info(`Filter ${filterUpdateOptions.filterId} updated successfully`);
            return filterMetadata;
        } catch (e) {
            logger.error(e);
            return null;
        }
    }

    /**
     * Download filter rules from backend and update filter state and metadata.
     *
     * @param filterUpdateOptions Filter update detail.
     * @param forceRemote Whether to download filter rules from remote resources or
     * from local resources.
     *
     * @returns Filter metadata — {@link RegularFilterMetadata}.
     */
    public static async loadFilterRulesFromBackend(
        filterUpdateOptions: FilterUpdateOptions,
        forceRemote: boolean,
    ): Promise<RegularFilterMetadata> {
        const isOptimized = settingsStorage.get(SettingOption.UseOptimizedFilters);
        const oldRawFilter = await RawFiltersStorage.get(filterUpdateOptions.filterId);

        const {
            filter,
            rawFilter,
            isPatchUpdateFailed,
        } = await network.downloadFilterRules(
            filterUpdateOptions,
            forceRemote,
            isOptimized,
            oldRawFilter,
        );

        await FiltersStorage.set(filterUpdateOptions.filterId, filter);
        await RawFiltersStorage.set(filterUpdateOptions.filterId, rawFilter);

        const currentFilterState = filterStateStorage.get(filterUpdateOptions.filterId);
        filterStateStorage.set(filterUpdateOptions.filterId, {
            installed: true,
            loaded: true,
            enabled: !!currentFilterState?.enabled,
        });

        const parsedMetadata = FilterParser.parseFilterDataFromHeader(filter);
        let filterMetadata = CommonFilterApi.getFilterMetadata(filterUpdateOptions.filterId);
        if (!(parsedMetadata && filterMetadata)) {
            throw new Error(`Not found metadata for filter id ${filterUpdateOptions.filterId}`);
        }

        // update filter metadata with new values
        filterMetadata = {
            ...filterMetadata,
            ...parsedMetadata,
        };

        const {
            version,
            expires,
            timeUpdated,
            diffPath,
        } = filterMetadata;

        const filterVersion = filterVersionStorage.get(filterUpdateOptions.filterId);

        // We only update the expiration date if it is a forced update to
        // avoid updating the expiration date during patch updates.
        const nextExpires = filterVersion?.expires && !filterUpdateOptions.ignorePatches
            ? filterVersion.expires
            : Number(expires);

        // We only update the last check time if it is a forced update to
        // avoid updating the last check time during patch updates.
        const nextLastCheckTime = filterVersion?.lastCheckTime && !filterUpdateOptions.ignorePatches
            ? filterVersion.lastCheckTime
            : Date.now();

        filterVersionStorage.set(filterUpdateOptions.filterId, {
            version,
            diffPath,
            expires: nextExpires,
            lastUpdateTime: new Date(timeUpdated).getTime(),
            lastCheckTime: nextLastCheckTime,
            lastScheduledCheckTime: filterVersion?.lastScheduledCheckTime || Date.now(),
            // Unaccessible status may be returned during patch update
            // which is considered as a fatal error https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2717.
            // And if it happens, isPatchUpdateFailed is returned as true,
            // and we should set shouldWaitFullUpdate flag to true for the filter so it will be checked later
            shouldWaitFullUpdate: isPatchUpdateFailed,
        });

        return filterMetadata;
    }

    /**
     * Updates metadata for filters and after that loads and enables default
     * common filters.
     *
     * Called on extension installation and reset settings.
     *
     * @param enableUntouchedGroups - Should enable untouched groups related to
     * the default filters or not.
     *
     */
    public static async initDefaultFilters(enableUntouchedGroups: boolean): Promise<void> {
        const filterIds = [
            AntiBannerFiltersId.EnglishFilterId,
            AntiBannerFiltersId.SearchAndSelfPromoFilterId,
        ];

        if (UserAgent.isAndroid) {
            filterIds.push(AntiBannerFiltersId.MobileAdsFilterId);
        }

        filterIds.push(...CommonFilterApi.getLangSuitableFilters());

        // TODO: Move the use of FiltersApi.loadAndEnableFilters into a separate
        // module to reduce the risk of cyclic dependency, since FiltersApi
        // depends on CommonFilterApi and CustomFilterApi.
        // On the first run, we update the common filters from the backend.
        await FiltersApi.loadAndEnableFilters(filterIds, true, enableUntouchedGroups);
    }

    /**
     * Returns language-specific filters by user locale.
     *
     * @returns List of language-specific filters ids.
     */
    public static getLangSuitableFilters(): number[] {
        let filterIds: number[] = [];

        let localeFilterIds = metadataStorage.getFilterIdsForLanguage(browser.i18n.getUILanguage());
        filterIds = filterIds.concat(localeFilterIds);

        // Get language-specific filters by navigator languages
        // Get all used languages
        const languages = BrowserUtils.getNavigatorLanguages();

        languages.forEach(language => {
            localeFilterIds = metadataStorage.getFilterIdsForLanguage(language);
            filterIds = filterIds.concat(localeFilterIds);
        });

        return Array.from(new Set(filterIds));
    }

    /**
     * Checks if common filter needs update.
     * Matches the version from updated metadata with data in filter version storage.
     *
     * @param filterMetadata Updated filter metadata.
     *
     * @returns True, if filter update is required, else returns false.
     */
    private static isFilterNeedUpdate(filterMetadata: RegularFilterMetadata): boolean {
        logger.info(`Check if filter ${filterMetadata.filterId} need to update`);

        const filterVersion = filterVersionStorage.get(filterMetadata.filterId);

        if (!filterVersion) {
            return true;
        }

        return !BrowserUtils.isGreaterOrEqualsVersion(filterVersion.version, filterMetadata.version);
    }
}
