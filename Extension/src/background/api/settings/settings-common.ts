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
import { defaultSettings } from '../../../common/settings';
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
    type AppearanceTheme,
    NotifierType,
} from '../../../common/constants';
import { settingsEvents } from '../../events';
import { notifier } from '../../notifier';
import { Unknown } from '../../../common/unknown';
import { messenger } from '../../../pages/services/messenger';
import { Prefs } from '../../prefs';
import { ASSISTANT_INJECT_OUTPUT, BLOCKING_BLOCKED_OUTPUT } from '../../../../../constants';
import { DocumentBlockApi } from '../document-block';
import { filteringLogApi } from '../filtering-log';
import { getZodErrorMessage } from '../../../common/error';
import { CommonFilterUtils } from '../../../common/common-filter-utils';
import { NotImplementedError } from '../../errors/not-implemented-error';

import { SettingsMigrations } from './migrations';

export type SettingsData = {
    names: typeof SettingOption;
    defaultValues: Settings;
    values: Settings;
};

type CommonSettingsConfig = Pick<SettingsConfig,
      'assistantUrl'
    | 'documentBlockingPageUrl'
    | 'collectStats'
    | 'stealth'
    | 'allowlistInverted'
    | 'allowlistEnabled'
    | 'stealthModeEnabled'
    | 'filteringEnabled'
>;

/**
 * SettingsApi is a facade class for encapsulating the work with extension
 * settings: getting, installing, gathering tswebextension configuration from
 * current settings, importing and exporting.
 */
export class SettingsApiCommon {
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
            logger.error('[ext.SettingsApiCommon.init]: cannot init settings from storage:', getZodErrorMessage(e));
            logger.info('[ext.SettingsApiCommon.init]: reverting settings to default values');
            const settings = { ...defaultSettings };

