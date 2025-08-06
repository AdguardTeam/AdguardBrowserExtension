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
    DocumentBlockApi,
    SettingsApi,
    type SettingsData,
} from '../../../../Extension/src/background/api';
import { Network } from '../../../../Extension/src/background/api/network';
import { App } from '../../../../Extension/src/background/app';
import {
    ExtensionSpecificSettingsOption,
    FiltersOption,
    RootOption,
    SettingOption,
} from '../../../../Extension/src/background/schema';
import { settingsStorage } from '../../../../Extension/src/background/storages';
import { ADGUARD_SETTINGS_KEY } from '../../../../Extension/src/common/constants';
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

            expect(SettingsApi.getTsWebExtConfiguration(__IS_MV3__)).toStrictEqual(expected);
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
            expect(exportedSettingsString).toStrictEqual(JSON.stringify(EXPORTED_SETTINGS_V_2_0));
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
    });
});
