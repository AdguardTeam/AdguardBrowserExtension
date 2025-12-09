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
import type { Runtime } from 'webextension-polyfill';

import {
    type TelemetryFilterUpdateIntervalMode,
    type TelemetryEventName,
    type TelemetryScreenName,
    type TelemetryTheme,
    type TelemetryActionToScreenMap,
} from './enums';

/**
 * User agent info.
 */
export type TelemetryUserAgent = {
    /**
     * Device info.
     */
    device?: {
        /**
         * Device brand, e.g. "Apple", "Samsung".
         */
        brand: string;

        /**
         * Device model, e.g. "iPhone", "SM-S901U1".
         */
        model?: string;
    };

    /**
     * Operating system info.
     */
    os: {
        /**
         * Operating system name, e.g. Windows, Android, iOS, Mac.
         */
        name: string;

        /**
         * Platform name, e.g. arm, mips, amd64, x64, etc.
         */
        platform?: Runtime.PlatformArch;

        /**
         * Operating system version.
         */
        version: string;
    };

    /**
     * Browser info.
     */
    browser?: {
        /**
         * Browser name, e.g. Chrome, Firefox, Safari, Edge.
         */
        name: string;

        /**
         * Browser version.
         */
        version: string;
    };
};

/**
 * Special type of event, refers to page view.
 */
export type TelemetryPageViewData = {
    pageview: {
        /**
         * Name of shown page.
         */
        name: TelemetryScreenName;

        /**
         * Name of referer page.
         */
        ref_name?: TelemetryScreenName;
    };

    /**
     * Event data is not used for pageview events.
     *
     * @see {@link TelemetryCustomEventData}
     */
    event?: never;
};

/**
 * Custom properties for the event. Can be attached to both pageviews and custom events.
 */
export type TelemetryProps = {
    /**
     * Selected in application locale, e.g. "en-US".
     */
    app_locale: string;

    /**
     * System locale, e.g. "en-US".
     */
    system_locale: string;

    /**
     * UI theme.
     */
    theme: TelemetryTheme;

    /**
     * Filter update interval source.
     */
    update_interval?: TelemetryFilterUpdateIntervalMode | null;
};

/**
 * Custom type of event.
 */
export type TelemetryCustomEventData = {
    event: {
        /**
         * Name of this custom event, e.g. "purchase".
         */
        name: TelemetryEventName;

        /**
         * Name of page where custom event occurs, e.g. "main_page".
         */
        ref_name: TelemetryActionToScreenMap[TelemetryEventName];

        /**
         * Action name.
         */
        action?: string;

        /**
         * Label name.
         */
        label?: string;
    };

    /**
     * Pageview data is not used for custom events.
     *
     * @see {@link TelemetryPageViewData}
     */
    pageview?: never;
};

/**
 * Telemetry base event data passed to the API.
 */
export type TelemetryBaseData = {
    /**
     * Unique and random synthetic identifier for telemetry tracking.
     * Doesn’t relate to the original application identifier using for other API requests.
     * It must be eight characters long and consist of characters [a-f1-9].
     * Must match the regular expression [a-f1-9]{8}.
     */
    synthetic_id: string;

    /**
     * Application type.
     */
    app_type: string;

    /**
     * Short version of application, e.g. "5.2.300.4".
     */
    version: string;

    /**
     * {@link TelemetryUserAgent}.
     */
    user_agent: TelemetryUserAgent;

    /**
     * {@link TelemetryProps}.
     */
    props?: TelemetryProps;
};

export type TelemetryEventData = TelemetryPageViewData | TelemetryCustomEventData;

/**
 * Telemetry event data passed to the API.
 */
export type TelemetryApiEventData = TelemetryEventData & TelemetryBaseData;
