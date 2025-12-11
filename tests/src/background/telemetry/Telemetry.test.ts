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
    Telemetry,
    TelemetryDataCollector,
    TelemetryEventName,
    TelemetryScreenName,
    Theme,
} from '../../../../Extension/src/background/services';
import { SettingOption } from '../../../../Extension/src/background/schema/settings/enum';
import { messageHandler } from '../../../../Extension/src/background/message-handler';
import { SettingsApi, TelemetryApi } from '../../../../Extension/src/background/api';
import { MessageType } from '../../../../Extension/src/common/messages';

vi.mock('../../../../Extension/src/background/message-handler', () => ({
    messageHandler: {
        addListener: vi.fn(),
    },
}));

vi.mock('../../../../Extension/src/background/api', () => ({
    SettingsApi: {
        getSetting: vi.fn(),
    },
    TelemetryApi: {
        sendEvent: vi.fn(),
    },
}));

vi.mock('../../../../Extension/src/common/logger', () => ({
    logger: {
        debug: vi.fn(),
        error: vi.fn(),
    },
}));

describe('Telemetry', () => {
    beforeEach(async () => {
        vi.clearAllMocks();

        // Mock telemetry enabled by default
        vi.mocked(SettingsApi.getSetting).mockImplementation((key) => {
            if (key === SettingOption.AllowAnonymizedUsageData) {
                return true;
            }
            return undefined;
        });

        vi.spyOn(TelemetryDataCollector, 'init').mockResolvedValue();

        vi.spyOn(TelemetryDataCollector, 'getBaseData').mockResolvedValue({
            synthetic_id: 'abc12345',
            app_type: 'EXTENSION',
            version: '5.0.0',
            user_agent: {
                os: { name: 'macOS', version: '14.0.0' },
                browser: { name: 'Chrome', version: '120.0' },
            },
            props: {
                app_locale: 'en-US',
                system_locale: 'en-US',
                theme: Theme.Light,
                update_interval: null,
            },
        });

        await Telemetry.init();
    });

    test('initialization', async () => {
        await Telemetry.init();

        expect(TelemetryDataCollector.init).toHaveBeenCalled();
        expect(messageHandler.addListener).toHaveBeenCalledWith(
            MessageType.SendTelemetryPageViewEvent,
            expect.any(Function),
        );
        expect(messageHandler.addListener).toHaveBeenCalledWith(
            MessageType.SendTelemetryCustomEvent,
            expect.any(Function),
        );
    });

    describe('sendPageViewEvent', () => {
        test('sends page view event when telemetry is enabled', async () => {
            await Telemetry.init();

            await Telemetry.sendPageViewEvent(TelemetryScreenName.MainPage, 'page-1');

            expect(TelemetryApi.sendEvent).toHaveBeenCalledWith({
                synthetic_id: 'abc12345',
                app_type: 'EXTENSION',
                version: '5.0.0',
                user_agent: expect.any(Object),
                props: expect.any(Object),
                pageview: {
                    name: TelemetryScreenName.MainPage,
                    ref_name: undefined,
                },
            });
        });

        test('does not send page view event when telemetry is disabled', async () => {
            vi.mocked(SettingsApi.getSetting).mockImplementation((key) => {
                if (key === SettingOption.AllowAnonymizedUsageData) {
                    return false;
                }
                return undefined;
            });

            await Telemetry.sendPageViewEvent(TelemetryScreenName.MainPage, 'page-1');

            expect(TelemetryApi.sendEvent).not.toHaveBeenCalled();
        });
    });

    describe('sendCustomEvent', () => {
        test('sends custom event when telemetry is enabled', async () => {
            await Telemetry.init();

            await Telemetry.sendCustomEvent(
                TelemetryScreenName.MainPage,
                TelemetryEventName.CheckUpdatesClick,
            );

            expect(TelemetryApi.sendEvent).toHaveBeenCalledWith({
                synthetic_id: 'abc12345',
                app_type: 'EXTENSION',
                version: '5.0.0',
                user_agent: expect.any(Object),
                props: expect.any(Object),
                event: {
                    name: TelemetryEventName.CheckUpdatesClick,
                    ref_name: TelemetryScreenName.MainPage,
                },
            });
        });

        test('does not send custom event when telemetry is disabled', async () => {
            vi.mocked(SettingsApi.getSetting).mockImplementation((key) => {
                if (key === SettingOption.AllowAnonymizedUsageData) {
                    return false;
                }
                return undefined;
            });

            await Telemetry.sendCustomEvent(
                TelemetryScreenName.MainPage,
                TelemetryEventName.CheckUpdatesClick,
            );

            expect(TelemetryApi.sendEvent).not.toHaveBeenCalled();
        });
    });

    describe('telemetry flow', () => {
        test('handles complete flow with page views and custom events', async () => {
            await Telemetry.init();

            await Telemetry.sendPageViewEvent(TelemetryScreenName.MainPage, 'page-1');
            await Telemetry.sendCustomEvent(TelemetryScreenName.MainPage, TelemetryEventName.CheckUpdatesClick);
            await Telemetry.sendPageViewEvent(TelemetryScreenName.GeneralSettings, 'page-1');

            expect(TelemetryApi.sendEvent).toHaveBeenCalledTimes(3);
        });
    });
});

export {};
