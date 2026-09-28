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

import browser from 'sinon-chrome';
import { type Storage } from 'webextension-polyfill';
import {
    vi,
    describe,
    afterEach,
    it,
    expect,
    beforeEach,
} from 'vitest';

import {
    ASSISTANT_INJECT_OUTPUT,
    BLOCKING_BLOCKED_OUTPUT,
    GPC_SCRIPT_OUTPUT,
    HIDE_DOCUMENT_REFERRER_OUTPUT,
} from '../../../../constants';
import {
    CommonFilterApi,
    DocumentBlockApi,
    SettingsApi,
    type SettingsData,
} from '../../../../Extension/src/background/api';
import { Network } from '../../../../Extension/src/background/api/network';
import { App } from '../../../../Extension/src/background/app';
import {
    defaultAutoDisableFiltersState,
    ExtensionSpecificSettingsOption,
    FiltersOption,
    RootOption,
    SettingOption,
    StealthOption,
} from '../../../../Extension/src/background/schema';
import {
    AutoDisableFiltersStorage,
    autoDisableFiltersStorage,
    filterStateStorage,
    settingsStorage,
} from '../../../../Extension/src/background/storages';
import { ADGUARD_SETTINGS_KEY, AUTO_DISABLE_FILTERS_KEY } from '../../../../Extension/src/common/constants';
import { browserStorage } from '../../../../Extension/src/background/storages/shared-instances';
import { logger } from '../../../../Extension/src/common/logger';
import { defaultSettings } from '../../../../Extension/src/common/settings';
import {
    getDefaultExportFixture,
    getDefaultSettingsConfigFixtureMV2,
    getDefaultSettingsConfigFixtureMV3,
    getExportedSettingsProtocolV1Fixture,
    getExportedSettingsProtocolV2Fixture,
    getImportedSettingsFromV1Fixture,
    mockLocalStorage,
    getSettingsV1,
    getExportedSettingsV2,
    filterNameFixture,
} from '../../../helpers';

vi.mock('../../../../Extension/src/background/engine');
vi.mock('../../../../Extension/src/background/api/ui/icons');
vi.mock('../../../../Extension/src/background/storages/notification');

