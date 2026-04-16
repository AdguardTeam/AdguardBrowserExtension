/**
 * Copyright (c) 2015-2026 Adguard Software Ltd.
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
import { logger } from '../../common/logger';
import { type TelemetryApiEventData } from '../services';
import { type SessionStartRequest, type SessionStartResponse } from '../services/telemetry/abtest/types';
import { sessionStartResponseSchema } from '../schema/telemetry/sessionStartResponse';

/**
 * API client for sending telemetry events to the telemetry service.
 */
export class TelemetryApi {
    /**
     * API endpoint path.
     */
    private static readonly API_PATH = 'api/v1/event';

    /**
     * Session start API endpoint path.
     */
    private static readonly SESSION_START_PATH = 'api/v1/session_start';

    /**
     * Sends a telemetry event to the telemetry service.
     *
     * @param data Telemetry event data to send.
     */
    static async sendEvent(data: TelemetryApiEventData): Promise<void> {
        const url = TelemetryApi.requestUrl;

        const config: RequestInit = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        };

        try {
            const response = await fetch(url, config);

            if (!response.ok) {
                logger.error(`[ext.TelemetryApi.sendEvent]: Failed to send event: ${response.status}`);
            }
        } catch (error) {
            logger.error('[ext.TelemetryApi.sendEvent]: Failed to send event');
        }
    }

    /**
     * Sends a session_start request to request A/B experiment variant assignments.
     *
     * @param data Session start request data.
     *
     * @returns Parsed session start response.
     */
    static async sendSessionStart(data: SessionStartRequest): Promise<SessionStartResponse> {
        const url = new URL(TelemetryApi.SESSION_START_PATH, `https://${TELEMETRY_URL}`);

        const config: RequestInit = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        };

        try {
            const response = await fetch(url, config);

            if (!response.ok) {
                logger.error(`[ext.TelemetryApi.sendSessionStart]: Failed to send session_start: ${response.status}`);
                return { versions: {} };
            }

            const json = await response.json();
            const parsed = sessionStartResponseSchema.parse(json);

            return {
                versions: parsed.versions as SessionStartResponse['versions'],
            };
        } catch (error) {
            logger.error('[ext.TelemetryApi.sendSessionStart]: Failed to send session_start', error);
            return { versions: {} };
        }
    }

    /**
     * Constructs the full URL for telemetry API requests.
     *
     * @returns The complete telemetry API URL.
     */
    private static get requestUrl(): string {
        return new URL(TelemetryApi.API_PATH, `https://${TELEMETRY_URL}`).href;
    }
}
