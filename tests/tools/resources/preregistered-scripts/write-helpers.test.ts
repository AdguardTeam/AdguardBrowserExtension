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

import os from 'node:os';
import path from 'node:path';
import { promises as fs } from 'node:fs';

import {
    describe,
    it,
    expect,
    beforeEach,
    afterEach,
} from 'vitest';

import { writeBundle } from '../../../../tools/resources/preregistered-scripts/write-helpers';

describe('writeBundle', () => {
    let tempDir: string;

    beforeEach(async () => {
        tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'write-bundle-test-'));
    });

    afterEach(async () => {
        await fs.rm(tempDir, { recursive: true, force: true });
    });

    it('writes valid JavaScript content to disk with a trailing newline', async () => {
        const filePath = path.join(tempDir, 'test.js');
        await writeBundle('var x = 1;', filePath);

        const written = await fs.readFile(filePath, 'utf-8');
        expect(written).toBe('var x = 1;\n');
    });

    it('does not double-append a trailing newline', async () => {
        const filePath = path.join(tempDir, 'newline.js');
        await writeBundle('var x = 1;\n', filePath);

        const written = await fs.readFile(filePath, 'utf-8');
        expect(written).toBe('var x = 1;\n');
    });

    it('writes an empty string without throwing', async () => {
        const filePath = path.join(tempDir, 'empty.js');
        await expect(writeBundle('', filePath)).resolves.toBeUndefined();

        const written = await fs.readFile(filePath, 'utf-8');
        expect(written).toBe('\n');
    });

    it('writes a complex valid IIFE', async () => {
        const filePath = path.join(tempDir, 'bundle.js');
        const code = '(function() { var _g = window._g; if (!_g) return; _g.r("foo", {}, [], "k"); })();';
        await writeBundle(code, filePath);

        const written = await fs.readFile(filePath, 'utf-8');
        expect(written).toBe(`${code}\n`);
    });

    it('throws for a syntax error and includes the file name in the message, without writing the file', async () => {
        const filePath = path.join(tempDir, 'bad-bundle.js');
        await expect(writeBundle('var = ;', filePath)).rejects.toThrowError(/bad-bundle\.js/);

        await expect(fs.readFile(filePath, 'utf-8')).rejects.toThrow();
    });

    it('throws for unclosed braces', async () => {
        const filePath = path.join(tempDir, 'unclosed.js');
        await expect(writeBundle('function foo() {', filePath)).rejects.toThrow();
    });

    it('throws for an unexpected token', async () => {
        const filePath = path.join(tempDir, 'invalid.js');
        await expect(writeBundle('!!!', filePath)).rejects.toThrow();
    });
});
