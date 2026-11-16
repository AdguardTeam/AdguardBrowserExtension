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

const REPO_ROOT = path.resolve(__dirname, '../../..');
const SCRIPT_PATH = path.resolve(REPO_ROOT, 'tools/release/resolve-rollout.ts');
const TSX_PATH = path.resolve(REPO_ROOT, 'node_modules/.bin/tsx');

/**
 * Creates a temporary directory and an output file path inside it.
 *
 * @returns The directory and the output file path.
 */
const createOutputFile = (): { dir: string; file: string } => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cws-rollout-'));

    return { dir, file: path.join(dir, 'output') };
};

/**
 * Runs the resolver CLI with the given environment and output file.
 *
 * @param env Additional environment variables.
 * @param outputFile Value for `$GITHUB_OUTPUT`.
 *
 * @returns The process result.
 */
const runResolver = (env: Record<string, string>, outputFile: string) => spawnSync(TSX_PATH, [SCRIPT_PATH], {
    cwd: REPO_ROOT,
    env: {
        ...process.env,
        GITHUB_OUTPUT: outputFile,
        ...env,
    },
    encoding: 'utf8',
});

describe('resolve-rollout', () => {
    it('writes the rollout from the PR body to the output file', () => {
        const { dir, file } = createOutputFile();
        const result = runResolver({
            CHANNEL: 'release',
            PR_BODY: 'Release v5.6.0\n\nChrome Web Store rollout: 10%\n',
            ROLLOUT_INPUT: '',
        }, file);

        expect(result.status).toBe(0);
        expect(result.stdout).toBe('');
        expect(fs.readFileSync(file, 'utf8')).toBe('rollout-percentage=10\n');
        fs.rmSync(dir, { recursive: true, force: true });
    });

    it('writes no percentage for the beta channel', () => {
        const { dir, file } = createOutputFile();
        const result = runResolver({
            CHANNEL: 'beta',
            PR_BODY: 'Chrome Web Store rollout: 50%',
            ROLLOUT_INPUT: '50',
        }, file);

        expect(result.status).toBe(0);
        expect(fs.readFileSync(file, 'utf8')).toBe('rollout-percentage=\n');
        fs.rmSync(dir, { recursive: true, force: true });
    });

    it('writes the default with a warning on an invalid PR body line', () => {
        const { dir, file } = createOutputFile();
        const result = runResolver({
            CHANNEL: 'release',
            PR_BODY: 'Chrome Web Store rollout: 5',
            ROLLOUT_INPUT: '',
        }, file);

        expect(result.status).toBe(0);
        expect(result.stdout).toContain('::warning::');
        expect(fs.readFileSync(file, 'utf8')).toBe('rollout-percentage=1\n');
        fs.rmSync(dir, { recursive: true, force: true });
    });

    it('fails on an invalid dispatch input', () => {
        const { dir, file } = createOutputFile();
        const result = runResolver({
            CHANNEL: 'release',
            PR_BODY: '',
            ROLLOUT_INPUT: 'abc',
        }, file);

        expect(result.status).toBe(1);
        expect(result.stderr).toContain('CWS rollout percentage must be an integer');
        expect(fs.existsSync(file)).toBe(false);
        fs.rmSync(dir, { recursive: true, force: true });
    });
});
