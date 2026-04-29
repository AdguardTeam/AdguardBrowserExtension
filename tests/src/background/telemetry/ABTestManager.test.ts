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
    describe,
    it,
    expect,
    vi,
    beforeEach,
    afterEach,
} from 'vitest';

import { ABTestManager } from '../../../../Extension/src/background/services/telemetry';
import { type SessionStartResponse } from '../../../../Extension/src/background/services/telemetry';
import { browserStorage } from '../../../../Extension/src/background/storages';
import { logger } from '../../../../Extension/src/common/logger';

vi.mock('../../../../Extension/src/background/storages', () => ({
    browserStorage: {
        get: vi.fn(),
        set: vi.fn(),
    },
}));

vi.mock('../../../../Extension/src/common/logger', () => ({
    logger: {
        error: vi.fn(),
        debug: vi.fn(),
    },
}));

vi.mock('../../../../Extension/src/background/services/telemetry/abtest/constants', () => ({
    VARIANTS_STORAGE_KEY: 'ab_test_manager.variants',
    EXPERIMENT_REGISTRY: {},
}));

const makeResponse = (overrides: SessionStartResponse['versions'] = {}): SessionStartResponse => ({
    versions: overrides,
});

describe('ABTestManager', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        ABTestManager.resetCache();
    });

    afterEach(() => {
        vi.resetAllMocks();
    });

    describe('lazy loading', () => {
        it('should lazy-load variant cache on first access', async () => {
            const cached = { experiment_1: 'AG-001-feature-a-variant_def' };
            vi.mocked(browserStorage.get).mockResolvedValue(cached);

            expect(browserStorage.get).not.toHaveBeenCalled();

            expect(await ABTestManager.getVariantsForProps()).toEqual(cached);
            expect(browserStorage.get).toHaveBeenCalledWith('ab_test_manager.variants');
        });

        it('should use empty cache if storage returns nothing', async () => {
            vi.mocked(browserStorage.get).mockResolvedValue(undefined);

            expect(await ABTestManager.getVariantsForProps()).toEqual({});
        });

        it('should lazy-load and log error if storage value is corrupted', async () => {
            vi.mocked(browserStorage.get).mockResolvedValue('corrupted-string');

            expect(logger.error).not.toHaveBeenCalled();

            expect(await ABTestManager.getVariantsForProps()).toEqual({});
            expect(logger.error).toHaveBeenCalled();
        });
    });

    describe('getTestsPayload', () => {
        it('should return empty object when registry is empty and cache is empty', async () => {
            vi.mocked(browserStorage.get).mockResolvedValue(undefined);

            expect(await ABTestManager.getTestsPayload()).toEqual({});
        });

        it('should return empty object when cache is empty (registry is empty by default)', async () => {
            vi.mocked(browserStorage.get).mockResolvedValue(undefined);

            expect(await ABTestManager.getTestsPayload()).toEqual({});
        });
    });

    describe('processResponse', () => {
        it('should not persist to storage when response is empty', async () => {
            vi.mocked(browserStorage.get).mockResolvedValue(undefined);

            await ABTestManager.processResponse(makeResponse({}));

            expect(browserStorage.set).not.toHaveBeenCalled();
            expect(await ABTestManager.getVariantsForProps()).toEqual({});
        });

        it('should ignore slots not present in the registry', async () => {
            vi.mocked(browserStorage.get).mockResolvedValue(undefined);

            const response = makeResponse({
                experiment_1: { experiment_name: 'AG-001-feature-a', version_name: 'AG-001-feature-a-variant_def' },
            });

            await ABTestManager.processResponse(response);

            // Since registry is empty, no slots should be accepted
            expect(browserStorage.set).not.toHaveBeenCalled();
            expect(await ABTestManager.getVariantsForProps()).toEqual({});
        });

        it('should handle response with undefined assignments gracefully', async () => {
            vi.mocked(browserStorage.get).mockResolvedValue(undefined);

            const response = makeResponse({
                experiment_1: undefined,
                experiment_2: undefined,
            });

            await ABTestManager.processResponse(response);

            expect(browserStorage.set).not.toHaveBeenCalled();
            expect(await ABTestManager.getVariantsForProps()).toEqual({});
        });
    });

    describe('getVariantsForProps', () => {
        it('should return only slots with a cached variant', async () => {
            const cached = {
                experiment_1: 'AG-001-feature-a-variant_def',
                experiment_2: 'AG-002-feature-b-variant_b',
            };
            vi.mocked(browserStorage.get).mockResolvedValue(cached);

            expect(await ABTestManager.getVariantsForProps()).toEqual(cached);
        });

        it('should return empty object when no variants are cached', async () => {
            vi.mocked(browserStorage.get).mockResolvedValue(undefined);

            expect(await ABTestManager.getVariantsForProps()).toEqual({});
        });
    });

    describe('hasVariant', () => {
        it('should return true when variant is cached', async () => {
            vi.mocked(browserStorage.get).mockResolvedValue({
                experiment_1: 'AG-51010-limitations-browser-b',
            });

            expect(await ABTestManager.hasVariant('AG-51010-limitations-browser-b')).toBe(true);
        });

        it('should return false when variant is not cached', async () => {
            vi.mocked(browserStorage.get).mockResolvedValue({
                experiment_1: 'AG-51010-limitations-browser-a',
            });

            expect(await ABTestManager.hasVariant('AG-51010-limitations-browser-b')).toBe(false);
        });
    });

    describe('storage operations', () => {
        it('should handle storage errors gracefully', async () => {
            vi.mocked(browserStorage.get).mockRejectedValue(new Error('Storage error'));

            await expect(ABTestManager.getVariantsForProps()).rejects.toThrow('Storage error');
        });

        it('should validate storage data with zod schema', async () => {
            const invalidCached = {
                invalid_slot: 'some-value',
            };
            vi.mocked(browserStorage.get).mockResolvedValue(invalidCached);

            expect(await ABTestManager.getVariantsForProps()).toEqual({});
            expect(logger.error).toHaveBeenCalled();
        });
    });
});
