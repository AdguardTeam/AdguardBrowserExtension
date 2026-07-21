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

        await writePerHashFiles(new Map([[hash, entry]]), outputDir);

        const content = await fs.readFile(path.join(outputDir, `${hash}.js`), 'utf-8');

        expect(content).not.toContain('__KEY__');
        expect(content).not.toContain('__CODE__');
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

        await expect(writePerHashFiles(new Map([[hash, entry]]), outputDir)).rejects.toThrow();
    });
});
