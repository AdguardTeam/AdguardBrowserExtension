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
import { type SettingsConfig as SettingsConfigMV3 } from '@adguard/tswebextension/mv3';
import { type SettingsConfig as SettingsConfigMV2 } from '@adguard/tswebextension';

import { logger } from '../../../common/logger';
import { type AppearanceTheme, defaultSettings } from '../../../common/settings';
import {
    type AllowlistConfig,
    AllowlistOption,
    configValidator,
    type ExtensionSpecificSettingsConfig,
    ExtensionSpecificSettingsOption,
    type FiltersConfig,
    FiltersOption,
    type GeneralSettingsConfig,
    GeneralSettingsOption,
    RootOption,
    PROTOCOL_VERSION,
    type StealthConfig,
    StealthOption,
    type UserFilterConfig,
    UserFilterOption,
    SettingOption,
    type Settings,
    settingsValidator,
    type Config,
} from '../../schema';
import {
    filterStateStorage,
    groupStateStorage,
    settingsStorage,
    browserStorage,
} from '../../storages';
import {
    CommonFilterApi,
    CustomFilterApi,
    FiltersApi,
    UserRulesApi,
    AllowlistApi,
    annoyancesConsent,
} from '../filters';
import {
    ADGUARD_SETTINGS_KEY,
    AntiBannerFiltersId,
    NotifierType,
    SEPARATE_ANNOYANCE_FILTER_IDS,
} from '../../../common/constants';
import { settingsEvents } from '../../events';
import { notifier } from '../../notifier';
import { Unknown } from '../../../common/unknown';
import { messenger } from '../../../pages/services/messenger';
import { Prefs } from '../../prefs';
import {
    ASSISTANT_INJECT_OUTPUT,
    BLOCKING_BLOCKED_OUTPUT,
    GPC_SCRIPT_OUTPUT,
    HIDE_DOCUMENT_REFERRER_OUTPUT,
} from '../../../../../constants';
import { DocumentBlockApi } from '../document-block';
import { filteringLogApi } from '../filtering-log';
import { network } from '../network';
import { getZodErrorMessage } from '../../../common/error';
import { CommonFilterUtils } from '../../../common/common-filter-utils';

import { SettingsMigrations } from './migrations';

export type SettingsData = {
    names: typeof SettingOption;
    defaultValues: Settings;
    values: Settings;
};

/**
 * SettingsApi is a facade class for encapsulating the work with extension
 * settings: getting, installing, gathering tswebextension configuration from
 * current settings, importing and exporting.
 */
export class SettingsApi {
    /**
     * Initializes settings: checks the settings from the repository and resets
     * them to defaults if the data are not valid.
     */
    public static async init(): Promise<void> {
        try {
            const data = await browserStorage.get(ADGUARD_SETTINGS_KEY);
            const settings = settingsValidator.parse(data);
            settingsStorage.setCache(settings);
        } catch (e) {
            logger.error('[ext.SettingsApi.init]: cannot init settings from storage:', getZodErrorMessage(e));
            logger.info('[ext.SettingsApi.init]: reverting settings to default values');
            const settings = { ...defaultSettings };

            // Update settings in the cache and in the storage
            settingsStorage.setData(settings);
        }
    }

    /**
     * Set setting to storage and publish setting event.
     *
     * @param key Setting option key.
     * @param value Settings option value.
     */
    public static async setSetting<T extends SettingOption>(key: T, value: Settings[T]): Promise<void> {
        settingsStorage.set(key, value);

        await settingsEvents.publishEvent(key, value);

        // legacy event mediator for frontend
        notifier.notifyListeners(NotifierType.SettingUpdated, {
            propertyName: key,
            propertyValue: value,
        });
    }

    /**
     * Returns setting from setting storage.
     *
     * @param key Setting option key.
     *
     * @returns Settings option value.
     */
    public static getSetting<T extends SettingOption>(key: T): Settings[T] {
        return settingsStorage.get(key);
    }

    /**
     * Returns settings data.
     *
     * @returns Object of {@link SettingsData}.
     */
    public static getData(): SettingsData {
        return {
            names: SettingOption,
            defaultValues: defaultSettings,
            values: settingsStorage.getData(),
        };
    }

