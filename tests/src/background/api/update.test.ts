import { Storage } from 'webextension-polyfill';

import { UpdateApi } from '../../../../Extension/src/background/api';
import {
    mockLocalStorage,
    getStorageSettingsFixtureV1,
    getUpdatedStorageSettingsV1,
} from '../../../helpers';
import { getRunInfo } from '../../../../Extension/src/background/utils';

describe('Update Api', () => {
    let storage: Storage.StorageArea;

    afterEach(() => {
        storage.clear();
    });

    const testStorages = [];
    const settingsV1 = getStorageSettingsFixtureV1();
    const updatedSettingsV1 = getUpdatedStorageSettingsV1();
    if (settingsV1.length !== updatedSettingsV1.length) {
        throw new Error('Number of expected storages settings is not equal to number of testing outdated settings');
    }
    for (let i = 0; i < settingsV1.length; i += 1) {
        testStorages.push({
            storageSettingsV1: settingsV1[i],
            expectedUpdatedSettings: updatedSettingsV1[i],
        });
    }

    it.each(testStorages)('Updates from schema V1: ', async ({
        storageSettingsV1,
        expectedUpdatedSettings,
    }) => {
        storage = mockLocalStorage(JSON.parse(JSON.stringify(storageSettingsV1)));

        const runInfo = await getRunInfo();

        await UpdateApi.update(runInfo);

        const settings = await storage.get();
        expect(settings).toStrictEqual(expectedUpdatedSettings);
    });
});
