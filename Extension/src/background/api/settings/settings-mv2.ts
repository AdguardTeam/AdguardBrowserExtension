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
import { type SettingsConfig } from 'tswebextension';

import { logger } from '../../../common/logger';
import {
    type GeneralSettingsConfig,
    GeneralSettingsOption,
    type StealthConfig,
    SettingOption,
} from '../../schema';
import { filterStateStorage, settingsStorage } from '../../storages';
import { CommonFilterApi } from '../filters';
import { AntiBannerFiltersId, SEPARATE_ANNOYANCE_FILTER_IDS } from '../../../common/constants';
import { filteringLogApi } from '../filtering-log';
import { network } from '../network';
import { getZodErrorMessage } from '../../../common/error';

import { SettingsApiCommon } from './settings-common';

/**
 * SettingsApi is a facade class for encapsulating the work with extension
 * settings: getting, installing, gathering tswebextension configuration from
 * current settings, importing and exporting.
 */
export class SettingsApi extends SettingsApiCommon {
    /**
     * Collects {@link SettingsConfig} for tswebextension from current extension settings.
     * FIXME: check, that method overrided correctly.
     *
     * @returns Collected {@link SettingsConfig} for tswebextension.
     */
    public static getTsWebExtConfiguration(): SettingsConfig {
        const commonConfig = SettingsApiCommon.getCommonTsWebExtConfiguration();

        return {
            ...commonConfig,
            debugScriptlets: filteringLogApi.isOpen(),
        };
    }

    /**
     * @inheritdoc
     */
    protected static async importGeneralSettings({
        [GeneralSettingsOption.AllowAcceptableAds]: allowAcceptableAds,
        [GeneralSettingsOption.ShowBlockedAdsCount]: showBlockedAdsCount,
        [GeneralSettingsOption.AutodetectFilters]: autodetectFilters,
        [GeneralSettingsOption.SafebrowsingEnabled]: safebrowsingEnabled,
        [GeneralSettingsOption.FiltersUpdatePeriod]: filtersUpdatePeriod,
        [GeneralSettingsOption.AppearanceTheme]: appearanceTheme,
    }: GeneralSettingsConfig): Promise<void> {
        SettingsApiCommon.importGeneralSettings({
            [GeneralSettingsOption.AllowAcceptableAds]: allowAcceptableAds,
            [GeneralSettingsOption.ShowBlockedAdsCount]: showBlockedAdsCount,
            [GeneralSettingsOption.AutodetectFilters]: autodetectFilters,
            [GeneralSettingsOption.SafebrowsingEnabled]: safebrowsingEnabled,
            [GeneralSettingsOption.FiltersUpdatePeriod]: filtersUpdatePeriod,
            [GeneralSettingsOption.AppearanceTheme]: appearanceTheme,
        });

        settingsStorage.set(SettingOption.DisableSafebrowsing, !safebrowsingEnabled);
        settingsStorage.set(SettingOption.FiltersUpdatePeriod, filtersUpdatePeriod);
    }

    /**
     * Loads built-in filters and enables them **for MV2**.
     * Firstly, tries to load filters from the backend, if it fails, tries to load them from the embedded.
     *
     * @param builtInFilters Array of built-in filters ids.
     */
    protected static async loadBuiltInFilters(builtInFilters: number[]): Promise<void> {
        const remoteFailedFilterIds = await SettingsApi.loadBuiltInFiltersRemote(builtInFilters);

        if (remoteFailedFilterIds.length === 0) {
            return;
        }

        const filterIdsToLoadLocal: number[] = [];
        const filterIdsWithNoLocalCopy: number[] = [];

        remoteFailedFilterIds.forEach((filterId) => {
            if (network.isFilterHasLocalCopy(filterId)) {
                filterIdsToLoadLocal.push(filterId);
            } else {
                filterIdsWithNoLocalCopy.push(filterId);
            }
        });

        if (filterIdsWithNoLocalCopy.length > 0) {
            throw new Error(`There is no local copy of filters with ids: ${filterIdsWithNoLocalCopy.join(', ')}`);
        }

        logger.debug(`[ext.SettingsApi.loadBuiltInFilters]: trying to load from storage filters with ids: ${filterIdsToLoadLocal.join(', ')}`);
        await SettingsApi.loadBuiltInFiltersLocal(filterIdsToLoadLocal);
    }

    /**
     * Loads built-in filters and enables them.
     *
     * Firstly, tries to load filters from the backend:
     * - if loaded successfully, enables them;
     * - if loading fails, returns the array of filters that were not loaded
     *   to try to load them from the local storage later.
     *
     * @param filterIds Array of built-in filters ids.
     *
     * @returns Array of filters that were not loaded from the backend.
     */
    private static async loadBuiltInFiltersRemote(filterIds: number[]): Promise<number[]> {
        const failedFilterIds: number[] = [];
        const filterIdsToEnable: number[] = [];

        const tasks = filterIds.map(async (filterId: number) => {
            try {
                // eslint-disable-next-line no-await-in-loop
                await CommonFilterApi.loadFilterRulesFromBackend({ filterId, ignorePatches: true }, true);
                filterIdsToEnable.push(filterId);
            } catch (e) {
                logger.debug(`[ext.SettingsApi.loadBuiltInFiltersRemote]: filter rules were not loaded from backend for filter: ${filterId}, error:`, getZodErrorMessage(e));
                failedFilterIds.push(filterId);
            }
        });

        await Promise.allSettled(tasks);

        filterStateStorage.enableFilters(filterIdsToEnable);

        return failedFilterIds;
    }

    /**
     * Replaces the deprecated combined Annoyances filter with separate filter IDs.
     *
     * @param enabledFilters Array of enabled filter ids.
     *
     * @returns Array of common filter ids with MV2-specific mappings applied.
     */
    protected static getFiltersToEnable(enabledFilters: number[]): number[] {
        const filtersToEnable = SettingsApiCommon.getFiltersToEnable(enabledFilters);

        // special handling for large AdGuard Annoyances filter,
        // all other deprecated filters shall be skipped;
        // only for MV2 because it was never available in MV3
        if (filtersToEnable.includes(AntiBannerFiltersId.AnnoyancesCombinedFilterId)) {
            filtersToEnable.push(...SEPARATE_ANNOYANCE_FILTER_IDS);
        }

        return filtersToEnable;
    }

    /**
     * @inheritdoc
     */
    protected static async importStealth(stealthConfig: StealthConfig): Promise<void> {
        await SettingsApiCommon.importStealth(stealthConfig, true);
    }
}