    /**
     * Collects {@link SettingsConfig} for tswebextension from current extension settings.
     *
     * @param isMV3 Is the extension in MV3 mode.
     *
     * @returns Collected {@link SettingsConfig} for tswebextension.
     */
    public static getTsWebExtConfiguration<T extends boolean>(
        isMV3: T,
    ): T extends true ? SettingsConfigMV3 : SettingsConfigMV2 {
        // pass the locale explicitly as a part of the url
        const documentBlockingPageUrl = `${Prefs.baseUrl}${BLOCKING_BLOCKED_OUTPUT}.html?_locale=${Prefs.language}`;

        return {
            assistantUrl: `/${ASSISTANT_INJECT_OUTPUT}.js`,
            documentBlockingPageUrl,
            ...(isMV3 && {
                gpcScriptUrl: `/${GPC_SCRIPT_OUTPUT}.js`,
                hideDocumentReferrerScriptUrl: `/${HIDE_DOCUMENT_REFERRER_OUTPUT}.js`,
            }),
            collectStats: !settingsStorage.get(SettingOption.DisableCollectHits) || filteringLogApi.isOpen(),
            debugScriptlets: !isMV3 && filteringLogApi.isOpen(),
            allowlistInverted: !settingsStorage.get(SettingOption.DefaultAllowlistMode),
            allowlistEnabled: settingsStorage.get(SettingOption.AllowlistEnabled),
            stealthModeEnabled: !settingsStorage.get(SettingOption.DisableStealthMode),
            filteringEnabled: !settingsStorage.get(SettingOption.DisableFiltering),
            stealth: {
                blockChromeClientData: settingsStorage.get(SettingOption.RemoveXClientData),
                // TODO: revert when will be found a better way to add exclusions for $stealth=referrer
                // AG-34765
                // Setting to false so that it will remove already added session rules.
                hideReferrer: isMV3 ? false : settingsStorage.get(SettingOption.HideReferrer),
                // TODO: revert when will be found a better way to add exclusions for $stealth=searchqueries
                hideSearchQueries: isMV3 ? false : settingsStorage.get(SettingOption.HideSearchQueries),
                sendDoNotTrack: settingsStorage.get(SettingOption.SendDoNotTrack),
                blockWebRTC: settingsStorage.get(SettingOption.BlockWebRTC),
                selfDestructThirdPartyCookies: settingsStorage.get(SettingOption.SelfDestructThirdPartyCookies),
                selfDestructThirdPartyCookiesTime: settingsStorage.get(SettingOption.SelfDestructThirdPartyCookiesTime),
                selfDestructFirstPartyCookies: settingsStorage.get(SettingOption.SelfDestructFirstPartyCookies),
                selfDestructFirstPartyCookiesTime: settingsStorage.get(SettingOption.SelfDestructFirstPartyCookiesTime),
            },
        };
    }

    /**
     * Resets to default settings.
     *
     * @param enableUntouchedGroups - Should enable untouched groups related to
     * the default filters or not.
     */
    public static async reset(enableUntouchedGroups: boolean): Promise<void> {
        await UserRulesApi.setUserRules('');

        // Set settings store to defaults
        settingsStorage.setData({
            ...defaultSettings,
        });

        // Re-init filters
        await FiltersApi.init(false);

        // On import should enable only groups from imported file.
        await CommonFilterApi.initDefaultFilters(enableUntouchedGroups);

        // reset trusted domains list
        await DocumentBlockApi.reset();

        // reset list of consented filter ids on reset settings
        await annoyancesConsent.reset();
    }