            // Update settings in the cache and in the storage
            settingsStorage.setData(settings);
        }
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
     * Collects {@link CommonSettingsConfig} for tswebextension from current extension settings.
     *
     * @returns Collected {@link CommonSettingsConfig} for tswebextension.
     */
    protected static getCommonTsWebExtConfiguration(): CommonSettingsConfig {
        // pass the locale explicitly as a part of the url
        const documentBlockingPageUrl = `${Prefs.baseUrl}${BLOCKING_BLOCKED_OUTPUT}.html?_locale=${Prefs.language}`;

        return {
            assistantUrl: `/${ASSISTANT_INJECT_OUTPUT}.js`,
            documentBlockingPageUrl,
            collectStats: !settingsStorage.get(SettingOption.DisableCollectHits) || filteringLogApi.isOpen(),
            allowlistInverted: !settingsStorage.get(SettingOption.DefaultAllowlistMode),
            allowlistEnabled: settingsStorage.get(SettingOption.AllowlistEnabled),
            stealthModeEnabled: !settingsStorage.get(SettingOption.DisableStealthMode),
            filteringEnabled: !settingsStorage.get(SettingOption.DisableFiltering),
            stealth: {
                // TODO: revert when will be found a better way to add exclusions for $stealth=referrer
                // AG-34765
                hideReferrer: settingsStorage.get(SettingOption.HideReferrer),
                // TODO: revert when will be found a better way to add exclusions for $stealth=searchqueries
                hideSearchQueries: settingsStorage.get(SettingOption.HideSearchQueries),
                blockChromeClientData: settingsStorage.get(SettingOption.RemoveXClientData),
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
     * @param shouldInitDefaultFilters - Should initialize default filters or not, default value is `true`.
     */
    public static async reset(enableUntouchedGroups: boolean, shouldInitDefaultFilters = true): Promise<void> {
        await UserRulesApi.setUserRules('');

        // Set settings store to defaults
        settingsStorage.setData({
            ...defaultSettings,
        });

        // Re-init filters
        await FiltersApi.init(false);

        // On import should not enable default filters
        // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/3136
        if (shouldInitDefaultFilters) {
            // On import should enable only groups from imported file.
            await CommonFilterApi.initDefaultFilters(enableUntouchedGroups);
        }

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

            /**
             * 1. Should not enable default groups.
             * 2. Should not enable default filters.
             *
             * @see {@link https://github.com/AdguardTeam/AdguardBrowserExtension/issues/3136}
             */
            await SettingsApiCommon.reset(false, false);

            SettingsApiCommon.importExtensionSpecificSettings(
                validConfig[RootOption.ExtensionSpecificSettings],
            );

            const stealthOptions = validConfig[RootOption.Stealth];

            if (stealthOptions) {
                // FIXME: check, that overriding it is work
                await this.importStealth(stealthOptions);
            }

            // FIxME: check, that overriding is work
            await this.importGeneralSettings(validConfig[RootOption.GeneralSettings]);
            await this.importFilters(validConfig[RootOption.Filters]);

            return true;
        } catch (e) {
            logger.error('[ext.SettingsApiCommon.import]: cannot import settings:', getZodErrorMessage(e));
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
            [RootOption.GeneralSettings]: SettingsApiCommon.exportGeneralSettings(),
            [RootOption.ExtensionSpecificSettings]: SettingsApiCommon.exportExtensionSpecificSettings(),
            [RootOption.Filters]: await SettingsApiCommon.exportFilters(),
            [RootOption.Stealth]: SettingsApiCommon.exportStealth(),
        };

        // FIXME: Is it better to leave it with formatting or without?
        return JSON.stringify(config, null, 4);
    }

    /**
     * Imports general settings from object of {@link GeneralSettingsConfig}.
     */
    protected static async importGeneralSettings({
        [GeneralSettingsOption.AllowAcceptableAds]: allowAcceptableAds,
        [GeneralSettingsOption.ShowBlockedAdsCount]: showBlockedAdsCount,
        [GeneralSettingsOption.AutodetectFilters]: autodetectFilters,
        [GeneralSettingsOption.AppearanceTheme]: appearanceTheme,
    }: GeneralSettingsConfig): Promise<void> {
        // TODO: AllowAcceptableAds

        settingsStorage.set(SettingOption.DisableShowPageStats, !showBlockedAdsCount);
        settingsStorage.set(SettingOption.DisableDetectFilters, !autodetectFilters);

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
                    `[ext.SettingsApiCommon.importGeneralSettings]: Failed to load filter with id ${AntiBannerFiltersId.SearchAndSelfPromoFilterId} due to ${e}`,
                );
            }
            filterStateStorage.enableFilters([AntiBannerFiltersId.SearchAndSelfPromoFilterId]);
        } else {
            filterStateStorage.disableFilters([AntiBannerFiltersId.SearchAndSelfPromoFilterId]);
        }
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
        await SettingsApiCommon.importUserFilter(userFilter);
        SettingsApiCommon.importAllowlist(allowlist);

        // FIXME: check, that overriding it is work
        const filtersToEnable = this.getFiltersToEnable(enabledFilters);
        // FIXME: check, that overriding it is work
        await this.loadBuiltInFilters(filtersToEnable);

        await CustomFilterApi.createFilters(customFilters);

        groupStateStorage.enableGroups(enabledGroups);

        logger.info(`[ext.SettingsApiCommon.importFilters]: next groups were enabled: ${enabledGroups}`);

        // Disable groups not listed in the imported list.
        const allGroups = groupStateStorage.getData();
        const allGroupsIds = Object.keys(allGroups).map((id) => Number(id));

        const groupIdsToDisable = allGroupsIds
            .filter((groupId) => !enabledGroups.includes(groupId));

        // Disable all other groups and mark them as untouched.
        groupStateStorage.disableGroups(groupIdsToDisable, false);
    }

    /**
     * Gets enabled filters to return only common filters.
     *
     * @param enabledFilters Array of enabled filter ids.
     *
     * @returns Array of common filter ids.
     */
    protected static getFiltersToEnable(enabledFilters: number[]): number[] {
        return enabledFilters.filter((filterId: number) => {
            return CommonFilterUtils.isCommonFilter(filterId);
        });
    }

    /**
     * Loads built-in filters from storage. Must be overridden in subclasses.
     *
     * @param filtersToEnable Array of filter ids to load and enable.
     *
     * @throws {NotImplementedError} This method must be implemented in subclasses.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected static loadBuiltInFilters(filtersToEnable: number[]): Promise<void> {
        throw new NotImplementedError();
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
            // FIXME: mv3 export this, but not import!!!
            [GeneralSettingsOption.SafebrowsingEnabled]: !settingsStorage.get(SettingOption.DisableSafebrowsing),
            // FIXME: mv3 export this, but not import!!!
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
        [ExtensionSpecificSettingsOption.AllowAnonymizedUsageData]: allowAnonymizedUsageData,
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
        if (allowAnonymizedUsageData !== undefined) {
            settingsStorage.set(SettingOption.AllowAnonymizedUsageData, allowAnonymizedUsageData);
        }
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
            [ExtensionSpecificSettingsOption.AllowAnonymizedUsageData]: (
                settingsStorage.get(SettingOption.AllowAnonymizedUsageData)
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
     * Loads built-in filters from the local storage, and enables them.
     *
     * @param filterIds Ids of filters to load and enable.
     *
     * @private
     */
    protected static async loadBuiltInFiltersLocal(filterIds: number[]): Promise<void> {
        const filtersToEnable: number[] = [];

        const tasks = filterIds.map(async (filterId: number) => {
            try {
                await CommonFilterApi.loadFilterRulesFromBackend({ filterId, ignorePatches: true }, false);

                filtersToEnable.push(filterId);
            } catch (e) {
                // error may be thrown if filter is deprecated and its local copy no longer exists
                logger.debug(`[ext.SettingsApiCommon.loadBuiltInFiltersLocal]: filter rules were not loaded from local storage for filter: ${filterId}, error:`, getZodErrorMessage(e));
            }
        });

        await Promise.allSettled(tasks);

        filterStateStorage.enableFilters(filtersToEnable);
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
            [FiltersOption.UserFilter]: await SettingsApiCommon.exportUserFilter(),
            [FiltersOption.Allowlist]: SettingsApiCommon.exportAllowlist(),
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
     *
     * @param stealthConfig Stealth configuration object.
     * @param remote Whether to load filters from remote or local storage.
     */
    protected static async importStealth(
        {
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
        }: StealthConfig,
        remote: boolean = false,
    ): Promise<void> {
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
            await FiltersApi.loadAndEnableFilters([AntiBannerFiltersId.UrlTrackingFilterId], remote);
        } else {
            filterStateStorage.disableFilters([AntiBannerFiltersId.UrlTrackingFilterId]);
        }

        if (blockKnownTrackers) {
            await FiltersApi.loadAndEnableFilters([AntiBannerFiltersId.TrackingFilterId], remote);
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
