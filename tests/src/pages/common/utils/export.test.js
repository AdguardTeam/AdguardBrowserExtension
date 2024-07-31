import { ExportTypes, getExportedSettingsFilename } from '../../../../../Extension/src/pages/common/utils/export';

const SETTINGS_TYPE = ExportTypes.SETTINGS;

describe('export', () => {
    it('exports settings file name correctly', () => {
        const dateNowSpy = jest.spyOn(Date, 'now')
            // date is hardcoded to avoid timezone offset
            .mockImplementation(() => new Date(2020, 0, 2, 1, 2, 3).getTime());

        const version = '1.0.0';
        let name = getExportedSettingsFilename(SETTINGS_TYPE, version);

        dateNowSpy.mockRestore();

        // should start with 'adg_ext_'
        expect(name.startsWith('adg_ext_')).toBeTruthy();

        // remove 'adg_ext_' prefix
        name = name.slice('adg_ext_'.length);

        // should contain category
        expect(name.startsWith('settings_')).toBeTruthy();

        // remove category prefix
        name = name.slice('settings_'.length);

        // should contain version
        expect(name.startsWith(`${version}_`)).toBeTruthy();

        // remove version prefix
        name = name.slice(`${version}_`.length);

        // should contain date
        expect(name.startsWith('020120-010203')).toBeTruthy();
        name = name.slice('020120-010203'.length);

        // should contain extension
        expect(name.endsWith('.json')).toBeTruthy();
    });
});
