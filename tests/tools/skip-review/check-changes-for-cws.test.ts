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

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
    describe,
    expect,
    it,
} from 'vitest';

import {
    CheckMode,
    CwsEligibilityError,
    EXPEDITED_SCOPE_HINT_HEADING,
    FILTERS_DIR,
    RULESET_DECLARATION_HINT_HEADING,
    compareManifestsAndRules,
    ensureOnlyAllowedChanges,
    getChangedFiles,
    isInsideDir,
    toExtensionRelativePath,
} from '../../../tools/skip-review/check-changes-for-cws';

/**
 * Write files under the root directory, creating parent directories.
 *
 * @param root Directory to write to.
 * @param files File contents keyed by path relative to `root`.
 */
const writeFiles = (root: string, files: Record<string, string>) => {
    for (const [relativePath, content] of Object.entries(files)) {
        const filePath = path.join(root, relativePath);
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, content);
    }
};

/**
 * Create a pair of extension directories, run the callback and clean up.
 *
 * @param oldFiles Files of the old extension, keyed by relative path.
 * @param newFiles Files of the new extension, keyed by relative path.
 * @param run Callback receiving the fixture directories.
 */
const withFixture = async (
    oldFiles: Record<string, string>,
    newFiles: Record<string, string>,
    run: (dirs: { oldDir: string; newDir: string }) => Promise<void>,
) => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cws-check-'));
    const oldDir = path.join(root, 'old');
    const newDir = path.join(root, 'new');

    try {
        writeFiles(oldDir, oldFiles);
        writeFiles(newDir, newFiles);
        await run({ oldDir, newDir });
    } finally {
        fs.rmSync(root, { recursive: true, force: true });
    }
};

describe('toExtensionRelativePath', () => {
    it('makes a `./`-prefixed diff path relative to the old directory', () => {
        expect(toExtensionRelativePath('./tmp/old/filters/a.json', './tmp/old', './tmp/new'))
            .toBe('filters/a.json');
    });

    it('makes an absolute diff path relative to the new directory', () => {
        expect(toExtensionRelativePath('/abs/new/filters/a.json', './tmp/old', '/abs/new'))
            .toBe('filters/a.json');
    });

    it('returns null for a path outside both directories', () => {
        expect(toExtensionRelativePath('/elsewhere/a.json', './tmp/old', './tmp/new')).toBeNull();
    });
});

describe('isInsideDir', () => {
    it('accepts the directory itself and its children', () => {
        expect(isInsideDir('filters', 'filters')).toBe(true);
        expect(isInsideDir('filters/declarative/1/1.json', 'filters')).toBe(true);
    });

    it('rejects a sibling whose name only shares the prefix', () => {
        expect(isInsideDir('filters-extra/a.js', 'filters')).toBe(false);
        expect(isInsideDir('background.js', 'filters')).toBe(false);
    });
});

describe('getChangedFiles', () => {
    it('returns changed paths relative to the extension roots', async () => {
        await withFixture(
            {
                'manifest.json': '{"version": "5.5.2.1"}',
                'background.js': 'console.log(1);',
                'filters/declarative/ruleset_1/ruleset_1.json': '[]',
            },
            {
                'manifest.json': '{"version": "5.5.2.2"}',
                'background.js': 'console.log(1);',
                'filters/declarative/ruleset_1/ruleset_1.json': '[{"id": 1}]',
                'filters/local_script_rules.js': 'export default [];',
            },
            async ({ oldDir, newDir }) => {
                const changed = await getChangedFiles(oldDir, newDir);

                expect([...changed].sort()).toEqual([
                    'filters/declarative/ruleset_1/ruleset_1.json',
                    'filters/local_script_rules.js',
                    'manifest.json',
                ]);
            },
        );
    });

    it('fails closed when a file name splits a diff message across lines', async () => {
        await withFixture(
            { 'filters\npayload.js': 'a' },
            { 'filters\npayload.js': 'b' },
            async ({ oldDir, newDir }) => {
                await expect(getChangedFiles(oldDir, newDir)).rejects.toThrow('Cannot map diff path(s)');
            },
        );
    });

    it('parses file names containing ` and `', async () => {
        await withFixture(
            { 'filters/a and b.json': 'a' },
            { 'filters/a and b.json': 'b' },
            async ({ oldDir, newDir }) => {
                const changed = await getChangedFiles(oldDir, newDir);

                expect([...changed]).toEqual(['filters/a and b.json']);
            },
        );
    });

    it('resolves an `Only in` line whose directory name contains `: `', async () => {
        await withFixture(
            { 'filters: x/.keep': 'keep' },
            { 'filters: x/.keep': 'keep', 'filters: x/evil.js': 'evil' },
            async ({ oldDir, newDir }) => {
                const changed = await getChangedFiles(oldDir, newDir);

                expect([...changed]).toEqual(['filters: x/evil.js']);
            },
        );
    });

    it('parses an `Only in` file name containing `: `', async () => {
        await withFixture(
            { 'filters/.keep': 'keep' },
            { 'filters/.keep': 'keep', 'filters/a: b.json': 'rules' },
            async ({ oldDir, newDir }) => {
                const changed = await getChangedFiles(oldDir, newDir);

                expect([...changed]).toEqual(['filters/a: b.json']);
            },
        );
    });

    it('fails closed when a diff entry cannot be mapped to the extension roots', async () => {
        const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cws-check-unmappable-'));
        const oldFile = path.join(root, 'old.txt');
        const newFile = path.join(root, 'new.txt');
        fs.writeFileSync(oldFile, 'a');
        fs.writeFileSync(newFile, 'b');

        try {
            await expect(getChangedFiles(oldFile, newFile)).rejects.toThrow('Cannot map diff path(s)');
        } finally {
            fs.rmSync(root, { recursive: true, force: true });
        }
    });
});

