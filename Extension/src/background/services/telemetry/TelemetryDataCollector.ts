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
import browser from 'webextension-polyfill';

import { UserAgent } from '../../../common/user-agent';
import { AppearanceTheme, DEFAULT_FILTERS_UPDATE_PERIOD } from '../../../common/settings';
import { Prefs } from '../../prefs';
import { SettingsApi } from '../../api';
import { SettingOption } from '../../schema';

import { TelemetryFilterUpdateIntervalMode, TelemetryTheme } from './enums';
import {
    type TelemetryBaseData,
    type TelemetryProps,
    type TelemetryUserAgent,
} from './types';
import { SyntheticIdGenerator } from './SyntheticIdGenerator';

/**
 * Collects and manages telemetry data including synthetic ID, user agent, and application props.
 *
 * This class is responsible for gathering all necessary data for telemetry events.
 */
export class TelemetryDataCollector {
    /**
     * Application type sent in telemetry events.
     */
    private static readonly APP_TYPE = 'EXTENSION';

    /**
     * Unique synthetic identifier for this extension installation.
     */
    private static syntheticId: string | undefined;

    /**
     * User agent data including OS, device, and browser information.
     */
    private static userAgent: TelemetryUserAgent | undefined;

    /**
     * Application properties including locales, theme, and filter update interval.
     */
    private static props: TelemetryProps | undefined;

    /**
     * AppearanceTheme to TelemetryTheme mapper.
     */
    private static readonly THEME_MAPPER: Record<AppearanceTheme, TelemetryTheme> = {
        [AppearanceTheme.Light]: TelemetryTheme.Light,
        [AppearanceTheme.Dark]: TelemetryTheme.Dark,
        [AppearanceTheme.System]: TelemetryTheme.System,
    };

    /**
     * Initializes the telemetry data collector.
     *
     * Generates synthetic ID, collects user agent information, and gathers application props.
     */
    public static async init(): Promise<void> {
        TelemetryDataCollector.syntheticId = await SyntheticIdGenerator.gainSyntheticId();
        TelemetryDataCollector.userAgent = await this.getUserAgent();
        TelemetryDataCollector.props = this.getProps();
    }

    /**
     * Collects OS and browser information from browser runtime.
     *
     * @returns User agent data with OS name, platform architecture, version, and browser info.
     */
    private static async getUserAgent(): Promise<TelemetryUserAgent> {
        // OS info
        const [platformInfo, osVersion] = await Promise.all([
            browser.runtime.getPlatformInfo(),
            UserAgent.getSystemInfo(),
        ]);

        const os = {
            name: UserAgent.getSystemName() || platformInfo.os,
            platform: platformInfo.arch,
            version: osVersion || 'unknown',
        };

        // Device info
        const { vendor, model } = UserAgent.parser.getDevice();
        const device = vendor ? {
            brand: vendor,
            model,
        } : undefined;

        // Browser info
        const browserInfo = UserAgent.parser.getBrowser();
        const browserData = {
            name: UserAgent.getBrowserName() || browserInfo.name || 'unknown',
            version: browserInfo.version || 'unknown',
        };

        return {
            os,
            device,
            browser: browserData,
        };
    }

    /**
     * Collects application properties for telemetry.
     *
     * @returns Props including locales, theme and update interval.
     */
    private static getProps(): TelemetryProps {
        const appLocale = browser.i18n.getUILanguage();
        const systemLocale = navigator.language;

        const appTheme = SettingsApi.getSetting(SettingOption.AppearanceTheme);
        const theme = TelemetryDataCollector.THEME_MAPPER[appTheme];

        const updateInterval = this.getFilterUpdateInterval();

        return {
            app_locale: appLocale,
            system_locale: systemLocale,
            theme,
            update_interval: updateInterval,
        };
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
            !TelemetryDataCollector.syntheticId
            || !TelemetryDataCollector.userAgent
            || !TelemetryDataCollector.props
        ) {
            throw new Error('Telemetry is not initialized');
        }

        return {
            synthetic_id: TelemetryDataCollector.syntheticId,
            app_type: TelemetryDataCollector.APP_TYPE,
            version: Prefs.version,
            user_agent: TelemetryDataCollector.userAgent,
            props: TelemetryDataCollector.props,
        };
    }

    /**
     * Gets filter update interval source.
     *
     * @returns A {@link TelemetryFilterUpdateIntervalMode.SystemDefault} if using
     * default interval, {@link TelemetryFilterUpdateIntervalMode.Custom} otherwise.
     */
    protected static getFilterUpdateInterval(): TelemetryFilterUpdateIntervalMode | null {
        const updatePeriod = SettingsApi.getSetting(SettingOption.FiltersUpdatePeriod);
        const isDefault = updatePeriod === DEFAULT_FILTERS_UPDATE_PERIOD;

        return isDefault
            ? TelemetryFilterUpdateIntervalMode.SystemDefault
            : TelemetryFilterUpdateIntervalMode.Custom;
    }
}
