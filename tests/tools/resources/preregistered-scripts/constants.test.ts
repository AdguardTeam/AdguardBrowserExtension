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
    describe,
    it,
    expect,
} from 'vitest';

import { getBundleFileName } from '../../../../tools/resources/preregistered-scripts/constants';

describe('getBundleFileName', () => {
    it('returns "domain-filterId.js" for a standard domain and filter ID', () => {
        expect(getBundleFileName('youtube.com', 2)).toBe('youtube.com-2.js');
    });

    it('returns the correct filename for a different domain and filter ID', () => {
        expect(getBundleFileName('example.com', 14)).toBe('example.com-14.js');
    });

    it('handles filter ID 0', () => {
        expect(getBundleFileName('youtube.com', 0)).toBe('youtube.com-0.js');
    });

    it('handles large filter IDs', () => {
        expect(getBundleFileName('youtube.com', 99999)).toBe('youtube.com-99999.js');
    });

    it('handles domains with subdomains', () => {
        expect(getBundleFileName('www.example.com', 5)).toBe('www.example.com-5.js');
    });
});
