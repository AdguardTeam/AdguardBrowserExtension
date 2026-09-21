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
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
} from 'vitest';

const SCRIPT_PATH = path.resolve(__dirname, '../../tools/ci/stage-deploy-artifacts.sh');

const BUILD_FILES = [
    'chrome-mv2.zip', 'chrome-mv3.zip', 'edge-mv2.zip', 'opera-mv2.zip',
    'opera-mv3.zip', 'firefox.zip', 'source.zip', 'approval-notes.txt', 'build.txt',
];

const COMMON_OUTPUTS = {
    'static-chrome': ['chrome.zip', 'chrome-mv3.zip', 'build.txt'],
    'cws-mv3': ['chrome.zip'],
    'gh-assets': ['chrome-mv2.zip', 'chrome-mv3.zip', 'edge-mv2.zip', 'build.txt'],
};

let workspace: string;

beforeEach(() => {
    workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'stage-deploy-'));
    fs.mkdirSync(path.join(workspace, 'output/build/artifacts'), { recursive: true });
    fs.mkdirSync(path.join(workspace, 'output/crx/artifacts'), { recursive: true });
    BUILD_FILES.forEach((file) => {
        fs.writeFileSync(path.join(workspace, 'output/build/artifacts', file), `package: ${file}`);
    });
    ['chrome-mv2.crx', 'update.xml'].forEach((file) => {
        fs.writeFileSync(path.join(workspace, 'output/crx/artifacts', file), `package: ${file}`);
    });
});

afterEach(() => {
    fs.rmSync(workspace, { recursive: true, force: true });
});

describe('Deploy artifact staging', () => {
    it.each(['beta', 'release'])('preserves filenames and package contents for %s consumers', (channel) => {
        const result = spawnSync('bash', [SCRIPT_PATH, channel], { cwd: workspace, encoding: 'utf8' });
        expect(result.status, result.stdout + result.stderr).toBe(0);

        const expected = channel === 'beta' ? {
            ...COMMON_OUTPUTS,
            'static-chrome': [...COMMON_OUTPUTS['static-chrome'], 'chrome.crx', 'update.xml'],
            'gh-assets': [...COMMON_OUTPUTS['gh-assets'], 'chrome-mv2.crx'],
        } : {
            ...COMMON_OUTPUTS,
            'static-firefox': ['firefox.zip', 'build.txt'],
            'cws-mv2': ['chrome.zip'],
            amo: ['firefox.zip', 'source.zip', 'approval-notes.txt'],
            edge: ['edge.zip'],
            'gh-assets': [...COMMON_OUTPUTS['gh-assets'], 'opera-mv2.zip', 'opera-mv3.zip', 'firefox.zip'],
        };
        const staged = path.join(workspace, 'staged');
        expect(fs.readdirSync(staged).sort()).toEqual(Object.keys(expected).sort());
        Object.entries(expected).forEach(([consumer, files]) => {
            expect(fs.readdirSync(path.join(staged, consumer)).sort()).toEqual([...files].sort());
            files.forEach((file) => {
                let source = file;
                if (file === 'chrome.zip') {
                    source = consumer === 'cws-mv3' ? 'chrome-mv3.zip' : 'chrome-mv2.zip';
                } else if (file === 'edge.zip') {
                    source = 'edge-mv2.zip';
                } else if (file === 'chrome.crx') {
                    source = 'chrome-mv2.crx';
                }
                const sourceDir = source === 'chrome-mv2.crx' || source === 'update.xml' ? 'crx' : 'build';
                expect(fs.readFileSync(path.join(staged, consumer, file))).toEqual(
                    fs.readFileSync(path.join(workspace, 'output', sourceDir, 'artifacts', source)),
                );
            });
        });
    });

    it.each([
        ['beta', 'build/chrome-mv2.zip'],
        ['beta', 'crx/chrome-mv2.crx'],
        ['release', 'build/edge-mv2.zip'],
        ['release', 'build/opera-mv2.zip'],
    ])('fails when %s is missing %s', (channel, missing) => {
        const [source, file] = missing.split('/') as [string, string];
        fs.unlinkSync(path.join(workspace, 'output', source, 'artifacts', file));
        const result = spawnSync('bash', [SCRIPT_PATH, channel], { cwd: workspace, encoding: 'utf8' });
        expect(result.status).not.toBe(0);
    });

    it('rejects an unknown channel before creating deploy artifacts', () => {
        const result = spawnSync('bash', [SCRIPT_PATH, 'invalid'], { cwd: workspace });
        expect(result.status).not.toBe(0);
        expect(fs.existsSync(path.join(workspace, 'staged'))).toBe(false);
    });
});