    /**
     * Imports settings from the configuration string.
     *
     * @param configText Configuration in JSON format.
     *
     * @returns True if the import was successful, or false if not.
     */
    public static async import(configText: string): Promise<boolean> {
        try {
            let json = JSON.parse(configText) as unknown;

            const protocolVersion = Unknown.get(json, RootOption.ProtocolVersion);

            if (typeof protocolVersion !== 'string') {
                throw new Error(`Not found string protocol version for provided settings: "${configText}"`);
            }

            // Try to migrate `unknown` settings to the latest version of settings
            if (protocolVersion !== PROTOCOL_VERSION) {
                json = await SettingsMigrations.migrateSettings(protocolVersion, json);
            }

            const validConfig = configValidator.parse(json);

            // Should not enable default groups.
            await SettingsApi.reset(false);

            SettingsApi.importExtensionSpecificSettings(
                validConfig[RootOption.ExtensionSpecificSettings],
            );

            const stealthOptions = validConfig[RootOption.Stealth];

            if (stealthOptions) {
                await SettingsApi.importStealth(stealthOptions);
            }

            await SettingsApi.importGeneralSettings(validConfig[RootOption.GeneralSettings]);
            await SettingsApi.importFilters(validConfig[RootOption.Filters]);

            return true;
        } catch (e) {
            logger.error('[ext.SettingsApi.import]: cannot import settings:', getZodErrorMessage(e));
            return false;
        }
    }

    /**
     * Exports settings to string with JSON format.
     *
     * @returns Configuration in JSON format.
     */
    public static async export(): Promise<string> {
        const config: Config = {
            [RootOption.ProtocolVersion]: PROTOCOL_VERSION,
            [RootOption.GeneralSettings]: SettingsApi.exportGeneralSettings(),
            [RootOption.ExtensionSpecificSettings]: SettingsApi.exportExtensionSpecificSettings(),
            [RootOption.Filters]: await SettingsApi.exportFilters(),
            [RootOption.Stealth]: SettingsApi.exportStealth(),
        };

        return JSON.stringify(config);
    }

    /**
     * Imports general settings from object of {@link GeneralSettingsConfig}.
     */
    private static async importGeneralSettings({
        [GeneralSettingsOption.AllowAcceptableAds]: allowAcceptableAds,
        [GeneralSettingsOption.ShowBlockedAdsCount]: showBlockedAdsCount,
        [GeneralSettingsOption.AutodetectFilters]: autodetectFilters,
        [GeneralSettingsOption.SafebrowsingEnabled]: safebrowsingEnabled,
        [GeneralSettingsOption.FiltersUpdatePeriod]: filtersUpdatePeriod,
        [GeneralSettingsOption.AppearanceTheme]: appearanceTheme,
    }: GeneralSettingsConfig): Promise<void> {
        // TODO: AllowAcceptableAds

        settingsStorage.set(SettingOption.DisableShowPageStats, !showBlockedAdsCount);
        settingsStorage.set(SettingOption.DisableDetectFilters, !autodetectFilters);

        settingsStorage.set(SettingOption.DisableSafebrowsing, !safebrowsingEnabled);
        settingsStorage.set(SettingOption.FiltersUpdatePeriod, filtersUpdatePeriod);

        if (appearanceTheme) {
            settingsStorage.set(SettingOption.AppearanceTheme, appearanceTheme);

            // Config is already validated in the upper level.
            await messenger.updateFullscreenUserRulesTheme(appearanceTheme as AppearanceTheme);
        }

        if (allowAcceptableAds) {
            try {
                await CommonFilterApi.loadFilterRulesFromBackend(
                    // Since this is called on settings import we update filters without patches.
                    { filterId: AntiBannerFiltersId.SearchAndSelfPromoFilterId, ignorePatches: false },
                    false,
                );
            } catch (e) {
                logger.error(
                    `[ext.SettingsApi.importGeneralSettings]: Failed to load filter with id ${AntiBannerFiltersId.SearchAndSelfPromoFilterId} due to ${e}`,
                );
            }
            filterStateStorage.enableFilters([AntiBannerFiltersId.SearchAndSelfPromoFilterId]);
        } else {
            filterStateStorage.disableFilters([AntiBannerFiltersId.SearchAndSelfPromoFilterId]);
        }
    }

