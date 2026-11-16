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
import browser, { type Tabs } from 'webextension-polyfill';

import { CommonFilterApi } from '../../../../Extension/src/background/api/filters/common';
import { toasts } from '../../../../Extension/src/background/api/ui';
import { engine } from '../../../../Extension/src/background/engine';
import { FiltersApi } from '../../../../Extension/src/background/api/filters/main';
import { Categories } from '../../../../Extension/src/background/api/filters/categories';
import { AntibannerGroupsId } from '../../../../Extension/src/common/constants';
import { logger } from '../../../../Extension/src/common/logger';
import { defaultSettings } from '../../../../Extension/src/common/settings';
import { SettingOption } from '../../../../Extension/src/background/schema';
import {
    filterStateStorage,
    groupStateStorage,
    metadataStorage,
    settingsStorage,
} from '../../../../Extension/src/background/storages';
import { localeDetect, UNDETERMINED_LANGUAGE } from '../../../../Extension/src/background/services/locale-detect-mv2';

const mocks = vi.hoisted(() => ({
    recordVisit: vi.fn(() => Promise.resolve()),
}));

vi.mock('../../../../Extension/src/background/services/auto-disable-filters-mv2', () => ({
    AutoDisableFiltersService: {
        recordVisit: mocks.recordVisit,
    },
}));

/**
 * Stub of the browser language detection API.
 */
const tabsDetectLanguage = browser.tabs.detectLanguage as unknown as {
    callsFake: (implementation: () => Promise<string>) => void;
};

/**
 * Creates a processed http page which passes the detection gates.
 *
 * @returns Tab details of a completed http page.
 */
const createHttpTab = (): Tabs.Tab => ({
    id: 1,
    url: 'https://example.com/',
    status: 'complete',
} as Tabs.Tab);

let onTabUpdated: Parameters<typeof browser.tabs.onUpdated.addListener>[0];

/**
 * Delivers a page update through the registered browser event listener.
 *
 * @param tab Updated tab.
 *
 * @returns Promise resolved when the page update is processed.
 */
const updateTab = (tab: Tabs.Tab): Promise<void> => Promise.resolve(onTabUpdated(tab.id ?? 1, {}, tab));

