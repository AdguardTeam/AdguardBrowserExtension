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
import { debounce } from 'lodash-es';

import { logger } from '../../../common/logger';
import { messageHandler } from '../../message-handler';
import {
    MessageType,
    type SendTelemetryCustomEventMessage,
    type SendTelemetryPageViewEventMessage,
} from '../../../common/messages';
import { SettingsApi, TelemetryApi } from '../../api';
import { SettingOption } from '../../schema';

import { TelemetryDataCollector } from './TelemetryDataCollector';
import {
    type TelemetryEventData,
    type TelemetryApiEventData,
    type TelemetryCustomEventData,
    type TelemetryPageViewData,
} from './types';
import { TelemetryPageTracker } from './TelemetryPageTracker';
import {
    type TelemetryActionToScreenMap,
    type TelemetryEventName,
    type TelemetryScreenName,
} from './enums';

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
    public static pageTracker: TelemetryPageTracker = new TelemetryPageTracker();

    /**
     * Debounce timeout for sending events.
     */
    public static readonly SEND_EVENT_TIMEOUT_MS = 300;

    /**
     * Initializes telemetry service.
     *
     * Generates or retrieves synthetic ID, collects user agent and props,
     * and sets up message listeners for telemetry events.
     */
    public static async init(): Promise<void> {
        await TelemetryDataCollector.init();
        // double instantiation need for ease of testing
        this.pageTracker = new TelemetryPageTracker();
        this.pageTracker.init();

        messageHandler.addListener(MessageType.SendTelemetryPageViewEvent, Telemetry.handlePageViewEventDebounced);
        messageHandler.addListener(MessageType.SendTelemetryCustomEvent, Telemetry.handleCustomEventDebounced);
    }

    /**
     * Debounced handler for page view events from UI pages.
     *
     * @see {@link handlePageViewEvent} - For implementation.
     * @see {@link SEND_EVENT_TIMEOUT} - For debounce timeout.
     */
    private static handlePageViewEventDebounced = debounce(
        Telemetry.handlePageViewEvent,
        Telemetry.SEND_EVENT_TIMEOUT_MS,
    );

    /**
     * Handles page view telemetry event message from UI pages.
     * Extracts data from message and delegates to {@link sendPageViewEvent}.
     *
     * @param message Message with screen name and page ID from UI.
     * @param message.data Event data containing screen name and page ID.
     */
    private static async handlePageViewEvent({ data }: SendTelemetryPageViewEventMessage): Promise<void> {
        const { screenName, pageId } = data;

        await Telemetry.sendPageViewEvent(screenName, pageId);
    }

    /**
     * Sends a page view event.
     *
     * @param screenName Screen name to track.
     * @param pageId Unique page identifier.
     */
    public static async sendPageViewEvent(
        screenName: TelemetryScreenName,
        pageId: string,
    ): Promise<void> {
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
     * Debounced handler for custom events from UI pages.
     *
     * @see {@link handleCustomEvent} - For implementation.
     * @see {@link SEND_EVENT_TIMEOUT} - For debounce timeout.
     */
    private static handleCustomEventDebounced = debounce(
        Telemetry.handleCustomEvent,
        Telemetry.SEND_EVENT_TIMEOUT_MS,
    );

    /**
     * Handles custom telemetry event message from UI pages.
     * Extracts data from message and delegates to {@link sendCustomEvent}.
     *
     * @param message Message with custom event data from UI.
     * @param message.data Event data containing screen name and event name.
     */
    private static async handleCustomEvent({ data }: SendTelemetryCustomEventMessage): Promise<void> {
        const { screenName, eventName } = data;

        await Telemetry.sendCustomEvent(screenName, eventName);
    }

    /**
     * Sends a custom event directly from background services (without debounce).
     * Use this for background services that need immediate telemetry tracking.
     *
     * @param screenName Screen name where the event occurred.
     * @param eventName Event name to track.
     */
    public static async sendCustomEvent<T extends TelemetryEventName>(
        screenName: TelemetryActionToScreenMap[T],
        eventName: T,
    ): Promise<void> {
        const event: TelemetryCustomEventData = {
            event: {
                name: eventName,
                ref_name: screenName,
            },
        };

        await Telemetry.sendEvent(event);
    }

    /**
     * Sends a telemetry event to the API.
     *
     * @param event Event data (page view or custom event).
     */
    private static async sendEvent(event: TelemetryEventData): Promise<void> {
        if (!Telemetry.isAnonymizedUsageDataAllowed()) {
            return;
        }

        try {
            const baseData = await TelemetryDataCollector.getBaseData();

            const apiData: TelemetryApiEventData = {
                ...baseData,
                ...event,
            };

            await TelemetryApi.sendEvent(apiData);
        } catch (e) {
            logger.error(`[ext.Telemetry.sendEvent]: Failed to send event: ${e}`);
        }
    }

    /**
     * Checks if anonymized usage data is allowed.
     *
     * @returns True if anonymized usage data is allowed.
     */
    private static isAnonymizedUsageDataAllowed(): boolean {
        return SettingsApi.getSetting(SettingOption.AllowAnonymizedUsageData);
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
