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

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
    describe,
    expect,
    it,
} from 'vitest';

import {
    UsageError,
    compareNumericCore,
    devPinOverrides,
    findConflicts,
    headShortSha,
    isPrVersion,
    parseVersions,
    readArgFromArgs,
    stripDevPins,
} from '../../tools/ci/use-dev-builds';

const DEV_TARBALL = 'https://ak.int.agrd.dev/npm/npm-internal-dev/@adguard/tsurlfilter/-/tsurlfilter-6.1.0-dev.pr26.2f5d9548.tgz';

/**
 * Create a throwaway checkout dir with the given package.json contents and
 * return its path (the caller is responsible for cleanup).
 *
 * @param manifest Package.json contents to write (JSON-serializable object).
 *
 * @returns Absolute path to the temp checkout directory.
 */
const withFixture = (manifest: object): string => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'udb-test-'));
    fs.writeFileSync(path.join(dir, 'package.json'), `${JSON.stringify(manifest, null, 4)}\n`);
    return dir;
};

describe('headShortSha', () => {
    it('returns the lowercase 8-char suffix for a full SHA', () => {
        expect(headShortSha('ABCDEF1234567890')).toBe('abcdef12');
    });

    it('returns the lowercase 8-char suffix for an 8-char SHA', () => {
        expect(headShortSha('2f5d9548')).toBe('2f5d9548');
    });

    it('returns null when no head is requested', () => {
        expect(headShortSha(null)).toBeNull();
    });

    it('returns null when the DEV_BUILDS_FORCE_NO_HEAD hook is set', () => {
        process.env.DEV_BUILDS_FORCE_NO_HEAD = '1';
        try {
            expect(headShortSha('2f5d9548')).toBeNull();
        } finally {
            delete process.env.DEV_BUILDS_FORCE_NO_HEAD;
        }
    });

    it('rejects a SHA shorter than 8 chars (version lookup needs the full suffix)', () => {
        expect(() => headShortSha('abc')).toThrow(UsageError);
        expect(() => headShortSha('abcdef0')).toThrow(UsageError);
    });

    it('rejects a non-hex head', () => {
        expect(() => headShortSha('zzzzzzzz')).toThrow(UsageError);
    });
});

describe('isPrVersion', () => {
    it('matches the bare -dev.pr<N> tag and head-scoped builds', () => {
        expect(isPrVersion('6.1.0-dev.pr26', '26')).toBe(true);
        expect(isPrVersion('6.1.0-dev.pr26.2f5d9548', '26')).toBe(true);
    });

    it('never crosses the pr<N> boundary (pr1 vs pr12)', () => {
        expect(isPrVersion('6.1.0-dev.pr12', '1')).toBe(false);
        expect(isPrVersion('6.1.0-dev.pr1.abcdef12', '12')).toBe(false);
    });

    it('rejects non-strings', () => {
        expect(isPrVersion(42, '26')).toBe(false);
        expect(isPrVersion(null, '26')).toBe(false);
    });
});

describe('compareNumericCore', () => {
    it('orders dev versions by their numeric core', () => {
        expect(compareNumericCore('6.1.0-dev.pr26.2f5d9548', '6.2.0-dev.pr26.2f5d9548')).toBeLessThan(0);
        expect(compareNumericCore('6.10.0-dev.pr26.2f5d9548', '6.2.0-dev.pr26.2f5d9548')).toBeGreaterThan(0);
        expect(compareNumericCore('6.1.0-dev.pr26.2f5d9548', '6.1.0-dev.pr26.2f5d9548')).toBe(0);
    });
});

