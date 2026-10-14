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

const SCRIPT_PATH = path.resolve(__dirname, '../../../tools/ci/check-cws-scope.sh');

/**
 * Stub `pnpm` installed into a fake bin dir: it prints the command line it was
 * called with and exits with the given code, so the test can drive the checker
 * outcome without running tsx.
 *
 * @param exitCode Exit code the stub returns.
 *
 * @returns Stub script content.
 */
const makePnpmStub = (exitCode: number) => [
    '#!/usr/bin/env bash',
    'echo "stub pnpm: $*"',
    `exit ${exitCode}`,
    '',
].join('\n');

/**
 * Run the scope check script with a stubbed `pnpm` on PATH.
 *
 * @param options Script inputs and stub behavior.
 * @param options.checkerExit Exit code the stubbed checker returns.
 * @param options.channel Channel argument.
 * @param options.reviewMode Review mode argument.
 * @param options.createProperties Whether the properties file exists.
 *
 * @returns Exit code, combined output and the resulting properties file.
 */
const runScript = ({
    checkerExit = 0,
    channel = 'beta',
    reviewMode = 'expedited',
    createProperties = true,
}: {
    checkerExit?: number;
    channel?: string;
    reviewMode?: string;
    createProperties?: boolean;
} = {}) => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cws-scope-'));
    const fakeBin = path.join(root, 'bin');
    fs.mkdirSync(fakeBin);

    const stubPath = path.join(fakeBin, 'pnpm');
    fs.writeFileSync(stubPath, makePnpmStub(checkerExit));
    fs.chmodSync(stubPath, 0o755);

    const propertiesFile = path.join(root, 'cws-publish.properties');
    if (createProperties) {
        fs.writeFileSync(propertiesFile, 'expedited=true\n');
    }

    const oldDir = path.join(root, 'old');
    const newDir = path.join(root, 'new');
    fs.mkdirSync(oldDir);
    fs.mkdirSync(newDir);

    try {
        const result = spawnSync('bash', [
            SCRIPT_PATH,
            propertiesFile,
            channel,
            oldDir,
            newDir,
            reviewMode,
        ], {
            encoding: 'utf-8',
            env: {
                ...process.env,
                PATH: `${fakeBin}:${process.env.PATH}`,
            },
        });

        return {
            status: result.status,
            output: `${result.stdout}${result.stderr}`,
            properties: fs.existsSync(propertiesFile)
                ? fs.readFileSync(propertiesFile, 'utf-8')
                : '',
        };
    } finally {
        fs.rmSync(root, { recursive: true, force: true });
    }
};

describe.skipIf(process.platform === 'win32')('check-cws-scope.sh', () => {
    it('records an eligible build without failing', () => {
        const { status, properties } = runScript({ checkerExit: 0, channel: 'beta' });

        expect(status).toBe(0);
        expect(properties).toContain('beta-scope=ok');
        // The script appends to the file the auto-build stage created.
        expect(properties).toContain('expedited=true');
    });

    it('records an ineligible build without failing', () => {
        const { status, output, properties } = runScript({ checkerExit: 2, channel: 'release' });

        expect(status).toBe(0);
        expect(properties).toContain('release-scope=ineligible');
        expect(output).toContain('publish will be skipped');
    });

    it('fails on a real checker error and records nothing', () => {
        const { status, properties } = runScript({ checkerExit: 1 });

        expect(status).toBe(1);
        expect(properties).not.toContain('-scope=');
    });

    it('passes --standard-review to the checker in the standard review mode', () => {
        const { status, output } = runScript({ reviewMode: 'standard-review' });

        expect(status).toBe(0);
        expect(output).toContain('--standard-review');
    });

    it('passes no review flag in the expedited mode', () => {
        const { status, output } = runScript({ reviewMode: 'expedited' });

        expect(status).toBe(0);
        expect(output).not.toContain('--standard-review');
    });

    it('rejects an unknown channel before running the checker', () => {
        const { status, output, properties } = runScript({ channel: 'chromium' });

        expect(status).toBe(1);
        expect(output).toContain("Unknown channel 'chromium'");
        expect(properties).not.toContain('-scope=');
    });

    it('rejects an unknown review mode', () => {
        const { status, output } = runScript({ reviewMode: 'fast-track' });

        expect(status).toBe(1);
        expect(output).toContain("Unknown review mode 'fast-track'");
    });

    it('fails when the properties file is missing', () => {
        const { status, output } = runScript({ createProperties: false });

        expect(status).toBe(1);
        expect(output).toContain('does not exist');
    });
});
