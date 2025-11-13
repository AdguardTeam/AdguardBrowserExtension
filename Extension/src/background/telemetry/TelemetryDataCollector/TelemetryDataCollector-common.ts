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

import { UserAgent } from '../../../common/user-agent';
import { APP_VERSION_KEY } from '../../../common/constants';
import { AppearanceTheme } from '../../../common/settings';
import { Prefs } from '../../prefs';
import { SettingsApi } from '../../api';
import { browserStorage } from '../../storages';
import { SettingOption } from '../../schema';
import {
    type FilterUpdateIntervalSource,
    RetentionCohort,
    Theme,
} from '../enums';
import {
    type TelemetryBaseData,
    type TelemetryProps,
    type TelemetryUserAgent,
} from '../types';
import { SyntheticIdGenerator } from '../SyntheticIdGenerator';

/**
 * Collects and manages telemetry data including synthetic ID, user agent, and application props.
 *
 * This class is responsible for gathering all necessary data for telemetry events.
 */
export class TelemetryDataCollectorCommon {
    /**
     * Application type sent in telemetry events
     * TODO: maybe other key.
     */
    private static readonly APP_TYPE = 'ADGUARD_EXTENSION';

    /**
     * Synthetic ID for telemetry events.
     */
    private static syntheticId: string | undefined;

    /**
     * User agent.
     */
    private static userAgent: TelemetryUserAgent | undefined;

    /**
     * Props.
     */
    private static props: TelemetryProps | undefined;

    /**
     * AppearanceTheme to TelemetryTheme mapper.
     */
    private static readonly THEME_MAPPER: Record<AppearanceTheme, Theme> = {
        [AppearanceTheme.Light]: Theme.Light,
        [AppearanceTheme.Dark]: Theme.Dark,
        [AppearanceTheme.System]: Theme.System,
    };

    /**
     * Initializes the telemetry data collector.
     *
     * Generates synthetic ID, collects user agent information, and gathers application props.
     */
    public static async init(): Promise<void> {
        TelemetryDataCollectorCommon.syntheticId = await SyntheticIdGenerator.gainSyntheticId();
        TelemetryDataCollectorCommon.userAgent = await TelemetryDataCollectorCommon.getUserAgent();
        TelemetryDataCollectorCommon.props = await TelemetryDataCollectorCommon.getProps();
    }

    /**
     * Gets user agent information (OS name, platform, version).
     *
     * TODO: Maybe add information about browser? We can use "name" or "device" field for this,
     * because version field is double.
     *
     * @returns User agent data.
     */
    private static async getUserAgent(): Promise<TelemetryUserAgent> {
        const platformInfo = await browser.runtime.getPlatformInfo();
        const name = UserAgent.getSystemName() || platformInfo.os;
        const version = await UserAgent.getSystemInfo() || 'unknown';
        const platform = platformInfo.arch;

        return {
            os: {
                name,
                platform,
                version,
            },
        };
    }

    /**
     * Gets telemetry props (locales, theme, retention cohort, update interval).
     *
     * @returns Telemetry props.
     */
    private static async getProps(): Promise<TelemetryProps> {
        const appLocale = browser.i18n.getUILanguage();
        const systemLocale = navigator.language;

        const appTheme = SettingsApi.getSetting(SettingOption.AppearanceTheme);
        const theme = TelemetryDataCollectorCommon.THEME_MAPPER[appTheme];

        const retentionCohort = await TelemetryDataCollectorCommon.getRetentionCohort();
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
     * Calculates retention cohort based on installation date.
     *
     * TODO: We don't have any information about installation date. Maybe use app version for this?
     *
     * @returns Retention cohort (Day1 for new users, Longtime for other).
     */
    private static async getRetentionCohort(): Promise<RetentionCohort> {
        const appVersion = await browserStorage.get(APP_VERSION_KEY);

        if (!appVersion) {
            return RetentionCohort.Day1;
        }

        return RetentionCohort.Longtime;
    }

    /**
     * Gets filter update interval source.
     *
     * This method should be overridden in MV2/MV3-specific implementations:
     * - MV2: Returns SystemDefault or Custom based on user settings
     * - MV3: Returns null (filters update automatically via Chrome Web Store).
     *
     * @returns Filter update interval source, or null if not applicable.
     */
    protected static getFilterUpdateInterval(): FilterUpdateIntervalSource | null {
        return null;
    }

    /**
     * Gets base telemetry data (synthetic ID, app type, version, user agent, props).
     *
     * @returns Base telemetry data.
     *
     * @throws Error if telemetry is not initialized.
     */
    public static async getBaseData(): Promise<TelemetryBaseData> {
        if (
            !TelemetryDataCollectorCommon.syntheticId
            || !TelemetryDataCollectorCommon.userAgent
            || !TelemetryDataCollectorCommon.props
        ) {
            throw new Error('Telemetry is not initialized');
        }

        return {
            synthetic_id: TelemetryDataCollectorCommon.syntheticId,
            app_type: TelemetryDataCollectorCommon.APP_TYPE,
            version: Prefs.version,
            user_agent: TelemetryDataCollectorCommon.userAgent,
            props: TelemetryDataCollectorCommon.props,
        };
    }
}
