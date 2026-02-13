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
    expect,
} from 'vitest';

import { UrlUtils } from '../../../../Extension/src/background/utils';

describe('trimFilterFilepath', () => {
    it('should return unmodified path for urls', () => {
        const path = 'https://filters.adtidy.org/mac_v2/filters/15.txt';
        expect(UrlUtils.trimFilterFilepath(path)).toEqual(path);
    });

    it('should return unmodified path if no slash or backslash found', () => {
        const path = 'filter.txt';
        expect(UrlUtils.trimFilterFilepath(path)).toEqual(path);
    });

    it('should handle file paths with backslashes', () => {
        const path = 'D:\\Workspace\\AdblockFilters\\anti-antiadb.txt';
        const expected = '\\anti-antiadb.txt';
        expect(UrlUtils.trimFilterFilepath(path)).toEqual(expected);
    });

    it('should handle file paths with slashes', () => {
        const path = 'file:///Users/userName/Library/CloudStorage/Adguard/Kelvin\'s Adguard Filter.txt';
        const expected = '/Kelvin\'s Adguard Filter.txt';
        expect(UrlUtils.trimFilterFilepath(path)).toEqual(expected);
    });
});