    /**
     * Exports general settings to object of {@link GeneralSettingsConfig}.
     *
     * @returns Object of {@link GeneralSettingsConfig}.
     */
    private static exportGeneralSettings(): GeneralSettingsConfig {
        return {
            [GeneralSettingsOption.AllowAcceptableAds]: (
                !!filterStateStorage.get(AntiBannerFiltersId.SearchAndSelfPromoFilterId)?.enabled
            ),
            [GeneralSettingsOption.ShowBlockedAdsCount]: (
                !settingsStorage.get(SettingOption.DisableShowPageStats)
            ),
            [GeneralSettingsOption.AutodetectFilters]: !settingsStorage.get(SettingOption.DisableDetectFilters),
            [GeneralSettingsOption.SafebrowsingEnabled]: !settingsStorage.get(SettingOption.DisableSafebrowsing),
            [GeneralSettingsOption.FiltersUpdatePeriod]: settingsStorage.get(SettingOption.FiltersUpdatePeriod),
            [GeneralSettingsOption.AppearanceTheme]: settingsStorage.get(SettingOption.AppearanceTheme),
        };
    }

    /**
     * Imports extension specific settings from object of {@link ExtensionSpecificSettingsConfig}.
     */
    private static importExtensionSpecificSettings({
        [ExtensionSpecificSettingsOption.UseOptimizedFilters]: useOptimizedFilters,
        [ExtensionSpecificSettingsOption.CollectHitsCount]: collectHitsCount,
        [ExtensionSpecificSettingsOption.ShowContextMenu]: showContextMenu,
        [ExtensionSpecificSettingsOption.ShowInfoAboutAdguard]: showInfoAboutAdguard,
        [ExtensionSpecificSettingsOption.ShowAppUpdatedInfo]: showAppUpdatedInfo,
        [ExtensionSpecificSettingsOption.HideRateAdguard]: hideRateAdguard,
        [ExtensionSpecificSettingsOption.UserRulesEditorWrap]: userRulesEditorWrap,
    }: ExtensionSpecificSettingsConfig): void {
        settingsStorage.set(SettingOption.UseOptimizedFilters, useOptimizedFilters);
        settingsStorage.set(SettingOption.DisableCollectHits, !collectHitsCount);
        settingsStorage.set(SettingOption.DisableShowContextMenu, !showContextMenu);
        settingsStorage.set(SettingOption.DisableShowAdguardPromoInfo, !showInfoAboutAdguard);
        settingsStorage.set(SettingOption.DisableShowAppUpdatedNotification, !showAppUpdatedInfo);
        settingsStorage.set(SettingOption.HideRateBlock, hideRateAdguard);
        settingsStorage.set(SettingOption.UserRulesEditorWrap, userRulesEditorWrap);
    }

