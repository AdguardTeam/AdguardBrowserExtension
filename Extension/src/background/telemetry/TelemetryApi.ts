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
import { logger } from '../../common/logger';

import { type TelemetryApiEventData } from './types';

/**
 * TODO: Should I move this file to background api or this is Ok?
 * API client for sending telemetry events to the telemetry service.
 */
export class TelemetryApi {
    /**
     * Telemetry service URL.
     * TODO: Should I move this to the some common config?
     */
    private static readonly TELEMETRY_URL = IS_RELEASE ? 'api.agrd-tm.com' : 'telemetry.service.agrd.dev';

    /**
     * API endpoint path.
     */
    private static readonly API_PATH = 'v1/event';

    /**
     * Sends a telemetry event to the telemetry service.
     *
     * @param data Telemetry event data to send.
     */
    static async sendEvent(data: TelemetryApiEventData): Promise<void> {
        const url = TelemetryApi.getRequestUrl();

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
            logger.error(`[ext.TelemetryApi.sendEvent]: Failed to send event: ${error}`);
        }
    }

    /**
     * Constructs the full URL for telemetry API requests.
     *
     * @returns The complete telemetry API URL.
     */
    private static getRequestUrl(): string {
        return `https://${TelemetryApi.TELEMETRY_URL}/${TelemetryApi.API_PATH}`;
    }
}
