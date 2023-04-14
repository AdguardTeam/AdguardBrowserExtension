import { type Storage } from 'webextension-polyfill';

import {
    TabContext,
    NetworkRule,
    TabInfo,
} from '@adguard/tswebextension';

import {
    PageStatsApi,
    mockLocalStorage,
    SettingsApi,
} from '../../../../helpers';
import { appContext, AppContextKey } from '../../../../../Extension/src/background/storages/app';
import { FramesApi } from '../../../../../Extension/src/background/api/ui/frames';

jest.mock('../../../../../Extension/src/background/api/filters/page-stats', () => ({
    ...(jest.requireActual('../../../../../Extension/src/background/api/filters/page-stats')),
    PageStatsApi,
}));

jest.mock('../../../../../Extension/src/background/api/settings/main', () => ({
    ...(jest.requireActual('../../../../../Extension/src/background/api/settings/main')),
    SettingsApi,
}));

jest.spyOn(PageStatsApi, 'getTotalBlocked').mockImplementation(() => 0);
jest.spyOn(SettingsApi, 'getSetting').mockImplementation(() => false);

describe('Frames Api', () => {
    let storage: Storage.StorageArea;

    afterEach(() => {
        storage.clear();
    });

    beforeEach(async () => {
        storage = mockLocalStorage();
    });

    beforeAll(() => {
        appContext.set(AppContextKey.IsInit, true);
    });

    it('getMainFrameData calculates documentAllowlisted and canAddRemoveRule', () => {
        const rule = '@@||testcases.agrd.dev$urlblock';
        const url = 'https://testcases.agrd.dev/test-important-vs-urlblock.html';

        const info: TabInfo = {
            url,
            id: 1,
            index: 0,
            highlighted: true,
            active: true,
            pinned: true,
            incognito: false,
        };
        const tabContext = new TabContext(info);
        tabContext.mainFrameRule = new NetworkRule(rule, 1000);
        tabContext.blockedRequestCount = 0;

        const frameData = FramesApi.getMainFrameData(tabContext);
        const { documentAllowlisted, canAddRemoveRule } = frameData;

        expect(documentAllowlisted).toBe(false);

        expect(canAddRemoveRule).toBe(true);
    });
});
