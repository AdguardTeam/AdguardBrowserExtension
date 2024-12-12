import { type Storage } from 'webextension-polyfill';

import { NetworkRuleParser } from '@adguard/agtree/parser';
// TODO should be written separate test, because there is different api in mv3 and mv2 for tabs context
//  after that remove exclude from the ./tsconfig.with_types_mv3.json
import {
    TabContext,
    NetworkRule,
    type TabInfo,
    documentApi,
} from '@adguard/tswebextension';

import {
    PageStatsApi,
    mockLocalStorage,
    SettingsApi,
} from '../../../../helpers';
import { appContext, AppContextKey } from '../../../../../Extension/src/background/storages/app';
import { FramesApi } from '../../../../../Extension/src/background/api/ui/frames';
import { AntiBannerFiltersId } from '../../../../../Extension/src/common/constants';

jest.mock('../../../../../Extension/src/background/api/page-stats', () => ({
    ...(jest.requireActual('../../../../../Extension/src/background/api/page-stats')),
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
        const rule = '@@||testcases.agrd.dev$document';
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
        const tabContext = new TabContext(info, documentApi);
        tabContext.mainFrameRule = new NetworkRule(NetworkRuleParser.parse(rule), AntiBannerFiltersId.UserFilterId);
        tabContext.blockedRequestCount = 0;

        const frameData = FramesApi.getMainFrameData(tabContext);
        const { documentAllowlisted, canAddRemoveRule } = frameData;

        expect(documentAllowlisted).toBe(true);

        expect(canAddRemoveRule).toBe(true);
    });
});