/**
 * Minimal MV3 manifest declaring one declarative ruleset.
 *
 * @param version Manifest version.
 *
 * @returns Manifest file content.
 */
const makeManifest = (version: string): string => {
    return JSON.stringify({
        manifest_version: 3,
        name: 'fixture',
        version,
        permissions: ['declarativeNetRequest'],
        declarative_net_request: {
            rule_resources: [
                {
                    id: 'ruleset_1',
                    enabled: true,
                    path: 'filters/declarative/ruleset_1/ruleset_1.json',
                },
            ],
        },
    }, null, 4);
};

/**
 * Minimal MV3 manifest with an optional `update_url` added by CWS.
 *
 * @param version Manifest version.
 * @param updateUrl Value of the `update_url` field, omitted when undefined.
 *
 * @returns Manifest file content.
 */
const makeManifestWithUpdateUrl = (version: string, updateUrl?: string): string => {
    const manifest = JSON.parse(makeManifest(version));
    if (updateUrl) {
        manifest.update_url = updateUrl;
    }

    return JSON.stringify(manifest, null, 4);
};

const REPO_ROOT = path.resolve(__dirname, '../../..');
// The Dockerfile invokes the tool without the `.ts` extension.
const CLI_SCRIPT = 'tools/skip-review/check-changes-for-cws';

/**
 * Run the checker CLI exactly as the Dockerfile does: extensionless entry
 * point through tsx.
 *
 * @param args CLI arguments.
 *
 * @returns Exit code and combined output of the CLI.
 */
const runCli = (args: string[]) => {
    const result = spawnSync('pnpm', ['tsx', CLI_SCRIPT, ...args], {
        cwd: REPO_ROOT,
        encoding: 'utf-8',
    });

    return {
        status: result.status,
        output: `${result.stdout}${result.stderr}`,
    };
};

const SAFE_RULES = JSON.stringify([{
    id: 1,
    priority: 1,
    action: { type: 'block' },
    condition: { urlFilter: '||ads.example^' },
}]);

const UNSAFE_RULES = JSON.stringify([{
    id: 2,
    priority: 1,
    action: {
        type: 'modifyHeaders',
        requestHeaders: [{ header: 'referer', operation: 'remove' }],
    },
    condition: { urlFilter: '||ads.example^' },
}]);

/**
 * Run `ensureOnlyAllowedChanges` with the standard-review scope, where any
 * change under `filters/` is allowed.
 *
 * @param oldDir Path to the old extension directory.
 * @param newDir Path to the new extension directory.
 *
 * @returns Promise that resolves when only changes under `filters/` are present.
 */
const ensureFiltersOnly = (oldDir: string, newDir: string) => {
    return ensureOnlyAllowedChanges(
        oldDir,
        newDir,
        (relativeFilePath) => isInsideDir(relativeFilePath, FILTERS_DIR),
    );
};

