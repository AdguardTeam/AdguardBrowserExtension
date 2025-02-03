import {
    describe,
    it,
    expect,
} from 'vitest';

import { SettingsMigrations } from '../../../../Extension/src/background/api/settings/migrations';
import { getSettingsV1, getSettingsV2 } from '../../../helpers';

describe('Settings Migrations Api', () => {
    describe('apply migration before import outdated settings', () => {
        it('Apply migration from version 1.0 to 2.0', async () => {
            const SETTINGS_V_1_0 = getSettingsV1();
            const SETTINGS_V_2_0 = getSettingsV2();
            const updatedSettings = await SettingsMigrations.migrateSettings('1.0', SETTINGS_V_1_0);

            expect(updatedSettings).toStrictEqual(SETTINGS_V_2_0);
        });
    });
});
