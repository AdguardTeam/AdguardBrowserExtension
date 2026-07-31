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

import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';

import {
    describe,
    it,
    expect,
    afterEach,
} from 'vitest';

import { CLEANUP_FILENAME } from '@adguard/tswebextension/mv3/preregistered-scripts/hasher';

/* eslint-disable max-len */
import {
    writeCleanupFile,
} from '../../../../tools/resources/preregistered-scripts/code-generators/cleanup-generator/write-cleanup-file';
import {
    compileSharedScriptletsBundle,
} from '../../../../tools/resources/preregistered-scripts/code-generators/shared-bundle-generator/shared-bundle-generator';
/* eslint-enable max-len */

const TEST_KEY = '__ag_test0123456789ab';
const TEST_CLEANUP_FILENAME = CLEANUP_FILENAME;

describe('writeCleanupFile', () => {
    let outputDir: string;

    afterEach(async () => {
        if (outputDir) {
            await fs.rm(outputDir, { recursive: true, force: true });
        }
    });

    it('writes a cleanup file that deletes the coordination window property', async () => {
        outputDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cleanup-file-'));

        await writeCleanupFile(TEST_KEY, outputDir);

        const content = await fs.readFile(path.join(outputDir, TEST_CLEANUP_FILENAME), 'utf-8');

        // The property is deleted outright (post-minification the template's
        // `delete window.__PROP__` becomes `delete window.<key>`).
        expect(content).toContain(`delete window.${TEST_KEY}`);
        // The key is a window property, not a lexical binding or a local
        // variable: no `let`/`var`/`const` declaration and no assignment.
        expect(content).not.toMatch(new RegExp(`(let|var|const)\\s+${TEST_KEY.replace(/\$/g, '\\$')}\\b`));
        expect(content).not.toContain(`${TEST_KEY}=`);
        expect(content).not.toContain('__PROP__');
    });

    it('does not throw when the coordination property was never created', async () => {
        outputDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cleanup-file-'));

        await writeCleanupFile(TEST_KEY, outputDir);
        const content = await fs.readFile(path.join(outputDir, TEST_CLEANUP_FILENAME), 'utf-8');

        // Running cleanup in an empty realm must not throw — the cleanup
        // script is registered after the shared bundle in the content-script
        // js array, so if the bundle fails, cleanup still runs.
        expect(() => {
            vm.runInNewContext(content, {});
        }).not.toThrow();
    });

    it('deletes the coordination property created by the shared bundle', async () => {
        outputDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cleanup-file-'));

        const bundle = await compileSharedScriptletsBundle(new Set(['abort-on-property-read']), TEST_KEY);
        await writeCleanupFile(TEST_KEY, outputDir);
        const cleanup = await fs.readFile(path.join(outputDir, TEST_CLEANUP_FILENAME), 'utf-8');

        // Emulate a page's MAIN world: window IS the global object.
        const sandbox: Record<string, unknown> = { document: { location: { hostname: 'example.com' } } };
        sandbox.window = sandbox;
        vm.createContext(sandbox);

        vm.runInContext(bundle, sandbox);
        expect(vm.runInContext(`typeof ${TEST_KEY}`, sandbox)).toBe('object');

        vm.runInContext(cleanup, sandbox);
        expect(vm.runInContext(`typeof ${TEST_KEY}`, sandbox)).toBe('undefined');
        expect(TEST_KEY in sandbox).toBe(false);
    });
});
