import { UpdateApi } from '../../../../Extension/src/background/api';
import {
    mockLocalStorage,
    getStorageFixturesV0,
    getStorageFixturesV1,
    getStorageFixturesV2,
    type StorageData,
} from '../../../helpers';
import { getRunInfo } from '../../../../Extension/src/background/utils';
import { SbCache } from '../../../../Extension/src/background/storages';

describe('Update Api', () => {
    describe('update method', () => {
        const timestamp = 12345;

        const v0 = getStorageFixturesV0();
        const v1 = getStorageFixturesV1();
        const v2 = getStorageFixturesV2(timestamp + SbCache.CACHE_TTL_MS);

        beforeAll(() => {
            jest.spyOn(Date, 'now').mockReturnValue(timestamp);
        });

        const getCases = (from: StorageData[], to: StorageData[]) => {
            const cases = [];

            for (let i = 0; i < Math.min(from.length, to.length); i += 1) {
                cases.push({ from: from[i] as StorageData, to: to[i] as StorageData });
            }

            return cases;
        };

        const runCase = async (data: {
            from: StorageData,
            to: StorageData,
        }) => {
            const storage = mockLocalStorage(data.from);

            const runInfo = await getRunInfo();

            await UpdateApi.update(runInfo);

            const settings = await storage.get();
            expect(settings).toStrictEqual(data.to);
        };

        it.each(getCases(v0, v2))('should update from v0 to v2', runCase);
        it.each(getCases(v1, v2))('should update from v1 to v2', runCase);
    });
});
