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
    devPinOverrides,
    findConflicts,
    parseNumberedVersion,
    parseRunNumber,
    parseVersions,
    readArgFromArgs,
    selectRunSet,
    stripDevPins,
} from '../../tools/ci/use-dev-builds';
import type { PackageVersions } from '../../tools/ci/use-dev-builds';

const DEV_TARBALL = 'https://ak.int.agrd.dev/npm/npm-internal-dev/@adguard/tsurlfilter/-/tsurlfilter-6.1.0-dev.pr26.123.tgz';

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

/**
 * Build one package's registry version list for {@link selectRunSet}.
 *
 * @param pkg Package directory name without the `@adguard/` scope.
 * @param versions Raw registry versions for that package.
 *
 * @returns The `PackageVersions` entry.
 */
const dev = (pkg: string, ...versions: string[]): PackageVersions => ({
    name: `@adguard/${pkg}`,
    versions,
});

/**
 * Capture the message of a thrown error.
 *
 * @param fn Callback expected to throw.
 *
 * @returns The thrown error message.
 *
 * @throws {Error} When the callback does not throw.
 */
const errorOf = (fn: () => unknown): string => {
    try {
        fn();
    } catch (error) {
        return (error as Error).message;
    }
    throw new Error('expected the call to throw');
};

describe('parseNumberedVersion', () => {
    it('parses the run number of a run-numbered dev build', () => {
        expect(parseNumberedVersion('6.1.0-dev.pr26.123', '26')).toEqual({
            version: '6.1.0-dev.pr26.123',
            run: 123,
        });
    });

    it('rejects unnumbered and head-scoped versions (run-numbered-only cutover)', () => {
        expect(parseNumberedVersion('6.1.0-dev.pr26', '26')).toBeNull();
        expect(parseNumberedVersion('6.1.0-dev.pr26.2f5d9548', '26')).toBeNull();
    });

    it('never crosses the pr<N> boundary (pr1 vs pr12)', () => {
        expect(parseNumberedVersion('6.1.0-dev.pr12.123', '1')).toBeNull();
        expect(parseNumberedVersion('6.1.0-dev.pr1.123', '12')).toBeNull();
    });

    it('rejects non-strings and trailing segments', () => {
        expect(parseNumberedVersion(42, '26')).toBeNull();
        expect(parseNumberedVersion('6.1.0-dev.pr26.123.2f5d9548', '26')).toBeNull();
        expect(parseNumberedVersion('6.1.0-dev.pr26.abc', '26')).toBeNull();
    });
});

describe('selectRunSet', () => {
    it('selects the highest run across all packages and returns its exact versions', () => {
        const selected = selectRunSet([
            dev('tsurlfilter', '6.0.4-dev.pr41.9', '6.1.0-dev.pr41.10'),
            dev('agtree', '5.2.0-dev.pr41.10', '5.1.0-dev.pr41.9'),
        ], '41', null);
        expect(selected).toEqual({
            run: 10,
            versions: {
                '@adguard/tsurlfilter': '6.1.0-dev.pr41.10',
                '@adguard/agtree': '5.2.0-dev.pr41.10',
            },
        });
    });

    it('compares run numbers numerically (10 beats 9) regardless of list order', () => {
        const selected = selectRunSet([
            dev('tsurlfilter', '6.0.4-dev.pr41.10', '6.0.4-dev.pr41.9'),
            dev('agtree', '5.2.0-dev.pr41.9', '5.2.0-dev.pr41.10'),
        ], '41', null);
        expect(selected.run).toBe(10);
    });

    it('fails on an incomplete highest run instead of falling back to an older complete run', () => {
        const message = errorOf(() => selectRunSet([
            dev('tsurlfilter', '6.0.4-dev.pr41.127', '6.0.4-dev.pr41.130'),
            dev('agtree', '5.2.0-dev.pr41.127'),
        ], '41', null));
        expect(message).toContain('PR #41 run 130 is incomplete');
        expect(message).toContain('missing @adguard/agtree');
        expect(message).toContain('Not falling back to an older run');
    });

    it('fails when the highest run exists only for a package other than tsurlfilter', () => {
        const message = errorOf(() => selectRunSet([
            dev('tsurlfilter', '6.0.4-dev.pr41.127'),
            dev('agtree', '5.2.0-dev.pr41.127', '5.2.0-dev.pr41.130'),
        ], '41', null));
        expect(message).toContain('run 130');
        expect(message).toContain('missing @adguard/tsurlfilter');
    });

    it('pins the explicitly requested run', () => {
        const selected = selectRunSet([
            dev('tsurlfilter', '6.0.4-dev.pr41.9', '6.0.4-dev.pr41.10'),
            dev('agtree', '5.2.0-dev.pr41.9', '5.2.0-dev.pr41.10'),
        ], '41', 9);
        expect(selected.run).toBe(9);
        expect(selected.versions['@adguard/tsurlfilter']).toBe('6.0.4-dev.pr41.9');
    });

    it('fails when the explicitly requested run is incomplete', () => {
        const message = errorOf(() => selectRunSet([
            dev('tsurlfilter', '6.0.4-dev.pr41.127', '6.0.4-dev.pr41.130'),
            dev('agtree', '6.0.4-dev.pr41.127'),
        ], '41', 130));
        expect(message).toContain('run 130');
        expect(message).toContain('missing @adguard/agtree');
    });

    it('fails when the explicitly requested run does not exist', () => {
        const message = errorOf(() => selectRunSet([
            dev('tsurlfilter', '6.0.4-dev.pr41.127'),
        ], '41', 999));
        expect(message).toContain('no published builds for run 999');
    });

    it('ignores head-scoped and unnumbered legacy versions (run-numbered-only cutover)', () => {
        const message = errorOf(() => selectRunSet([
            dev('tsurlfilter', '6.0.4-dev.pr41', '6.0.4-dev.pr41.2f5d9548'),
            dev('agtree', '5.2.0-dev.pr41.2f5d9548'),
        ], '41', null));
        expect(message).toContain('no numbered -dev.pr41.<run> builds found');
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

describe('parseRunNumber', () => {
    it('parses a workflow run number', () => {
        expect(parseRunNumber('123')).toBe(123);
    });

    it('rejects non-numeric values', () => {
        expect(() => parseRunNumber('abc')).toThrow(UsageError);
        expect(() => parseRunNumber('12.3')).toThrow(UsageError);
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
