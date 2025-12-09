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
import {
    beforeEach,
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import {
    TelemetryEventName,
    TelemetryScreenName,
    Theme,
    type TelemetryApiEventData,
} from '../../../../Extension/src/background/services';
import { TelemetryApi } from '../../../../Extension/src/background/api';

describe('TelemetryApi', () => {
    let fetchMock: ReturnType<typeof vi.fn<typeof fetch>>;

    const createBaseEventData = (): Omit<TelemetryApiEventData, 'pageview' | 'event'> => ({
        synthetic_id: 'abc12345',
        app_type: 'EXTENSION',
        version: '5.0.0',
        user_agent: {
            os: {
                name: 'macOS',
                platform: 'x86-64',
                version: '14.0.0',
            },
            browser: {
                name: 'Chrome',
                version: '120.0.0',
            },
        },
        props: {
            app_locale: 'en-US',
            system_locale: 'en-US',
            theme: Theme.Light,
            update_interval: null,
        },
    });

    beforeEach(() => {
        vi.clearAllMocks();

        fetchMock = vi.fn<typeof fetch>();
        global.fetch = fetchMock;
    });

    describe('sendEvent', () => {
        test('sends POST request to correct URL with proper headers', async () => {
            fetchMock.mockResolvedValue(Response.json({
                ok: true,
                status: 200,
            }));

            const eventData: TelemetryApiEventData = {
                ...createBaseEventData(),
                event: {
                    name: TelemetryEventName.CheckUpdatesClick,
                    ref_name: TelemetryScreenName.MainPage,
                },
            };

            await TelemetryApi.sendEvent(eventData);

            expect(fetchMock).toHaveBeenCalledTimes(1);
            expect(fetchMock).toHaveBeenCalledWith(
                'https://telemetry.local/api/v1/event',
                expect.objectContaining({
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(eventData),
                }),
            );
        });

        test('handles HTTP error response', async () => {
            fetchMock.mockResolvedValue(Response.json({
                ok: false,
                status: 500,
            }));

            const eventData: TelemetryApiEventData = {
                ...createBaseEventData(),
                event: {
                    name: TelemetryEventName.CheckUpdatesClick,
                    ref_name: TelemetryScreenName.MainPage,
                },
            };

            await expect(TelemetryApi.sendEvent(eventData)).resolves.toBeUndefined();
        });

        test('handles network error', async () => {
            fetchMock.mockRejectedValue(new Error('Network error'));

            const eventData: TelemetryApiEventData = {
                ...createBaseEventData(),
                event: {
                    name: TelemetryEventName.PauseClick,
                    ref_name: TelemetryScreenName.MainPage,
                },
            };

            await expect(TelemetryApi.sendEvent(eventData)).resolves.toBeUndefined();
        });
    });
});

export {};
