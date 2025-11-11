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
import browser from 'webextension-polyfill';
import { TelemetryEventData, TelemetryBaseData, TelemetryProps, TelemetryUserAgent, TelemetryApiEventData, TelemetryPageViewData, TelemetryCustomEventData } from "./types";
import { TelemetryApi } from "./TelemetryApi";
import { SettingOption } from "../schema/settings/enum";    
import { SettingsApi } from "../api";
import { Prefs } from "../prefs";
import { UserAgent } from '../../common/user-agent';
import { Theme, RetentionCohort, FilterUpdateIntervalSource } from './enums';
import { AppearanceTheme, APP_VERSION_KEY, FiltersUpdateTime } from '../../common/constants';
import { browserStorage } from '../storages';
import { logger } from '../../common/logger';

export class Telemetry {
    /**
     * Application type sent in telemetry events
     */
    private static readonly APP_TYPE = 'ADGUARD_EXTENSION';

    /**
     * Synthetic ID for telemetry events
     * TODO: Generate synthetic ID
     */
    private syntheticId: string = 'lalalalalala';

    /**
     * User agent
     * TODO: is "!" okey?
     */
    private userAgent!: TelemetryUserAgent;

    /**
     * Props
     * TODO: is "!" okey?
     */
    private props!: TelemetryProps;

    /**
     * Flag indicating whether telemetry module is initialized or not.
     */
    private isInitialized = false;

    /**
     * AppearanceTheme to TelemetryTheme mapper.
     */
    private static readonly THEME_MAPPER: Record<AppearanceTheme, Theme> = {
        [AppearanceTheme.Light]: Theme.Light,
        [AppearanceTheme.Dark]: Theme.Dark,
        [AppearanceTheme.System]: Theme.System,
    };

    constructor() {
        this.init();
    }

    async init() {
        this.userAgent = await this.getUserAgent();
        this.props = await this.getProps();
        this.isInitialized = true;
    }
 
    async sendPageViewEvent(event: TelemetryPageViewData) {
        await this.sendEvent(event);
    }

    async sendCustomEvent(event: TelemetryCustomEventData) {
        await this.sendEvent(event);
    }

    private async sendEvent(event: TelemetryEventData) {
        if (!this.isHelpUsEnabled()) {
            return;
        }

        const baseData = await this.getBaseData();

        const apiData: TelemetryApiEventData = { 
            ...baseData,
            ...event
        };

        await TelemetryApi.sendEvent(apiData);
    }

    /**
     * Checks if telemetry events can be sent.
     *
     * @returns True if telemetry events can be sent, false otherwise.
     */
    private canSendEvents(): boolean {
        // Double check if user opted in to send telemetry events.
        // At this point we previously checked if settings enabled or not,
        // but in case if event is reached this point it means that bug appeared.
        if (!this.isHelpUsEnabled()) {
            logger.debug('Telemetry is disabled by user');
            return false;
        }

        // Do not send telemetry events if module is not initialized
        // only after making sure that user opted in
        // NOTE: We are not throwing an error here because telemetry
        // should neither block the application nor notify the user
        if (!this.isInitialized) {
            logger.debug('Telemetry module is not initialized');
            return false;
        }

        return true;
    }

    private isHelpUsEnabled() {
        // TODO: Should we update settings description? 
        // Current description: "Sends anonymous stats on ad filter usage to AdGuard."
        // Now, we will send more information...
        return !SettingsApi.getSetting(SettingOption.DisableCollectHits);
    }

    private async getBaseData(): Promise<TelemetryBaseData> {
        return {
            synthetic_id: this.syntheticId,
            app_type: Telemetry.APP_TYPE,
            version: Prefs.version,
            user_agent: this.userAgent,
            props: this.props,
        };
    }

    // TODO: Maybe add information about browser? We can user "name" or "device" field for this, because version field is double
    private async getUserAgent(): Promise<TelemetryUserAgent> {
        const platformInfo = await browser.runtime.getPlatformInfo();
        const name = UserAgent.getSystemName() || platformInfo.os;
        const version = await UserAgent.getSystemInfo() || 'unknown';
        const platform = platformInfo.arch;

        return {
            os: {
                name,
                platform,
                version,
            }
        };
    }

    private async getProps(): Promise<TelemetryProps> {
        const appLocale = browser.i18n.getUILanguage();
        const systemLocale = navigator.language;
        
        const appTheme: AppearanceTheme = SettingsApi.getSetting(SettingOption.AppearanceTheme);
        const theme = Telemetry.THEME_MAPPER[appTheme];
        
        const retentionCohort = await this.getRetentionCohort();
        const updateInterval = this.getFilterUpdateInterval();
        
        return {
            app_locale: appLocale,
            system_locale: systemLocale,
            theme,
            retention_cohort: retentionCohort,
            update_interval: updateInterval,
        };
    }

    /**
     * Calculates retention cohort based on installation date
     * TODO: AI suggest me this version. Is it okey? 
     */
    private async getRetentionCohort(): Promise<RetentionCohort> {
        // Get installation date from storage
        const appVersion = await browserStorage.get(APP_VERSION_KEY);
        
        // If no version stored, it's a new installation
        if (!appVersion) {
            return RetentionCohort.Day1;
        }
        
        // For existing users, we don't have exact install date stored
        // So we consider them as longtime users
        return RetentionCohort.Longtime;
    }

    /**
     * Gets filter update interval source
     */
    private getFilterUpdateInterval(): FilterUpdateIntervalSource {
        const updatePeriod: FiltersUpdateTime = SettingsApi.getSetting(SettingOption.FiltersUpdatePeriod);
        const isDefault = updatePeriod === FiltersUpdateTime.OneHour;
        // TODO: Why is only two values? Why we cant send number info?
        return isDefault 
            ? FilterUpdateIntervalSource.SystemDefault 
            : FilterUpdateIntervalSource.Custom;
    }
}