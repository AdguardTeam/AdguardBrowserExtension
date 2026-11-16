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
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

import { CanvasRegistrationStatus, type RegistrationResult } from '@adguard/tswebextension';

import {
    SettingsServiceCommon,
} from '../../../../../Extension/src/background/services/settings/settings/settings-service-common';
import { SettingsApi } from '../../../../../Extension/src/background/api';
import { settingsStorage } from '../../../../../Extension/src/background/storages';
import { appContext, AppContextKey } from '../../../../../Extension/src/background/storages/app';
import { settingsEvents } from '../../../../../Extension/src/background/events';
import { messageHandler } from '../../../../../Extension/src/background/message-handler';
import { SettingOption } from '../../../../../Extension/src/background/schema';
import { MessageType } from '../../../../../Extension/src/common/messages';
import { defaultSettings } from '../../../../../Extension/src/common/settings';
import { logger } from '../../../../../Extension/src/common/logger';

const { setCanvasProtectionEnabledMock } = vi.hoisted(() => ({
    setCanvasProtectionEnabledMock: vi.fn(),
}));

vi.mock('../../../../../Extension/src/background/engine', () => ({
    engine: {
        api: {
            setCanvasProtectionEnabled: setCanvasProtectionEnabledMock,
        },
    },
}));

describe('SettingsServiceCommon — canvas protection', () => {
    beforeEach(() => {
        settingsStorage.setCache({ ...defaultSettings });
        setCanvasProtectionEnabledMock.mockReset();
        setCanvasProtectionEnabledMock.mockResolvedValue({
            status: CanvasRegistrationStatus.Installed,
        } as RegistrationResult);
    });

    afterEach(() => {
        appContext.set(AppContextKey.IsInit, false);
        vi.restoreAllMocks();
    });

    it('registers the block fingerprinting listener and the re-apply message listener on init', () => {
        const settingsEventsAddListenerSpy = vi
            .spyOn(settingsEvents, 'addListener')
            .mockImplementation(() => {});
        const messageHandlerAddListenerSpy = vi
            .spyOn(messageHandler, 'addListener')
            .mockImplementation(() => {});

        SettingsServiceCommon.init();

        expect(settingsEventsAddListenerSpy).toHaveBeenCalledWith(
            SettingOption.BlockFingerprinting,
            SettingsServiceCommon.onBlockFingerprintingChange,
        );
        expect(messageHandlerAddListenerSpy).toHaveBeenCalledWith(
            MessageType.ReapplyCanvasProtection,
            SettingsServiceCommon.reapplyCanvasProtection,
        );
    });

    it('passes the new setting value to the canvas protection setter', async () => {
        await SettingsServiceCommon.onBlockFingerprintingChange(true);

        expect(setCanvasProtectionEnabledMock).toHaveBeenCalledTimes(1);
        expect(setCanvasProtectionEnabledMock).toHaveBeenCalledWith(true);
    });

    it('re-applies the stored setting value on request', async () => {
        settingsStorage.setCache({
            ...defaultSettings,
            [SettingOption.BlockFingerprinting]: true,
        });
        appContext.set(AppContextKey.IsInit, true);

        await SettingsServiceCommon.reapplyCanvasProtection();

        expect(setCanvasProtectionEnabledMock).toHaveBeenCalledTimes(1);
        expect(setCanvasProtectionEnabledMock).toHaveBeenCalledWith(true);
    });

    it('does not re-apply the setting before the engine starts', async () => {
        settingsStorage.setCache({
            ...defaultSettings,
            [SettingOption.BlockFingerprinting]: true,
        });
        appContext.set(AppContextKey.IsInit, false);

        await SettingsServiceCommon.reapplyCanvasProtection();

        expect(setCanvasProtectionEnabledMock).not.toHaveBeenCalled();
    });

    it('keeps the setting and logs the status when protection is unavailable', async () => {
        const reason = 'user scripts are not allowed';
        const requiredUserAction = 'Allow user scripts';
        settingsStorage.setCache({
            ...defaultSettings,
            [SettingOption.BlockFingerprinting]: true,
        });

        const loggerInfoSpy = vi.spyOn(logger, 'info').mockImplementation(() => {});
        const setSettingSpy = vi.spyOn(SettingsApi, 'setSetting');
        setCanvasProtectionEnabledMock.mockResolvedValue({
            status: CanvasRegistrationStatus.Unavailable,
            reason,
            requiredUserAction,
        } as RegistrationResult);

        await SettingsServiceCommon.onBlockFingerprintingChange(true);

        expect(SettingsApi.getSetting(SettingOption.BlockFingerprinting)).toBe(true);
        expect(setSettingSpy).not.toHaveBeenCalled();
        expect(loggerInfoSpy).toHaveBeenCalledTimes(1);

        const message = loggerInfoSpy.mock.calls[0]?.[0] as string;

        expect(message).toContain(CanvasRegistrationStatus.Unavailable);
        expect(message).toContain(reason);
    });

    it('logs an error when the canvas protection setter rejects', async () => {
        settingsStorage.setCache({
            ...defaultSettings,
            [SettingOption.BlockFingerprinting]: true,
        });

        const loggerErrorSpy = vi.spyOn(logger, 'error').mockImplementation(() => {});
        const setSettingSpy = vi.spyOn(SettingsApi, 'setSetting');
        setCanvasProtectionEnabledMock.mockRejectedValue(new Error('no configuration'));

        await expect(SettingsServiceCommon.onBlockFingerprintingChange(true)).resolves.toBeUndefined();

        expect(loggerErrorSpy).toHaveBeenCalledTimes(1);
        expect(setSettingSpy).not.toHaveBeenCalled();
        expect(SettingsApi.getSetting(SettingOption.BlockFingerprinting)).toBe(true);
    });
});
