/**
 * Copyright (c) 2015-2026 Adguard Software Ltd.
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

import { SettingsApi } from 'settings-api';

import { logger } from '../../../../common/logger';
import { metadataStorage } from '../../../storages';
import {
    PROTOCOL_VERSION,
    RootOption,
    GeneralSettingsOption,
    ExtensionSpecificSettingsOption,
    FiltersOption,
    StealthOption,
    AllowlistOption,
    UserFilterOption,
    CustomFilterOption,
    SettingOption,
    type Config,
} from '../../../schema';
import {
    DEFAULT_THIRD_PARTY_COOKIES_SELF_DESTRUCT_MIN,
    DEFAULT_FIRST_PARTY_COOKIES_SELF_DESTRUCT_MIN,
    defaultSettings,
} from '../../../../common/settings';
import { AntiBannerFiltersId, AntibannerGroupsId } from '../../../../common/constants';

import { UrlParamParser } from './url-param-parser';
import { type ImportConfiguration } from './types';

/**
 * API for importing user configuration from URL parameters.
 *
 * Applies full-replace semantics: settings present in the URL are set to their
 * imported values; settings NOT present in the URL are reset to their defaults.
 */
export abstract class ConfigurationImportApi {
    /**
     * Parses an import configuration URL query string.
     *
     * @param queryString Raw query string from the `adguard:import_user_configuration` URL.
     *
     * @returns Parsed import configuration.
     */
    public static parseUrl(queryString: string): ImportConfiguration {
        return UrlParamParser.parse(queryString);
    }

    /**
     * Checks whether the parsed configuration contains any applicable settings.
     *
     * @param config Parsed {@link ImportConfiguration}.
     *
     * @returns `true` if the config has at least one applicable setting.
     */
    // eslint-disable-next-line class-methods-use-this
    public hasApplicableSettings(config: ImportConfiguration): boolean {
        return (
            config.regularFilters.length > 0
            || config.customFilters.length > 0
            || Object.keys(config.stealth).length > 0
            || config.browsingSecurity !== undefined
        );
    }

    /**
     * Applies the parsed import configuration using full-replace semantics.
     * Builds a complete {@link Config} from defaults overlaid with URL-provided
     * values, then delegates to {@link SettingsApi.import} which handles reset,
     * validation, filter loading, group management, and MV2/MV3 differences.
     *
     * @param config Parsed {@link ImportConfiguration}.
     *
     * @returns `true` if the import succeeded, `false` otherwise.
     */
    // eslint-disable-next-line class-methods-use-this
    public async applyConfig(config: ImportConfiguration): Promise<boolean> {
        const fullConfig = this.buildConfig(config);

        const result = await SettingsApi.import(JSON.stringify(fullConfig));

        if (!result) {
            logger.error('[ext.ConfigurationImportApi.applyConfig]: import failed');
        }

        return result;
    }

