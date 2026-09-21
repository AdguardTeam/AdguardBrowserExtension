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

const SCRIPT_PATH = path.resolve(__dirname, '../../../tools/ci/check-publish-state.sh');

const ITEM_ID = 'apjcbfpjihpedihablmalmbbhjpklbdf';
const EXPECTED_VERSION = '5.5.2.32';

/**
 * The stub `go-webext` installed into a fake bin dir. `FAKE_STATUS_OUTPUT`
 * steers the printed status, `FAKE_STATUS_FAIL=1` makes the call fail, and
 * `FAKE_STATUS_DIR` prints one file per call (reusing `last` afterwards) so
 * retries can be tested.
 */
const GO_WEBEXT_STUB = [
    '#!/usr/bin/env bash',
    'if [[ -n "$FAKE_STATUS_FAIL" ]]; then',
    '    echo "boom" >&2',
    '    exit 1',
    'fi',
    'if [[ -n "$FAKE_STATUS_DIR" ]]; then',
    '    count_file="$FAKE_STATUS_DIR/count"',
    '    count=0',
    '    [[ -f "$count_file" ]] && count=$(cat "$count_file")',
    '    count=$((count + 1))',
    '    echo "$count" > "$count_file"',
    '    response="$FAKE_STATUS_DIR/$count"',
    '    [[ -f "$response" ]] || response="$FAKE_STATUS_DIR/last"',
    '    cat "$response"',
    '    exit 0',
    'fi',
    'printf \'%s\\n\' "$FAKE_STATUS_OUTPUT"',
    'exit 0',
    '',
].join('\n');

/**
 * Run the script with a stubbed `go-webext` on PATH.
 *
 * @param statusOutput Text the stub prints (newline separated), or one entry
 * per status poll for retry tests.
 * @param fail Whether the stub should exit non-zero.
 * @param attempts Value of CWS_VERIFY_ATTEMPTS.
 * @param envOverrides Environment variables that override the defaults.
 *
 * @returns Exit code and combined output of the script.
 */
const runScript = (
    statusOutput: string | string[],
    fail = false,
    attempts: number | string = 1,
    envOverrides: NodeJS.ProcessEnv = {},
) => {
    const fakeBin = fs.mkdtempSync(path.join(os.tmpdir(), 'cws-state-bin-'));

    try {
        const stubPath = path.join(fakeBin, 'go-webext');
        fs.writeFileSync(stubPath, GO_WEBEXT_STUB);
        fs.chmodSync(stubPath, 0o755);

        const env: NodeJS.ProcessEnv = {
            ...process.env,
            PATH: `${fakeBin}:${process.env.PATH}`,
            ...(fail ? { FAKE_STATUS_FAIL: '1' } : {}),
            CHROME_CLIENT_ID: 'client-id',
            CHROME_CLIENT_SECRET: 'client-secret',
            CHROME_REFRESH_TOKEN: 'refresh-token',
            CHROME_PUBLISHER_ID: 'publisher-id',
            CHROME_API_VERSION: 'v2',
            // Keep the test fast: no retry delay.
            CWS_VERIFY_ATTEMPTS: String(attempts),
            CWS_VERIFY_DELAY_SECONDS: '0',
            ...envOverrides,
        };

        if (Array.isArray(statusOutput)) {
            const statusDir = path.join(fakeBin, 'status');
            fs.mkdirSync(statusDir);
            statusOutput.forEach((output, index) => {
                fs.writeFileSync(path.join(statusDir, String(index + 1)), output);
            });
            fs.writeFileSync(path.join(statusDir, 'last'), statusOutput[statusOutput.length - 1] ?? '');
            env.FAKE_STATUS_DIR = statusDir;
        } else {
            env.FAKE_STATUS_OUTPUT = statusOutput;
        }

        const result = spawnSync('bash', [SCRIPT_PATH, ITEM_ID, EXPECTED_VERSION], {
            encoding: 'utf-8',
            env,
        });

        return {
            status: result.status,
            output: `${result.stdout}${result.stderr}`,
        };
    } finally {
        fs.rmSync(fakeBin, { recursive: true, force: true });
    }
};

