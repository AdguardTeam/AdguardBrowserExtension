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

import * as fs from 'node:fs';
import { execFileSync } from 'node:child_process';

import {
    vi,
    describe,
    expect,
    it,
} from 'vitest';

import {
    updateDnrRulesets,
    base64Sha512,
    normalizeUrlDependency,
    resolveLatestStableVersion,
    resolveStableDistTagVersion,
    resolveTargetLine,
    resolveTargetVersion,
    rewriteDnrRulesetsTarballUrls,
    wouldDowngrade,
} from '../../../tools/resources/update-dnr-rulesets';

vi.mock('node:fs', async (importOriginal) => {
    const original = await importOriginal<typeof fs>();
    const mocked = {
        ...original,
        readFileSync: vi.fn(original.readFileSync),
        writeFileSync: vi.fn(),
    };
    return { ...mocked, default: mocked };
});

vi.mock('node:child_process', () => {
    const mocked = {
        execFileSync: vi.fn(() => {
            throw new Error('Unexpected dependency install');
        }),
    };
    return { ...mocked, default: mocked };
});

const NPM_REGISTRY = 'https://registry.npmjs.org';
const AK_REGISTRY = 'https://ak.internal.example/npm/npm-internal';
const NPM_TARBALL_BASE = `${NPM_REGISTRY}/@adguard/dnr-rulesets/-/`;
const AK_TARBALL_BASE = `${AK_REGISTRY}/@adguard/dnr-rulesets/-/`;
const VERSION = '6.0.20261007011026';
const AK_TARBALL_URL = `${AK_TARBALL_BASE}dnr-rulesets-${VERSION}.tgz`;
const INTEGRITY = 'sha512-AAAA';

describe('rewriteDnrRulesetsTarballUrls', () => {
    it('rewrites Artifact Keeper tarball URLs back to the npm registry', () => {
        const lockfile = [
            'packages:',
            '',
            `  '@adguard/dnr-rulesets@${VERSION}':`,
            `    resolution: {integrity: sha512-aaa, tarball: ${AK_TARBALL_URL}}`,
            '',
        ].join('\n');

        const result = rewriteDnrRulesetsTarballUrls(lockfile, AK_REGISTRY);

        expect(result).toContain(`${NPM_TARBALL_BASE}dnr-rulesets-${VERSION}.tgz`);
        expect(result).not.toContain('ak.internal.example');
        expect(result).toContain('integrity: sha512-aaa');
    });

    it('leaves npm registry URLs untouched (idempotent)', () => {
        const lockfile = `    resolution: {integrity: sha512-ddd, tarball: ${NPM_TARBALL_BASE}dnr-rulesets-6.0.0.tgz}`;

        expect(rewriteDnrRulesetsTarballUrls(lockfile, AK_REGISTRY)).toBe(lockfile);
    });

    it('leaves entries without a tarball URL untouched', () => {
        const lockfile = '    resolution: {integrity: sha512-eee}';

        expect(rewriteDnrRulesetsTarballUrls(lockfile, AK_REGISTRY)).toBe(lockfile);
    });

    it('does not touch URLs from other registries', () => {
        const lockfile = '    resolution: {integrity: sha512-fff, tarball: https://other.registry.example/@adguard/tsurlfilter/-/tsurlfilter-6.0.3.tgz}';

        expect(rewriteDnrRulesetsTarballUrls(lockfile, AK_REGISTRY)).toBe(lockfile);
    });

    it('rewrites every occurrence', () => {
        const lockfile = [
            `a: {tarball: ${AK_TARBALL_BASE}dnr-rulesets-5.0.1.tgz}`,
            `b: {tarball: ${AK_TARBALL_BASE}dnr-rulesets-5.0.2.tgz}`,
        ].join('\n');

        const result = rewriteDnrRulesetsTarballUrls(lockfile, AK_REGISTRY);

        expect(result.match(/registry\.npmjs\.org/g)).toHaveLength(2);
    });
});