    /**
     * Builds a complete {@link Config} object from defaults overlaid with the
     * values provided in `importConfig`. Settings absent from the URL retain
     * their default values (full-replace semantics).
     *
     * `stealth.blockTrackers` and `stealth.stripUrl` are reflected in the stealth
     * section (`block-known-trackers`, `strip-tracking-parameters`) so that
     * {@link SettingsApi.import} handles the corresponding filter toggles via
     * its `importStealth` path.
     *
     * @param importConfig Parsed {@link ImportConfiguration}.
     *
     * @returns A fully-populated {@link Config} ready for {@link SettingsApi.import}.
     */
    // eslint-disable-next-line class-methods-use-this
    protected buildConfig(importConfig: ImportConfiguration): Config {
        const {
            stealth,
            regularFilters,
            customFilters,
            browsingSecurity,
        } = importConfig;

        const enabledFilters = [...regularFilters];

        if (stealth.blockTrackers === true) {
            enabledFilters.push(AntiBannerFiltersId.TrackingFilterId);
        }

        if (stealth.stripUrl === true) {
            enabledFilters.push(AntiBannerFiltersId.UrlTrackingFilterId);
        }

        const enabledGroups = ConfigurationImportApi.resolveGroupIds(enabledFilters);

        if (customFilters.length > 0) {
            enabledGroups.push(AntibannerGroupsId.CustomFiltersGroupId);
        }

        const thirdPartyCookiesMin = stealth.thirdPartyCookiesMin ?? 0;
        const thirdPartyEnabled = thirdPartyCookiesMin > 0;

        const firstPartyCookiesMin = stealth.firstPartyCookiesMin ?? 0;
        const firstPartyEnabled = firstPartyCookiesMin > 0;

        const defaults = ConfigurationImportApi.defaultConfig();

        return {
            ...defaults,
            [RootOption.GeneralSettings]: {
                ...defaults[RootOption.GeneralSettings],
                [GeneralSettingsOption.SafebrowsingEnabled]: browsingSecurity !== undefined
                    ? browsingSecurity.enabled
                    : defaults[RootOption.GeneralSettings][GeneralSettingsOption.SafebrowsingEnabled],
            },
            [RootOption.Filters]: {
                ...defaults[RootOption.Filters],
                [FiltersOption.EnabledFilters]: enabledFilters,
                [FiltersOption.EnabledGroups]: enabledGroups,
                [FiltersOption.CustomFilters]: customFilters.map(({ title, url }) => ({
                    [CustomFilterOption.CustomUrl]: url,
                    [CustomFilterOption.Title]: title,
                    [CustomFilterOption.Trusted]: true,
                    [CustomFilterOption.Enabled]: true,
                })),
            },
            [RootOption.Stealth]: {
                ...defaults[RootOption.Stealth],
                [StealthOption.DisableStealthMode]: stealth.enabled !== undefined ? !stealth.enabled : true,
                [StealthOption.HideReferrer]: stealth.hideReferrer ?? false,
                [StealthOption.HideSearchQueries]: stealth.hideSearchQueries ?? false,
                [StealthOption.SendDoNotTrack]: stealth.sendDnt ?? false,
                [StealthOption.BlockWebRTC]: stealth.blockWebrtc ?? false,
                [StealthOption.RemoveXClientData]: stealth.xClient ?? false,
                [StealthOption.SelfDestructThirdPartyCookies]: thirdPartyEnabled,
                [StealthOption.SelfDestructThirdPartyCookiesTime]: thirdPartyEnabled
                    ? thirdPartyCookiesMin
                    : DEFAULT_THIRD_PARTY_COOKIES_SELF_DESTRUCT_MIN,
                [StealthOption.SelfDestructFirstPartyCookies]: firstPartyEnabled,
                [StealthOption.SelfDestructFirstPartyCookiesTime]: firstPartyEnabled
                    ? firstPartyCookiesMin
                    : DEFAULT_FIRST_PARTY_COOKIES_SELF_DESTRUCT_MIN,
                [StealthOption.BlockKnownTrackers]: stealth.blockTrackers ?? false,
                [StealthOption.StripTrackingParams]: stealth.stripUrl ?? false,
            },
        };
    }

