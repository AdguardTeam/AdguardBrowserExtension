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

const PIN_PATH = path.resolve(__dirname, '../../.github/actions/pin-tsurlfilter-dev/pin.mjs');

/**
 * The stub npm installed into the fake bin dir.
 *
 * Only `install --prefix <dir> ...` is used now that pin.mjs delegates all
 * registry access to the pin tool: it materializes a pinned `tsx`/`pnpm` into
 * `<dir>/node_modules/.bin`. `FAKE_TSX_FAIL=1` makes the fake tsx exit 1 to
 * simulate a pin-tool failure.
 */
const NPM_STUB = [
    '#!/usr/bin/env bash',
    'set -e',
    'if [[ "$1" == "install" ]]; then',
    '    bin="$3/node_modules/.bin"',
    '    mkdir -p "$bin"',
    '    printf \'#!/usr/bin/env bash\necho "tsx $*" >> "$RECORD"\n'
    + 'if [[ -n "$FAKE_TSX_FAIL" ]]; then echo "::error::pin tool failed" >&2; exit 1; fi\n'
    + 'exec pnpm install --no-frozen-lockfile --ignore-scripts\n\' > "$bin/tsx"',
    '    printf \'#!/usr/bin/env bash\necho "pinned-pnpm $*" >> "$RECORD"\n\' > "$bin/pnpm"',
    '    chmod +x "$bin/tsx" "$bin/pnpm"',
    '    exit 0',
    'fi',
    'exit 1',
    '',
].join('\n');

/**
 * Create a fake bin dir with the stub npm on PATH and return its path plus
 * cleanup. Env entries in `extra` are added to the spawned process.
 */
const withFakeBin = () => {
    const fakeBin = fs.mkdtempSync(path.join(os.tmpdir(), 'pin-test-bin-'));
    const npmPath = path.join(fakeBin, 'npm');
    fs.writeFileSync(npmPath, NPM_STUB);
    fs.chmodSync(npmPath, 0o755);
    return fakeBin;
};

/**
 * Run pin.mjs end-to-end against the stub npm/pnpm.
 *
 * @param overrides Environment overrides for the spawned process.
 *
 * @returns The process status, stderr, the GITHUB_OUTPUT content, and the stub
 *   record log.
 */
const runPin = (overrides: Record<string, string> = {}) => {
    const fakeHome = fs.mkdtempSync(path.join(os.tmpdir(), 'pin-test-home-'));
    const fakeBin = withFakeBin();
    const record = path.join(fakeHome, 'record.txt');
    const output = path.join(fakeHome, 'github-output.txt');
    try {
        const result = spawnSync(process.execPath, [PIN_PATH], {
            env: {
                ...process.env,
                HOME: fakeHome,
                PATH: `${fakeBin}:${process.env.PATH}`,
                RECORD: record,
                PR_INPUT: '26',
                RUN_INPUT: '',
                GITHUB_OUTPUT: output,
                GITHUB_EVENT_NAME: 'pull_request',
                ...overrides,
            },
            encoding: 'utf8',
        });
        return {
            status: result.status,
            stderr: result.stderr ?? '',
            output: fs.existsSync(output) ? fs.readFileSync(output, 'utf8') : '',
            record: fs.existsSync(record) ? fs.readFileSync(record, 'utf8') : '',
        };
    } finally {
        fs.rmSync(fakeHome, { recursive: true, force: true });
        fs.rmSync(fakeBin, { recursive: true, force: true });
    }
};

describe('pin.mjs end-to-end (npm/pnpm stubs)', () => {
    it('passes an explicit run to the pin tool', () => {
        const result = runPin({ RUN_INPUT: '123' });
        expect(result.status, result.stderr).toBe(0);
        expect(result.output).toContain('pr=26');
        expect(result.record).toContain('tsx tools/ci/use-dev-builds.ts --pr 26 --run 123 --extension .');
        expect(result.record).toContain('--with-dnr-converter');
        expect(result.record).toContain('--with-tswebextension');
    });

    it('omits --run so the tool selects the highest published run itself', () => {
        const result = runPin();
        expect(result.status, result.stderr).toBe(0);
        const toolLine = result.record.split('\n').find((line) => line.startsWith('tsx '));
        expect(toolLine).toBeDefined();
        expect(toolLine).toContain('--pr 26 --extension .');
        expect(toolLine).not.toContain('--run');
    });

    it('propagates a pin tool failure', () => {
        const result = runPin({ FAKE_TSX_FAIL: '1' });
        expect(result.status).not.toBe(0);
    });

    it('lets the pinned pnpm win on PATH when the pin tool refreshes the lockfile', () => {
        const fakeHome = fs.mkdtempSync(path.join(os.tmpdir(), 'pin-test-home-'));
        const fakeBin = withFakeBin();
        const record = path.join(fakeHome, 'record.txt');
        const output = path.join(fakeHome, 'github-output.txt');
        try {
            // Decoy pnpm in the ambient PATH — must lose to the pinned one.
            const decoy = path.join(fakeBin, 'pnpm');
            fs.writeFileSync(decoy, '#!/usr/bin/env bash\necho "decoy-pnpm $*" >> "$RECORD"\n');
            fs.chmodSync(decoy, 0o755);

            const result = spawnSync(process.execPath, [PIN_PATH], {
                env: {
                    ...process.env,
                    HOME: fakeHome,
                    PATH: `${fakeBin}:${process.env.PATH}`,
                    RECORD: record,
                    PR_INPUT: '26',
                    RUN_INPUT: '',
                    GITHUB_OUTPUT: output,
                    GITHUB_EVENT_NAME: 'pull_request',
                },
                encoding: 'utf8',
            });

            expect(result.status, result.stderr).toBe(0);
            const recordLines = fs.readFileSync(record, 'utf8');
            expect(recordLines).toContain('pinned-pnpm install --no-frozen-lockfile --ignore-scripts');
            expect(recordLines).not.toContain('decoy-pnpm');
        } finally {
            fs.rmSync(fakeHome, { recursive: true, force: true });
            fs.rmSync(fakeBin, { recursive: true, force: true });
        }
    }, 30000);
});
