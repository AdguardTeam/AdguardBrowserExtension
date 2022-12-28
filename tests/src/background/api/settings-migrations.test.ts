import { SettingsMigrations } from '../../../../Extension/src/background/api/settings/migrations';
import { SETTINGS_V_1_0, SETTINGS_V_2_0 } from '../../../helpers';

describe('Settings Migrations Api', () => {
    describe('apply migration before import outdated settings', () => {
        it('Apply migration from version 1.0 to 2.0', async () => {
            const updatedSettings = await SettingsMigrations.migrateSettings('1.0', SETTINGS_V_1_0);

            expect(updatedSettings).toStrictEqual(SETTINGS_V_2_0);
        });
    });
});
