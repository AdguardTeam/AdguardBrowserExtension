import { SettingsConfig } from '@adguard/tswebextension';
import metadata from '../../Extension/filters/chromium/filters.json';
import i18nMetadata from '../../Extension/filters/chromium/filters_i18n.json';
import { GetStatisticsDataResponse } from '../../Extension/src/background/api';

import {
    metadataValidator,
    i18nMetadataValidator,
    Config,
    SettingOption,
    PageStatsData,
    Metadata,
    I18nMetadata,
    RootOption,
    PROTOCOL_VERSION,
    GeneralSettingsOption,
    ExtensionSpecificSettingsOption,
    FiltersOption,
    UserFilterOption,
    AllowlistOption,
    StealthOption,
} from '../../Extension/src/background/schema';
import { PageStatsStorage } from '../../Extension/src/background/storages';
import { defaultSettings } from '../../Extension/src/common/settings';
import { UserAgent } from '../../Extension/src/common/user-agent';

export const getMetadataFixture = (): Metadata => metadataValidator.parse(metadata);

export const getI18nMetadataFixture = (): I18nMetadata => i18nMetadataValidator.parse(i18nMetadata);

export const getFilterTextFixture = (): string => `
example.org##h1\n
!#if !adguard\n
adguard.com##h1\n
!#endif\n
example.org##p\n`;

export const filterTextFixture = 'example.org';

export const getDefaultExportFixture = (): Config => ({
    [RootOption.ProtocolVersion]: PROTOCOL_VERSION,
    [RootOption.GeneralSettings]: {
        [GeneralSettingsOption.AllowAcceptableAds]: true,
        [GeneralSettingsOption.ShowBlockedAdsCount]: true,
        [GeneralSettingsOption.AutodetectFilters]: true,
        [GeneralSettingsOption.SafebrowsingEnabled]: false,
        [GeneralSettingsOption.FiltersUpdatePeriod]: -1,
        [GeneralSettingsOption.AppearanceTheme]: 'system',
    },
    [RootOption.ExtensionSpecificSettings]: {
        [ExtensionSpecificSettingsOption.UseOptimizedFilters]: false,
        [ExtensionSpecificSettingsOption.CollectHitsCount]: false,
        [ExtensionSpecificSettingsOption.ShowContextMenu]: true,
        [ExtensionSpecificSettingsOption.ShowInfoAboutAdguard]: true,
        [ExtensionSpecificSettingsOption.ShowAppUpdatedInfo]: true,
        [ExtensionSpecificSettingsOption.HideRateAdguard]: false,
        [ExtensionSpecificSettingsOption.UserRulesEditorWrap]: false,
    },
    [RootOption.Filters]: {
        [FiltersOption.EnabledFilters]: [2, 10],
        [FiltersOption.EnabledGroups]: [0, 1, 6, 7],
        [FiltersOption.CustomFilters]: [],
        [FiltersOption.UserFilter]: {
            [UserFilterOption.Enabled]: true,
            [UserFilterOption.Rules]: '',
            [UserFilterOption.DisabledRules]: '',
        },
        [FiltersOption.Allowlist]: {
            [AllowlistOption.Enabled]: true,
            [AllowlistOption.Inverted]: false,
            [AllowlistOption.Domains]: [],
            [AllowlistOption.InvertedDomains]: [],
        },
    },
    [RootOption.Stealth]: {
        [StealthOption.DisableStealthMode]: true,
        [StealthOption.HideReferrer]: true,
        [StealthOption.HideSearchQueries]: true,
        [StealthOption.SendDoNotTrack]: true,
        [StealthOption.BlockWebRTC]: false,
        [StealthOption.RemoveXClientData]: UserAgent.isChrome,
        [StealthOption.BlockThirdPartyCookies]: true,
        [StealthOption.BlockThirdPartyCookiesTime]: 2880,
        [StealthOption.BlockFirstPartyCookies]: false,
        [StealthOption.BlockFirstPartyCookiesTime]: 4320,
        [StealthOption.BlockKnownTrackers]: false,
        [StealthOption.StripTrackingParams]: false,
    },
});

export const getDefaultSettingsConfigFixture = (
    documentBlockingPageUrl: string,
    assistantUrl: string,
): SettingsConfig => ({
    assistantUrl,
    documentBlockingPageUrl,
    collectStats: !defaultSettings[SettingOption.DisableCollectHits],
    allowlistInverted: !defaultSettings[SettingOption.DefaultAllowlistMode],
    allowlistEnabled: defaultSettings[SettingOption.AllowlistEnabled],
    stealthModeEnabled: !defaultSettings[SettingOption.DisableStealthMode],
    filteringEnabled: !defaultSettings[SettingOption.DisableFiltering],
    stealth: {
        blockChromeClientData: defaultSettings[SettingOption.BlockChromeClientData],
        hideReferrer: defaultSettings[SettingOption.HideReferrer],
        hideSearchQueries: defaultSettings[SettingOption.HideSearchQueries],
        sendDoNotTrack: defaultSettings[SettingOption.SendDoNotTrack],
        blockWebRTC: defaultSettings[SettingOption.BlockWebRTC],
        selfDestructThirdPartyCookies: defaultSettings[SettingOption.SelfDestructThirdPartyCookies],
        selfDestructThirdPartyCookiesTime: (
            defaultSettings[SettingOption.SelfDestructThirdPartyCookiesTime]
        ),
        selfDestructFirstPartyCookies: defaultSettings[SettingOption.SelfDestructFirstPartyCookies],
        selfDestructFirstPartyCookiesTime: (
            defaultSettings[SettingOption.SelfDestructFirstPartyCookiesTime]
        ),
    },
});

