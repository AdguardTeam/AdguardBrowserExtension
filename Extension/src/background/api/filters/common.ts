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
import { Log } from '../../../common/log';
import { UserAgent } from '../../../common/user-agent';
import { SettingOption, RegularFilterMetadata } from '../../schema';
import { AntiBannerFiltersId } from '../../../common/constants';
import {
    metadataStorage,
    filterStateStorage,
    settingsStorage,
    FiltersStorage,
    filterVersionStorage,
} from '../../storages';
import { network } from '../network';

import { CustomFilterApi } from './custom';
import { FiltersApi } from './main';

/**
 * API for managing AdGuard's filters data.
 *
 * This class provides methods for reading common filter metadata from {@link metadataStorage.data.filters},
 * installation and updating common filters data, stored in next storages:
 * - {@link filterStateStorage} filters states;
 * - {@link filterVersionStorage} filters versions;
 * - {@link FiltersStorage} filter rules.
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
     * @param filterId Filter id.
     *
     * @returns Updated filter metadata or null, if update is not required.
     */
    public static async updateFilter(filterId: number): Promise<RegularFilterMetadata | null> {
        Log.info(`Update filter ${filterId}`);

        const filterMetadata = CommonFilterApi.getFilterMetadata(filterId);

        if (!filterMetadata) {
            Log.error(`Cannot find filter ${filterId} metadata`);
            return null;
        }

        if (!CommonFilterApi.isFilterNeedUpdate(filterMetadata)) {
            Log.info(`Filter ${filterId} is already updated`);
            return null;
        }

        Log.info(`Filter ${filterId} is need to updated`);

        try {
            await CommonFilterApi.loadFilterRulesFromBackend(filterId, true);
            Log.info(`Successfully update filter ${filterId}`);
            return filterMetadata;
        } catch (e) {
            Log.error(e);
            return null;
        }
    }

    /**
     * Download filter rules from backend and update filter state and metadata.
     *
     * @param filterId Filter id.
     * @param remote Whether to download filter rules from remote resources or
     * from local resources.
     */
    public static async loadFilterRulesFromBackend(filterId: number, remote: boolean): Promise<void> {
        const isOptimized = settingsStorage.get(SettingOption.UseOptimizedFilters);

        const rules = await network.downloadFilterRules(filterId, remote, isOptimized);
        await FiltersStorage.set(filterId, rules);

        const currentFilterState = filterStateStorage.get(filterId);
        filterStateStorage.set(filterId, {
            installed: true,
            loaded: true,
            enabled: !!currentFilterState?.enabled,
        });

        // TODO: We should retrieve metadata from the actual rules loaded, but
        // not from the metadata repository, because the metadata may be
        // the newest (loaded from a remote source) and the filter may be loaded
        // from local resources and have an expired version. But in the current
        // flow, we will think that the filter is the newest and doesn't need to
        // be updated.
        // We need to use something like this:
        // const filterMetadata = CustomFilterParser.parseFilterDataFromHeader(rules);
        const filterMetadata = CommonFilterApi.getFilterMetadata(filterId);
        if (!filterMetadata) {
            throw new Error(`Not found metadata for filter id ${filterId}`);
        }

        const {
            version,
            expires,
            timeUpdated,
        } = filterMetadata;

        filterVersionStorage.set(filterId, {
            version,
            expires: Number(expires),
            lastUpdateTime: new Date(timeUpdated).getTime(),
            lastCheckTime: Date.now(),
        });
    }

    /**
     * Updates metadata for filters and after that loads and enables default
     * common filters.
     *
     * Called on extension installation and reset settings.
     */
    public static async initDefaultFilters(): Promise<void> {
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
        await FiltersApi.loadAndEnableFilters(filterIds, true);
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
     * Checks if common filter need update.
     * Matches version from updated metadata with data in filter version storage.
     *
     * @param filterMetadata Updated filter metadata.
     *
     * @returns True, if filter update is required, else returns false.
     */
    private static isFilterNeedUpdate(filterMetadata: RegularFilterMetadata): boolean {
        Log.info(`Check if filter ${filterMetadata.filterId} need to update`);

        const filterVersion = filterVersionStorage.get(filterMetadata.filterId);

        if (!filterVersion) {
            return true;
        }

        return !BrowserUtils.isGreaterOrEqualsVersion(filterVersion.version, filterMetadata.version);
    }
}
