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
    mkdtemp,
    readFile,
    rm,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import vm from 'node:vm';

import {
    afterEach,
    describe,
    expect,
    it,
} from 'vitest';

import { SHARED_BUNDLE_FILENAME, getRuleFilename } from '@adguard/tswebextension/mv3/preregistered-scripts/hasher';

/* eslint-disable max-len */
import {
    writeSharedBundle,
} from '../../../../tools/resources/preregistered-scripts/code-generators/shared-bundle-generator/write-shared-bundle';
import {
    writePerHashFiles,
} from '../../../../tools/resources/preregistered-scripts/code-generators/per-hash-generator/write-per-hash-files';
/* eslint-enable max-len */

/**
 * Fixed coordination key used across tests, matching the shape of the real
 * generated key.
 */
const TEST_KEY = '__ag_test0123456789ab';

/**
 * Creates a vm sandbox emulating a page's MAIN world: `window` IS the
 * global object, so `window.<key> = ...` creates a global binding reachable
 * as a bare identifier.
 *
 * @returns Contextified sandbox.
 */
const createPageSandbox = (): Record<string, unknown> => {
    const sandbox: Record<string, unknown> = {
        document: { location: { hostname: 'example.com' } },
    };
    sandbox.window = sandbox;
    vm.createContext(sandbox);
    return sandbox;
};

describe('JS-only pipeline (end-to-end)', () => {
    let outputDir: string;

    afterEach(async () => {
        await rm(outputDir, { recursive: true, force: true });
    });

    it('writes the shared bundle and runs a JS rule exactly once even when its file executes twice', async () => {
        outputDir = await mkdtemp(path.join(tmpdir(), 'ag-js-only-'));

        const hash = '0123456789abcdef';
        await writeSharedBundle(outputDir, TEST_KEY);
        await writePerHashFiles(
            new Map([[hash, {
                hash,
                jsBody: 'window.__jsRuleHits = (window.__jsRuleHits || 0) + 1;',
            }]]),
            outputDir,
            TEST_KEY,
        );

        // The JS-only case: no `s-*.js` scriptlet function files are
        // written, yet the shared bundle must exist — the rule file's dedup
        // guard reads `<key>.b` from it.
        const bundle = await readFile(path.join(outputDir, SHARED_BUNDLE_FILENAME), 'utf-8');
        const ruleFile = await readFile(path.join(outputDir, getRuleFilename(hash)), 'utf-8');

        const sandbox = createPageSandbox();
        vm.runInContext(bundle, sandbox);
        // An updated host registration re-runs the same rule file; the
        // guard must dedup it against the shared bundle's Set.
        vm.runInContext(ruleFile, sandbox);
        vm.runInContext(ruleFile, sandbox);

        expect(sandbox.__jsRuleHits).toBe(1);
    });
});
