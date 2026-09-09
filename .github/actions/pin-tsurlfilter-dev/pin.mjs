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

/* eslint-disable no-console */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/**
 * Composite action entry point — see `.github/actions/pin-tsurlfilter-dev/action.yml`.
 *
 * Pins the six bridged @adguard/* packages to the Artifact Keeper (AK) dev
 * builds of a tsurlfilter PR, workspace-local via pnpm.overrides, so the whole
 * CI pipeline builds the extension against unmerged tsurlfilter work.
 *
 * Inputs come from the environment:
 *   - `PR_INPUT` / `HEAD_INPUT` / `REQUIRED` — the action's `inputs`, mapped
 *     in action.yml;
 *   - `GITHUB_OUTPUT`, `GITHUB_EVENT_NAME`, `GITHUB_REF_NAME` — provided by
 *     GitHub Actions.
 *
 * The resolved PR number is written to `GITHUB_OUTPUT` so the calling workflow
 * can name its artifacts. Runs with the runner's built-in Node (no deps);
 * pnpm + tsx are installed to a user-local prefix, exactly like the previous
 * shell implementation. Kept as a plain Node script instead of a composite
 * action `run:` block because actionlint cannot parse action.yml files — CI
 * `node --check`s this file instead.
 */

const AK_REGISTRY = 'https://ak.int.agrd.dev/npm/npm-internal';
const PIN_FILE = 'tsurlfilter-dev-pr.txt';
const BRIDGED_PACKAGES = [
    'dnr-converter',
    'css-tokenizer',
    'agtree',
    'tsurlfilter',
    'dnr-rulesets',
    'tswebextension',
];

/**
 * The user-local prefix the pinned pnpm/tsx are installed into.
 *
 * @returns The local node_modules/.bin dir, e.g. `~/.local/node_modules/.bin`.
 */
const localBinDir = () => path.join(os.homedir(), '.local', 'node_modules', '.bin');

/**
 * Print a fatal `::error::` annotation and exit non-zero.
 *
 * @param message Error description; the `::error::` prefix is added.
 */
const fail = (message) => {
    console.error(`::error::${message}`);
    process.exit(1);
};

/**
 * The PR number from `tsurlfilter-dev-pr.txt` in the repo root.
 *
 * Requires a single PR number: a file like `# updated 2026` followed by `26`
 * must not silently resolve to PR 2026. Lines starting with `#` are treated as
 * comments; the rest must be exactly one number.
 *
 * @returns The PR number, or `''` when the file is absent or contains only
 *   comments/whitespace.
 */
const readPrFromFile = () => {
    if (!fs.existsSync(PIN_FILE)) {
        return '';
    }
    const content = fs.readFileSync(PIN_FILE, 'utf8');
    const body = content
        .split('\n')
        .filter((line) => !/^[ \t]*#/.test(line))
        .join('')
        .replace(/\s/g, '');
    if (body === '') {
        return '';
    }
    if (!/^[0-9]+$/.test(body)) {
        fail(`tsurlfilter-dev-pr.txt must contain a single PR number (lines starting with '#' are comments) — got: ${content.replace(/\n/g, ' ')}`);
    }
    return body;
};

/**
 * Resolve the newest PUBLISHED head for the PR on AK.
 *
 * `npm view ... versions` returns semver order, not publish order, so the
 * newest pushed head is picked from the `time` map (version -> publish
 * timestamp) rather than the last version string. A failed registry round-trip
 * is reported separately from a successful query that found no builds.
 *
 * @param pr PR number (as a string).
 *
 * @returns The 8-char short SHA of the newest published head.
 */
const resolveHead = (pr) => {
    let timesText;
    try {
        timesText = execFileSync(
            'npm',
            ['view', '@adguard/tsurlfilter', 'time', '--json', `--registry=${AK_REGISTRY}`],
            { encoding: 'utf8' },
        ).trim();
    } catch {
        fail(`npm view of @adguard/tsurlfilter failed (registry ${AK_REGISTRY} unreachable or auth error) — check the AK registry/network before re-running.`);
    }

    let times = {};
    try {
        times = JSON.parse(timesText || '{}');
    } catch {
        fail(`npm view of @adguard/tsurlfilter returned unexpected output: ${timesText}`);
    }

    const suffix = new RegExp(`-dev\\.pr${pr}\\.[0-9a-f]{8}$`);
    const newest = Object.entries(times)
        .filter(([version]) => suffix.test(version))
        .map(([version, time]) => ({ sha: version.slice(-8), publishedAt: Date.parse(time) }))
        .sort((a, b) => b.publishedAt - a.publishedAt)[0];
    if (!newest) {
        fail(`No -dev.pr${pr}.* builds found on ${AK_REGISTRY}. Has devex-bridge.yml finished for PR #${pr}? (Push to the tsurlfilter PR or close+reopen it.)`);
    }
    return newest.sha;
};

/**
 * Install the pinned pnpm + tsx to a user-local prefix.
 *
 * The team-extensions runner user cannot write to the global npm prefix, so the
 * tools go into `~/.local` (used only via PATH inside the tool invocation).
 * Pin the exact versions the repo/Docker use (pnpm 10.33.4 rewrites the
 * lockfile here and consumes it in Docker; tsx 4.19.2 is in package.json) so a
 * version skew cannot surface as a confusing frozen-lockfile failure inside
 * Docker.
 */
const installTools = () => {
    execFileSync(
        'npm',
        ['install', '--prefix', path.join(os.homedir(), '.local'), 'pnpm@10.33.4', 'tsx@4.19.2'],
        { stdio: 'inherit' },
    );
};

const main = () => {
    let pr = process.env.PR_INPUT ?? '';
    if (!pr) {
        pr = readPrFromFile();
    }
    if (!pr) {
        if (process.env.REQUIRED === 'true') {
            fail('No tsurlfilter PR specified — pass the pr input or put a PR number in tsurlfilter-dev-pr.txt');
        }
        console.log('No tsurlfilter PR configured (tsurlfilter-dev-pr.txt absent/empty) — building against npm versions.');
        fs.appendFileSync(process.env.GITHUB_OUTPUT, 'pr=\n');
        return;
    }

    // The pin file must never land on master: every branch forked from master
    // afterwards would silently build against a stale tsurlfilter PR. Fail
    // loudly so the bad merge is noticed immediately.
    if (process.env.GITHUB_EVENT_NAME === 'push' && process.env.GITHUB_REF_NAME === 'master') {
        fail('tsurlfilter-dev-pr.txt is present on master — remove it (the pin is for feature branches only)');
    }

    installTools();

    // Head-scoped coherent set: prefer an explicit head, else resolve the
    // newest published head for the PR on AK. The tool then refuses to mix
    // heads.
    const head = process.env.HEAD_INPUT ? process.env.HEAD_INPUT : resolveHead(pr);
    console.log(`Pinning tsurlfilter PR #${pr} @ ${head} from ${AK_REGISTRY}`);

    execFileSync(path.join(localBinDir(), 'tsx'), [
        'tools/ci/use-dev-builds.ts',
        '--pr', pr,
        '--head', head,
        '--extension', '.',
        ...BRIDGED_PACKAGES.map((pkg) => `--with-${pkg}`),
    ], { stdio: 'inherit' });

    fs.appendFileSync(process.env.GITHUB_OUTPUT, `pr=${pr}\n`);
};

main();
