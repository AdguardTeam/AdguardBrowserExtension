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


//TODO: it need to create adapter to convert app theme to telemetry theme. Find App Theme in SettingOption.AppearanceTheme
/**
 * UI theme
 */
export enum Theme {
    Light = 'LIGHT',
    Dark = 'DARK',
    System = 'SYSTEM',
    SystemDark = 'SYSTEM_DARK',
    SystemLight = 'SYSTEM_LIGHT',
}

/**
 * Retention cohort of the user
 * TODO: find info about this.
 */
export enum RetentionCohort {
    Day1 = 'DAY_1',
    Week1 = 'WEEK_1',
    Month1 = 'MONTH_1',
    Longtime = 'LONGTIME',
}

/**
 * Filter update interval source. 
 * TODO: We don't have filter updating in MV3
 * TODO: find info about this.
 */
export enum FilterUpdateIntervalSource {
    SystemDefault = 'SYSTEM_DEFAULT',
    Custom = 'CUSTOM',
}

// TODO: I take this from vpn extension and can't find info in telemetry docs about this. Can i Use types from runtime?
/**
 * Operating system names passed to telemetry.
 */
// export enum TelemetryOs {
//     MacOS = 'Mac',
//     iOS = 'iOS',
//     Windows = 'Windows',
//     Android = 'Android',
//     ChromeOS = 'ChromeOS',
//     Linux = 'Linux',
//     OpenBSD = 'OpenBSD',
//     Fuchsia = 'Fuchsia',
// }

/**
 * Telemetry screen name
 */
export enum TelemetryScreenName {
    MainPage = 'main_page',
    SecurePage = 'secure_page', 
    BlockElementScreen = 'block_element_screen', 
    GeneralSettings = 'general_settings', 	
    FiltersScreen = 'filters_screen', 
    TrackingProtectionScreen = 'tracking_protection_screen',
    WebsiteAllowListScreen = 'website_allow_list_screen',
    UserRulesScreen = 'user_rules_screen',
    AdditionalSettings = 'additional_settings',
    // TODO: talk about error in name(rules_limts -> rules_limits)
    RulesLimits = 'rules_limits',
    AboutScreen = 'about_screen'
}

export enum TelemetryEventName {
    CheckUpdatesClick = 'check_updates_click',
    PauseClick = 'pause_click',
    ProtectionSwitch = 'protection_switch',
    StatisticClick = 'statistic_click',
    BlockManuallyClick = 'block_manually_click',
    OpenLogClick = 'open_log_click',
    ReportIssueClick = 'report_issue_click',
    CheckSecurityClick = 'check_security_click',
    AppleClick = 'apple_click',
    AndroidClick = 'android_click',
    UpdateAvailableClick = 'update_available_click',
    BlockElementClick = 'block_element_click',
}