describe('ensureOnlyAllowedChanges', () => {
    it('allows filter-only changes when the allowed scope is the filters directory', async () => {
        await withFixture(
            {
                'background.js': 'a',
                'filters/declarative/ruleset_1/ruleset_1.json': SAFE_RULES,
                'filters/local_script_rules.js': 'a',
            },
            {
                'background.js': 'a',
                'filters/declarative/ruleset_1/ruleset_1.json': UNSAFE_RULES,
                'filters/local_script_rules.js': 'b',
            },
            async ({ oldDir, newDir }) => {
                await expect(ensureFiltersOnly(oldDir, newDir)).resolves.toBeUndefined();
            },
        );
    });

    it('rejects a code change outside the filters directory', async () => {
        await withFixture(
            { 'background.js': 'a' },
            { 'background.js': 'b' },
            async ({ oldDir, newDir }) => {
                await expect(ensureFiltersOnly(oldDir, newDir))
                    .rejects.toThrow('❌ Files outside the allowed scope were changed!');
            },
        );
    });

    it('ignores an insignificant manifest version change', async () => {
        await withFixture(
            { 'manifest.json': makeManifest('5.5.2.1') },
            { 'manifest.json': makeManifest('5.5.2.2') },
            async ({ oldDir, newDir }) => {
                await expect(ensureFiltersOnly(oldDir, newDir)).resolves.toBeUndefined();
            },
        );
    });

    it('ignores a manifest with the same fields in a different order', async () => {
        const manifest = JSON.parse(makeManifest('5.5.2.1'));
        const reordered = {
            declarative_net_request: manifest.declarative_net_request,
            permissions: manifest.permissions,
            version: manifest.version,
            name: manifest.name,
            manifest_version: manifest.manifest_version,
        };

        await withFixture(
            { 'manifest.json': JSON.stringify(manifest, null, 4) },
            { 'manifest.json': JSON.stringify(reordered, null, 4) },
            async ({ oldDir, newDir }) => {
                await expect(ensureFiltersOnly(oldDir, newDir)).resolves.toBeUndefined();
            },
        );
    });

    it('rejects a significant manifest change', async () => {
        await withFixture(
            { 'manifest.json': makeManifest('5.5.2.1') },
            {
                'manifest.json': makeManifest('5.5.2.2')
                    .replace('"declarativeNetRequest"', '"declarativeNetRequest", "tabs"'),
            },
            async ({ oldDir, newDir }) => {
                await expect(ensureFiltersOnly(oldDir, newDir))
                    .rejects.toThrow('❌ Files outside the allowed scope were changed!');
            },
        );
    });

    it('ignores the update_url CWS adds to the published manifest', async () => {
        await withFixture(
            {
                // The published extension downloaded from CWS has `update_url`
                // added, the fresh build does not.
                'manifest.json': makeManifestWithUpdateUrl(
                    '5.5.2.1',
                    'https://clients2.google.com/service/update2/crx',
                ),
            },
            { 'manifest.json': makeManifestWithUpdateUrl('5.5.2.1') },
            async ({ oldDir, newDir }) => {
                await expect(ensureFiltersOnly(oldDir, newDir)).resolves.toBeUndefined();
            },
        );
    });

    it('ignores an update_url present on the fresh build side as well', async () => {
        await withFixture(
            { 'manifest.json': makeManifestWithUpdateUrl('5.5.2.1') },
            {
                'manifest.json': makeManifestWithUpdateUrl(
                    '5.5.2.1',
                    'https://clients2.google.com/service/update2/crx',
                ),
            },
            async ({ oldDir, newDir }) => {
                await expect(ensureFiltersOnly(oldDir, newDir)).resolves.toBeUndefined();
            },
        );
    });

    it('rejects a directory whose name contains `: ` next to the allowed scope', async () => {
        await withFixture(
            {
                'manifest.json': makeManifest('5.5.2.1'),
                'filters: x/.keep': 'keep',
            },
            {
                'manifest.json': makeManifest('5.5.2.2'),
                'filters: x/.keep': 'keep',
                'filters: x/evil.js': 'evil',
            },
            async ({ oldDir, newDir }) => {
                await expect(ensureFiltersOnly(oldDir, newDir))
                    .rejects.toThrow('❌ Files outside the allowed scope were changed!');
            },
        );
    });

    it('accepts an added file with `: ` in its name under filters/', async () => {
        await withFixture(
            { 'filters/.keep': 'keep' },
            { 'filters/.keep': 'keep', 'filters/a: b.json': 'rules' },
            async ({ oldDir, newDir }) => {
                await expect(ensureFiltersOnly(oldDir, newDir)).resolves.toBeUndefined();
            },
        );
    });

    it('ignores changes in the CWS _metadata folder', async () => {
        await withFixture(
            {
                'manifest.json': makeManifest('5.5.2.1'),
                '_metadata/computed_hashes.json': '{"hashes": []}',
            },
            {
                'manifest.json': makeManifest('5.5.2.1'),
                '_metadata/computed_hashes.json': '{"hashes": [1]}',
            },
            async ({ oldDir, newDir }) => {
                await expect(ensureFiltersOnly(oldDir, newDir)).resolves.toBeUndefined();
            },
        );
    });

    it('rejects a root file whose name only shares the metadata prefix', async () => {
        await withFixture(
            {
                '_metadata_backup/computed_hashes.json': '{"hashes": []}',
            },
            {
                '_metadata_backup/computed_hashes.json': '{"hashes": [1]}',
            },
            async ({ oldDir, newDir }) => {
                await expect(ensureFiltersOnly(oldDir, newDir))
                    .rejects.toThrow('❌ Files outside the allowed scope were changed!');
            },
        );
    });

    it('rejects a file removed outside the allowed scope', async () => {
        await withFixture(
            {
                'manifest.json': makeManifest('5.5.2.1'),
                'background.js': 'a',
            },
            { 'manifest.json': makeManifest('5.5.2.1') },
            async ({ oldDir, newDir }) => {
                await expect(ensureFiltersOnly(oldDir, newDir))
                    .rejects.toThrow('❌ Files outside the allowed scope were changed!');
            },
        );
    });
});