describe('resolveTargetLine', () => {
    it('derives the line from an exact pin', () => {
        expect(resolveTargetLine('6.0.0')).toBe('6.0');
    });

    it('derives the line from a tilde range pin', () => {
        expect(resolveTargetLine('~6.0.20261007011026')).toBe('6.0');
        expect(resolveTargetLine('~5.0.20260829100031')).toBe('5.0');
    });

    it('throws when the spec has no major.minor version', () => {
        expect(() => resolveTargetLine('latest')).toThrow(/major\.minor/);
    });
});

describe('resolveStableDistTagVersion', () => {
    it('prefers the stable-<line> dist-tag over the newest version', () => {
        const distTags = {
            'stable-6.0': '6.0.20260829100031',
            latest: '6.0.20261007011026',
        };

        expect(resolveStableDistTagVersion(distTags, '6.0')).toBe('6.0.20260829100031');
    });

    it('returns undefined when the stable-<line> tag is absent', () => {
        expect(resolveStableDistTagVersion({ latest: '6.0.20261007011026' }, '6.0')).toBeUndefined();
    });

    it('returns undefined when the stable-<line> tag does not match the line', () => {
        expect(resolveStableDistTagVersion({ 'stable-6.0': '5.0.20260903144513' }, '6.0')).toBeUndefined();
    });
});

describe('resolveTargetVersion', () => {
    it('prefers the stable-<line> dist-tag over a newer published version', () => {
        const metadata = {
            'dist-tags': { 'stable-6.0': '6.0.20261007011026' },
            versions: {
                '6.0.20261007011026': {},
                '6.0.20261008010951': {},
            },
        };

        expect(resolveTargetVersion(metadata, '6.0')).toBe('6.0.20261007011026');
    });

    it('falls back to the newest published version when the tag is absent', () => {
        const metadata = {
            versions: {
                '6.0.20261007011026': {},
                '6.0.20261008010951': {},
            },
        };

        expect(resolveTargetVersion(metadata, '6.0')).toBe('6.0.20261008010951');
    });
});

describe('resolveLatestStableVersion', () => {
    it('picks the newest stable version of the requested line', () => {
        const versions = [
            '6.0.20260829100031',
            '6.0.0-beta.0',
            '5.0.20260903144513',
            '6.0.20261007011026',
            '6.1.0',
        ];

        expect(resolveLatestStableVersion(versions, '6.0')).toBe('6.0.20261007011026');
    });

    it('returns undefined when no stable version of the line exists', () => {
        expect(resolveLatestStableVersion(['6.0.0-beta.0', '5.0.20260903144513'], '6.0')).toBeUndefined();
    });

    it('returns undefined for an empty list', () => {
        expect(resolveLatestStableVersion([], '6.0')).toBeUndefined();
    });
});

describe('wouldDowngrade', () => {
    it('detects a candidate older than the pinned timestamp', () => {
        expect(wouldDowngrade('6.0.20261007011026', '~6.0.20261008010951', '6.0')).toBe(true);
    });

    it('allows a candidate equal to or newer than the pin', () => {
        expect(wouldDowngrade('6.0.20261008010951', '~6.0.20261008010951', '6.0')).toBe(false);
        expect(wouldDowngrade('6.0.20261009000000', '~6.0.20261008010951', '6.0')).toBe(false);
    });

    it('allows a stable candidate when the pin is an exact release', () => {
        // `6.0.0` parses to build component 0, so any dated build is newer.
        expect(wouldDowngrade('6.0.20261007011026', '6.0.0', '6.0')).toBe(false);
    });

    it('returns false when the pin carries no build component', () => {
        expect(wouldDowngrade('6.0.20261007011026', '~6.0', '6.0')).toBe(false);
    });
});

