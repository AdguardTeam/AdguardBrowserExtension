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

/**
 * UI theme.
 */
export enum TelemetryTheme {
    Light = 'LIGHT',
    Dark = 'DARK',
    System = 'SYSTEM',
}

/**
 * Filter update interval mode.
 */
export enum TelemetryFilterUpdateIntervalMode {
    SystemDefault = 'SYSTEM_DEFAULT',
    Custom = 'CUSTOM',
}

/**
 * Telemetry screen name.
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
    RulesLimits = 'rules_limits',
    AboutScreen = 'about_screen',
}

/**
 * Telemetry event name.
 */
export enum TelemetryEventName {
    CheckUpdatesClick = 'check_updates_click',
    PauseClick = 'pause_click',
    ProtectionSwitch = 'protection_switch',
    StatisticsClick = 'statistics_click',
    BlockManuallyClick = 'block_manually_click',
    OpenLogClick = 'open_log_click',
    ReportIssueClick = 'report_issue_click',
    CheckSecurityClick = 'check_security_click',
    AppleClick = 'apple_click',
    AndroidClick = 'android_click',
    UpdateAvailableClick = 'update_available_click',
    BlockElementClick = 'block_element_click',
}

export type TelemetryActionToScreenMap = {
    [TelemetryEventName.CheckUpdatesClick]: TelemetryScreenName.MainPage;
    [TelemetryEventName.PauseClick]: TelemetryScreenName.MainPage;
    [TelemetryEventName.ProtectionSwitch]: TelemetryScreenName.MainPage;
    [TelemetryEventName.StatisticsClick]: TelemetryScreenName.MainPage;
    [TelemetryEventName.BlockManuallyClick]: TelemetryScreenName.MainPage;
    [TelemetryEventName.OpenLogClick]: TelemetryScreenName.MainPage;
    [TelemetryEventName.ReportIssueClick]: TelemetryScreenName.MainPage;
    [TelemetryEventName.CheckSecurityClick]: TelemetryScreenName.MainPage;
    [TelemetryEventName.AppleClick]: TelemetryScreenName.MainPage;
    [TelemetryEventName.AndroidClick]: TelemetryScreenName.MainPage;
    [TelemetryEventName.UpdateAvailableClick]: TelemetryScreenName.MainPage;
    [TelemetryEventName.BlockElementClick]: TelemetryScreenName.BlockElementScreen;
};