describe('compareManifestsAndRules', () => {
    const oldFiles = {
        'manifest.json': makeManifest('5.5.2.1'),
        'background.js': 'console.log(1);',
        'filters/declarative/ruleset_1/ruleset_1.json': SAFE_RULES,
    };

    const newFiles = {
        'manifest.json': makeManifest('5.5.2.2'),
        'background.js': 'console.log(1);',
        'filters/declarative/ruleset_1/ruleset_1.json': UNSAFE_RULES,
    };

    it('accepts unsafe rule changes in the standard review mode', async () => {
        await withFixture(oldFiles, newFiles, async ({ oldDir, newDir }) => {
            await expect(compareManifestsAndRules(oldDir, newDir, CheckMode.StandardReview))
                .resolves.toBeUndefined();
        });
    });

    it('rejects code changes outside filters/ in the standard review mode', async () => {
        await withFixture(
            oldFiles,
            { ...newFiles, 'background.js': 'console.log(2);' },
            async ({ oldDir, newDir }) => {
                await expect(compareManifestsAndRules(oldDir, newDir, CheckMode.StandardReview))
                    .rejects.toThrow('❌ Files outside the allowed scope were changed!');
            },
        );
    });

    it('allows the background bundle when the local script rules module changed', async () => {
        await withFixture(
            {
                ...oldFiles,
                'pages/background.js': 'console.log(1);',
                'filters/local_script_rules.js': 'export const localScriptRules = { a: () => {} };',
            },
            {
                ...newFiles,
                'pages/background.js': 'console.log(2);',
                'filters/local_script_rules.js': 'export const localScriptRules = { b: () => {} };',
            },
            async ({ oldDir, newDir }) => {
                await expect(compareManifestsAndRules(oldDir, newDir, CheckMode.StandardReview))
                    .resolves.toBeUndefined();
            },
        );
    });

    it('rejects the background bundle when the local script rules module did not change', async () => {
        const rules = 'export const localScriptRules = { a: () => {} };';

        await withFixture(
            {
                ...oldFiles,
                'pages/background.js': 'console.log(1);',
                'filters/local_script_rules.js': rules,
            },
            {
                ...newFiles,
                'pages/background.js': 'console.log(2);',
                'filters/local_script_rules.js': rules,
            },
            async ({ oldDir, newDir }) => {
                await expect(compareManifestsAndRules(oldDir, newDir, CheckMode.StandardReview))
                    .rejects.toThrow('❌ Files outside the allowed scope were changed!');
            },
        );
    });

    it('rejects the background bundle in the expedited mode even when the local script rules changed', async () => {
        await withFixture(
            {
                ...oldFiles,
                'pages/background.js': 'console.log(1);',
                'filters/local_script_rules.js': 'export const localScriptRules = { a: () => {} };',
            },
            {
                ...oldFiles,
                'manifest.json': makeManifest('5.5.2.2'),
                'pages/background.js': 'console.log(2);',
                'filters/local_script_rules.js': 'export const localScriptRules = { b: () => {} };',
            },
            async ({ oldDir, newDir }) => {
                await expect(compareManifestsAndRules(oldDir, newDir, CheckMode.Expedited))
                    .rejects.toThrow('❌ Files outside the allowed scope were changed!');
            },
        );
    });

    it('rejects unsafe rule changes in the expedited mode', async () => {
        await withFixture(oldFiles, newFiles, async ({ oldDir, newDir }) => {
            await expect(compareManifestsAndRules(oldDir, newDir, CheckMode.Expedited))
                .rejects.toThrow('❌ There are changes NOT in safe rules (see above)');
        });
    });

    it('accepts safe rule changes in the expedited mode', async () => {
        await withFixture(
            oldFiles,
            {
                ...newFiles,
                'filters/declarative/ruleset_1/ruleset_1.json': SAFE_RULES.replace('ads.example', 'ads2.example'),
            },
            async ({ oldDir, newDir }) => {
                await expect(compareManifestsAndRules(oldDir, newDir, CheckMode.Expedited))
                    .resolves.toBeUndefined();
            },
        );
    });

    it('explains the scope when the ruleset list changes', async () => {
        const newManifest = JSON.parse(makeManifest('5.5.2.2'));
        newManifest.declarative_net_request.rule_resources.push({
            id: 'ruleset_2',
            enabled: true,
            path: 'filters/declarative/ruleset_2/ruleset_2.json',
        });

        await withFixture(
            { 'manifest.json': makeManifest('5.5.2.1') },
            { 'manifest.json': JSON.stringify(newManifest, null, 4) },
            async ({ oldDir, newDir }) => {
                await expect(compareManifestsAndRules(oldDir, newDir, CheckMode.StandardReview))
                    .rejects.toThrow('outside the change scope of an auto-published build');
            },
        );
    });
});

