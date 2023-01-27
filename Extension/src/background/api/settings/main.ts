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
import { SettingsConfig } from '@adguard/tswebextension';
import { Log } from '../../../common/log';
import { AppearanceTheme, defaultSettings } from '../../../common/settings';

import {
    AllowlistConfig,
    AllowlistOption,
    configValidator,
    ExtensionSpecificSettingsConfig,
    ExtensionSpecificSettingsOption,
    FiltersConfig,
    FiltersOption,
    GeneralSettingsConfig,
    GeneralSettingsOption,
    RootOption,
    PROTOCOL_VERSION,
    StealthConfig,
    StealthOption,
    UserFilterConfig,
    UserFilterOption,
    SettingOption,
    Settings,
    settingsValidator,
} from '../../schema';

import {
    filterStateStorage,
    groupStateStorage,
    settingsStorage,
    storage,
} from '../../storages';

import {
    CommonFilterApi,
    CustomFilterApi,
    CustomFilterDTO,
    FiltersApi,
    UserRulesApi,
    AllowlistApi,
} from '../filters';

import { ADGUARD_SETTINGS_KEY, AntiBannerFiltersId } from '../../../common/constants';
import { settingsEvents } from '../../events';
import { listeners } from '../../notifier';
import { SettingsMigrations } from './migrations';
import { Unknown } from '../../../common/unknown';
import { Prefs } from '../../prefs';
import { ASSISTANT_INJECT_OUTPUT, DOCUMENT_BLOCK_OUTPUT } from '../../../../../constants';

