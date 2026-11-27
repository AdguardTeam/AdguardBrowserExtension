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

import { InstallApi } from '../../../../../Extension/src/background/api/install/main';
import { INSTALL_TIME_KEY } from '../../../../../Extension/src/common/constants';
import { type RunInfo } from '../../../../../Extension/src/background/utils/run-info';

const { mockBrowserStorageSet, mockBrowserStorageHas } = vi.hoisted(() => ({
    mockBrowserStorageSet: vi.fn(),
    mockBrowserStorageHas: vi.fn(),
}));

vi.mock('../../../../../Extension/src/background/storages', () => ({
    browserStorage: {
        get: vi.fn(),
        set: mockBrowserStorageSet,
        has: mockBrowserStorageHas,
    },
}));

const runInfo: RunInfo = {
    currentAppVersion: '5.0.0',
    previousAppVersion: null,
    currentSchemaVersion: 16,
    previousSchemaVersion: 0,
    clientId: null,
};

describe('InstallApi', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('stores the current time under the install time key on install', async () => {
        const now = 1_000_000_000;
        const nowSpy = vi.spyOn(Date, 'now').mockReturnValue(now);
        mockBrowserStorageHas.mockResolvedValue(false);

        await InstallApi.install(runInfo);

        expect(mockBrowserStorageSet).toHaveBeenCalledWith(INSTALL_TIME_KEY, now);

        nowSpy.mockRestore();
    });

    test('keeps the stored install time when the install runs again', async () => {
        mockBrowserStorageHas.mockResolvedValue(true);

        await InstallApi.install(runInfo);

        expect(mockBrowserStorageHas).toHaveBeenCalledWith(INSTALL_TIME_KEY);
        expect(mockBrowserStorageSet).not.toHaveBeenCalledWith(INSTALL_TIME_KEY, expect.anything());
    });
});

export {};
