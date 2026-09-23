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
import { pathToFileURL } from 'node:url';

/**
 * Composite action entry point — see `.github/actions/pin-tsurlfilter-dev/action.yml`.
 *
 * Pins the six bridged @adguard/* packages to the Artifact Keeper (AK) dev
 * builds of a tsurlfilter PR, workspace-local via pnpm.overrides, so the whole
 * CI pipeline builds the extension against unmerged tsurlfilter work.
 *
 * The run-numbered dev versions (`<next-patch>-dev.pr<N>.<run_number>`) are
 * resolved by the pin tool itself: it selects the highest run number visible
 * across all six packages and requires the complete set, so this action only
 * forwards an explicit `run` override and never probes AK.
 *
 * Inputs come from the environment:
 *   - `PR_INPUT` / `RUN_INPUT` / `REQUIRED` — the action's `inputs`, mapped
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

/**
 * Run the consumer-side pin tool (`tools/ci/use-dev-builds.ts`) for one PR.
 *
 * The tool owns run selection: it picks the highest run number visible across
 * all six packages and requires the complete set. This action only forwards an
 * explicit QA `run` override.
 *
 * The pinned tsx is invoked by absolute path, but the tool it runs spawns
 * `pnpm` from PATH — prepend the local bin dir so the pinned pnpm (the exact
 * repo version) is the one that refreshes the lockfile.
 *
 * @param pr PR number (as a string).
 *
 * @param run Optional workflow run number; when empty the tool selects the
 *   highest published run itself.
 */
const runPinTool = (pr, run) => {
    const env = {
        ...process.env,
        PATH: `${localBinDir()}${path.delimiter}${process.env.PATH}`,
    };
    const args = [
        'tools/ci/use-dev-builds.ts',
        '--pr', pr,
        ...(run ? ['--run', run] : []),
        '--extension', '.',
        ...BRIDGED_PACKAGES.map((pkg) => `--with-${pkg}`),
    ];
    execFileSync(path.join(localBinDir(), 'tsx'), args, { stdio: 'inherit', env });
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

    // The pin tool owns run selection: without an explicit QA run it selects
    // the highest published run across all six packages and requires the
    // complete set for that run. The action no longer probes AK itself.
    const run = process.env.RUN_INPUT ?? '';
    console.log(`Pinning tsurlfilter PR #${pr}${run ? ` (run ${run})` : ' (highest published run)'} from Artifact Keeper`);

    runPinTool(pr, run);

    fs.appendFileSync(process.env.GITHUB_OUTPUT, `pr=${pr}\n`);
};

export {
    BRIDGED_PACKAGES,
    localBinDir,
    readPrFromFile,
    runPinTool,
};

// The composite action runs `node pin.mjs`; tests import the module, so the
// entry point must not fire on import.
if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
    main();
}