    /**
     * Exports extension specific settings to object of {@link ExtensionSpecificSettingsConfig}.
     *
     * @returns Object of {@link ExtensionSpecificSettingsConfig}.
     */
    private static exportExtensionSpecificSettings(): ExtensionSpecificSettingsConfig {
        return {
            [ExtensionSpecificSettingsOption.UseOptimizedFilters]: (
                settingsStorage.get(SettingOption.UseOptimizedFilters)
            ),
            [ExtensionSpecificSettingsOption.CollectHitsCount]: (
                !settingsStorage.get(SettingOption.DisableCollectHits)
            ),
            [ExtensionSpecificSettingsOption.ShowContextMenu]: (
                !settingsStorage.get(SettingOption.DisableShowContextMenu)
            ),
            [ExtensionSpecificSettingsOption.ShowInfoAboutAdguard]: (
                !settingsStorage.get(SettingOption.DisableShowAdguardPromoInfo)
            ),
            [ExtensionSpecificSettingsOption.ShowAppUpdatedInfo]: (
                !settingsStorage.get(SettingOption.DisableShowAppUpdatedNotification)
            ),
            [ExtensionSpecificSettingsOption.HideRateAdguard]: (
                settingsStorage.get(SettingOption.HideRateBlock)
            ),
            [ExtensionSpecificSettingsOption.UserRulesEditorWrap]: (
                settingsStorage.get(SettingOption.UserRulesEditorWrap)
            ),
        };
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
     *
     * @private
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
     * Loads built-in filters from the local storage, and enables them.
     *
     * @param filterIds Ids of filters to load and enable.
     *
     * @private
     */
    private static async loadBuiltInFiltersLocal(filterIds: number[]): Promise<void> {
        const filtersToEnable: number[] = [];

        const tasks = filterIds.map(async (filterId: number) => {
            try {
                await CommonFilterApi.loadFilterRulesFromBackend({ filterId, ignorePatches: true }, false);

                filtersToEnable.push(filterId);
            } catch (e) {
                // error may be thrown if filter is deprecated and its local copy no longer exists
                logger.debug(`[ext.SettingsApi.loadBuiltInFiltersLocal]: filter rules were not loaded from local storage for filter: ${filterId}, error:`, getZodErrorMessage(e));
            }
        });

        await Promise.allSettled(tasks);

        filterStateStorage.enableFilters(filtersToEnable);
    }

    /**
     * Loads built-in filters and enables them **for MV2**.
     * Firstly, tries to load filters from the backend, if it fails, tries to load them from the embedded.
     *
     * @param builtInFilters Array of built-in filters ids.
     *
     * @private
     */
    private static async loadBuiltInFiltersMv2(builtInFilters: number[]): Promise<void> {
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

        logger.debug(`[ext.SettingsApi.loadBuiltInFiltersMv2]: trying to load from storage filters with ids: ${filterIdsToLoadLocal.join(', ')}`);
        await SettingsApi.loadBuiltInFiltersLocal(filterIdsToLoadLocal);
    }

    /**
     * Loads built-in filters and enables them **for MV3**.
     *
     * Checks whether the filter is supported by MV3.
     * Tries to load them from the storage only.
     *
     * @param builtInFilters Array of built-in filters ids.
     *
     * @private
     */
    private static async loadBuiltInFiltersMv3(builtInFilters: number[]): Promise<void> {
        const filtersToLoad: number[] = [];

        builtInFilters.forEach((filterId) => {
            if (CommonFilterApi.isMv3Supported(filterId)) {
                filtersToLoad.push(filterId);
            } else {
                logger.debug(`[ext.SettingsApi.loadBuiltInFiltersMv3]: MV3 extension does not support filter with id ${filterId}`);
            }
        });

        await SettingsApi.loadBuiltInFiltersLocal(filtersToLoad);
    }

    /**
     * Imports filters settings from object of {@link FiltersConfig}.
     */
    private static async importFilters({
        [FiltersOption.EnabledFilters]: enabledFilters,
        [FiltersOption.EnabledGroups]: enabledGroups,
        [FiltersOption.CustomFilters]: customFilters,
        [FiltersOption.UserFilter]: userFilter,
        [FiltersOption.Allowlist]: allowlist,
    }: FiltersConfig): Promise<void> {
        await SettingsApi.importUserFilter(userFilter);
        SettingsApi.importAllowlist(allowlist);

        const filtersToEnable = enabledFilters.filter((filterId: number) => {
            return CommonFilterUtils.isCommonFilter(filterId);
        });

        // special handling for large AdGuard Annoyances filter,
        // all other deprecated filters shall be skipped;
        // only for MV2 because it was never available in MV3
        if (filtersToEnable.includes(AntiBannerFiltersId.AnnoyancesCombinedFilterId)) {
            filtersToEnable.push(...SEPARATE_ANNOYANCE_FILTER_IDS);
        }

        await SettingsApi.loadBuiltInFiltersMv2(filtersToEnable);

        await CustomFilterApi.createFilters(customFilters);

        groupStateStorage.enableGroups(enabledGroups);

        logger.info(`[ext.SettingsApi.importFilters]: next groups were enabled: ${enabledGroups}`);

        // Disable groups not listed in the imported list.
        const allGroups = groupStateStorage.getData();
        const allGroupsIds = Object.keys(allGroups).map((id) => Number(id));

        const groupIdsToDisable = allGroupsIds
            .filter((groupId) => !enabledGroups.includes(groupId));

        // Disable all other groups and mark them as untouched.
        groupStateStorage.disableGroups(groupIdsToDisable, false);
    }

    /**
     * Exports filters settings to object of {@link FiltersConfig}.
     *
     * @returns Object of {@link FiltersConfig}.
     */
    private static async exportFilters(): Promise<FiltersConfig> {
        return {
            [FiltersOption.EnabledFilters]: filterStateStorage.getEnabledFilters(),
            [FiltersOption.EnabledGroups]: groupStateStorage.getEnabledGroups(),
            [FiltersOption.CustomFilters]: CustomFilterApi.getFiltersData(),
            [FiltersOption.UserFilter]: await SettingsApi.exportUserFilter(),
            [FiltersOption.Allowlist]: SettingsApi.exportAllowlist(),
        };
    }

    /**
     * Imports user rules from object of {@link UserFilterConfig}.
     */
    private static async importUserFilter({
        [UserFilterOption.Enabled]: enabled,
        [UserFilterOption.Rules]: rulesText,
    }: UserFilterConfig): Promise<void> {
        if (typeof enabled === 'boolean') {
            settingsStorage.set(SettingOption.UserFilterEnabled, enabled);
        } else {
            settingsStorage.set(SettingOption.UserFilterEnabled, true);
        }

        await UserRulesApi.setUserRules(rulesText);
    }

    /**
     * Exports user rules to object of {@link UserFilterConfig}.
     *
     * @returns Object of {@link UserFilterConfig}.
     */
    private static async exportUserFilter(): Promise<UserFilterConfig> {
        return {
            [UserFilterOption.Enabled]: settingsStorage.get(SettingOption.UserFilterEnabled),
            [UserFilterOption.Rules]: (await UserRulesApi.getOriginalUserRules()),
            [UserFilterOption.DisabledRules]: '',
        };
    }

    /**
     * Imports extension allowlist from object of {@link AllowlistConfig}.
     */
    private static importAllowlist({
        [AllowlistOption.Enabled]: enabled,
        [AllowlistOption.Inverted]: inverted,
        [AllowlistOption.Domains]: domains,
        [AllowlistOption.InvertedDomains]: invertedDomains,
    }: AllowlistConfig): void {
        if (typeof enabled === 'boolean') {
            settingsStorage.set(SettingOption.AllowlistEnabled, enabled);
        } else {
            settingsStorage.set(SettingOption.AllowlistEnabled, true);
        }

        if (typeof inverted === 'boolean') {
            settingsStorage.set(SettingOption.DefaultAllowlistMode, !inverted);
        } else {
            settingsStorage.set(SettingOption.DefaultAllowlistMode, true);
        }

        AllowlistApi.setAllowlistDomains(domains);
        AllowlistApi.setInvertedAllowlistDomains(invertedDomains);
    }

    /**
     * Exports extension allowlist to object of {@link AllowlistConfig}.
     *
     * @returns Object of {@link AllowlistConfig}.
     */
    private static exportAllowlist(): AllowlistConfig {
        return {
            [AllowlistOption.Enabled]: settingsStorage.get(SettingOption.AllowlistEnabled),
            [AllowlistOption.Inverted]: !settingsStorage.get(SettingOption.DefaultAllowlistMode),
            [AllowlistOption.Domains]: AllowlistApi.getAllowlistDomains(),
            [AllowlistOption.InvertedDomains]: AllowlistApi.getInvertedAllowlistDomains(),
        };
    }

    /**
     * Imports Tracking protection (formerly Stealth mode) settings from object of {@link StealthConfig}.
     */
    private static async importStealth({
        [StealthOption.DisableStealthMode]: disableStealthMode,
        [StealthOption.HideReferrer]: hideReferrer,
        [StealthOption.HideSearchQueries]: hideSearchQueries,
        [StealthOption.SendDoNotTrack]: sendDoNotTrack,
        [StealthOption.BlockWebRTC]: blockWebRTC,
        [StealthOption.RemoveXClientData]: removeXClientData,
        [StealthOption.SelfDestructThirdPartyCookies]: selfDestructThirdPartyCookies,
        [StealthOption.SelfDestructThirdPartyCookiesTime]: selfDestructThirdPartyCookiesTime,
        [StealthOption.SelfDestructFirstPartyCookies]: selfDestructFirstPartyCookies,
        [StealthOption.SelfDestructFirstPartyCookiesTime]: selfDestructFirstPartyCookiesTime,
        [StealthOption.BlockKnownTrackers]: blockKnownTrackers,
        [StealthOption.StripTrackingParams]: stripTrackingParam,
    }: StealthConfig): Promise<void> {
        /**
         * Set "block webrtc" setting as soon as possible. AG-9980
         * don't set the actual value to avoid requesting permissions.
         */
        if (settingsStorage.get(SettingOption.BlockWebRTC) !== blockWebRTC) {
            settingsStorage.set(SettingOption.BlockWebRTC, blockWebRTC);
        }

        settingsStorage.set(SettingOption.DisableStealthMode, disableStealthMode);
        settingsStorage.set(SettingOption.HideReferrer, hideReferrer);
        settingsStorage.set(SettingOption.HideSearchQueries, hideSearchQueries);
        settingsStorage.set(SettingOption.SendDoNotTrack, sendDoNotTrack);
        settingsStorage.set(SettingOption.RemoveXClientData, removeXClientData);

        settingsStorage.set(SettingOption.SelfDestructThirdPartyCookies, selfDestructThirdPartyCookies);
        if (selfDestructThirdPartyCookiesTime) {
            settingsStorage.set(SettingOption.SelfDestructThirdPartyCookiesTime, selfDestructThirdPartyCookiesTime);
        }

        settingsStorage.set(SettingOption.SelfDestructFirstPartyCookies, selfDestructFirstPartyCookies);
        if (selfDestructFirstPartyCookiesTime) {
            settingsStorage.set(SettingOption.SelfDestructFirstPartyCookiesTime, selfDestructFirstPartyCookiesTime);
        }

        if (stripTrackingParam) {
            await FiltersApi.loadAndEnableFilters([AntiBannerFiltersId.UrlTrackingFilterId], true);
        } else {
            filterStateStorage.disableFilters([AntiBannerFiltersId.UrlTrackingFilterId]);
        }

        if (blockKnownTrackers) {
            await FiltersApi.loadAndEnableFilters([AntiBannerFiltersId.TrackingFilterId], true);
        } else {
            filterStateStorage.disableFilters([AntiBannerFiltersId.TrackingFilterId]);
        }
    }

    /**
     * Exports Tracking protection (formerly Stealth mode) settings to object of {@link StealthConfig}.
     *
     * @returns Object of {@link StealthConfig}.
     */
    private static exportStealth(): StealthConfig {
        return {
            [StealthOption.DisableStealthMode]: settingsStorage.get(SettingOption.DisableStealthMode),
            [StealthOption.HideReferrer]: settingsStorage.get(SettingOption.HideReferrer),
            [StealthOption.HideSearchQueries]: settingsStorage.get(SettingOption.HideSearchQueries),
            [StealthOption.SendDoNotTrack]: settingsStorage.get(SettingOption.SendDoNotTrack),
            [StealthOption.BlockWebRTC]: settingsStorage.get(SettingOption.BlockWebRTC),
            [StealthOption.RemoveXClientData]: settingsStorage.get(SettingOption.RemoveXClientData),
            [StealthOption.SelfDestructThirdPartyCookies]: (
                settingsStorage.get(SettingOption.SelfDestructThirdPartyCookies)
            ),
            [StealthOption.SelfDestructThirdPartyCookiesTime]: (
                settingsStorage.get(SettingOption.SelfDestructThirdPartyCookiesTime)
            ),
            [StealthOption.SelfDestructFirstPartyCookies]: (
                settingsStorage.get(SettingOption.SelfDestructFirstPartyCookies)
            ),
            [StealthOption.SelfDestructFirstPartyCookiesTime]: (
                settingsStorage.get(SettingOption.SelfDestructFirstPartyCookiesTime)
            ),
            [StealthOption.BlockKnownTrackers]: (
                !!filterStateStorage.get(AntiBannerFiltersId.TrackingFilterId)?.enabled
            ),
            [StealthOption.StripTrackingParams]: (
                !!filterStateStorage.get(AntiBannerFiltersId.UrlTrackingFilterId)?.enabled
            ),
        };
    }
}
