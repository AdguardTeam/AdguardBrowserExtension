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
import { debounce } from 'lodash-es';
import { TelemetryDataCollector } from 'telemetry-data-collector';

import { SettingOption } from '../schema/settings/enum';
import { SettingsApi } from '../api';
import { logger } from '../../common/logger';
import { messageHandler } from '../message-handler';
import {
    MessageType,
    type SendTelemetryCustomEventMessage,
    type SendTelemetryPageViewEventMessage,
} from '../../common/messages';

import { TelemetryApi } from './TelemetryApi';
import {
    type TelemetryEventData,
    type TelemetryApiEventData,
    type TelemetryCustomEventData,
    type TelemetryPageViewData,
} from './types';
import { TelemetryPageTracker } from './TelemetryPageTracker';

/**
 * Telemetry service for tracking user interactions and sending analytics events.
 *
 * Handles page view events, custom events, and manages telemetry state.
 * Events are debounced and sent to the telemetry API.
 */
export class Telemetry {
    /**
     * Page tracker.
     */
    private static pageTracker = new TelemetryPageTracker();

    /**
     * Debounce timeout for sending events.
     */
    public static readonly SEND_EVENT_TIMEOUT = 300;

    /**
     * Initializes telemetry service.
     *
     * Generates or retrieves synthetic ID, collects user agent and props,
     * and sets up message listeners for telemetry events.
     */
    public static async init(): Promise<void> {
        await TelemetryDataCollector.init();

        messageHandler.addListener(MessageType.SendTelemetryPageViewEvent, Telemetry.sendPageViewEventDebounced);
        messageHandler.addListener(MessageType.SendTelemetryCustomEvent, Telemetry.sendCustomEventDebounced);
    }

    /**
     * Sends a telemetry page view event.
     *
     * @param message Message with screen name and page ID.
     * @param message.data Event data containing screen name and page ID.
     */
    private static async sendPageViewEvent({ data }: SendTelemetryPageViewEventMessage): Promise<void> {
        const { screenName, pageId } = data;

        if (!Telemetry.pageTracker.updateScreen(screenName, pageId)) {
            logger.debug(`[ext.Telemetry.sendPageViewEvent]: Screen '${screenName}' in page '${pageId}' already sent`);

            return;
        }

        const event: TelemetryPageViewData = {
            pageview: {
                name: screenName,
                ref_name: Telemetry.pageTracker.prevScreenName,
            },
        };

        await Telemetry.sendEvent(event);
    }

    /**
     * Debounced version of {@link sendPageViewEvent}.
     *
     * @see {@link sendPageViewEvent} - For implementation.
     * @see {@link SEND_EVENT_TIMEOUT} - For debounce timeout.
     */
    private static sendPageViewEventDebounced = debounce(
        Telemetry.sendPageViewEvent,
        Telemetry.SEND_EVENT_TIMEOUT,
    );

    /**
     * Sends a telemetry custom event.
     *
     * @param message Message with custom event data.
     * @param message.data Event data containing screen name and event name.
     */
    private static async sendCustomEvent({ data }: SendTelemetryCustomEventMessage): Promise<void> {
        const { screenName, eventName } = data;

        const event: TelemetryCustomEventData = {
            event: {
                name: eventName,
                ref_name: screenName,
            },
        };
        await Telemetry.sendEvent(event);
    }

    /**
     * Debounced version of {@link sendCustomEvent}.
     *
     * @see {@link sendCustomEvent} - For implementation.
     * @see {@link SEND_EVENT_TIMEOUT} - For debounce timeout.
     */
    private static sendCustomEventDebounced = debounce(
        Telemetry.sendCustomEvent,
        Telemetry.SEND_EVENT_TIMEOUT,
    );

    /**
     * Sends a telemetry event to the API.
     *
     * @param event Event data (page view or custom event).
     */
    private static async sendEvent(event: TelemetryEventData): Promise<void> {
        if (!Telemetry.isHelpUsEnabled()) {
            return;
        }

        const baseData = await TelemetryDataCollector.getBaseData();

        const apiData: TelemetryApiEventData = {
            ...baseData,
            ...event,
        };

        await TelemetryApi.sendEvent(apiData);
    }

    /**
     * Checks if telemetry is enabled.
     *
     * @returns True if telemetry is enabled.
     */
    private static isHelpUsEnabled(): boolean {
        // TODO: Should we update settings description?
        // Current description: "Sends anonymous stats on ad filter usage to AdGuard."
        // Now, we will send more information...
        // By default this option is disabled. If we don't show user modal page about this, user never on this.
        return !SettingsApi.getSetting(SettingOption.DisableCollectHits);
    }

    /**
     * Handles popup connected event.
     * Adds `portName` to the list of opened pages.
     *
     * @param portName Name of the port popup connected to.
     */
    public static handlePopupConnect = (portName: string): void => {
        Telemetry.pageTracker.addOpenedPage(portName);
    };

    /**
     * Handles popup disconnected event.
     * Removes `portName` from the list of opened pages.
     *
     * @param portName Name of the port popup connected to.
     */
    public static handlePopupDisconnect = (portName: string): void => {
        Telemetry.pageTracker.removeOpenedPage(portName);
    };
}
