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
    TelemetryDataCollector,
    Theme,
    SyntheticIdGenerator,
} from '../../../../Extension/src/background/services';
import { TelemetryFilterUpdateIntervalMode } from '../../../../Extension/src/background/services/telemetry/enums';
import { AppearanceTheme, DEFAULT_FILTERS_UPDATE_PERIOD } from '../../../../Extension/src/common/settings';
import { UserAgent } from '../../../../Extension/src/common/user-agent';
import { SettingOption } from '../../../../Extension/src/background/schema/settings/enum';

const { mockSettingsStorageGet } = vi.hoisted(() => ({
    mockSettingsStorageGet: vi.fn(),
}));

vi.mock('../../../../Extension/src/common/user-agent', () => ({
    UserAgent: {
        getSystemInfo: vi.fn(),
        getSystemName: vi.fn(),
        getBrowserName: vi.fn(),
        parser: {
            getDevice: vi.fn(),
            getBrowser: vi.fn(),
        },
    },
}));

vi.mock('../../../../Extension/src/background/prefs', () => ({
    Prefs: {
        version: '5.0.0',
    },
}));

vi.mock('../../../../Extension/src/background/storages', () => ({
    browserStorage: {
        get: vi.fn(),
        set: vi.fn(),
    },
    settingsStorage: {
        get: mockSettingsStorageGet,
        set: vi.fn(),
    },
}));

vi.mock('../../../../Extension/src/background/services/telemetry/SyntheticIdGenerator', () => ({
    SyntheticIdGenerator: {
        gainSyntheticId: vi.fn(),
    },
}));

describe('TelemetryDataCollector', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        vi.mocked(UserAgent.getSystemInfo).mockResolvedValue('14.0.0');
        vi.mocked(UserAgent.getSystemName).mockReturnValue('macOS');
        vi.mocked(UserAgent.getBrowserName).mockReturnValue('Chrome');

        vi.mocked(UserAgent.parser.getDevice).mockReturnValue({
            vendor: undefined,
            model: undefined,
            type: undefined,
        });

        vi.mocked(UserAgent.parser.getBrowser).mockReturnValue({
            name: 'Chrome',
            version: '120.0.0',
            major: '120',
        });

        mockSettingsStorageGet.mockImplementation((key: SettingOption): any => {
            if (key === SettingOption.AppearanceTheme) {
                return AppearanceTheme.Light;
            }
            if (key === SettingOption.FiltersUpdatePeriod) {
                return DEFAULT_FILTERS_UPDATE_PERIOD;
            }
            return undefined;
        });

        vi.mocked(SyntheticIdGenerator.gainSyntheticId).mockResolvedValue('abc12345');

        Object.defineProperty(navigator, 'language', {
            value: 'en-US',
            configurable: true,
        });
    });

    test('throws error if not initialized', async () => {
        await expect(TelemetryDataCollector.getBaseData()).rejects.toThrow('Telemetry is not initialized');
    });

    test('initializes telemetry data collector with all required fields', async () => {
        await TelemetryDataCollector.init();

        const baseData = await TelemetryDataCollector.getBaseData();

        expect(baseData).toEqual({
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
                device: undefined,
            },
            props: {
                app_locale: 'en',
                system_locale: 'en-US',
                theme: Theme.Light,
                update_interval: TelemetryFilterUpdateIntervalMode.SystemDefault,
            },
        });

        expect(SyntheticIdGenerator.gainSyntheticId).toHaveBeenCalled();
        expect(UserAgent.getSystemInfo).toHaveBeenCalled();
        expect(UserAgent.getSystemName).toHaveBeenCalled();
        expect(UserAgent.getBrowserName).toHaveBeenCalled();
        expect(UserAgent.parser.getDevice).toHaveBeenCalled();
        expect(UserAgent.parser.getBrowser).toHaveBeenCalled();
        expect(mockSettingsStorageGet).toHaveBeenCalledWith(SettingOption.AppearanceTheme);
    });
});

export {};