    /**
     * Constructs a {@link Config} object representing the extension's default
     * state, derived from {@link defaultSettings}. This serves as the baseline
     * that {@link buildConfig} overlays with URL-imported values.
     *
     * @returns A fully-populated default {@link Config}.
     */
    private static defaultConfig(): Config {
        return {
            [RootOption.ProtocolVersion]: PROTOCOL_VERSION,
            [RootOption.GeneralSettings]: {
                [GeneralSettingsOption.AllowAcceptableAds]: false,
                [GeneralSettingsOption.ShowBlockedAdsCount]: !defaultSettings[SettingOption.DisableShowPageStats],
                [GeneralSettingsOption.AutodetectFilters]: !defaultSettings[SettingOption.DisableDetectFilters],
                [GeneralSettingsOption.SafebrowsingEnabled]: !defaultSettings[SettingOption.DisableSafebrowsing],
                [GeneralSettingsOption.FiltersUpdatePeriod]: defaultSettings[SettingOption.FiltersUpdatePeriod],
            },
            [RootOption.ExtensionSpecificSettings]: {
                [ExtensionSpecificSettingsOption.UseOptimizedFilters]: (
                    defaultSettings[SettingOption.UseOptimizedFilters]
                ),
                [ExtensionSpecificSettingsOption.CollectHitsCount]: (
                    !defaultSettings[SettingOption.DisableCollectHits]
                ),
                [ExtensionSpecificSettingsOption.ShowContextMenu]: (
                    !defaultSettings[SettingOption.DisableShowContextMenu]
                ),
                [ExtensionSpecificSettingsOption.ShowInfoAboutAdguard]: (
                    !defaultSettings[SettingOption.DisableShowAdguardPromoInfo]
                ),
                [ExtensionSpecificSettingsOption.ShowAppUpdatedInfo]: (
                    !defaultSettings[SettingOption.DisableShowAppUpdatedNotification]
                ),
                [ExtensionSpecificSettingsOption.HideRateAdguard]: defaultSettings[SettingOption.HideRateBlock],
                [ExtensionSpecificSettingsOption.UserRulesEditorWrap]: (
                    defaultSettings[SettingOption.UserRulesEditorWrap]
                ),
            },
            [RootOption.Filters]: {
                [FiltersOption.EnabledFilters]: [],
                [FiltersOption.EnabledGroups]: [],
                [FiltersOption.CustomFilters]: [],
                [FiltersOption.UserFilter]: {
                    [UserFilterOption.Rules]: '',
                    [UserFilterOption.DisabledRules]: '',
                    [UserFilterOption.Enabled]: defaultSettings[SettingOption.UserFilterEnabled],
                },
                [FiltersOption.Allowlist]: {
                    [AllowlistOption.Enabled]: defaultSettings[SettingOption.AllowlistEnabled],
                    [AllowlistOption.Inverted]: !defaultSettings[SettingOption.DefaultAllowlistMode],
                    [AllowlistOption.Domains]: [],
                    [AllowlistOption.InvertedDomains]: [],
                },
            },
            [RootOption.Stealth]: {
                [StealthOption.DisableStealthMode]: defaultSettings[SettingOption.DisableStealthMode],
                [StealthOption.HideReferrer]: defaultSettings[SettingOption.HideReferrer],
                [StealthOption.HideSearchQueries]: defaultSettings[SettingOption.HideSearchQueries],
                [StealthOption.SendDoNotTrack]: defaultSettings[SettingOption.SendDoNotTrack],
                [StealthOption.BlockWebRTC]: defaultSettings[SettingOption.BlockWebRTC],
                [StealthOption.RemoveXClientData]: defaultSettings[SettingOption.RemoveXClientData],
                [StealthOption.SelfDestructThirdPartyCookies]: (
                    defaultSettings[SettingOption.SelfDestructThirdPartyCookies]
                ),
                [StealthOption.SelfDestructThirdPartyCookiesTime]: (
                    defaultSettings[SettingOption.SelfDestructThirdPartyCookiesTime]
                ),
                [StealthOption.SelfDestructFirstPartyCookies]: (
                    defaultSettings[SettingOption.SelfDestructFirstPartyCookies]
                ),
                [StealthOption.SelfDestructFirstPartyCookiesTime]: (
                    defaultSettings[SettingOption.SelfDestructFirstPartyCookiesTime]
                ),
                [StealthOption.BlockKnownTrackers]: false,
                [StealthOption.StripTrackingParams]: false,
            },
        };
    }

    /**
     * Resolves the set of group IDs that own the given filter IDs by looking
     * up each filter's metadata.  Filters whose metadata is not found (e.g.
     * custom filters) are silently skipped.
     *
     * @param filterIds Array of filter IDs to resolve.
     *
     * @returns Deduplicated array of group IDs that cover the given filters.
     */
    private static resolveGroupIds(filterIds: number[]): number[] {
        const groupIds = new Set<number>();

        for (const filterId of filterIds) {
            let meta;

            try {
                meta = metadataStorage.getFilter(filterId);
            } catch {
                logger.debug(`[ext.ConfigurationImportApi.resolveGroupIds]: skipping filter ${filterId}, metadata unavailable`);
                continue;
            }

            if (meta) {
                groupIds.add(meta.groupId);
            }
        }

        return Array.from(groupIds);
    }
}