describe.skipIf(process.platform === 'win32')('check-publish-state', () => {
    it('succeeds when the store has a registered submission', () => {
        const { status, output } = runScript([
            `Item ID: ${ITEM_ID}`,
            'Published State: PUBLISHED',
            'Published Version: 5.5.2.31',
            'Rollout: 100%',
            'Submitted State: PENDING_REVIEW',
        ].join('\n'));

        expect(output).toContain('the publish call landed');
        expect(status).toBe(0);
    });

    it('succeeds when the expected version is already published', () => {
        const { status } = runScript([
            `Item ID: ${ITEM_ID}`,
            'Published State: PUBLISHED',
            `Published Version: ${EXPECTED_VERSION}`,
            'Rollout: 100%',
        ].join('\n'));

        expect(status).toBe(0);
    });

    it('fails when the store does not hold the built version', () => {
        const { status, output } = runScript([
            `Item ID: ${ITEM_ID}`,
            'Published State: PUBLISHED',
            'Published Version: 5.5.2.31',
            'Rollout: 100%',
        ].join('\n'));

        expect(output).toContain('The publish failure is real');
        expect(status).toBe(1);
    });

    it('fails when the submission was cancelled', () => {
        const { status } = runScript([
            'Submitted State: CANCELLED',
            'Published Version: 5.5.2.31',
        ].join('\n'));

        expect(status).toBe(1);
    });

    it('fails with the hard-error code when go-webext itself fails', () => {
        const { status } = runScript('', true);

        expect(status).toBe(2);
    });

    it('fails with the hard-error code when the status output reports an error', () => {
        const { status, output } = runScript('Error: rate limit exceeded for the publisher');

        expect(output).toContain('go-webext reported an error');
        expect(status).toBe(2);
    });

    it('fails with the hard-error code when the status output has no state markers', () => {
        const { status, output } = runScript(`Item ID: ${ITEM_ID}`);

        expect(output).toContain('no recognized state markers');
        expect(status).toBe(2);
    });

    it('does not treat item text containing `unauthorized` as an API error', () => {
        const { status, output } = runScript([
            `Item ID: ${ITEM_ID}`,
            'Published State: PUBLISHED',
            'Published Version: 5.5.2.31',
            'Rollout: 100%',
            'Submitted State: PENDING_REVIEW',
            'Name: block unauthorized requests',
        ].join('\n'));

        expect(output).not.toContain('reported an error');
        expect(status).toBe(0);
    });

    it('fails with the hard-error code when the attempt count is zero', () => {
        const { status, output } = runScript('', false, 0);

        expect(output).toContain('CWS_VERIFY_ATTEMPTS must be an integer >= 1');
        expect(status).toBe(2);
    });

    it('fails with the hard-error code when the attempt count is not numeric', () => {
        const { status, output } = runScript('', false, 'many');

        expect(output).toContain('CWS_VERIFY_ATTEMPTS must be an integer >= 1');
        expect(status).toBe(2);
    });

    it('fails with the hard-error code when the delay is not numeric', () => {
        const { status, output } = runScript('', false, 1, { CWS_VERIFY_DELAY_SECONDS: 'soon' });

        expect(output).toContain('CWS_VERIFY_DELAY_SECONDS must be an integer >= 0');
        expect(status).toBe(2);
    });

    it('tolerates a STAGED submission', () => {
        const { status, output } = runScript([
            'Published State: PUBLISHED',
            'Published Version: 5.5.2.31',
            'Submitted State: STAGED',
        ].join('\n'));

        expect(output).toContain('the publish call landed');
        expect(status).toBe(0);
    });

    it('does not treat a terminal PUBLISHED submission as proof', () => {
        const { status, output } = runScript([
            'Published State: PUBLISHED',
            'Published Version: 5.5.2.31',
            'Submitted State: PUBLISHED',
        ].join('\n'));

        expect(output).toContain('The publish failure is real');
        expect(status).toBe(1);
    });

    it('does not treat a PUBLISHED_TO_TESTERS submission as proof', () => {
        const { status, output } = runScript([
            'Published State: PUBLISHED',
            'Published Version: 5.5.2.31',
            'Submitted State: PUBLISHED_TO_TESTERS',
        ].join('\n'));

        expect(output).toContain('The publish failure is real');
        expect(status).toBe(1);
    });

    it('does not treat an unspecified submission state as proof', () => {
        const { status, output } = runScript([
            'Published State: PUBLISHED',
            'Published Version: 5.5.2.31',
            'Submitted State: ITEM_STATE_UNSPECIFIED',
        ].join('\n'));

        expect(output).toContain('The publish failure is real');
        expect(status).toBe(1);
    });

    it('retries and tolerates a pending submission from a later poll', () => {
        const notLanded = [
            'Published State: PUBLISHED',
            'Published Version: 5.5.2.31',
        ].join('\n');
        const landed = [
            'Published State: PUBLISHED',
            'Published Version: 5.5.2.31',
            'Submitted State: PENDING_REVIEW',
        ].join('\n');

        const { status, output } = runScript([notLanded, landed], false, 2);

        expect(output).toContain('Status poll 2/2');
        expect(output).toContain('the publish call landed');
        expect(status).toBe(0);
    });

    it('fails for real after exhausting the configured attempts', () => {
        const notLanded = [
            'Published State: PUBLISHED',
            'Published Version: 5.5.2.31',
        ].join('\n');

        const { status, output } = runScript([notLanded, notLanded], false, 2);

        expect(output).toContain('Status poll 2/2');
        expect(output).toContain('The publish failure is real');
        expect(status).toBe(1);
    });
});
