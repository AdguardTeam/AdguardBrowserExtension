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

import { type Storage } from 'webextension-polyfill';
import {
    afterEach,
    beforeAll,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

// TODO should be written separate test, because there is different api in mv3 and mv2 for tabs context
//  after that remove exclude from the ./tsconfig.mv3.json
import { RULE_INDEX_NONE } from '@adguard/tsurlfilter';
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
import { engine } from '../../../../../Extension/src/background/engine';
import { logger } from '../../../../../Extension/src/common/logger';
import { AntiBannerFiltersId } from '../../../../../Extension/src/common/constants';

vi.mock('../../../../../Extension/src/background/api/page-stats', () => ({
    ...(vi.importActual('../../../../../Extension/src/background/api/page-stats')),
    PageStatsApi,
}));

vi.mock('../../../../../Extension/src/background/api/settings', async () => ({
    ...(await vi.importActual('../../../../../Extension/src/background/api/settings')),
    SettingsApi,
}));

vi.spyOn(PageStatsApi, 'getTotalBlocked').mockImplementation(() => 0);
vi.spyOn(SettingsApi, 'getSetting').mockImplementation(() => false);

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
        tabContext.mainFrameRule = new NetworkRule(rule, AntiBannerFiltersId.UserFilterId);
        tabContext.blockedRequestCount = 0;

        // TODO (Slava): fix later
        // @ts-ignore
        const frameData = FramesApi.getMainFrameData(tabContext);
        const { documentAllowlisted, canAddRemoveRule } = frameData;

        expect(documentAllowlisted).toBe(true);

        expect(canAddRemoveRule).toBe(true);
    });

    describe('getMainFrameData resolves rule text', () => {
        const url = 'https://example.org/';

        /**
         * Builds a tab context with the given main frame rule for testing.
         *
         * @param mainFrameRule Document-level rule applied to the main frame.
         *
         * @returns Tab context ready to be passed to {@link FramesApi.getMainFrameData}.
         */
        const createTabContext = (mainFrameRule: NetworkRule): TabContext => {
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
            tabContext.mainFrameRule = mainFrameRule;
            tabContext.blockedRequestCount = 0;
            return tabContext;
        };

        let retrieveRuleTextSpy: ReturnType<typeof vi.spyOn>;
        let loggerErrorSpy: ReturnType<typeof vi.spyOn>;

        beforeEach(() => {
            retrieveRuleTextSpy = vi.spyOn(engine.api, 'retrieveRuleText');
            loggerErrorSpy = vi.spyOn(logger, 'error').mockImplementation(() => {});
        });

        afterEach(() => {
            retrieveRuleTextSpy.mockRestore();
            loggerErrorSpy.mockRestore();
        });

        it('uses inline text for synthetic rules without querying the engine', () => {
            // Synthetic document-level allowlist rule (e.g. inverted allowlist mode):
            // it has no source index, so its text must come from getText().
            const ruleText = '@@$document,important,to=example.org';
            const mainFrameRule = new NetworkRule(ruleText, AntiBannerFiltersId.AllowlistFilterId);

            expect(mainFrameRule.getIndex()).toBe(RULE_INDEX_NONE);

            // TODO (Slava): fix later
            // @ts-ignore
            const { frameRule } = FramesApi.getMainFrameData(createTabContext(mainFrameRule));

            expect(frameRule?.ruleText).toBe(ruleText);
            expect(retrieveRuleTextSpy).not.toHaveBeenCalled();
            expect(loggerErrorSpy).not.toHaveBeenCalled();
        });

        it('retrieves text from the engine for indexed rules', () => {
            const ruleIndex = 42;
            const resolvedText = '@@||example.org$document';
            retrieveRuleTextSpy.mockReturnValue(resolvedText);

            const mainFrameRule = new NetworkRule(
                resolvedText,
                AntiBannerFiltersId.AllowlistFilterId,
                ruleIndex,
            );

            // TODO (Slava): fix later
            // @ts-ignore
            const { frameRule } = FramesApi.getMainFrameData(createTabContext(mainFrameRule));

            expect(retrieveRuleTextSpy).toHaveBeenCalledWith(AntiBannerFiltersId.AllowlistFilterId, ruleIndex);
            expect(frameRule?.ruleText).toBe(resolvedText);
            expect(loggerErrorSpy).not.toHaveBeenCalled();
        });

        it('logs an error and falls back to a placeholder when an indexed rule cannot be resolved', () => {
            const ruleIndex = 42;
            retrieveRuleTextSpy.mockReturnValue(null);

            const mainFrameRule = new NetworkRule(
                '@@||example.org$document',
                AntiBannerFiltersId.AllowlistFilterId,
                ruleIndex,
            );

            // TODO (Slava): fix later
            // @ts-ignore
            const { frameRule } = FramesApi.getMainFrameData(createTabContext(mainFrameRule));

            expect(frameRule?.ruleText).toBe(
                `<cannot retrieve rule text: ${AntiBannerFiltersId.AllowlistFilterId}:${ruleIndex}>`,
            );
            expect(loggerErrorSpy).toHaveBeenCalledTimes(1);
        });
    });
});
