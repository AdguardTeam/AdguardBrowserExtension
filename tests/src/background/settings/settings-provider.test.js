import _ from 'lodash';

import { settingsProvider } from '../../../../Extension/src/background/settings/settings-provider';
import { adgSettings } from './adg-settings';
import { APPEARANCE_THEMES } from '../../../../Extension/src/pages/constants';
import { settings } from '../../../../Extension/src/background/settings/user-settings';

jest.mock('../../../../Extension/src/common/log');

jest.mock('../../../../Extension/src/background/application', () => {
    return {
        __esModule: true,
        application: {
            getEnabledFilters: () => [
                { filterId: 1 },
                {
                    filterId: 100,
                    customUrl: 'https://example.org/custom_url',
                },
            ],
            addAndEnableFilters: async () => {},
            removeFilter: () => {},
            disableFilters: () => {},
            enableGroup: () => {},
            disableGroup: () => {},
        },
    };
});

jest.mock('../../../../Extension/src/background/filter/filters/subscription', () => {
    const groupsMap = {
        1: { groupId: 1, groupName: 'Ad Blocking', displayNumber: 1 },
        2: { groupId: 2, groupName: 'Privacy', displayNumber: 2 },
        3: { groupId: 3, groupName: 'Social Widgets', displayNumber: 3 },
        4: { groupId: 4, groupName: 'Annoyances', displayNumber: 4 },
        5: { groupId: 5, groupName: 'Security', displayNumber: 5 },
        6: { groupId: 6, groupName: 'Other', displayNumber: 6 },
        7: { groupId: 7, groupName: 'Language-specific', displayNumber: 7 },
        0: { groupId: 0, groupName: 'Custom', displayNumber: 99 },
    };

    const filtersMap = {
        1: { filterId: 1, groupId: 1 },
        2: { filterId: 2, groupId: 2 },
        3: { filterId: 3, groupId: 2 },
        4: { filterId: 4, groupId: 3 },
        5: { filterId: 5, groupId: 5 },
        10: { filterId: 10, groupId: 1 },
        6: { filterId: 1001, groupId: 0, customUrl: 'https://example.org/custom_url' },
    };

    return {
        __esModule: true,
        subscriptions: {
            getCustomFilters: () => Object.values(filtersMap).filter(f => f.customUrl),
            getFilter: filterId => filtersMap[filterId],
            getGroups: () => Object.keys(groupsMap).map(key => groupsMap[key]),
            getGroup: groupId => groupsMap[groupId],
        },
    };
});

jest.mock('../../../../Extension/src/background/filter/userrules', () => {
    return {
        __esModule: true,
        userrules: {
            getUserRulesText: async () => '',
            updateUserRulesText: () => {},
        },
    };
});

describe('settingsProvider', () => {
    it('exports settings in json', async () => {
        const json = await settingsProvider.loadSettingsBackup();

        const settings = JSON.parse(json);

        expect(settings['protocol-version']).toEqual('1.0');
        expect(settings['extension-specific-settings']).toBeTruthy();
        expect(settings['general-settings']).toBeTruthy();
        expect(settings['filters']).toBeTruthy();
        expect(settings['stealth']).toBeTruthy();
    });

    it('updates settings from json', async () => {
        const success = await settingsProvider.applySettingsBackup(adgSettings);
        expect(success).toBeTruthy();
    });

    it('handles settings without defined appearance theme', async () => {
        const obj = JSON.parse(adgSettings);
        delete obj['general-settings']['appearance-theme'];
        const success = await settingsProvider.applySettingsBackup(JSON.stringify(obj));
        expect(success).toBeTruthy();
        expect(settings.getAppearanceTheme()).toBe(APPEARANCE_THEMES.SYSTEM);
    });

    it('handles settings with defined appearance theme', async () => {
        const obj = JSON.parse(adgSettings);
        const MODE_PATH = 'general-settings.appearance-theme';

        // Set light theme
        _.set(obj, MODE_PATH, APPEARANCE_THEMES.LIGHT);
        let success = await settingsProvider.applySettingsBackup(JSON.stringify(obj));
        expect(success).toBeTruthy();
        expect(settings.getAppearanceTheme()).toBe(APPEARANCE_THEMES.LIGHT);

        // Set dark theme
        _.set(obj, MODE_PATH, APPEARANCE_THEMES.DARK);
        success = await settingsProvider.applySettingsBackup(JSON.stringify(obj));
        expect(success).toBeTruthy();
        expect(settings.getAppearanceTheme()).toBe(APPEARANCE_THEMES.DARK);

        // Set wrong theme
        _.set(obj, MODE_PATH, 'black');
        success = await settingsProvider.applySettingsBackup(JSON.stringify(obj));
        expect(success).toBeTruthy();
        expect(settings.getAppearanceTheme()).toBe(APPEARANCE_THEMES.SYSTEM);
    });

    it('handles settings without stealth section', async () => {
        const obj = JSON.parse(adgSettings);
        delete obj['stealth'];

        const success = await settingsProvider.applySettingsBackup(JSON.stringify(obj));
        expect(success).toBeTruthy();
        // default value is true
        expect(settings.getDisableStealthMode()).toBeTruthy();
    });

    it('handles settings with whitelist section', async () => {
        const obj = JSON.parse(adgSettings);
        const ALLOWLIST_ENABLED_PATH = 'filters.whitelist.enabled';

        _.set(obj, ALLOWLIST_ENABLED_PATH, true);
        await settingsProvider.applySettingsBackup(JSON.stringify(obj));
        expect(settings.getAllowlistEnabledState()).toBeTruthy();

        _.set(obj, ALLOWLIST_ENABLED_PATH, false);
        await settingsProvider.applySettingsBackup(JSON.stringify(obj));
        expect(settings.getAllowlistEnabledState()).toBeFalsy();

        // by default should be true
        _.unset(obj, ALLOWLIST_ENABLED_PATH);
        await settingsProvider.applySettingsBackup(JSON.stringify(obj));
        expect(settings.getAllowlistEnabledState()).toBeTruthy();
    });
});
