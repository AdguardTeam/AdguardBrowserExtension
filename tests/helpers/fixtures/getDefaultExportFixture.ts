import {
    Config,
    RootOption,
    PROTOCOL_VERSION,
    GeneralSettingsOption,
    ExtensionSpecificSettingsOption,
    FiltersOption,
    UserFilterOption,
    AllowlistOption,
    StealthOption,
} from '../../../Extension/src/background/schema';
import { UserAgent } from '../../../Extension/src/common/user-agent';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getDefaultExportFixture = (isMv3: boolean): Config => ({
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
        // TODO: uncomment this when quick fixes filter will be supported for MV3
        // // For MV3 we added AdGuard Quick Fixes filter enabled by default.
        // [FiltersOption.EnabledFilters]: isMv3 ? [2, 10, 24] : [2, 10],
        [FiltersOption.EnabledFilters]: [2, 10],
        [FiltersOption.EnabledGroups]: [1, 6],
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
        [StealthOption.SelfDestructThirdPartyCookies]: true,
        [StealthOption.SelfDestructThirdPartyCookiesTime]: 2880,
        [StealthOption.SelfDestructFirstPartyCookies]: false,
        [StealthOption.SelfDestructFirstPartyCookiesTime]: 4320,
        [StealthOption.BlockKnownTrackers]: false,
        [StealthOption.StripTrackingParams]: false,
    },
});
