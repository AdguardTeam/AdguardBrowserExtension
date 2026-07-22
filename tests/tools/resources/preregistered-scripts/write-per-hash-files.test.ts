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

import {
    describe,
    it,
    expect,
    afterEach,
} from 'vitest';

/* eslint-disable max-len */
import {
    writePerHashFiles,
} from '../../../../tools/resources/preregistered-scripts/code-generators/per-hash-generator/write-per-hash-files';
import { type CollectedRuleEntry } from '../../../../tools/resources/preregistered-scripts/scriptlet-collector';
/* eslint-enable max-len */

describe('writePerHashFiles', () => {
    let outputDir: string;

    const TEST_KEY = '__ag_test0123456789ab';

    afterEach(async () => {
        if (outputDir) {
            await fs.rm(outputDir, { recursive: true, force: true });
        }
    });

    it('does not corrupt a JS rule body containing "$&" via String.replace special patterns', async () => {
        outputDir = await fs.mkdtemp(path.join(os.tmpdir(), 'per-hash-files-'));

        const hash = 'deadbeefdeadbeef';
        const jsBody = "window.foo = 'x'.replace(/x/g, '\\$&\\$&');";
        const entry: CollectedRuleEntry = {
            hash,
            jsBody,
        };

        await writePerHashFiles(new Map([[hash, entry]]), outputDir, TEST_KEY);

        const content = await fs.readFile(path.join(outputDir, `${hash}.js`), 'utf-8');

        expect(content).not.toContain('__KEY__');
        expect(content).not.toContain('__CODE__');
        expect(content).not.toContain('__PROP__');
        // The compiled body must retain the "$&$&" sequence from jsBody unchanged
        // (the minifier drops the redundant "\" before "$", since "\$" and "$" are
        // the same string literal in JS — that's fine, only corruption into a
        // literal "__CODE__" would indicate the bug).
        expect(content).toContain('$&$&');
    });

    it('throws when an entry has neither scriptletName nor jsBody', async () => {
        outputDir = await fs.mkdtemp(path.join(os.tmpdir(), 'per-hash-files-'));

        const hash = 'emptyentryhash01';
        const entry: CollectedRuleEntry = { hash };

        await expect(writePerHashFiles(new Map([[hash, entry]]), outputDir, TEST_KEY)).rejects.toThrow();
    });

    it('emits a scriptlet invocation via <coordinationKey>.r, not a fixed "_ag" name/window prop', async () => {
        outputDir = await fs.mkdtemp(path.join(os.tmpdir(), 'per-hash-files-'));

        const hash = 'scriptlethash0001';
        const entry: CollectedRuleEntry = {
            hash,
            scriptletName: 'abort-on-property-read',
            scriptletArgs: ['foo'],
        };

        await writePerHashFiles(new Map([[hash, entry]]), outputDir, TEST_KEY);

        const content = await fs.readFile(path.join(outputDir, `${hash}.js`), 'utf-8');

        // Bare identifier reference (lexical `let` binding declared by the
        // shared bundle), not a `window` property access.
        expect(content).toContain(`${TEST_KEY}.r(`);
        expect(content).not.toContain('_ag.r');
        expect(content).not.toContain('window._ag');
        expect(content).not.toContain(`window.${TEST_KEY}`);
        expect(content).not.toContain(`window["${TEST_KEY}"]`);
    });

    it('wraps a JS rule dedup guard in <coordinationKey>.b, not a fixed "_ag" name or a window property', async () => {
        outputDir = await fs.mkdtemp(path.join(os.tmpdir(), 'per-hash-files-'));

        const hash = 'jsrulehash00000001';
        const entry: CollectedRuleEntry = {
            hash,
            jsBody: "console.log('hi');",
        };

        await writePerHashFiles(new Map([[hash, entry]]), outputDir, TEST_KEY);

        const content = await fs.readFile(path.join(outputDir, `${hash}.js`), 'utf-8');

        expect(content).toContain(`${TEST_KEY}.b`);
        expect(content).not.toContain('_ag.b');
        expect(content).not.toContain('window._ag');
        expect(content).not.toContain(`window.${TEST_KEY}`);
    });

    it('uses a different coordination key per call, and only that key appears in the output', async () => {
        outputDir = await fs.mkdtemp(path.join(os.tmpdir(), 'per-hash-files-'));

        const keyA = '__ag_aaaaaaaaaaaaaaaa';
        const keyB = '__ag_bbbbbbbbbbbbbbbb';
        const hash = 'keyisolationhash1';
        const entry: CollectedRuleEntry = {
            hash,
            scriptletName: 'abort-on-property-read',
            scriptletArgs: ['foo'],
        };

        await writePerHashFiles(new Map([[hash, entry]]), outputDir, keyA);
        const contentA = await fs.readFile(path.join(outputDir, `${hash}.js`), 'utf-8');
        expect(contentA).toContain(keyA);
        expect(contentA).not.toContain(keyB);

        await writePerHashFiles(new Map([[hash, entry]]), outputDir, keyB);
        const contentB = await fs.readFile(path.join(outputDir, `${hash}.js`), 'utf-8');
        expect(contentB).toContain(keyB);
        expect(contentB).not.toContain(keyA);
    });
});
