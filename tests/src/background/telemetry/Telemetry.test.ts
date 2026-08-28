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
import { SettingOption } from '../../../../Extension/src/background/schema';
import { messageHandler } from '../../../../Extension/src/background/message-handler';
import { SettingsApi, TelemetryApi } from '../../../../Extension/src/background/api';
import { MessageType } from '../../../../Extension/src/common/messages';
import { ABTestManager } from '../../../../Extension/src/background/services/telemetry';
import { NotifierType } from '../../../../Extension/src/common/constants';

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
        sendSessionStart: vi.fn().mockResolvedValue({ versions: {} }),
    },
}));

vi.mock('../../../../Extension/src/common/logger', () => ({
    logger: {
        debug: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
    },
}));

vi.mock('../../../../Extension/src/background/services/telemetry/abtest/ABTestManager', () => ({
    ABTestManager: {
        removeRetiredVariants: vi.fn().mockResolvedValue(undefined),
        getVariantsForProps: vi.fn().mockResolvedValue({}),
        getTestsPayload: vi.fn().mockResolvedValue({}),
        processResponse: vi.fn().mockResolvedValue(undefined),
        resetCache: vi.fn(),
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

        // Reset session start state so each test starts fresh
        // @ts-ignore - accessing private field for testing
        Telemetry.isSessionStartSent = false;
        // @ts-ignore - accessing private field for testing
        Telemetry.isSessionStartInProgress = false;
        vi.mocked(TelemetryApi.sendSessionStart).mockResolvedValue({ versions: {} });

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

    describe('session_start', () => {
        test('continues initialization when retired experiment cleanup fails', async () => {
            // @ts-ignore - accessing private field for testing
            Telemetry.isSessionStartSent = false;
            // @ts-ignore - accessing private field for testing
            Telemetry.isSessionStartInProgress = false;
            vi.clearAllMocks();
            vi.mocked(ABTestManager.removeRetiredVariants).mockRejectedValueOnce(new Error('Storage error'));

            await expect(Telemetry.init()).resolves.toBeUndefined();

            expect(TelemetryApi.sendSessionStart).toHaveBeenCalledTimes(1);
            expect(messageHandler.addListener).toHaveBeenCalledWith(
                MessageType.SendTelemetryPageViewEvent,
                expect.any(Function),
            );
        });

        test('sends session_start during init when telemetry is enabled', async () => {
            // beforeEach calls init() with telemetry enabled
            expect(TelemetryApi.sendSessionStart).toHaveBeenCalledTimes(1);
        });

        test('does not send session_start again on re-init', async () => {
            // @ts-ignore - accessing private field for testing
            Telemetry.isSessionStartSent = true;
            vi.clearAllMocks();
            await Telemetry.init();

            expect(TelemetryApi.sendSessionStart).not.toHaveBeenCalled();
        });

        test('does not send session_start when telemetry is disabled', async () => {
            // @ts-ignore - accessing private field for testing
            Telemetry.isSessionStartSent = false;
            // @ts-ignore - accessing private field for testing
            Telemetry.isSessionStartInProgress = false;
            vi.clearAllMocks();
            vi.mocked(SettingsApi.getSetting).mockImplementation((key) => {
                if (key === SettingOption.AllowAnonymizedUsageData) {
                    return false;
                }
                return undefined;
            });
            await Telemetry.init();

            expect(TelemetryApi.sendSessionStart).not.toHaveBeenCalled();
        });

        test('drops events before session_start succeeds even if telemetry is enabled', async () => {
            // Simulate state before session_start has succeeded: telemetry enabled,
            // but isSessionStartSent is still false.
            // @ts-ignore - accessing private field for testing
            Telemetry.isSessionStartSent = false;
            vi.clearAllMocks();

            await Telemetry.sendPageViewEvent(TelemetryScreenName.MainPage, 'page-1');

            expect(TelemetryApi.sendEvent).not.toHaveBeenCalled();
        });

        test('sends events after session_start succeeds', async () => {
            // beforeEach already called init() so isSessionStartSent is true
            vi.clearAllMocks();

            await Telemetry.sendPageViewEvent(TelemetryScreenName.MainPage, 'page-1');

            expect(TelemetryApi.sendEvent).toHaveBeenCalledTimes(1);
        });

        test('retries session_start on next trigger after failure', async () => {
            // Reset state
            // @ts-ignore - accessing private field for testing
            Telemetry.isSessionStartSent = false;
            // @ts-ignore - accessing private field for testing
            Telemetry.isSessionStartInProgress = false;
            vi.clearAllMocks();

            // First attempt: session_start fails
            vi.mocked(TelemetryApi.sendSessionStart).mockRejectedValue(new Error('Network error'));
            await Telemetry.init();

            expect(TelemetryApi.sendSessionStart).toHaveBeenCalledTimes(1);
            // @ts-ignore - accessing private field for testing
            expect(Telemetry.isSessionStartSent).toBe(false);

            // Second attempt: session_start succeeds (e.g. user re-enables telemetry)
            vi.mocked(TelemetryApi.sendSessionStart).mockResolvedValue({ versions: {} });
            vi.clearAllMocks();
            // @ts-ignore - accessing private field for testing
            Telemetry.isSessionStartInProgress = false;
            await Telemetry.init();

            expect(TelemetryApi.sendSessionStart).toHaveBeenCalledTimes(1);
            // @ts-ignore - accessing private field for testing
            expect(Telemetry.isSessionStartSent).toBe(true);
        });

        test('sends session_start when telemetry is enabled mid-process via handleSettingUpdated', async () => {
            // Reset state — init with telemetry disabled first
            // @ts-ignore - accessing private field for testing
            Telemetry.isSessionStartSent = false;
            // @ts-ignore - accessing private field for testing
            Telemetry.isSessionStartInProgress = false;
            vi.clearAllMocks();
            vi.mocked(SettingsApi.getSetting).mockImplementation((key) => {
                if (key === SettingOption.AllowAnonymizedUsageData) {
                    return false;
                }
                return undefined;
            });

            await Telemetry.init();
            expect(TelemetryApi.sendSessionStart).not.toHaveBeenCalled();

            // Now enable telemetry — SettingsApi must return true for runSessionStart to proceed
            vi.mocked(SettingsApi.getSetting).mockImplementation((key) => {
                if (key === SettingOption.AllowAnonymizedUsageData) {
                    return true;
                }
                return undefined;
            });

            // Simulate the notifier callback when user enables telemetry consent
            // @ts-ignore - accessing private method for testing
            Telemetry.handleSettingUpdated(
                NotifierType.SettingUpdated,
                { propertyName: SettingOption.AllowAnonymizedUsageData, propertyValue: true },
            );

            // handleSettingUpdated calls runSessionStart() fire-and-forget,
            // so wait for the async operation to complete
            await vi.waitFor(() => {
                expect(TelemetryApi.sendSessionStart).toHaveBeenCalledTimes(1);
            });
        });

        test('does not set isSessionStartSent on failure, allowing retry', async () => {
            // Reset state
            // @ts-ignore - accessing private field for testing
            Telemetry.isSessionStartSent = false;
            // @ts-ignore - accessing private field for testing
            Telemetry.isSessionStartInProgress = false;
            vi.clearAllMocks();

            // First attempt: session_start fails
            vi.mocked(TelemetryApi.sendSessionStart).mockRejectedValue(new Error('Network error'));
            await Telemetry.init();

            expect(TelemetryApi.sendSessionStart).toHaveBeenCalledTimes(1);
            // @ts-ignore - accessing private field for testing
            expect(Telemetry.isSessionStartSent).toBe(false);

            // Second attempt: session_start succeeds (e.g. user re-enables telemetry)
            vi.mocked(TelemetryApi.sendSessionStart).mockResolvedValue({ versions: {} });
            vi.clearAllMocks();
            // @ts-ignore - accessing private field for testing
            Telemetry.isSessionStartInProgress = false;
            await Telemetry.init();

            expect(TelemetryApi.sendSessionStart).toHaveBeenCalledTimes(1);
            // @ts-ignore - accessing private field for testing
            expect(Telemetry.isSessionStartSent).toBe(true);
        });
    });

    describe('experiment props', () => {
        test('does not include empty experiment fields in telemetry events', async () => {
            vi.spyOn(ABTestManager, 'getVariantsForProps').mockResolvedValue({});

            await Telemetry.sendPageViewEvent(TelemetryScreenName.MainPage, 'page-1');

            const callArgs = vi.mocked(TelemetryApi.sendEvent).mock.calls[0]![0];
            expect(callArgs.props).toBeDefined();
            expect(callArgs.props).not.toHaveProperty('experiment_1');
            expect(callArgs.props).not.toHaveProperty('experiment_2');
            expect(callArgs.props).not.toHaveProperty('experiment_3');
        });
    });
});

export {};
