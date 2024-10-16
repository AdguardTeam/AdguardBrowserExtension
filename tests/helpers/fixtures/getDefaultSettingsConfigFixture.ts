import { type SettingsConfig as SettingsConfigMV2 } from '@adguard/tswebextension';
import { type SettingsConfig as SettingsConfigMV3 } from '@adguard/tswebextension/mv3';

import { SettingOption } from '../../../Extension/src/background/schema';
import { defaultSettings } from '../../../Extension/src/common/settings';

export const getDefaultSettingsConfigFixtureMV2 = (
    documentBlockingPageUrl: string,
    assistantUrl: string,
    debugScriptlets: boolean,
): SettingsConfigMV2 => ({
    assistantUrl,
    documentBlockingPageUrl,
    collectStats: !defaultSettings[SettingOption.DisableCollectHits],
    debugScriptlets,
    allowlistInverted: !defaultSettings[SettingOption.DefaultAllowlistMode],
    allowlistEnabled: defaultSettings[SettingOption.AllowlistEnabled],
    stealthModeEnabled: !defaultSettings[SettingOption.DisableStealthMode],
    filteringEnabled: !defaultSettings[SettingOption.DisableFiltering],
    stealth: {
        blockChromeClientData: defaultSettings[SettingOption.RemoveXClientData],
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

export const getDefaultSettingsConfigFixtureMV3 = (
    documentBlockingPageUrl: string,
    assistantUrl: string,
    gpcScriptUrl: string,
    hideDocumentReferrerScriptUrl: string,
    debugScriptlets: boolean,
): SettingsConfigMV3 => ({
    assistantUrl,
    documentBlockingPageUrl,
    collectStats: !defaultSettings[SettingOption.DisableCollectHits],
    debugScriptlets,
    gpcScriptUrl,
    hideDocumentReferrerScriptUrl,
    allowlistInverted: !defaultSettings[SettingOption.DefaultAllowlistMode],
    allowlistEnabled: defaultSettings[SettingOption.AllowlistEnabled],
    stealthModeEnabled: !defaultSettings[SettingOption.DisableStealthMode],
    filteringEnabled: !defaultSettings[SettingOption.DisableFiltering],
    stealth: {
        blockChromeClientData: defaultSettings[SettingOption.RemoveXClientData],
        // TODO: revert when will be found a better way to add exclusions for $stealth=referrer
        // AG-34765, Setting to false so that it will remove already added session rules.
        hideReferrer: false,
        // TODO: revert when will be found a better way to add exclusions for $stealth=searchqueries
        hideSearchQueries: false,
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
