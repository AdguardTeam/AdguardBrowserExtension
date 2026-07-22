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

/* eslint-disable max-len */
import {
    writeCleanupFile,
} from '../../../../tools/resources/preregistered-scripts/code-generators/cleanup-generator/write-cleanup-file';
import {
    compileSharedScriptletsBundle,
} from '../../../../tools/resources/preregistered-scripts/code-generators/shared-bundle-generator/shared-bundle-generator';
/* eslint-enable max-len */

const TEST_KEY = '__ag_test0123456789ab';

describe('writeCleanupFile', () => {
    let outputDir: string;

    afterEach(async () => {
        if (outputDir) {
            await fs.rm(outputDir, { recursive: true, force: true });
        }
    });

    it('writes cleanup.js containing the provided coordination key', async () => {
        outputDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cleanup-file-'));

        await writeCleanupFile(TEST_KEY, outputDir);

        const content = await fs.readFile(path.join(outputDir, 'cleanup.js'), 'utf-8');

        // Compiles to `<coordinationKey>=undefined` (a reassignment of the
        // top-level `let` the bundle declares), not `delete window[...]`.
        expect(content).toContain(TEST_KEY);
        expect(content).not.toContain('__PROP__');
        expect(content).not.toContain('delete window');
        expect(content).not.toContain(`window.${TEST_KEY}`);
    });

    it('produces valid JavaScript syntax', async () => {
        outputDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cleanup-file-'));

        await writeCleanupFile(TEST_KEY, outputDir);

        const content = await fs.readFile(path.join(outputDir, 'cleanup.js'), 'utf-8');

        expect(() => {
            // eslint-disable-next-line no-new
            new vm.Script(content);
        }).not.toThrow();
    });

    it('reassigns the coordination binding created by the shared bundle to undefined', async () => {
        outputDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cleanup-file-'));

        const bundle = await compileSharedScriptletsBundle(
            new Set(['abort-on-property-read']),
            TEST_KEY,
        );
        await writeCleanupFile(TEST_KEY, outputDir);
        const cleanup = await fs.readFile(path.join(outputDir, 'cleanup.js'), 'utf-8');

        expect(bundle).not.toBeNull();

        const sandbox: { window: Record<string, unknown>; document: { location: { hostname: string } } } = {
            window: {},
            document: { location: { hostname: 'example.com' } },
        };
        vm.createContext(sandbox);

        // Simulates the runtime order: shared bundle loads first...
        vm.runInContext(bundle as string, sandbox);
        expect(vm.runInContext(`typeof ${TEST_KEY}`, sandbox)).not.toBe('undefined');

        // ...cleanup.js loads last, after every per-hash file...
        vm.runInContext(cleanup, sandbox);

        // ...and by the time a page script could run, the binding is undefined —
        // indistinguishable from never having been declared to any `typeof` check.
        expect(vm.runInContext(`typeof ${TEST_KEY}`, sandbox)).toBe('undefined');
    });

    it('does not throw when the coordination property was never created', async () => {
        outputDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cleanup-file-'));

        await writeCleanupFile(TEST_KEY, outputDir);
        const cleanup = await fs.readFile(path.join(outputDir, 'cleanup.js'), 'utf-8');

        const sandbox: { window: Record<string, unknown> } = { window: {} };
        vm.createContext(sandbox);

        expect(() => {
            vm.runInContext(cleanup, sandbox);
        }).not.toThrow();
    });
});