describe('CwsEligibilityError', () => {
    // The trees differ only where each test introduces its change, so an
    // earlier check in `compareManifestsAndRules` cannot mask the path under
    // test.
    const baseOldFiles = {
        'manifest.json': makeManifest('5.5.2.1'),
        'background.js': 'console.log(1);',
        'filters/declarative/ruleset_1/ruleset_1.json': SAFE_RULES,
    };

    const baseNewFiles = {
        'manifest.json': makeManifest('5.5.2.2'),
        'background.js': 'console.log(1);',
        'filters/declarative/ruleset_1/ruleset_1.json': SAFE_RULES,
    };

    it('is thrown for changes outside the allowed scope', async () => {
        await withFixture(
            baseOldFiles,
            { ...baseNewFiles, 'background.js': 'console.log(2);' },
            async ({ oldDir, newDir }) => {
                await expect(compareManifestsAndRules(oldDir, newDir, CheckMode.Expedited))
                    .rejects.toBeInstanceOf(CwsEligibilityError);
            },
        );
    });

    it('is thrown for unsafe rules in the expedited mode', async () => {
        await withFixture(
            baseOldFiles,
            { ...baseNewFiles, 'filters/declarative/ruleset_1/ruleset_1.json': UNSAFE_RULES },
            async ({ oldDir, newDir }) => {
                await expect(compareManifestsAndRules(oldDir, newDir, CheckMode.Expedited))
                    .rejects.toBeInstanceOf(CwsEligibilityError);
            },
        );
    });

    it('is thrown when the ruleset declaration changes', async () => {
        const newManifest = JSON.parse(makeManifest('5.5.2.2'));
        newManifest.declarative_net_request.rule_resources.push({
            id: 'ruleset_2',
            enabled: true,
            path: 'filters/declarative/ruleset_2/ruleset_2.json',
        });

        await withFixture(
            baseOldFiles,
            {
                ...baseNewFiles,
                'manifest.json': JSON.stringify(newManifest, null, 4),
            },
            async ({ oldDir, newDir }) => {
                await expect(compareManifestsAndRules(oldDir, newDir, CheckMode.StandardReview))
                    .rejects.toBeInstanceOf(CwsEligibilityError);
            },
        );
    });

    it('is not thrown for a real build error', async () => {
        await withFixture({}, {}, async ({ oldDir, newDir }) => {
            const error = await compareManifestsAndRules(oldDir, newDir, CheckMode.Expedited)
                .catch((e: unknown) => e);

            expect(error).toBeInstanceOf(Error);
            expect(error).not.toBeInstanceOf(CwsEligibilityError);
        });
    });

    it('is not thrown when a declared ruleset is missing from a tree', async () => {
        await withFixture(
            {
                ...baseOldFiles,
                // A second file in the ruleset directory keeps the directory
                // present in both trees, so the diff reports the missing
                // ruleset file itself instead of the whole directory.
                'filters/declarative/ruleset_1/keep.txt': 'keep',
            },
            {
                'manifest.json': makeManifest('5.5.2.2'),
                'background.js': 'console.log(1);',
                'filters/declarative/ruleset_1/keep.txt': 'keep',
            },
            async ({ oldDir, newDir }) => {
                const error = await compareManifestsAndRules(oldDir, newDir, CheckMode.Expedited)
                    .catch((e: unknown) => e);

                expect(error).toBeInstanceOf(Error);
                expect(error).not.toBeInstanceOf(CwsEligibilityError);
                expect((error as Error).message).toContain('is missing in one of the compared directories');
            },
        );
    });

    it('is not thrown when a ruleset cannot be parsed', async () => {
        await withFixture(
            baseOldFiles,
            {
                ...baseNewFiles,
                'filters/declarative/ruleset_1/ruleset_1.json': '{ not valid json',
            },
            async ({ oldDir, newDir }) => {
                const error = await compareManifestsAndRules(oldDir, newDir, CheckMode.Expedited)
                    .catch((e: unknown) => e);

                expect(error).toBeInstanceOf(Error);
                expect(error).not.toBeInstanceOf(CwsEligibilityError);
                expect((error as Error).message).toContain('Failed to parse ruleset');
            },
        );
    });
});

