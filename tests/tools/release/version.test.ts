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
    allocateVersion,
    compareExtensionVersions,
    composePackageVersion,
    formatManifestVersion,
    formatTag,
    getDnrPatchVersion,
    isNewerVersion,
    parseExtensionVersion,
    parsePackageVersion,
    parseReleaseTag,
} from '../../../tools/release/version';

describe('parseReleaseTag', () => {
    test('parses a release tag', () => {
        expect(parseReleaseTag('v5.6.0')).toEqual({
            major: 5, minor: 6, patch: 0, channel: 'release',
        });
    });

    test('parses a beta tag', () => {
        expect(parseReleaseTag('v5.5.3-beta.7')).toEqual({
            major: 5, minor: 5, patch: 3, channel: 'beta', betaNumber: 7,
        });
    });

    test('accepts a tag without the v prefix', () => {
        expect(parseReleaseTag('5.6.0-beta.7').betaNumber).toBe(7);
    });

    test.each([
        '5.5',
        'v5.5.0.7',
        'v5.6.0-beta',
        'v5.6.0-beta.7.1',
        'v5.6.0-rc.1',
        'v5.6.0-beta.7+build',
        'v05.6.0',
        'vx.6.0',
        'garbage',
    ])('rejects invalid release tag %s', (input) => {
        expect(() => parseReleaseTag(input)).toThrow(/Invalid release tag/);
    });
});

describe('parseExtensionVersion', () => {
    test('parses a 4-component release version', () => {
        expect(parseExtensionVersion('5.6.0.7')).toEqual({
            major: 5, minor: 6, patch: 0, build: 7, channel: 'release',
        });
    });

    test('parses a 4-component beta version', () => {
        expect(parseExtensionVersion('5.5.3.7-beta')).toEqual({
            major: 5, minor: 5, patch: 3, build: 7, channel: 'beta',
        });
    });

    test.each(['5.5', 'v5.6.0', 'v5.6.0-beta.7', 'vx.6.0.1', 'garbage'])(
        'rejects invalid 4-component version %s',
        (input) => {
            expect(() => parseExtensionVersion(input)).toThrow(/Invalid extension version/);
        },
    );
});

describe('parsePackageVersion', () => {
    test('reads the version and build counter without adding a channel', () => {
        expect(parsePackageVersion('5.6.0+7.build.20261020120000')).toStrictEqual({
            major: 5, minor: 6, patch: 0, build: 7,
        });
    });

    test('throws on an unparsable package version', () => {
        expect(() => parsePackageVersion('not-a-version'))
            .toThrow(/Cannot parse package version/);
    });

    test('throws on a package version without build metadata', () => {
        expect(() => parsePackageVersion('5.6.0'))
            .toThrow(/Invalid build format in package version/);
    });

    test('throws on a package version missing the build metatag or dnr version', () => {
        expect(() => parsePackageVersion('5.6.0+7.other'))
            .toThrow(/Invalid build format in package version/);
        expect(() => parsePackageVersion('5.6.0+7.build'))
            .toThrow(/Invalid build format in package version/);
        expect(() => parsePackageVersion('5.6.0+next.build.20261020120000'))
            .toThrow(/Invalid build format in package version/);
    });
});

describe('allocateVersion', () => {
    test('allocates the next build for a release', () => {
        expect(allocateVersion(
            parseReleaseTag('v5.5.3'),
            '5.5.3+6.build.20260817120135',
        )).toEqual({
            major: 5, minor: 5, patch: 3, build: 7, channel: 'release',
        });
    });

    test('allocates the next build for a matching beta tag', () => {
        expect(allocateVersion(
            parseReleaseTag('v5.5.3-beta.7'),
            '5.5.3+6.build.20260817120135',
        )).toEqual({
            major: 5, minor: 5, patch: 3, build: 7, channel: 'beta',
        });
    });

    test('rejects a beta number different from the allocated build', () => {
        expect(() => allocateVersion(
            parseReleaseTag('v5.5.3-beta.8'),
            '5.5.3+6.build.20260817120135',
        )).toThrow(/expected v5\.5\.3-beta\.7/);
    });

    test('accepts an explicit build override for a stable branch with a higher counter', () => {
        expect(allocateVersion(
            parseReleaseTag('v5.5.3-beta.29'),
            '5.5.3+6.build.20260817120135',
            29,
        )).toEqual({
            major: 5, minor: 5, patch: 3, build: 29, channel: 'beta',
        });
        expect(allocateVersion(
            parseReleaseTag('v5.5.3'),
            '5.5.3+28.build.20260817120135',
            29,
        )).toEqual({
            major: 5, minor: 5, patch: 3, build: 29, channel: 'release',
        });
    });

    test('requires the beta number to match an explicit build override', () => {
        expect(() => allocateVersion(
            parseReleaseTag('v5.5.3-beta.28'),
            '5.5.3+6.build.20260817120135',
            29,
        )).toThrow(/expected v5\.5\.3-beta\.29/);
    });

    test.each([0, -1, 1.5, 6, Number.NaN])('rejects invalid build override %s', (buildOverride) => {
        expect(() => allocateVersion(
            parseReleaseTag('v5.5.3'),
            '5.5.3+6.build.20260817120135',
            buildOverride,
        )).toThrow(/Build override must be an integer greater than the current package build 6/);
    });
});