describe('normalizeUrlDependency', () => {
    it('converts the tarball URL dependency back to the pinned-version form', () => {
        const packageJson = `{
  "name": "browser-extension",
  "devDependencies": {
    "@adguard/dnr-rulesets": "${AK_TARBALL_URL}"
  }
}`;
        const lockfile = [
            'importers:',
            '',
            '  .:',
            '    devDependencies:',
            '      \'@adguard/dnr-rulesets\':',
            `        specifier: ${AK_TARBALL_URL}`,
            `        version: ${AK_TARBALL_URL}(typescript@5.6.3)`,
            '',
            'packages:',
            '',
            `  '@adguard/dnr-rulesets@${AK_TARBALL_URL}':`,
            `    resolution: {tarball: ${AK_TARBALL_URL}}`,
            `    version: ${VERSION}`,
            '    hasBin: true',
            '',
            'snapshots:',
            '',
            `  '@adguard/dnr-rulesets@${AK_TARBALL_URL}(typescript@5.6.3)':`,
            '    dependencies:',
            '      axios: 1.15.0',
        ].join('\n');

        const result = normalizeUrlDependency(packageJson, lockfile, AK_TARBALL_URL, VERSION, INTEGRITY);

        // package.json is pinned like a plain npm install.
        expect(result.packageJson).toContain(`"@adguard/dnr-rulesets": "~${VERSION}"`);
        expect(result.packageJson).not.toContain('ak.internal.example');

        // Importer.
        expect(result.lockfile).toContain(`specifier: ~${VERSION}`);
        expect(result.lockfile).toContain(`version: ${VERSION}(typescript@5.6.3)`);

        // packages key + resolution (+ the redundant version: line dropped).
        expect(result.lockfile).toContain(`'@adguard/dnr-rulesets@${VERSION}':`);
        expect(result.lockfile).toContain(`resolution: {integrity: ${INTEGRITY}, tarball: ${AK_TARBALL_URL}}`);
        expect(result.lockfile).not.toContain(`\n    version: ${VERSION}\n    hasBin: true`);
        expect(result.lockfile).toContain('    hasBin: true');

        // snapshots key keeps its peer-hash suffix.
        expect(result.lockfile).toContain(`'@adguard/dnr-rulesets@${VERSION}(typescript@5.6.3)':`);
        // The resolution tarball still points at AK at this stage: main() flips
        // it to npm via rewriteDnrRulesetsTarballUrls once the version is
        // confirmed published on npm.
        expect(result.lockfile.match(/ak\.internal\.example/g)).toHaveLength(1);
    });

    it('throws when the tarball URL is not present in the dependency files', () => {
        const packageJson = '{ "devDependencies": { "@adguard/dnr-rulesets": "~5.0.1" } }';
        const lockfile = 'empty';

        expect(() => normalizeUrlDependency(
            packageJson,
            lockfile,
            AK_TARBALL_URL,
            VERSION,
            INTEGRITY,
        )).toThrow(AK_TARBALL_URL);
    });
});

describe('base64Sha512', () => {
    it('produces a base64-encoded sha512 with the sha512- prefix', () => {
        const testSha512 = 'sha512-7iaw3Ur350mqGo7jwQrpkj9hiYB3Lkc/iBml1JQODbJ6wY'
            + 'X4oOHV+E+IvIh/1nsUNzLDBMxfqa2Ob1f1ACio/w==';
        const emptySha512 = 'sha512-z4PhNX7vuL3xVChQ1m2AB9Yg5AULVxXcg/SpIdNs6c5H0NE8XY'
            + 'XysP+DGNKHfuwvY7kxvUdBeoGlODJ6+SfaPg==';

        expect(base64Sha512(Buffer.from('test'))).toBe(testSha512);
        expect(base64Sha512(Buffer.from(''))).toBe(emptySha512);
    });
});