describe.skipIf(process.platform === 'win32')('CLI entry point', () => {
    const cliOldFiles = {
        'manifest.json': makeManifest('5.5.2.1'),
        'filters/declarative/ruleset_1/ruleset_1.json': SAFE_RULES,
    };

    const cliNewFiles = {
        'manifest.json': makeManifest('5.5.2.2'),
        'filters/declarative/ruleset_1/ruleset_1.json': UNSAFE_RULES,
    };

    it('runs when invoked extensionless and reports an ineligible build with exit code 2', async () => {
        await withFixture(
            {
                'manifest.json': makeManifest('5.5.2.1'),
                'background.js': 'a',
                'filters/declarative/ruleset_1/ruleset_1.json': SAFE_RULES,
            },
            {
                'manifest.json': makeManifest('5.5.2.2'),
                'background.js': 'b',
                'filters/declarative/ruleset_1/ruleset_1.json': SAFE_RULES,
            },
            async ({ oldDir, newDir }) => {
                const { status, output } = runCli([oldDir, newDir]);

                // Exit code 2 tells the Dockerfile to skip the CWS publish
                // instead of failing the build, so the Edge publish still runs.
                expect(status).toBe(2);
                expect(output).toContain('❌ Files outside the allowed scope were changed!');
                expect(output).toContain('Auto-build failed on the expedited scope check');
            },
        );
    });

    it('reports a real build error with exit code 1', async () => {
        await withFixture({}, {}, async ({ oldDir, newDir }) => {
            const { status, output } = runCli([oldDir, newDir]);

            expect(status).toBe(1);
            expect(output).toContain('Manifest not found');
        });
    });

    it('accepts filter-only changes with --standard-review', async () => {
        await withFixture(cliOldFiles, cliNewFiles, async ({ oldDir, newDir }) => {
            const { status } = runCli([oldDir, newDir, '--standard-review']);

            expect(status).toBe(0);
        });
    });
});

describe('DEPLOYMENT.md references', () => {
    it('keeps the headings the error hints point at', () => {
        // Collapse the markdown line wrapping, so a heading split across two
        // lines still matches the single-line text embedded in the hints.
        const deployment = fs.readFileSync(path.resolve(__dirname, '../../../DEPLOYMENT.md'), 'utf-8')
            .replace(/\s+/g, ' ');

        expect(deployment).toContain(EXPEDITED_SCOPE_HINT_HEADING);
        expect(deployment).toContain(RULESET_DECLARATION_HINT_HEADING);
    });
});