describe('Settings Api', () => {
    let storage: Storage.StorageArea;

    vi.spyOn(Network.prototype, 'downloadFilterRules').mockImplementation(async () => {
        const content = 'Title: foo\n||example.com^$third-party';

        return {
            filter: content.split('\n'),
            rawFilter: content,
        };
    });

    afterEach(() => {
        storage.clear();
    });

    describe('Reverting settings to default values when: ', () => {
        it('one of fields is omitted', async () => {
            const deepCopy = JSON.parse(JSON.stringify(defaultSettings));
            delete deepCopy[SettingOption.DisableShowAdguardPromoInfo];
            storage = mockLocalStorage({
                [ADGUARD_SETTINGS_KEY]: deepCopy,
            });
            await SettingsApi.init();

            const settings = await storage.get(ADGUARD_SETTINGS_KEY);
            expect(settings).toStrictEqual({ [ADGUARD_SETTINGS_KEY]: defaultSettings });
        });

        it('entire settings object is omitted', async () => {
            storage = mockLocalStorage({
                [ADGUARD_SETTINGS_KEY]: {},
            });
            await SettingsApi.init();

            const settings = await storage.get(ADGUARD_SETTINGS_KEY);
            expect(settings).toStrictEqual({ [ADGUARD_SETTINGS_KEY]: defaultSettings });
        });
    });

    describe('reads and writes setting storage data', () => {
        beforeEach(async () => {
            storage = mockLocalStorage({ [ADGUARD_SETTINGS_KEY]: defaultSettings });
            await SettingsApi.init();
        });

        it('Inits settings cache', () => {
            expect(browser.storage.local.get.calledOnceWith(ADGUARD_SETTINGS_KEY)).toBe(true);
            expect(settingsStorage.getData()).toStrictEqual(defaultSettings);
        });

        it('Gets option', () => {
            expect(SettingsApi.getSetting(SettingOption.AllowlistEnabled)).toBe(true);
        });

        it('Sets option', async () => {
            await SettingsApi.setSetting(SettingOption.AllowlistEnabled, false);
            expect(SettingsApi.getSetting(SettingOption.AllowlistEnabled)).toBe(false);
        });

        it('Gets setting data', async () => {
            const expected: SettingsData = {
                names: SettingOption,
                defaultValues: defaultSettings,
                values: defaultSettings,
            };

            expect(SettingsApi.getData()).toStrictEqual(expected);
        });

        it('Gets tswebextension config', async () => {
            const expected = __IS_MV3__
                ? getDefaultSettingsConfigFixtureMV3(
                    browser.runtime.getURL(`${BLOCKING_BLOCKED_OUTPUT}.html?_locale=en`),
                    `/${ASSISTANT_INJECT_OUTPUT}.js`,
                    `/${GPC_SCRIPT_OUTPUT}.js`,
                    `/${HIDE_DOCUMENT_REFERRER_OUTPUT}.js`,
                    false,
                )
                : getDefaultSettingsConfigFixtureMV2(
                    browser.runtime.getURL(`${BLOCKING_BLOCKED_OUTPUT}.html?_locale=en`),
                    `/${ASSISTANT_INJECT_OUTPUT}.js`,
                    false,
                );

            expect(SettingsApi.getTsWebExtConfiguration()).toStrictEqual(expected);
        });
    });

    describe('imports, exports and resets app data', () => {
        /**
         * Default timeout for tests is 5000 ms, but we need more time for these
         * tests. Because at some point CI became execute tests slower
         * than before.
         */
        const EXTENDED_TIMEOUT_MS = 10000;

        beforeEach(async () => {
            storage = mockLocalStorage();
            await App.init();
        });

        it.skipIf(!__IS_MV3__)('does not reset language tracking in MV3', async () => {
            const reset = vi.spyOn(autoDisableFiltersStorage, 'reset');
            await SettingsApi.reset(true);
            expect(reset).not.toHaveBeenCalled();
            reset.mockRestore();
        }, EXTENDED_TIMEOUT_MS);

        /**
         * Saves auto-disable history which a reset or an import must clear.
         */
        const saveAutoDisableHistory = async (): Promise<void> => {
            autoDisableFiltersStorage.setCache({
                activeDayCounter: 105,
                lastCountedDayUtc: '2026-09-16',
                lastVisitedActiveDayByLanguage: { de: 75 },
                enabledAtActiveDayByFilter: { 1: 70 },
                pendingNotificationFilterIds: [1, 9],
            });
            await autoDisableFiltersStorage.save();
        };

        /**
         * Checks that the auto-disable history starts over.
         */
        const expectClearedAutoDisableHistory = async (): Promise<void> => {
            const state = await autoDisableFiltersStorage.getState();
            expect(state.activeDayCounter).toBe(0);
            expect(state.lastVisitedActiveDayByLanguage).toStrictEqual({});
            expect(state.lastCountedDayUtc).toBeNull();
            expect(state.pendingNotificationFilterIds).toStrictEqual([]);
            expect(state.enabledAtActiveDayByFilter).toStrictEqual({});
        };

        /**
         * Makes writes of the auto-disable history fail while other writes succeed.
         *
         * @returns Spy of the storage write.
         */
        const failAutoDisableHistoryWrites = () => {
            const originalSet = browserStorage.set.bind(browserStorage);
            return vi.spyOn(browserStorage, 'set').mockImplementation(async (key, value) => {
                if (key === AUTO_DISABLE_FILTERS_KEY) {
                    throw new Error('history storage unavailable');
                }
                await originalSet(key, value);
            });
        };

        it.skipIf(__IS_MV3__)('clears auto-disable history on reset', async () => {
            await saveAutoDisableHistory();

            await SettingsApi.reset(true);

            await expectClearedAutoDisableHistory();
        }, EXTENDED_TIMEOUT_MS);

        it.skipIf(__IS_MV3__)('clears auto-disable history on import', async () => {
            await saveAutoDisableHistory();

            expect(await SettingsApi.import(JSON.stringify(getDefaultExportFixture(false)))).toBe(true);

            await expectClearedAutoDisableHistory();
        }, EXTENDED_TIMEOUT_MS);

        it.skipIf(__IS_MV3__)('completes reset and retries the cleared history when its write fails', async () => {
            await saveAutoDisableHistory();
            await SettingsApi.setSetting(SettingOption.AllowlistEnabled, false);
            vi.spyOn(logger, 'error').mockImplementation(() => {});
            const write = failAutoDisableHistoryWrites();
            vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'], shouldAdvanceTime: true });
            try {
                await SettingsApi.reset(true);

                expect(SettingsApi.getSetting(SettingOption.AllowlistEnabled)).toBe(true);
                await expectClearedAutoDisableHistory();
                await expect(new AutoDisableFiltersStorage().getState()).resolves.toMatchObject({
                    activeDayCounter: 105,
                });

                write.mockRestore();
                await vi.advanceTimersByTimeAsync(AutoDisableFiltersStorage.RETRY_DELAY_MS);
                await expect(new AutoDisableFiltersStorage().getState()).resolves.toStrictEqual(
                    defaultAutoDisableFiltersState,
                );
            } finally {
                write.mockRestore();
                await autoDisableFiltersStorage.reset();
                vi.useRealTimers();
            }
        }, EXTENDED_TIMEOUT_MS);

        it.skipIf(__IS_MV3__)('completes import and retries the cleared history when its write fails', async () => {
            await saveAutoDisableHistory();
            await SettingsApi.setSetting(SettingOption.AllowlistEnabled, false);
            vi.spyOn(logger, 'error').mockImplementation(() => {});
            const write = failAutoDisableHistoryWrites();
            vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'], shouldAdvanceTime: true });
            try {
                const config = getDefaultExportFixture(false);
                config[RootOption.Filters][FiltersOption.EnabledFilters] = [16];

                expect(await SettingsApi.import(JSON.stringify(config))).toBe(true);

                expect(filterStateStorage.get(16)?.enabled).toBe(true);
                expect(SettingsApi.getSetting(SettingOption.AllowlistEnabled)).toBe(true);
                await expectClearedAutoDisableHistory();
                await expect(new AutoDisableFiltersStorage().getState()).resolves.toMatchObject({
                    activeDayCounter: 105,
                });

                write.mockRestore();
                await vi.advanceTimersByTimeAsync(AutoDisableFiltersStorage.RETRY_DELAY_MS);
                await expect(new AutoDisableFiltersStorage().getState()).resolves.toStrictEqual(
                    defaultAutoDisableFiltersState,
                );
            } finally {
                write.mockRestore();
                await autoDisableFiltersStorage.reset();
                vi.useRealTimers();
            }
        }, EXTENDED_TIMEOUT_MS);

        it('Import settings', async () => {
            const userConfig = getDefaultExportFixture(__IS_MV3__);

            // eslint-disable-next-line max-len
            userConfig[RootOption.ExtensionSpecificSettings][ExtensionSpecificSettingsOption.UseOptimizedFilters] = true;

            const importResult = await SettingsApi.import(JSON.stringify(userConfig));

            expect(importResult).toBeTruthy();
            expect(SettingsApi.getSetting(SettingOption.UseOptimizedFilters)).toBe(true);
        }, EXTENDED_TIMEOUT_MS);

        it('Export settings', async () => {
            const exportedSettings = await SettingsApi.export();

            expect(JSON.parse(exportedSettings)).toStrictEqual(getDefaultExportFixture(__IS_MV3__));
        }, EXTENDED_TIMEOUT_MS);

        it('Imports exported settings for protocol v1', async () => {
            const userConfig = getExportedSettingsProtocolV1Fixture();
            let importResult = await SettingsApi.import(JSON.stringify(userConfig));

            expect(importResult).toBeTruthy();

            const exportedSettings = await SettingsApi.export();
            importResult = await SettingsApi.import(exportedSettings);

            expect(importResult).toBeTruthy();

            const importedSettingsString = await SettingsApi.export();

            const importedSettings = getImportedSettingsFromV1Fixture();

            expect(JSON.parse(importedSettingsString)).toStrictEqual(importedSettings);
        }, EXTENDED_TIMEOUT_MS);

        it('Imports exported settings for protocol v2', async () => {
            const userConfig = getExportedSettingsProtocolV2Fixture();
            let importResult = await SettingsApi.import(JSON.stringify(userConfig));

            expect(importResult).toBeTruthy();

            const exportedSettings = await SettingsApi.export();
            importResult = await SettingsApi.import(exportedSettings);

            expect(importResult).toBeTruthy();

            const importedSettingsString = await SettingsApi.export();

            // Fill up optional fields
            userConfig[RootOption.Filters][FiltersOption.CustomFilters][1]!.title = filterNameFixture;

            expect(JSON.parse(importedSettingsString)).toStrictEqual(userConfig);
        }, EXTENDED_TIMEOUT_MS);

        it('Imports settings from 4.1.X version', async () => {
            const settings = getSettingsV1();
            let importResult = await SettingsApi.import(JSON.stringify(settings));

            expect(importResult).toBeTruthy();

            const exportedSettings = await SettingsApi.export();
            importResult = await SettingsApi.import(exportedSettings);

            expect(importResult).toBeTruthy();

            const exportedSettingsString = await SettingsApi.export();
            const EXPORTED_SETTINGS_V_2_0 = getExportedSettingsV2();
            expect(JSON.parse(exportedSettingsString)).toStrictEqual(EXPORTED_SETTINGS_V_2_0);
        }, EXTENDED_TIMEOUT_MS);

        it('Imports optional AllowAnonymizedUsageData when present', async () => {
            await SettingsApi.setSetting(SettingOption.AllowAnonymizedUsageData, false);
            expect(SettingsApi.getSetting(SettingOption.AllowAnonymizedUsageData)).toBe(false);

            const userConfig = getDefaultExportFixture(__IS_MV3__);
            // eslint-disable-next-line max-len
            userConfig[RootOption.ExtensionSpecificSettings][ExtensionSpecificSettingsOption.AllowAnonymizedUsageData] = true;

            const importResult = await SettingsApi.import(JSON.stringify(userConfig));

            expect(importResult).toBeTruthy();
            expect(SettingsApi.getSetting(SettingOption.AllowAnonymizedUsageData)).toBe(true);
        }, EXTENDED_TIMEOUT_MS);

        it('Sets AllowAnonymizedUsageData to default when not present in import', async () => {
            await SettingsApi.setSetting(SettingOption.AllowAnonymizedUsageData, true);
            expect(SettingsApi.getSetting(SettingOption.AllowAnonymizedUsageData)).toBe(true);

            const userConfig = getDefaultExportFixture(__IS_MV3__);
            // eslint-disable-next-line max-len
            delete userConfig[RootOption.ExtensionSpecificSettings][ExtensionSpecificSettingsOption.AllowAnonymizedUsageData];

            const importResult = await SettingsApi.import(JSON.stringify(userConfig));

            expect(importResult).toBeTruthy();
            expect(SettingsApi.getSetting(SettingOption.AllowAnonymizedUsageData)).toBe(false);
        }, EXTENDED_TIMEOUT_MS);

        it('Reset default settings', async () => {
            await SettingsApi.setSetting(SettingOption.AllowlistEnabled, false);
            expect(SettingsApi.getSetting(SettingOption.AllowlistEnabled)).toBe(false);

            // check trusted domains list as well since it is temporary and not stored as a part of settings
            await DocumentBlockApi.setTrustedDomain('https://example.com/test');
            expect(await DocumentBlockApi.getTrustedDomains()).toStrictEqual(['example.com']);

            await SettingsApi.reset(true);

            expect(SettingsApi.getSetting(SettingOption.AllowlistEnabled)).toBe(true);
            expect(await DocumentBlockApi.getTrustedDomains()).toStrictEqual([]);
        }, EXTENDED_TIMEOUT_MS);

        it('Clears the disabled-as-unused statuses on reset', async () => {
            const [filterId] = filterStateStorage.getAllFilters();
            expect(filterId).toBeDefined();

            filterStateStorage.disableFiltersAsUnused([filterId!]);
            expect(filterStateStorage.get(filterId!)?.disabledAsUnused).toBe(true);

            await SettingsApi.reset(true);

            expect(filterStateStorage.get(filterId!)?.disabledAsUnused).toBe(false);
        }, EXTENDED_TIMEOUT_MS);

        it('Clears the disabled-as-unused statuses on import', async () => {
            const [filterId] = filterStateStorage.getAllFilters();
            expect(filterId).toBeDefined();

            filterStateStorage.disableFiltersAsUnused([filterId!]);
            expect(filterStateStorage.get(filterId!)?.disabledAsUnused).toBe(true);

            const importResult = await SettingsApi.import(
                JSON.stringify(getDefaultExportFixture(__IS_MV3__)),
            );

            expect(importResult).toBeTruthy();
            expect(filterStateStorage.get(filterId!)?.disabledAsUnused).toBe(false);
        }, EXTENDED_TIMEOUT_MS);

        it('should not enable default filters on import', async () => {
            const initDefaultFiltersSpy = vi.spyOn(CommonFilterApi, 'initDefaultFilters');

            const userConfig = getExportedSettingsProtocolV2Fixture();

            // Disable all filters in settings
            userConfig[RootOption.Filters][FiltersOption.EnabledFilters] = [];
            userConfig[RootOption.Filters][FiltersOption.EnabledGroups] = [];
            userConfig[RootOption.Filters][FiltersOption.CustomFilters] = [];
            if (userConfig[RootOption.Stealth]) {
                userConfig[RootOption.Stealth][StealthOption.BlockKnownTrackers] = false;
                userConfig[RootOption.Stealth][StealthOption.StripTrackingParams] = false;
            }

            const importResult = await SettingsApi.import(JSON.stringify(userConfig));

            // Should export successfully
            expect(importResult).toBeTruthy();

            // Should not initialize default filters
            expect(initDefaultFiltersSpy).not.toHaveBeenCalled();

            // Exported settings should be the same
            const exportedSettings = await SettingsApi.export();
            expect(JSON.parse(exportedSettings)).toStrictEqual(userConfig);
        }, EXTENDED_TIMEOUT_MS);
    });
});