export type SettingsData = {
    names: typeof SettingOption,
    defaultValues: Settings,
    values: Settings,
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
            const data = await storage.get(ADGUARD_SETTINGS_KEY);
            const settings = settingsValidator.parse(data);
            settingsStorage.setCache(settings);
        } catch (e) {
            Log.error('Can\'t init settings from storage: ', e);
            Log.info('Reverting settings to default values');
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
        listeners.notifyListeners(listeners.SettingUpdated, {
            propertyName: key,
            propertyValue: value,
        });
    }

    /**
     * Get setting from setting storage.
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
     * @returns Collected {@link SettingsConfig} for tswebextension.
     */
    public static getTsWebExtConfiguration(): SettingsConfig {
        return {
            assistantUrl: `/${ASSISTANT_INJECT_OUTPUT}.js`,
            documentBlockingPageUrl: `${Prefs.baseUrl}${DOCUMENT_BLOCK_OUTPUT}.html`,
            collectStats: !settingsStorage.get(SettingOption.DisableCollectHits),
            allowlistInverted: !settingsStorage.get(SettingOption.DefaultAllowlistMode),
            allowlistEnabled: settingsStorage.get(SettingOption.AllowlistEnabled),
            stealthModeEnabled: !settingsStorage.get(SettingOption.DisableStealthMode),
            filteringEnabled: !settingsStorage.get(SettingOption.DisableFiltering),
            stealth: {
                blockChromeClientData: settingsStorage.get(SettingOption.BlockChromeClientData),
                hideReferrer: settingsStorage.get(SettingOption.HideReferrer),
                hideSearchQueries: settingsStorage.get(SettingOption.HideSearchQueries),
                sendDoNotTrack: settingsStorage.get(SettingOption.SendDoNotTrack),
                blockWebRTC: settingsStorage.get(SettingOption.BlockWebRTC),
                selfDestructThirdPartyCookies: settingsStorage.get(SettingOption.SelfDestructThirdPartyCookies),
                selfDestructThirdPartyCookiesTime: (
                    settingsStorage.get(SettingOption.SelfDestructThirdPartyCookiesTime)
                ),
                selfDestructFirstPartyCookies: settingsStorage.get(SettingOption.SelfDestructFirstPartyCookies),
                selfDestructFirstPartyCookiesTime: (
                    settingsStorage.get(SettingOption.SelfDestructFirstPartyCookiesTime)
                ),
            },
        };
    }

    /**
     * Resets to default settings.
     */
    public static async reset(): Promise<void> {
        await UserRulesApi.setUserRules([]);

        // Set settings store to defaults
        settingsStorage.setData({
            ...defaultSettings,
        });

        // Re-init filters
        await FiltersApi.init();

        await CommonFilterApi.initDefaultFilters();
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

            await SettingsApi.reset();

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
            Log.error(e);
            return false;
        }
    }

    /**
     * Exports settings to string with JSON format.
     */
    public static async export(): Promise<string> {
        return JSON.stringify({
            [RootOption.ProtocolVersion]: PROTOCOL_VERSION,
            [RootOption.GeneralSettings]: SettingsApi.exportGeneralSettings(),
            [RootOption.ExtensionSpecificSettings]: SettingsApi.exportExtensionSpecificSettings(),
            [RootOption.Filters]: await SettingsApi.exportFilters(),
            [RootOption.Stealth]: SettingsApi.exportStealth(),
        });
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
            settingsStorage.set(SettingOption.AppearanceTheme, appearanceTheme as AppearanceTheme);
        }

        if (allowAcceptableAds) {
            await CommonFilterApi.loadFilterRulesFromBackend(
                AntiBannerFiltersId.SearchAndSelfPromoFilterId,
                false,
            );
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

        const tasks = enabledFilters.map(async filterId => {
            await CommonFilterApi.loadFilterRulesFromBackend(filterId, false);
            filterStateStorage.enableFilters([filterId]);
        });

        await Promise.allSettled(tasks);

        await CustomFilterApi.createFilters(customFilters as CustomFilterDTO[]);
        groupStateStorage.enableGroups(enabledGroups);
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
        [UserFilterOption.Rules]: rules,
    }: UserFilterConfig): Promise<void> {
        if (typeof enabled === 'boolean') {
            settingsStorage.set(SettingOption.UserFilterEnabled, enabled);
        } else {
            settingsStorage.set(SettingOption.UserFilterEnabled, true);
        }

        await UserRulesApi.setUserRules(rules.split('\n'));
    }

    /**
     * Exports user rules to object of {@link UserFilterConfig}.
     *
     * @returns Object of {@link UserFilterConfig}.
     */
    private static async exportUserFilter(): Promise<UserFilterConfig> {
        return {
            [UserFilterOption.Enabled]: settingsStorage.get(SettingOption.UserFilterEnabled),
            [UserFilterOption.Rules]: (await UserRulesApi.getUserRules()).join('/n'),
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
     * Imports stealth mode settings from object of {@link StealthConfig}.
     */
    private static async importStealth({
        [StealthOption.DisableStealthMode]: disableStealthMode,
        [StealthOption.HideReferrer]: hideReferrer,
        [StealthOption.HideSearchQueries]: hideSearchQueries,
        [StealthOption.SendDoNotTrack]: sendDoNotTrack,
        [StealthOption.BlockWebRTC]: blockWebRTC,
        [StealthOption.RemoveXClientData]: removeXClientData,
        [StealthOption.BlockThirdPartyCookies]: blockThirdPartyCookies,
        [StealthOption.BlockThirdPartyCookiesTime]: blockThirdPartyCookiesTime,
        [StealthOption.BlockFirstPartyCookies]: blockFirstPartyCookies,
        [StealthOption.BlockFirstPartyCookiesTime]: blockFirstPartyCookiesTime,
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
        settingsStorage.set(SettingOption.BlockChromeClientData, removeXClientData);
        settingsStorage.set(SettingOption.SelfDestructThirdPartyCookies, blockThirdPartyCookies);

        if (blockThirdPartyCookiesTime) {
            settingsStorage.set(SettingOption.SelfDestructThirdPartyCookiesTime, blockThirdPartyCookiesTime);
        }

        settingsStorage.set(SettingOption.SelfDestructFirstPartyCookies, blockFirstPartyCookies);

        if (blockFirstPartyCookiesTime) {
            settingsStorage.set(SettingOption.SelfDestructFirstPartyCookiesTime, blockFirstPartyCookiesTime);
        }

        if (stripTrackingParam) {
            await FiltersApi.loadAndEnableFilters([AntiBannerFiltersId.UrlTrackingFilterId]);
        } else {
            filterStateStorage.disableFilters([AntiBannerFiltersId.UrlTrackingFilterId]);
        }

        if (blockKnownTrackers) {
            await FiltersApi.loadAndEnableFilters([AntiBannerFiltersId.TrackingFilterId]);
        } else {
            filterStateStorage.disableFilters([AntiBannerFiltersId.TrackingFilterId]);
        }
    }

    /**
     * Exports stealth mode settings to object of {@link StealthConfig}.
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
            [StealthOption.RemoveXClientData]: settingsStorage.get(SettingOption.BlockChromeClientData),
            [StealthOption.BlockThirdPartyCookies]: (
                settingsStorage.get(SettingOption.SelfDestructThirdPartyCookies)
            ),
            [StealthOption.BlockThirdPartyCookiesTime]: (
                settingsStorage.get(SettingOption.SelfDestructThirdPartyCookiesTime)
            ),
            [StealthOption.BlockFirstPartyCookies]: (
                settingsStorage.get(SettingOption.SelfDestructFirstPartyCookies)
            ),
            [StealthOption.BlockFirstPartyCookiesTime]: (
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
