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
    expect,
    test,
} from 'vitest';

import {
    compareExtensionVersions,
    composePackageVersion,
    formatManifestVersion,
    formatTag,
    getDnrPatchVersion,
    isNewerVersion,
    parseExtensionVersion,
} from '../../../tools/release/version';

describe('parseExtensionVersion', () => {
    test('parses a release tag', () => {
        expect(parseExtensionVersion('v5.6.0.1')).toEqual({
            major: 5, minor: 6, patch: 0, increment: 1, channel: 'release',
        });
    });

    test('parses a beta tag', () => {
        expect(parseExtensionVersion('v5.5.0.8-beta')).toEqual({
            major: 5, minor: 5, patch: 0, increment: 8, channel: 'beta',
        });
    });

    test('accepts a tag without the v prefix', () => {
        expect(parseExtensionVersion('5.6.0.1').increment).toBe(1);
    });

    test.each(['5.5', 'v5.5.0', 'v5.6.0.1-beta.1', 'v5.6.0.1-beta-1', 'vx.6.0.1', 'garbage'])(
        'rejects invalid version %s',
        (input) => {
            expect(() => parseExtensionVersion(input)).toThrow(/Invalid extension version/);
        },
    );
});

describe('formatManifestVersion and formatTag', () => {
    test('formats the 4-component manifest version', () => {
        expect(formatManifestVersion(parseExtensionVersion('v5.6.0.1'))).toBe('5.6.0.1');
    });

    test('formats tags for both channels', () => {
        expect(formatTag(parseExtensionVersion('v5.6.0.1'))).toBe('v5.6.0.1');
        expect(formatTag(parseExtensionVersion('v5.6.0.1-beta'))).toBe('v5.6.0.1-beta');
    });
});

describe('composePackageVersion', () => {
    test('composes the package.json version with build metadata', () => {
        const version = parseExtensionVersion('v5.6.0.1-beta');
        expect(composePackageVersion(version, '20260820120135')).toBe('5.6.0+1.build.20260820120135');
    });
});

describe('compareExtensionVersions and isNewerVersion', () => {
    test('compares 4-component versions', () => {
        const a = parseExtensionVersion('v5.5.0.8');
        const b = parseExtensionVersion('v5.6.0.1-beta');
        const c = parseExtensionVersion('v5.6.0.1');
        expect(compareExtensionVersions(a, b)).toBeLessThan(0);
        expect(compareExtensionVersions(b, c)).toBeLessThan(0);
        expect(compareExtensionVersions(c, a)).toBeGreaterThan(0);
    });

    test('treats beta as strictly older than release for equal 4-component versions', () => {
        const beta = parseExtensionVersion('v5.5.0.7-beta');
        const release = parseExtensionVersion('v5.5.0.7');
        expect(compareExtensionVersions(beta, release)).toBeLessThan(0);
        expect(compareExtensionVersions(release, beta)).toBeGreaterThan(0);
        expect(compareExtensionVersions(beta, beta)).toBe(0);
        expect(compareExtensionVersions(release, release)).toBe(0);
    });

    test('accepts a candidate newer than the current package version', () => {
        expect(isNewerVersion(parseExtensionVersion('v5.5.0.8'), '5.5.0+7.build.20260817120135'))
            .toBe(true);
    });

    test('rejects a candidate equal to the current package version', () => {
        expect(isNewerVersion(parseExtensionVersion('v5.5.0.7'), '5.5.0+7.build.20260817120135'))
            .toBe(false);
    });

    test('accepts a release candidate equal to a previously published beta (promotion)', () => {
        expect(isNewerVersion(
            parseExtensionVersion('v5.5.0.7'),
            '5.5.0+7.build.20260817120135',
            'beta',
        )).toBe(true);
    });

    test('rejects a beta candidate equal to a previously published release', () => {
        expect(isNewerVersion(
            parseExtensionVersion('v5.5.0.7-beta'),
            '5.5.0+7.build.20260817120135',
            'release',
        )).toBe(false);
    });

    test('rejects a candidate older than the current package version', () => {
        expect(isNewerVersion(parseExtensionVersion('v5.5.0.6'), '5.5.0+7.build.20260817120135'))
            .toBe(false);
    });

    test('throws on an unparsable package version', () => {
        expect(() => isNewerVersion(parseExtensionVersion('v5.5.0.8'), 'not-a-version'))
            .toThrow(/Cannot parse package version/);
    });

    test('throws on a package version without build metadata instead of crashing', () => {
        expect(() => isNewerVersion(parseExtensionVersion('v5.5.0.8'), '5.5.0'))
            .toThrow(/Invalid build format in package version/);
    });

    test('throws on a package version missing the build metatag or dnr version', () => {
        expect(() => isNewerVersion(parseExtensionVersion('v5.5.0.8'), '5.5.0+7.other'))
            .toThrow(/Invalid build format in package version/);
        expect(() => isNewerVersion(parseExtensionVersion('v5.5.0.8'), '5.5.0+7.build'))
            .toThrow(/Invalid build format in package version/);
    });
});

describe('getDnrPatchVersion', () => {
    test('returns the numeric dnr-rulesets patch', () => {
        expect(getDnrPatchVersion()).toMatch(/^\d+$/);
    });
});
