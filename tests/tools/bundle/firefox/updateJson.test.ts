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

import { getFormattedVersion } from '../../../../tools/helpers';

/**
 * Regression test for AG-54236: Firefox standalone update.json must use the same
 * formatted version as the XPI manifest.json, not the raw package.json version.
 */
describe('Firefox update.json version formatting', () => {
    it('formats version with build metadata to browser-compatible format', () => {
        // Raw version from package.json
        const rawVersion = '5.2.800+1.build.20251216080045';
        // Expected formatted version matching XPI manifest.json
        const expected = '5.2.800.1';

        expect(getFormattedVersion(rawVersion)).toBe(expected);
    });

    it('formats version with higher increment number', () => {
        const rawVersion = '5.4.2+42.build.20260501120000';
        expect(getFormattedVersion(rawVersion)).toBe('5.4.2.42');
    });

    it('update.json template substitution produces correct version', () => {
        const template = '{"version": "%VERSION%"}';
        const rawVersion = '5.2.800+1.build.20251216080045';
        const formattedVersion = getFormattedVersion(rawVersion);
        const result = template.replace(/%VERSION%/g, formattedVersion);

        expect(result).toBe('{"version": "5.2.800.1"}');
        // Must NOT contain the raw semver build metadata
        expect(result).not.toContain('+');
    });
});
