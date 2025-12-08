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

import { TELEMETRY_SYNTHETIC_ID_KEY } from '../../../../Extension/src/common/constants';
import { SyntheticIdGenerator } from '../../../../Extension/src/background/services';
import { browserStorage } from '../../../../Extension/src/background/storages';

vi.mock('../../../../Extension/src/background/storages', () => ({
    browserStorage: {
        get: vi.fn(),
        set: vi.fn(),
    },
}));

describe('SyntheticIdGenerator', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('gainSyntheticId', () => {
        test('generates new synthetic ID when storage is empty', async () => {
            vi.mocked(browserStorage.get).mockResolvedValue(undefined);

            const id = await SyntheticIdGenerator.gainSyntheticId();

            expect(id).toHaveLength(8);
            expect(id).toMatch(/^[abcdef123456789]{8}$/);
            expect(vi.mocked(browserStorage.set)).toHaveBeenCalledWith(TELEMETRY_SYNTHETIC_ID_KEY, id);
        });

        test('returns existing valid synthetic ID from storage', async () => {
            const existingId = 'abc12345';
            vi.mocked(browserStorage.get).mockResolvedValue(existingId);

            const id = await SyntheticIdGenerator.gainSyntheticId();

            expect(id).toBe(existingId);
            expect(vi.mocked(browserStorage.set)).not.toHaveBeenCalled();
        });

        test('generates new ID when stored ID is invalid (wrong length)', async () => {
            vi.mocked(browserStorage.get).mockResolvedValue('abc123');

            const id = await SyntheticIdGenerator.gainSyntheticId();

            expect(id).toHaveLength(8);
            expect(vi.mocked(browserStorage.set)).toHaveBeenCalledWith(TELEMETRY_SYNTHETIC_ID_KEY, id);
        });

        test('generates new ID when stored ID contains invalid characters', async () => {
            vi.mocked(browserStorage.get).mockResolvedValue('abc1234g');

            const id = await SyntheticIdGenerator.gainSyntheticId();

            expect(id).toHaveLength(8);
            expect(id).toMatch(/^[abcdef123456789]{8}$/);
            expect(vi.mocked(browserStorage.set)).toHaveBeenCalledWith(TELEMETRY_SYNTHETIC_ID_KEY, id);
        });
    });
});

export {};
