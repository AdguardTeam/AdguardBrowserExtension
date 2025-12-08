import {
    afterAll,
    afterEach,
    beforeAll,
    beforeEach,
    describe,
    expect,
    it,
    vi,
    type MockInstance,
} from 'vitest';

import { HybridStorage } from '../../../../Extension/src/background/storages/hybrid-storage';
import { UpdateApi } from '../../../../Extension/src/background/api';
import {
    mockLocalStorage,
    getStorageFixturesV0,
    getStorageFixturesV1,
    getStorageFixturesV2,
    getStorageFixturesV3,
    getStorageFixturesV4,
    getStorageFixturesV5,
    getStorageFixturesV6,
    getStorageFixturesV7,
    getStorageFixturesV8,
    getStorageFixturesV9,
    getStorageFixturesV10,
    getStorageFixturesV11,
    getStorageFixturesV12,
    getStorageFixturesV13,
    getStorageFixturesV14,
    type StorageData,
} from '../../../helpers';
import { getRunInfo } from '../../../../Extension/src/background/utils';
import { SbCache } from '../../../../Extension/src/background/storages';
import { FILTER_KEY_PREFIX } from '../../../../Extension/src/background/api/update/assets/old-filters-storage-v1';
import { settingsValidator } from '../../../../Extension/src/background/schema';

vi.mock('../../../../Extension/src/background/engine');
vi.mock('../../../../Extension/src/background/api/ui/icons');
vi.mock('../../../../Extension/src/background/storages/notification');

/**
 * Recursively parses JSON-like values safely.
 *
 * - If a string is a valid JSON, it is parsed.
 * - Dates are converted to ISO strings.
 * - Arrays and objects are traversed deeply to parse nested JSON strings.
 * - Non-serializable values (functions, symbols) remain unchanged.
 *
 * @param value - The value to be processed.
 *
 * @returns The parsed value if it was JSON, otherwise the original value.
 */
function deepJsonParse<T = unknown>(value: unknown): T {
    if (typeof value === 'string') {
        try {
            return JSON.parse(value) as T;
        } catch {
            // Return original string if parsing fails
            return value as T;
        }
    }

    if (Array.isArray(value)) {
        // Recursively process array elements
        return value.map(deepJsonParse) as T;
    }

    if (value instanceof Date) {
        // Convert Date to string
        return value.toISOString() as T;
    }

    // Convert Uint8Array
    if (value instanceof Uint8Array) {
        return Buffer.from(value) as T;
    }

    if (value && typeof value === 'object') {
        return Object.fromEntries(
            Object.entries(value).map(([key, val]) => [key, deepJsonParse(val)]),
        ) as T;
    }

    return value as T; // Return other types as-is
}

// TODO: add tests for the case when indexedDB is supported
describe('Update Api (without indexedDB)', () => {
    describe('update method', () => {
        let dateNowSpy: MockInstance;
        let setMultipleSpy: MockInstance;
        let indexedDBOpenSpy: MockInstance;

        const timestamp = 12345;
        const expires = timestamp + SbCache.CACHE_TTL_MS;

        beforeAll(() => {
            dateNowSpy = vi.spyOn(Date, 'now').mockReturnValue(timestamp);
        });

        beforeEach(() => {
            setMultipleSpy = vi.spyOn(HybridStorage.prototype, 'setMultiple');

            // Throwing an error to simulate the absence of indexedDB,
            // and HybridStorage falls back to browser.storage.local
            indexedDBOpenSpy = vi.spyOn(indexedDB, 'open').mockImplementation(() => {
                throw new Error('IndexedDB not supported');
            });
        });

        afterEach(() => {
            setMultipleSpy.mockRestore();
            indexedDBOpenSpy.mockRestore();
        });

        afterAll(() => {
            dateNowSpy.mockRestore();
        });

        const getCases = (from: StorageData[], to: StorageData[]) => {
            const cases = [];

            for (let i = 0; i < Math.min(from.length, to.length); i += 1) {
                cases.push({ from: from[i] as StorageData, to: to[i] as StorageData });
            }

            return cases;
        };

        const runCase = async (data: {
            from: StorageData;
            to: StorageData;
        }) => {
            const storage = mockLocalStorage(data.from);
            const runInfo = await getRunInfo();

            await UpdateApi.update(runInfo);

            const settings = await storage.get(null);

            // Some properties in the data are stored as strings, but we need to compare them as objects, not as strings
            expect(deepJsonParse(settings)).toStrictEqual(deepJsonParse(data.to));

            // Verify settings integrity
            const adguardSettings = settings['adguard-settings'];
            const validationResult = settingsValidator.safeParse(adguardSettings);

            expect(validationResult.success).toBe(true);
        };

        const migrationCasesData = {
            v0: getStorageFixturesV0(),
            v1: getStorageFixturesV1(),
            v2: getStorageFixturesV2(expires),
            v3: getStorageFixturesV3(expires),
            v4: getStorageFixturesV4(expires),
            v5: getStorageFixturesV5(expires),
            v6: getStorageFixturesV6(expires),
            v7: getStorageFixturesV7(expires),
            v8: getStorageFixturesV8(expires),
            v9: getStorageFixturesV9(expires),
            v10: getStorageFixturesV10(expires),
            v11: getStorageFixturesV11(expires),
            v12: getStorageFixturesV12(expires),
            v13: getStorageFixturesV13(expires),
            v14: getStorageFixturesV14(expires),
        };

        const targetVersion = Object.keys(migrationCasesData).pop() as keyof typeof migrationCasesData;

        // Iterate over all versions except the last one
        // e.g. if we have v0, v1, v2, v3, only v0->v3, v1->v3, v2->v3 will be tested
        // but not v3->v3
        Object.entries(migrationCasesData).forEach(([version, data]) => {
            if (version === targetVersion) {
                return;
            }

            const cases = getCases(data, migrationCasesData[targetVersion]);
            it.each(cases)(`should update from ${version} to ${targetVersion}`, runCase);
        });

        // Separate test for migration from V3 storage, because after this
        // version we moved from localStorage to hybridStorage.
        it('should call hybridStorage.setMultiple with filter-related keys', async () => {
            const [data] = getStorageFixturesV3(expires);

            if (!data) {
                throw new Error('fixture is not defined');
            }

            mockLocalStorage(data);

            const runInfo = await getRunInfo();
            const filterRelatedKeys = Object.keys(data).filter((key) => key.startsWith(FILTER_KEY_PREFIX));

            await UpdateApi.update(runInfo);

            // there should be 3 calls in MV3 for:
            // 1) migration filters from localStorage to hybridStorage
            // 2) adding new Quick Fixes filter — in v5.0.91
            // 3) re-adding Quick Fixes filter back (after temporary removal) — in v5.0.185
            // 4) renaming filters keys

            // there should be 2 calls in MV2 for:
            // 1) migration filters from localStorage to hybridStorage
            // 2) renaming filters keys
            expect(setMultipleSpy).toHaveBeenCalledTimes(__IS_MV3__ ? 4 : 2);
            expect(setMultipleSpy).toHaveBeenCalledWith(
                // An object that contains all filter-related keys from the old data
                // If this test passes, it means that data was passed to the hybrid storage
                expect.objectContaining(
                    filterRelatedKeys.reduce((acc: { [key: string]: any }, key) => {
                        acc[key] = expect.anything();
                        return acc;
                    }, {}),
                ),
            );
        });
    });
});
