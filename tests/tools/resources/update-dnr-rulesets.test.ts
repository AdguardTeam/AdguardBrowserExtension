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
    rewriteDnrRulesetsTarballUrls,
} from '../../../tools/resources/update-dnr-rulesets';

vi.mock('node:fs', async (importOriginal) => {
    const original = await importOriginal<typeof fs>();
    const mocked = { ...original, readFileSync: vi.fn(original.readFileSync) };
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
const VERSION = '5.0.20260903144513';
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

describe('resolveLatestStableVersion', () => {
    it('picks the newest stable 5.0.x timestamp', () => {
        const versions = [
            '5.0.20260829100031',
            '5.0.2-dev.pr18.7e6184ad',
            '5.0.20260901001712',
            '4.2.0-beta.2',
            '5.0.20260903144513',
            '5.1.0',
            '6.0.0',
        ];

        expect(resolveLatestStableVersion(versions)).toBe('5.0.20260903144513');
    });

    it('returns undefined when no stable 5.0.x version exists', () => {
        expect(resolveLatestStableVersion(['5.0.2-dev.pr30.42bccc2a', '4.2.0', '5.1.0'])).toBeUndefined();
    });

    it('returns undefined for an empty list', () => {
        expect(resolveLatestStableVersion([])).toBeUndefined();
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
            devDependencies: { '@adguard/dnr-rulesets': '5.1.0-beta.1' },
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
});