describe('updateDnrRulesets', () => {
    it('keeps an explicitly pinned prerelease instead of installing the older stable channel', async () => {
        const read = vi.mocked(fs.readFileSync).mockReturnValueOnce(JSON.stringify({
            devDependencies: { '@adguard/dnr-rulesets': '6.0.0-beta.0' },
        }));
        const exec = vi.mocked(execFileSync);
        try {
            await updateDnrRulesets();
            expect(exec).not.toHaveBeenCalled();
        } finally {
            read.mockClear();
            exec.mockClear();
        }
    });

    it('keeps an exact pin untouched on the public npm registry', async () => {
        vi.stubEnv('DNR_RULESETS_REGISTRY', '');
        const read = vi.mocked(fs.readFileSync).mockReturnValueOnce(JSON.stringify({
            devDependencies: { '@adguard/dnr-rulesets': '6.0.0' },
        }));
        const exec = vi.mocked(execFileSync);
        try {
            await updateDnrRulesets();
            expect(exec).not.toHaveBeenCalled();
        } finally {
            read.mockClear();
            exec.mockClear();
            vi.unstubAllEnvs();
        }
    });

    it('installs the derived line for a range pin on the public npm registry', async () => {
        vi.stubEnv('DNR_RULESETS_REGISTRY', '');
        const read = vi.mocked(fs.readFileSync).mockReturnValueOnce(JSON.stringify({
            devDependencies: { '@adguard/dnr-rulesets': `~${VERSION}` },
        }));
        const exec = vi.mocked(execFileSync).mockImplementation(() => Buffer.from(''));
        vi.stubGlobal('fetch', vi.fn(async () => ({
            ok: true,
            json: async () => ({ versions: { [VERSION]: {} } }),
        })));
        try {
            await updateDnrRulesets();
            expect(exec).toHaveBeenNthCalledWith(
                1,
                'pnpm',
                ['remove', '@adguard/dnr-rulesets'],
                { stdio: 'inherit' },
            );
            expect(exec).toHaveBeenNthCalledWith(
                2,
                'pnpm',
                ['add', '-D', '@adguard/dnr-rulesets@~6.0'],
                { stdio: 'inherit' },
            );
        } finally {
            read.mockClear();
            exec.mockReset();
            exec.mockImplementation(() => {
                throw new Error('Unexpected dependency install');
            });
            vi.unstubAllGlobals();
            vi.unstubAllEnvs();
        }
    });

    it('keeps a range pin when the line is not on the public npm registry', async () => {
        vi.stubEnv('DNR_RULESETS_REGISTRY', '');
        const read = vi.mocked(fs.readFileSync).mockReturnValueOnce(JSON.stringify({
            devDependencies: { '@adguard/dnr-rulesets': `~${VERSION}` },
        }));
        const exec = vi.mocked(execFileSync);
        vi.stubGlobal('fetch', vi.fn(async () => ({
            ok: true,
            json: async () => ({ versions: { '5.0.20260903144513': {} } }),
        })));
        try {
            await updateDnrRulesets();
            expect(exec).not.toHaveBeenCalled();
        } finally {
            read.mockClear();
            exec.mockClear();
            vi.unstubAllGlobals();
            vi.unstubAllEnvs();
        }
    });

    it('keeps a range pin when the public registry metadata cannot be read', async () => {
        vi.stubEnv('DNR_RULESETS_REGISTRY', '');
        const read = vi.mocked(fs.readFileSync).mockReturnValueOnce(JSON.stringify({
            devDependencies: { '@adguard/dnr-rulesets': `~${VERSION}` },
        }));
        const exec = vi.mocked(execFileSync);
        vi.stubGlobal('fetch', vi.fn(async () => {
            throw new Error('GET https://registry.npmjs.org/@adguard/dnr-rulesets failed: HTTP 429');
        }));
        try {
            await updateDnrRulesets();
            expect(exec).not.toHaveBeenCalled();
        } finally {
            read.mockClear();
            exec.mockClear();
            vi.unstubAllGlobals();
            vi.unstubAllEnvs();
        }
    });

    it('keeps a range pin when the public registry only has an older version', async () => {
        vi.stubEnv('DNR_RULESETS_REGISTRY', '');
        const read = vi.mocked(fs.readFileSync).mockReturnValueOnce(JSON.stringify({
            devDependencies: { '@adguard/dnr-rulesets': '~6.0.20261008010951' },
        }));
        const exec = vi.mocked(execFileSync);
        vi.stubGlobal('fetch', vi.fn(async () => ({
            ok: true,
            json: async () => ({ versions: { [VERSION]: {} } }),
        })));
        try {
            await updateDnrRulesets();
            expect(exec).not.toHaveBeenCalled();
        } finally {
            read.mockClear();
            exec.mockClear();
            vi.unstubAllGlobals();
            vi.unstubAllEnvs();
        }
    });

    it('keeps the pin when Artifact Keeper resolves an older version', async () => {
        vi.stubEnv('DNR_RULESETS_REGISTRY', AK_REGISTRY);
        const read = vi.mocked(fs.readFileSync).mockReturnValueOnce(JSON.stringify({
            devDependencies: { '@adguard/dnr-rulesets': '~6.0.20261008010951' },
        }));
        const exec = vi.mocked(execFileSync);
        vi.stubGlobal('fetch', vi.fn(async () => ({
            ok: true,
            json: async () => ({
                'dist-tags': { 'stable-6.0': VERSION },
                versions: { [VERSION]: {} },
            }),
        })));
        try {
            await updateDnrRulesets();
            expect(exec).not.toHaveBeenCalled();
        } finally {
            read.mockClear();
            exec.mockClear();
            vi.unstubAllGlobals();
            vi.unstubAllEnvs();
        }
    });

    it('prefers the Artifact Keeper stable dist-tag over a newer published version', async () => {
        vi.stubEnv('DNR_RULESETS_REGISTRY', AK_REGISTRY);
        const newerVersion = '6.0.20261008010951';
        const tagTarballUrl = `${AK_TARBALL_BASE}dnr-rulesets-${VERSION}.tgz`;
        const read = vi.mocked(fs.readFileSync)
            .mockReturnValueOnce(JSON.stringify({
                devDependencies: { '@adguard/dnr-rulesets': '6.0.0' },
            }))
            .mockReturnValueOnce(JSON.stringify({
                devDependencies: { '@adguard/dnr-rulesets': tagTarballUrl },
            }))
            .mockReturnValueOnce(`resolution: {tarball: ${tagTarballUrl}}`);
        const exec = vi.mocked(execFileSync).mockImplementation(() => Buffer.from(''));
        const write = vi.mocked(fs.writeFileSync);
        vi.stubGlobal('fetch', vi.fn(async (url: string) => {
            if (url === `${AK_REGISTRY}/@adguard/dnr-rulesets`) {
                return {
                    ok: true,
                    json: async () => ({
                        'dist-tags': { 'stable-6.0': VERSION },
                        versions: {
                            [VERSION]: { dist: { tarball: tagTarballUrl } },
                            [newerVersion]: { dist: { tarball: `${AK_TARBALL_BASE}dnr-rulesets-${newerVersion}.tgz` } },
                        },
                    }),
                };
            }
            if (url === tagTarballUrl) {
                return {
                    ok: true,
                    arrayBuffer: async () => new ArrayBuffer(8),
                };
            }
            return { ok: false };
        }));
        try {
            await updateDnrRulesets();
            expect(exec).toHaveBeenNthCalledWith(
                1,
                'pnpm',
                ['remove', '@adguard/dnr-rulesets'],
                { stdio: 'inherit' },
            );
            expect(exec).toHaveBeenNthCalledWith(
                2,
                'pnpm',
                ['add', '-D', tagTarballUrl],
                { stdio: 'inherit' },
            );
            expect(write).toHaveBeenCalledTimes(2);
        } finally {
            read.mockClear();
            exec.mockReset();
            exec.mockImplementation(() => {
                throw new Error('Unexpected dependency install');
            });
            write.mockClear();
            vi.unstubAllGlobals();
            vi.unstubAllEnvs();
        }
    });
});
