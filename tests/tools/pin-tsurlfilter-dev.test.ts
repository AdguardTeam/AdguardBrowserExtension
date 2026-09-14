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
 * Behavior is steered by env vars so one script covers all cases:
 *   - `FAKE_NPM_FAIL` — every call fails (simulates a registry outage).
 *   - `FAKE_NPM_RAW` — every `view` call prints this verbatim (for the
 *     non-JSON case).
 *   - otherwise `view <pkg> dist-tags` prints `FAKE_DIST_TAGS` and
 *     `view <pkg> versions` prints `FAKE_VERSIONS`.
 *   - `install --prefix <dir> ...` materializes a pinned `tsx`/`pnpm` into
 *     `<dir>/node_modules/.bin` (for the end-to-end case).
 */
const NPM_STUB = [
    '#!/usr/bin/env bash',
    'set -e',
    'if [[ -n "$FAKE_NPM_FAIL" ]]; then',
    '    echo "npm error code EAI_AGAIN" >&2',
    '    exit 1',
    'fi',
    'if [[ "$1" == "view" ]]; then',
    '    if [[ -n "$FAKE_NPM_RAW" ]]; then',
    '        printf \'%s\' "$FAKE_NPM_RAW"',
    '    elif [[ "$3" == "dist-tags" ]]; then',
    '        printf \'%s\' "$FAKE_DIST_TAGS"',
    '    elif [[ "$3" == "versions" ]]; then',
    '        printf \'%s\' "$FAKE_VERSIONS"',
    '    else',
    '        echo "unexpected field $3" >&2; exit 1',
    '    fi',
    '    exit 0',
    'fi',
    'if [[ "$1" == "install" ]]; then',
    '    bin="$3/node_modules/.bin"',
    '    mkdir -p "$bin"',
    '    printf \'#!/usr/bin/env bash\necho "tsx $*" >> "$RECORD"\n'
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
 * Run `resolveHead(pr)` in a fresh node process whose PATH sees only the stub
 * npm, with the given fake registry responses, and return the process result.
 *
 * @param pr PR number to resolve for.
 * @param responses Fake registry data (see NPM_STUB for the steering vars).
 */
const runResolveHead = (
    pr: string,
    responses: {
        distTags?: Record<string, string>;
        versions?: string[];
        fail?: boolean;
        raw?: string;
    },
) => {
    const fakeBin = withFakeBin();
    try {
        const result = spawnSync(process.execPath, [
            '--input-type=module',
            '-e',
            `import(${JSON.stringify(PIN_PATH)}).then((m) => console.log(m.resolveHead(process.env.PR)))`,
        ], {
            env: {
                ...process.env,
                PATH: `${fakeBin}:${process.env.PATH}`,
                PR: pr,
                FAKE_DIST_TAGS: responses.distTags ? JSON.stringify(responses.distTags) : '',
                FAKE_VERSIONS: responses.versions ? JSON.stringify(responses.versions) : '',
                FAKE_NPM_FAIL: responses.fail ? '1' : '',
                ...(responses.raw !== undefined ? { FAKE_NPM_RAW: responses.raw } : {}),
            },
            encoding: 'utf8',
        });
        return {
            status: result.status,
            stdout: (result.stdout ?? '').trim(),
            stderr: result.stderr ?? '',
        };
    } finally {
        fs.rmSync(fakeBin, { recursive: true, force: true });
    }
};

describe('resolveHead (hermetic, stub npm)', () => {
    it('resolves the head from the devex dist-tag when it belongs to the PR', () => {
        const result = runResolveHead('26', {
            distTags: { devex: '6.0.4-dev.pr26.7fb0f898', latest: '6.0.4-dev.pr34.c0f324b8' },
        });
        expect(result.status).toBe(0);
        expect(result.stdout).toBe('7fb0f898');
    });

    it('prefers the PR-scoped tag over the shared devex tag', () => {
        const result = runResolveHead('26', {
            distTags: {
                'devex-pr26': '6.0.4-dev.pr26.aaaaaaaa',
                devex: '6.0.4-dev.pr26.bbbbbbbb',
            },
        });
        expect(result.status).toBe(0);
        expect(result.stdout).toBe('aaaaaaaa');
    });

    it("falls back to the PR's single published head when devex belongs to another PR", () => {
        const result = runResolveHead('26', {
            distTags: { devex: '6.0.4-dev.pr34.c0f324b8' },
            versions: ['6.0.3-dev.pr26.4bc50783', '6.0.4-dev.pr34.c0f324b8'],
        });
        expect(result.status).toBe(0);
        expect(result.stdout).toBe('4bc50783');
    });

    it('fails loudly when devex is another PR\'s and several heads are published', () => {
        const result = runResolveHead('31', {
            distTags: { devex: '6.0.4-dev.pr34.c0f324b8' },
            versions: ['6.0.4-dev.pr31.2907fb37', '6.0.4-dev.pr31.d1bedcd5'],
        });
        expect(result.status).toBe(1);
        expect(result.stderr).toContain('Multiple -dev.pr31 heads are published');
        expect(result.stderr).toContain("'tsurlfilter dev builds' QA workflow");
        expect(result.stderr).toContain('head input');
    });

    it('fails with the bridge hint when the PR has no builds at all', () => {
        const result = runResolveHead('99', {
            distTags: { devex: '6.0.4-dev.pr34.c0f324b8' },
            versions: ['6.0.4-dev.pr34.c0f324b8'],
        });
        expect(result.status).toBe(1);
        expect(result.stderr).toContain('No -dev.pr99.* builds found');
        expect(result.stderr).toContain('devex-bridge.yml');
    });

    it('ignores a devex tag that is not a head-scoped build of the PR', () => {
        const result = runResolveHead('26', {
            distTags: { devex: '6.0.4-dev.pr34' },
            versions: ['6.0.4-dev.pr26.7fb0f898'],
        });
        expect(result.status).toBe(0);
        expect(result.stdout).toBe('7fb0f898');
    });

    it('fails with a curated registry error when npm view cannot run', () => {
        const result = runResolveHead('26', { fail: true });
        expect(result.status).toBe(1);
        expect(result.stderr).toContain(
            'npm view @adguard/tsurlfilter dist-tags failed'
            + ' (registry https://ak.int.agrd.dev/npm/npm-internal-dev unreachable or auth error)',
        );
    });

    it('fails with a curated message on non-JSON registry output', () => {
        const result = runResolveHead('26', { raw: 'not json' });
        expect(result.status).toBe(1);
        expect(result.stderr).toContain('returned unexpected output');
    });
});

describe('pin.mjs end-to-end (npm/pnpm stubs)', () => {
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
                    HEAD_INPUT: '',
                    FAKE_DIST_TAGS: '{"devex":"6.0.4-dev.pr26.7fb0f898","latest":"1.0.0"}',
                    FAKE_VERSIONS: '["6.0.4-dev.pr26.7fb0f898"]',
                    GITHUB_OUTPUT: output,
                    GITHUB_EVENT_NAME: 'pull_request',
                },
                encoding: 'utf8',
            });

            expect(result.status, result.stderr).toBe(0);
            expect(fs.readFileSync(output, 'utf8')).toContain('pr=26');
            const recordLines = fs.readFileSync(record, 'utf8');
            // The tool ran from the pinned prefix and pinned every bridged
            // package for the resolved head.
            expect(recordLines).toContain('tsx tools/ci/use-dev-builds.ts --pr 26 --head 7fb0f898');
            expect(recordLines).toContain('--with-dnr-converter');
            expect(recordLines).toContain('--with-tswebextension');
            // The lockfile refresh used the pinned pnpm, not the decoy on the
            // ambient PATH.
            expect(recordLines).toContain('pinned-pnpm install --no-frozen-lockfile --ignore-scripts');
            expect(recordLines).not.toContain('decoy-pnpm');
        } finally {
            fs.rmSync(fakeHome, { recursive: true, force: true });
            fs.rmSync(fakeBin, { recursive: true, force: true });
        }
    }, 30000);
});