describe.skipIf(__IS_MV3__)('LocaleDetect unused filters tracking', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        settingsStorage.setCache({ ...defaultSettings });
        tabsDetectLanguage.callsFake(async () => 'tr');
        vi.spyOn(metadataStorage, 'getFilterIdsForLanguage').mockReturnValue([]);
        vi.spyOn(browser.tabs.onUpdated, 'addListener').mockImplementation((listener) => {
            onTabUpdated = listener;
        });
        localeDetect.init();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('allows the next page to retry auto-enabling after a failure', async () => {
        vi.spyOn(engine, 'debounceUpdate').mockReturnValue(undefined);
        vi.spyOn(CommonFilterApi, 'getFilterMetadata').mockReturnValue(undefined);
        vi.spyOn(toasts, 'showFiltersEnabledAlertMessage').mockResolvedValue(undefined);
        groupStateStorage.setCache({});
        tabsDetectLanguage.callsFake(async () => 'fr');
        vi.spyOn(metadataStorage, 'getFilterIdsForLanguage').mockReturnValue([16]);
        vi.spyOn(FiltersApi, 'isFilterEnabled').mockReturnValue(false);
        vi.spyOn(Categories, 'getFiltersIdsByGroupId').mockReturnValue([16]);
        vi.spyOn(filterStateStorage, 'clearUnused').mockReturnValue(undefined);
        const enable = vi.spyOn(FiltersApi, 'loadAndEnableFilters')
            .mockRejectedValueOnce(new Error('allowance write failed'))
            .mockResolvedValue(undefined);
        const error = vi.spyOn(logger, 'error').mockImplementation(() => {});

        for (let i = 0; i < 3; i += 1) {
            await expect(updateTab(createHttpTab())).resolves.toBeUndefined();
        }
        expect(enable).toHaveBeenCalledTimes(1);
        expect(error).toHaveBeenCalled();

        await updateTab(createHttpTab());
        expect(enable).toHaveBeenCalledTimes(2);
        expect(error).toHaveBeenCalledTimes(1);
    });

    it('clears unused statuses when auto-enabling a disabled language group', async () => {
        vi.spyOn(engine, 'debounceUpdate').mockReturnValue(undefined);
        vi.spyOn(CommonFilterApi, 'getFilterMetadata').mockReturnValue(undefined);
        vi.spyOn(toasts, 'showFiltersEnabledAlertMessage').mockResolvedValue(undefined);
        groupStateStorage.setCache({
            [AntibannerGroupsId.LanguageFiltersGroupId]: { enabled: false, touched: true },
        });
        tabsDetectLanguage.callsFake(async () => 'fr');
        vi.spyOn(metadataStorage, 'getFilterIdsForLanguage').mockReturnValue([16]);
        vi.spyOn(FiltersApi, 'isFilterEnabled').mockReturnValue(false);
        vi.spyOn(FiltersApi, 'loadAndEnableFilters').mockResolvedValue(undefined);
        vi.spyOn(Categories, 'getFiltersIdsByGroupId').mockReturnValue([16, 17]);
        const clearUnused = vi.spyOn(filterStateStorage, 'clearUnused').mockReturnValue(undefined);

        for (let i = 0; i < 3; i += 1) {
            await updateTab(createHttpTab());
        }

        expect(groupStateStorage.get(AntibannerGroupsId.LanguageFiltersGroupId)?.enabled).toBe(true);
        expect(clearUnused).toHaveBeenCalledExactlyOnceWith([16, 17]);
    });

    it('keeps unused statuses when the language group is already enabled', async () => {
        vi.spyOn(engine, 'debounceUpdate').mockReturnValue(undefined);
        vi.spyOn(CommonFilterApi, 'getFilterMetadata').mockReturnValue(undefined);
        vi.spyOn(toasts, 'showFiltersEnabledAlertMessage').mockResolvedValue(undefined);
        groupStateStorage.setCache({
            [AntibannerGroupsId.LanguageFiltersGroupId]: { enabled: true, touched: true },
        });
        tabsDetectLanguage.callsFake(async () => 'fr');
        vi.spyOn(metadataStorage, 'getFilterIdsForLanguage').mockReturnValue([16]);
        vi.spyOn(FiltersApi, 'isFilterEnabled').mockReturnValue(false);
        const enable = vi.spyOn(FiltersApi, 'loadAndEnableFilters').mockResolvedValue(undefined);
        const clearUnused = vi.spyOn(filterStateStorage, 'clearUnused').mockReturnValue(undefined);

        for (let i = 0; i < 3; i += 1) {
            await updateTab(createHttpTab());
        }

        expect(enable).toHaveBeenCalled();
        expect(clearUnused).not.toHaveBeenCalled();
    });

    it('records a processed page once with its detected language', async () => {
        await updateTab(createHttpTab());

        expect(mocks.recordVisit).toHaveBeenCalledExactlyOnceWith('tr');
    });

    it('counts activity without recording an undetermined language', async () => {
        tabsDetectLanguage.callsFake(async () => UNDETERMINED_LANGUAGE);

        await updateTab(createHttpTab());

        expect(mocks.recordVisit).toHaveBeenCalledExactlyOnceWith(undefined);
    });

    it('counts activity without recording an empty language', async () => {
        tabsDetectLanguage.callsFake(async () => '');

        await updateTab(createHttpTab());

        expect(mocks.recordVisit).toHaveBeenCalledExactlyOnceWith(undefined);
    });

    it('counts activity when the browser language detection fails', async () => {
        tabsDetectLanguage.callsFake(async () => {
            throw new Error('Language detection failed');
        });

        await updateTab(createHttpTab());

        expect(mocks.recordVisit).toHaveBeenCalledExactlyOnceWith(undefined);
    });

    it('records the language of a known domain zone when detection gives no tab', async () => {
        await updateTab({ ...createHttpTab(), id: undefined, url: 'https://example.de/' });

        expect(mocks.recordVisit).toHaveBeenCalledExactlyOnceWith('de');
    });

    it('records no language for an unknown domain zone', async () => {
        await updateTab({ ...createHttpTab(), id: undefined, url: 'https://example.test/' });

        expect(mocks.recordVisit).toHaveBeenCalledExactlyOnceWith(undefined);
    });

    it('records no language for a domain zone named like an object property', async () => {
        await updateTab({ ...createHttpTab(), id: undefined, url: 'https://example.constructor/' });

        expect(mocks.recordVisit).toHaveBeenCalledExactlyOnceWith(undefined);
    });

    it('records no language for a domain zone named like the prototype property', async () => {
        await updateTab({ ...createHttpTab(), id: undefined, url: 'https://example.__proto__/' });

        expect(mocks.recordVisit).toHaveBeenCalledExactlyOnceWith(undefined);
    });

    it('records no language for a second-level domain without a subdomain', async () => {
        await updateTab({ ...createHttpTab(), id: undefined, url: 'https://a.de/' });

        expect(mocks.recordVisit).toHaveBeenCalledExactlyOnceWith(undefined);
    });

    it('does not track activity when language autodetect is disabled', async () => {
        settingsStorage.set(SettingOption.DisableDetectFilters, true);

        await updateTab(createHttpTab());

        expect(mocks.recordVisit).not.toHaveBeenCalled();
    });

    it('does not track activity when filtering is paused', async () => {
        settingsStorage.set(SettingOption.DisableFiltering, true);

        await updateTab(createHttpTab());

        expect(mocks.recordVisit).not.toHaveBeenCalled();
    });

    it('does not track activity for non-http pages', async () => {
        await updateTab({ ...createHttpTab(), url: 'ftp://example.com/file.txt' });

        expect(mocks.recordVisit).not.toHaveBeenCalled();
    });

    it('does not track activity for pages without a url', async () => {
        await updateTab({ ...createHttpTab(), url: undefined });

        expect(mocks.recordVisit).not.toHaveBeenCalled();
    });

    it('does not track pages which are still loading', async () => {
        await updateTab({ ...createHttpTab(), status: 'loading' });

        expect(mocks.recordVisit).not.toHaveBeenCalled();
    });
});
