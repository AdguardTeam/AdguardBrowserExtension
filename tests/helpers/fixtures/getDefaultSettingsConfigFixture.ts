import { SettingsConfig } from '@adguard/tswebextension';

import { SettingOption } from '../../../Extension/src/background/schema';
import { defaultSettings } from '../../../Extension/src/common/settings';

export const getDefaultSettingsConfigFixture = (
    documentBlockingPageUrl: string,
    assistantUrl: string,
    debugScriptlets: boolean,
): SettingsConfig => ({
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
