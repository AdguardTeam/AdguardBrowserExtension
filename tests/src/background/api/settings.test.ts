import browser from 'sinon-chrome';
import { Storage } from 'webextension-polyfill';
import { ASSISTANT_INJECT_OUTPUT, DOCUMENT_BLOCK_OUTPUT } from '../../../../constants';
import { SettingsApi, SettingsData } from '../../../../Extension/src/background/api';
import { App } from '../../../../Extension/src/background/app';
import { SettingOption } from '../../../../Extension/src/background/schema';
import { settingsStorage } from '../../../../Extension/src/background/storages';
import { ADGUARD_SETTINGS_KEY } from '../../../../Extension/src/common/constants';
import { defaultSettings } from '../../../../Extension/src/common/settings';
import {
    getDefaultExportFixture,
    getDefaultSettingsConfigFixture,
    mockLocalStorage,
} from '../../../helpers';

describe('Settings Api', () => {
    let storage: Storage.StorageArea;

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
            const expected = getDefaultSettingsConfigFixture(
                browser.runtime.getURL(`${DOCUMENT_BLOCK_OUTPUT}.html`),
                `/${ASSISTANT_INJECT_OUTPUT}.js`,
            );
            expect(SettingsApi.getTsWebExtConfiguration()).toStrictEqual(expected);
        });
    });

    describe('imports, exports and resets app data', () => {
        beforeEach(async () => {
            storage = mockLocalStorage();
            await App.init();
        });

        it('Import settings', async () => {
            const userConfig = getDefaultExportFixture();

            userConfig['extension-specific-settings']['use-optimized-filters'] = true;

            await SettingsApi.import(JSON.stringify(userConfig));

            expect(SettingsApi.getSetting(SettingOption.UseOptimizedFilters)).toBe(true);
        });

        it('Export settings', async () => {
            const exportedSettings = await SettingsApi.export();

            expect(exportedSettings).toBe(JSON.stringify(getDefaultExportFixture()));
        });

        it('Reset default settings', async () => {
            await SettingsApi.setSetting(SettingOption.AllowlistEnabled, false);

            await SettingsApi.reset();

            expect(SettingsApi.getSetting(SettingOption.AllowlistEnabled)).toBe(true);
        });
    });
});