describe('parseVersions', () => {
    it('parses a JSON array of versions', () => {
        expect(parseVersions('@adguard/tsurlfilter', '["6.0.3","6.1.0-dev.pr26.2f5d9548"]')).toEqual([
            '6.0.3',
            '6.1.0-dev.pr26.2f5d9548',
        ]);
    });

    it('wraps a single non-array value', () => {
        expect(parseVersions('@adguard/tsurlfilter', '"6.0.3"')).toEqual(['6.0.3']);
    });

    it('treats empty output as no versions', () => {
        expect(parseVersions('@adguard/tsurlfilter', '')).toEqual([]);
    });

    it('fails loudly on unexpected output', () => {
        expect(() => parseVersions('@adguard/tsurlfilter', 'not json')).toThrow(UsageError);
    });
});

describe('readArgFromArgs', () => {
    it('reads a value following the flag', () => {
        expect(readArgFromArgs(['--pr', '26'], '--pr')).toBe('26');
    });

    it('fails when the flag is missing', () => {
        expect(() => readArgFromArgs(['--pr', '26'], '--extension')).toThrow(UsageError);
    });

    it('fails when the value is flag-like', () => {
        expect(() => readArgFromArgs(['--extension', '--pr'], '--extension')).toThrow(UsageError);
    });
});

describe('devPinOverrides', () => {
    it('lists only -dev.pr overrides, ignoring stable and non-bridged pins', () => {
        const manifest = {
            pnpm: {
                overrides: {
                    '@adguard/tsurlfilter': DEV_TARBALL,
                    '@adguard/agtree': '4.2.1',
                    'some-other-pkg': DEV_TARBALL,
                },
            },
        };
        expect(devPinOverrides(manifest)).toEqual(['@adguard/tsurlfilter', 'some-other-pkg']);
    });
});

describe('stripDevPins', () => {
    it('removes every dev pin and returns true', () => {
        const dir = withFixture({
            name: 'fixture',
            pnpm: {
                overrides: {
                    '@adguard/tsurlfilter': DEV_TARBALL,
                    '@adguard/agtree': DEV_TARBALL,
                    '@adguard/dnr-converter': '1.1.2',
                },
            },
        });
        try {
            expect(stripDevPins(dir)).toBe(true);
            const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8')) as {
                pnpm: { overrides: Record<string, string> };
            };
            expect(manifest.pnpm.overrides['@adguard/dnr-converter']).toBe('1.1.2');
            expect(manifest.pnpm.overrides['@adguard/tsurlfilter']).toBeUndefined();
            expect(manifest.pnpm.overrides['@adguard/agtree']).toBeUndefined();
        } finally {
            fs.rmSync(dir, { recursive: true, force: true });
        }
    });

    it('returns false and leaves the manifest untouched when no pins are present', () => {
        const dir = withFixture({
            name: 'fixture',
            pnpm: { overrides: { '@adguard/tsurlfilter': '6.0.3' } },
        });
        try {
            expect(stripDevPins(dir)).toBe(false);
            const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8')) as {
                pnpm: { overrides: Record<string, string> };
            };
            expect(manifest.pnpm.overrides['@adguard/tsurlfilter']).toBe('6.0.3');
        } finally {
            fs.rmSync(dir, { recursive: true, force: true });
        }
    });
});

describe('findConflicts', () => {
    const bridged = ['dnr-converter', 'css-tokenizer', 'agtree', 'tsurlfilter', 'dnr-rulesets', 'tswebextension'];

    it('reports non-dev overrides of the bridged set', () => {
        const manifest = {
            pnpm: {
                overrides: {
                    '@adguard/tsurlfilter': '6.0.3',
                    '@adguard/agtree': DEV_TARBALL,
                },
            },
        };
        const conflicts = findConflicts(manifest, bridged);
        expect(conflicts).toHaveLength(1);
        expect(conflicts[0]).toContain('@adguard/tsurlfilter');
    });

    it('reports no conflicts when the bridged set only carries dev pins', () => {
        const manifest = {
            pnpm: {
                overrides: {
                    '@adguard/tsurlfilter': DEV_TARBALL,
                    '@adguard/agtree': DEV_TARBALL,
                },
            },
        };
        expect(findConflicts(manifest, bridged)).toEqual([]);
    });
});