export const getEmptyPageStatsDataFixture = (
    updated: number,
): PageStatsData => {
    const emptyStats = { [PageStatsStorage.TOTAL_GROUP_ID]: 0 };
    return {
        hours: Array(PageStatsStorage.MAX_HOURS_HISTORY).fill(emptyStats),
        days: Array(PageStatsStorage.MAX_DAYS_HISTORY).fill(emptyStats),
        months: Array(PageStatsStorage.MAX_MONTHS_HISTORY).fill(emptyStats),
        updated,
    };
};

export const getEmptyStatisticDataFixture = (): GetStatisticsDataResponse => {
    const emptyStats = { [PageStatsStorage.TOTAL_GROUP_ID]: 0 };

    return {
        today: Array(24).fill(emptyStats),
        lastWeek: Array(7).fill(emptyStats),
        lastMonth: Array(30).fill(emptyStats),
        lastYear: Array(3).fill(emptyStats),
        overall: Array(3).fill(emptyStats),
        blockedGroups: [
            { groupId: 'total', groupName: 'popup_statistics_total' },
            { displayNumber: 1, groupId: 1, groupName: 'Ad Blocking' },
            { displayNumber: 2, groupId: 2, groupName: 'Privacy' },
            { displayNumber: 3, groupId: 3, groupName: 'Social Widgets' },
            { displayNumber: 4, groupId: 4, groupName: 'Annoyances' },
            { displayNumber: 5, groupId: 5, groupName: 'Security' },
            { displayNumber: 6, groupId: 6, groupName: 'Other' },
            { displayNumber: 7, groupId: 7, groupName: 'Language-specific' },
            {
                groupId: 0,
                displayNumber: 99,
                groupName: 'options_antibanner_custom_group',
            },
        ],
    };
};

export const SETTINGS_V_1_0 = {
    'protocol-version': '1.0',
    'general-settings': {
        'allow-acceptable-ads': true,
        'show-blocked-ads-count': true,
        'autodetect-filters': true,
        'safebrowsing-enabled': false,
        'filters-update-period': -1,
        'appearance-theme': 'system',
    },
    'extension-specific-settings': {
        'use-optimized-filters': false,
        'collect-hits-count': false,
        'show-context-menu': true,
        'show-info-about-adguard': false,
        'show-app-updated-info': true,
        'hide-rate-adguard': true,
        'user-rules-editor-wrap': false,
    },
    'filters': {
        'enabled-filters': [
            2,
            10,
        ],
        'enabled-groups': [
            0,
            1,
            6,
            7,
        ],
        'custom-filters': [],
        'user-filter': {
            'enabled': true,
            'rules': '',
            'disabled-rules': '',
        },
        'whitelist': {
            'enabled': false,
            'inverted': false,
            'domains': [
                'allowdomain.com',
                'allowdomain.net',
            ],
            'inverted-domains': [
                'invertedallowlist.com',
            ],
        },
    },
    'stealth': {
        'stealth_disable_stealth_mode': true,
        'stealth-hide-referrer': true,
        'stealth-hide-search-queries': true,
        'stealth-send-do-not-track': true,
        'stealth-block-webrtc': false,
        'stealth-remove-x-client': true,
        'stealth-block-third-party-cookies': true,
        'stealth-block-third-party-cookies-time': 2880,
        'stealth-block-first-party-cookies': false,
        'stealth-block-first-party-cookies-time': 4320,
        'block-known-trackers': false,
        'strip-tracking-parameters': false,
    },
};

export const SETTINGS_V_2_0 = {
    'general-settings': SETTINGS_V_1_0['general-settings'],
    'extension-specific-settings': SETTINGS_V_1_0['extension-specific-settings'],
    'stealth': SETTINGS_V_1_0.stealth,
    'protocol-version': '2.0',
    'filters': {
        'enabled-filters': SETTINGS_V_1_0.filters['enabled-filters'],
        'enabled-groups': SETTINGS_V_1_0.filters['enabled-groups'],
        'custom-filters': SETTINGS_V_1_0.filters['custom-filters'],
        'user-filter': SETTINGS_V_1_0.filters['user-filter'],
        'allowlist': {
            ...SETTINGS_V_1_0.filters.whitelist,
        },
    },
};
