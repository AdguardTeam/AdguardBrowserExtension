/**
 * Copyright (c) 2015-2025 Adguard Software Ltd.
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
    describe,
    it,
    vi,
    expect,
} from 'vitest';

import { ExportTypes, getExportedSettingsFilename } from '../../../../../Extension/src/pages/common/utils/export';

const SETTINGS_TYPE = ExportTypes.Settings;

describe('export', () => {
    it('exports settings file name correctly', () => {
        const dateNowSpy = vi.spyOn(Date, 'now')
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