describe('formatManifestVersion and formatTag', () => {
    test('formats the 4-component manifest version', () => {
        expect(formatManifestVersion(parseExtensionVersion('5.6.0.7'))).toBe('5.6.0.7');
        expect(formatManifestVersion(parseExtensionVersion('5.6.0.7-beta'))).toBe('5.6.0.7');
    });

    test('formats a release tag as semver without the build number', () => {
        expect(formatTag(parseExtensionVersion('5.6.0.7'))).toBe('v5.6.0');
    });

    test('formats a beta tag with the build number as the beta number', () => {
        expect(formatTag(parseExtensionVersion('5.6.0.7-beta'))).toBe('v5.6.0-beta.7');
    });
});

describe('composePackageVersion', () => {
    test('composes the package.json version with build metadata', () => {
        const version = parseExtensionVersion('5.6.0.7-beta');
        expect(composePackageVersion(version, '20260820120135')).toBe('5.6.0+7.build.20260820120135');
    });
});

describe('compareExtensionVersions and isNewerVersion', () => {
    test('compares versions by major.minor.patch first', () => {
        const a = parseExtensionVersion('5.5.3.8');
        const b = parseExtensionVersion('5.6.0.7-beta');
        expect(compareExtensionVersions(a, b)).toBeLessThan(0);
        expect(compareExtensionVersions(b, a)).toBeGreaterThan(0);
    });

    test('treats beta as strictly older than release for equal major.minor.patch', () => {
        const beta = parseExtensionVersion('5.5.3.9-beta');
        const release = parseExtensionVersion('5.5.3.8');
        expect(compareExtensionVersions(beta, release)).toBeLessThan(0);
        expect(compareExtensionVersions(release, beta)).toBeGreaterThan(0);
    });

    test('compares build numbers within the same channel', () => {
        const olderBeta = parseExtensionVersion('5.5.3.7-beta');
        const newerBeta = parseExtensionVersion('5.5.3.8-beta');
        const olderRelease = parseExtensionVersion('5.5.3.7');
        const newerRelease = parseExtensionVersion('5.5.3.8');

        expect(compareExtensionVersions(olderBeta, newerBeta)).toBeLessThan(0);
        expect(compareExtensionVersions(newerBeta, olderBeta)).toBeGreaterThan(0);
        expect(compareExtensionVersions(olderBeta, olderBeta)).toBe(0);
        expect(compareExtensionVersions(olderRelease, newerRelease)).toBeLessThan(0);
        expect(compareExtensionVersions(newerRelease, olderRelease)).toBeGreaterThan(0);
    });

    test('accepts a candidate with the next build number', () => {
        expect(isNewerVersion(parseExtensionVersion('5.5.3.7'), '5.5.3+6.build.20260817120135'))
            .toBe(true);
        expect(isNewerVersion(parseExtensionVersion('5.5.3.7-beta'), '5.5.3+6.build.20260817120135'))
            .toBe(true);
    });

    test('rejects a candidate equal to the current package version', () => {
        expect(isNewerVersion(parseExtensionVersion('5.5.3.6'), '5.5.3+6.build.20260817120135'))
            .toBe(false);
        expect(isNewerVersion(parseExtensionVersion('5.5.3.6-beta'), '5.5.3+6.build.20260817120135'))
            .toBe(false);
    });

    test('rejects a candidate with a lower major.minor.patch even if the build is higher', () => {
        expect(isNewerVersion(parseExtensionVersion('5.5.2.7'), '5.5.3+6.build.20260817120135'))
            .toBe(false);
    });

    test('throws on an unparsable package version', () => {
        expect(() => isNewerVersion(parseExtensionVersion('5.5.3.8'), 'not-a-version'))
            .toThrow(/Cannot parse package version/);
    });

    test('throws on a package version without build metadata instead of crashing', () => {
        expect(() => isNewerVersion(parseExtensionVersion('5.5.3.8'), '5.5.3'))
            .toThrow(/Invalid build format in package version/);
    });
});

describe('getDnrPatchVersion', () => {
    test('returns the numeric dnr-rulesets patch', () => {
        expect(getDnrPatchVersion()).toMatch(/^\d+$/);
    });
});
