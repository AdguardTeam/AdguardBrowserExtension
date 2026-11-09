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

import fs from 'node:fs';
import path from 'node:path';

import {
    describe,
    expect,
    it,
} from 'vitest';

/**
 * Chrome Web Store rejects Manifest V2 uploads, so no workflow may regain a
 * CWS MV2 deploy target (AG-58375). `publish-release.yml` is the release
 * pipeline, and `auto-build.yml` is the other path that publishes to the
 * Chrome Web Store, so every workflow file is scanned.
 *
 * Chrome MV2 is still distributed via static.adtidy.org and GitHub Release
 * assets: `chrome.zip` on both channels, while the signed `chrome.crx` and
 * `update.xml` are shipped on the beta channel only. Those references are
 * intentionally not asserted here.
 *
 * The same workflow sources are also scanned for the per-browser static deploy
 * gates and their approval environments (AG-59389).
 */
const WORKFLOWS_DIR_PATH = path.resolve(__dirname, '../../../.github/workflows');
const DEPLOYMENT_PATH = path.resolve(__dirname, '../../../DEPLOYMENT.md');

/**
 * Matches any reference to the removed Chrome Web Store MV2 deploy target:
 * the `staged/cws-mv2` directory, the `cws-mv2-release` artifact, the
 * `publish-cws-mv2-release` job, or a "Chrome Web Store MV2" step title.
 */
const CWS_MV2_REFERENCE_RE = /cws-mv2|chrome web store mv2/i;

/**
 * Repository variable that was only used by the removed CWS MV2 publish job.
 */
const CWS_MV2_ITEM_VARIABLE = 'CHROME_WEBSTORE_MV2_ITEM_ID';

/**
 * Sources of all workflow files, keyed by file name. Read once at module load
 * and reused by every test.
 */
const WORKFLOWS = new Map<string, string>(
    fs.readdirSync(WORKFLOWS_DIR_PATH)
        .filter((fileName) => /\.ya?ml$/.test(fileName))
        .map((fileName) => [
            fileName,
            fs.readFileSync(path.join(WORKFLOWS_DIR_PATH, fileName), 'utf8'),
        ] as const),
);

/**
 * Contents of the deployment documentation, read once at module load.
 */
const DEPLOYMENT = fs.readFileSync(DEPLOYMENT_PATH, 'utf8');

/**
 * Opens the list of environments that gate a deploy with approval rules.
 */
const APPROVAL_ENVIRONMENTS_START = '**Environments** with approval rules:';

/**
 * Ends the approval list: everything after it is explicitly ungated.
 */
const APPROVAL_ENVIRONMENTS_END = 'The auto-publish environments';

const approvalStart = DEPLOYMENT.indexOf(APPROVAL_ENVIRONMENTS_START);
const approvalEnd = DEPLOYMENT.indexOf(APPROVAL_ENVIRONMENTS_END);

/**
 * The part of DEPLOYMENT.md that lists the gated environments. Scanning the
 * whole file would let an ungated auto-publish name or an artifact name count
 * as documentation for an approval gate.
 */
const APPROVAL_ENVIRONMENTS = approvalEnd > approvalStart && approvalStart !== -1
    ? DEPLOYMENT.slice(approvalStart, approvalEnd)
    : '';

/**
 * Looks up a workflow source by file name.
 *
 * @param fileName Workflow file name, e.g. `publish-release.yml`.
 *
 * @returns The workflow YAML as a string.
 *
 * @throws If the workflow file is missing from the repository.
 */
const getWorkflow = (fileName: string): string => {
    const source = WORKFLOWS.get(fileName);

    if (source === undefined) {
        throw new Error(`Workflow file ${fileName} not found in ${WORKFLOWS_DIR_PATH}`);
    }

    return source;
};

/**
 * Matches the top-level `jobs:` key that opens the job definitions block.
 */
const JOBS_BLOCK_RE = /^jobs:[ \t]*$/m;

/**
 * Matches a job id key inside the `jobs:` block. GitHub job ids may contain
 * letters, digits, `-`, and `_`, so a narrower pattern would hide jobs from the
 * assertions below.
 */
const JOB_ID_RE = /^ {2}([A-Za-z0-9_-]+):$/;

/**
 * Extracts every job id from a workflow, scoped to the `jobs:` block so that
 * trigger, concurrency, or environment keys cannot be mistaken for jobs.
 *
 * @param workflow Workflow YAML source.
 *
 * @returns Job ids in declaration order.
 */
const parseJobIds = (workflow: string): string[] => {
    const [, jobsBlock = ''] = workflow.split(JOBS_BLOCK_RE);
    const jobIds: string[] = [];

    for (const line of jobsBlock.split('\n')) {
        const jobId = JOB_ID_RE.exec(line)?.[1];

        if (jobId) {
            jobIds.push(jobId);
        }
    }

    return jobIds;
};

/**
 * Extracts the lines of a single job's block, from its key to the next job key.
 *
 * @param workflow Workflow YAML source.
 * @param jobId Job id to extract.
 *
 * @returns Lines of the job block.
 *
 * @throws If the job is missing from the workflow.
 */
const getJobBlock = (workflow: string, jobId: string): string[] => {
    const lines = workflow.split('\n');
    const jobIndex = lines.findIndex((line) => line === `  ${jobId}:`);

    if (jobIndex === -1) {
        throw new Error(`Job ${jobId} not found in workflow`);
    }

    const block: string[] = [];

    for (const line of lines.slice(jobIndex + 1)) {
        if (JOB_ID_RE.test(line)) {
            break;
        }

        block.push(line);
    }

    return block;
};

/**
 * Extracts the `needs` list of a single job.
 *
 * `needs` arrays in these workflows are single-line, so line-based parsing is
 * enough and avoids adding a YAML parser dependency.
 *
 * @param workflow Workflow YAML source.
 * @param jobId Job id to look up.
 *
 * @returns Ids of the jobs the given job depends on.
 */
const parseJobNeeds = (workflow: string, jobId: string): string[] => {
    for (const line of getJobBlock(workflow, jobId)) {
        const needs = /^ {4}needs: \[(.*)\]$/.exec(line)?.[1];

        if (needs !== undefined) {
            return needs
                .split(',')
                .map((dependency) => dependency.trim())
                .filter(Boolean);
        }
    }

    return [];
};

/**
 * Matches a named `with:` input of a reusable-workflow call job.
 */
const JOB_WITH_INPUT_RE = /^\s+([a-z0-9-]+): (.+)$/;

/**
 * Matches the channel expression interpolated into a `with:` input value. The
 * two channel outputs carry the same value, so either source is accepted.
 */
const CHANNEL_EXPRESSION_RE = /\$\{\{\s*needs\.(?:build|resolve-version)\.outputs\.channel\s*\}\}/;

/**
 * Strips a trailing YAML comment and surrounding quotes from an input value.
 *
 * @param value Raw value as it appears after the `:`.
 *
 * @returns The bare value.
 */
const unquote = (value: string): string => {
    const withoutComment = value.replace(/\s+#.*$/, '').trim();
    const match = /^(['"])(.*)\1$/.exec(withoutComment);

    return match?.[2] ?? withoutComment;
};

/**
 * Extracts a `with:` input of a reusable-workflow call job.
 *
 * @param workflow Workflow YAML source.
 * @param jobId Job id to look up.
 * @param inputName Input name, e.g. `environment`.
 *
 * @returns The bare input value, e.g. `chrome-static-${{ needs.build.outputs.channel }}`.
 *
 * @throws If the job has no input with that name.
 */
const getWithInput = (workflow: string, jobId: string, inputName: string): string => {
    for (const line of getJobBlock(workflow, jobId)) {
        const [, name, value] = JOB_WITH_INPUT_RE.exec(line) ?? [];

        if (name === inputName && value !== undefined) {
            return unquote(value);
        }
    }

    throw new Error(`Job ${jobId} has no ${inputName} input`);
};

/**
 * Resolves the release channel interpolated into a `with:` input value.
 *
 * @param value Raw input value.
 * @param channel Release channel to substitute.
 *
 * @returns The value the job uses on that channel.
 */
const resolveChannel = (value: string, channel: string): string => (
    value.replace(CHANNEL_EXPRESSION_RE, channel)
);

/**
 * Matches the top-level `if:` condition of a job.
 */
const JOB_IF_RE = /^ {4}if: (.*)$/;

/**
 * Matches a continuation line of a block-scalar `if:` condition. Job-level keys
 * sit at four spaces, nested values at six or more.
 */
const JOB_IF_CONTINUATION_RE = /^ {6,}\S/;

/**
 * Extracts the raw lines of the job-level `if:` condition: the value after
 * `if:` followed by the continuation lines of a block scalar, blank lines
 * included. `getJobIf` folds them into one expression.
 *
 * @param workflow Workflow YAML source.
 * @param jobId Job id to look up.
 *
 * @returns Condition lines, or an empty array when the job has no `if:`.
 */
const getJobIfLines = (workflow: string, jobId: string): string[] => {
    const lines = getJobBlock(workflow, jobId);
    const index = lines.findIndex((line) => JOB_IF_RE.test(line));
    const ifLine = lines[index];

    if (ifLine === undefined) {
        return [];
    }

    const condition = [JOB_IF_RE.exec(ifLine)?.[1] ?? ''];

    for (const line of lines.slice(index + 1)) {
        // A blank line belongs to the block scalar: the condition may continue
        // after it, so it must not end the scan.
        if (line.trim() === '') {
            continue;
        }

        if (!JOB_IF_CONTINUATION_RE.test(line)) {
            break;
        }

        condition.push(line);
    }

    return condition;
};

/**
 * Matches the header of a block-scalar `if:` condition: the indicator (`>`,
 * `|`), an optional chomping and indentation pair in either order (`>-`, `|2`,
 * `>2-`, `>-2`) and an optional trailing comment.
 */
const BLOCK_SCALAR_INDICATOR_RE = /^[>|](?:[1-9][+-]?|[+-][1-9]?)?(?:\s+#.*)?$/;

/**
 * Extracts the `if:` condition of a job.
 *
 * The indicator of a block scalar is not part of the condition, and both block
 * and plain continuation lines fold into one expression, so the same condition
 * reads the same in every style.
 *
 * @param workflow Workflow YAML source.
 * @param jobId Job id to look up.
 *
 * @returns The condition without a trailing comment or quotes, or `undefined`
 * when the job has no `if:`.
 */
const getJobIf = (workflow: string, jobId: string): string | undefined => {
    const condition = unquote(
        getJobIfLines(workflow, jobId)
            .map((line) => line.trim())
            .filter((line) => line !== '' && !BLOCK_SCALAR_INDICATOR_RE.test(line))
            .join(' '),
    );

    return condition === '' ? undefined : condition;
};

/**
 * Matches the only condition shape that restricts a job to one release channel.
 * Any other condition, including `always()` or a channel check combined with an
 * extra clause, may run on both channels.
 */
const CHANNEL_CONDITION_RE = /^needs\.resolve-version\.outputs\.channel == '(beta|release)'$/;

/**
 * Release channels a static deploy job can run on.
 *
 * @param workflow Workflow YAML source.
 * @param jobId Job id to look up.
 *
 * @returns One channel when the `if:` restricts the job to it, both otherwise.
 */
const getJobChannels = (workflow: string, jobId: string): string[] => {
    const condition = getJobIf(workflow, jobId);
    const channel = condition === undefined ? undefined : CHANNEL_CONDITION_RE.exec(condition)?.[1];

    return channel === undefined ? ['beta', 'release'] : [channel];
};

/**
 * What a static deploy job must use on one release channel (AG-59389): its own
 * browser's artifact, its own Deployer module and its own approval environment.
 */
type StaticDeployGate = {
    channel: string;
    artifactName: string;
    deployerModule: string;
    environment: string;
};

/**
 * Static deploy jobs and the resources they must use on every channel they run
 * on. Chrome and Edge deploy from one job that runs on both channels; the
 * Firefox jobs are channel-filtered by their `if:` condition.
 */
const STATIC_DEPLOY_GATES: Record<string, StaticDeployGate[]> = {
    'deploy-static-chrome': [
        {
            channel: 'beta',
            artifactName: 'static-chrome-beta',
            deployerModule: 'adblocker-webext-chrome-beta',
            environment: 'chrome-static-beta',
        },
        {
            channel: 'release',
            artifactName: 'static-chrome-release',
            deployerModule: 'adblocker-webext-chrome-release',
            environment: 'chrome-static-release',
        },
    ],
    'deploy-static-edge': [
        {
            channel: 'beta',
            artifactName: 'static-edge-beta',
            deployerModule: 'adblocker-webext-edge-beta',
            environment: 'edge-static-beta',
        },
        {
            channel: 'release',
            artifactName: 'static-edge-release',
            deployerModule: 'adblocker-webext-edge-release',
            environment: 'edge-static-release',
        },
    ],
    'deploy-static-firefox-beta': [
        {
            channel: 'beta',
            artifactName: 'static-firefox-beta',
            deployerModule: 'adblocker-webext-firefox-beta',
            environment: 'firefox-static-beta',
        },
    ],
    'deploy-static-firefox-release': [
        {
            channel: 'release',
            artifactName: 'static-firefox-release',
            deployerModule: 'adblocker-webext-firefox-release',
            environment: 'firefox-static-release',
        },
    ],
};

/**
 * Exact `needs` of every static deploy job.
 */
const STATIC_DEPLOY_NEEDS: Record<string, string[]> = {
    'deploy-static-chrome': ['build', 'resolve-version', 'tag'],
    'deploy-static-edge': ['build', 'resolve-version', 'tag'],
    'deploy-static-firefox-beta': ['build-firefox-standalone', 'resolve-version', 'tag'],
    'deploy-static-firefox-release': ['build', 'resolve-version', 'tag'],
};

/**
 * Channel a static deploy job is restricted to; `undefined` means it runs on
 * both channels.
 */
const STATIC_DEPLOY_CHANNEL_FILTERS: Record<string, string | undefined> = {
    'deploy-static-chrome': undefined,
    'deploy-static-edge': undefined,
    'deploy-static-firefox-beta': 'beta',
    'deploy-static-firefox-release': 'release',
};

/**
 * Matches the shared static environment names replaced by the per-browser ones.
 */
const SHARED_STATIC_ENVIRONMENT_RE = /beta-static|production-static/;

describe('Chrome Web Store deploy guards', () => {
    it('no workflow references the removed CWS MV2 target', () => {
        for (const [fileName, source] of WORKFLOWS) {
            expect(source, `unexpected CWS MV2 reference in ${fileName}`).not.toMatch(CWS_MV2_REFERENCE_RE);
            expect(source, `unexpected MV2 store variable in ${fileName}`).not.toContain(CWS_MV2_ITEM_VARIABLE);
        }
    });

    it('DEPLOYMENT.md does not document the removed CWS MV2 target', () => {
        expect(DEPLOYMENT).not.toContain(CWS_MV2_ITEM_VARIABLE);
        expect(DEPLOYMENT).not.toMatch(CWS_MV2_REFERENCE_RE);
    });

    it('publish-release.yml still publishes both MV3 CWS channels', () => {
        const workflow = getWorkflow('publish-release.yml');

        expect(workflow).toMatch(/^ {2}publish-cws-mv3-beta:$/m);
        expect(workflow).toMatch(/^ {2}publish-cws-mv3-release:$/m);
    });

    it('publish-release.yml tags after the main build and before deploy jobs', () => {
        const workflow = getWorkflow('publish-release.yml');

        expect(parseJobNeeds(workflow, 'tag').sort()).toEqual([
            'build',
            'preflight',
            'resolve-version',
        ]);

        const deployJobIds = [
            'create-release',
            'deploy-static-chrome',
            'deploy-static-edge',
            'deploy-static-firefox-beta',
            'deploy-static-firefox-release',
            'publish-amo-beta',
            'publish-amo-release',
            'publish-cws-mv3-beta',
            'publish-cws-mv3-release',
            'publish-edge-release',
        ];
        for (const jobId of deployJobIds) {
            expect(parseJobNeeds(workflow, jobId), `${jobId} needs tag`).toContain('tag');
        }
    });

    it('publish-release.yml notify jobs depend on every other job', () => {
        const workflow = getWorkflow('publish-release.yml');
        const otherJobIds = parseJobIds(workflow)
            .filter((jobId) => !jobId.startsWith('notify-'))
            .sort();

        for (const notifyJobId of ['notify-success', 'notify-failure']) {
            expect(parseJobNeeds(workflow, notifyJobId).sort(), `${notifyJobId} needs`).toEqual(otherJobIds);
        }
    });

    it('publish-release.yml failure message reports every needed job', () => {
        const workflow = getWorkflow('publish-release.yml');
        const failureMessage = getJobBlock(workflow, 'notify-failure')
            .find((line) => line.trimStart().startsWith('message:'));

        expect(failureMessage).toBeDefined();

        // `resolve-version` is reported through its tag and must succeed before
        // the failure notification can run, so any reference to it counts.
        for (const jobId of parseJobNeeds(workflow, 'notify-failure')) {
            expect(failureMessage).toContain(`needs.${jobId}.`);
        }
    });
});

describe('Static deploy approval gates', () => {
    it('each static deploy job uses its own browser artifacts and environment', () => {
        const workflow = getWorkflow('publish-release.yml');

        for (const [jobId, gates] of Object.entries(STATIC_DEPLOY_GATES)) {
            for (const gate of gates) {
                const context = `${jobId} on ${gate.channel}`;

                expect(
                    resolveChannel(getWithInput(workflow, jobId, 'environment'), gate.channel),
                    `${context}: environment`,
                ).toBe(gate.environment);
                expect(
                    resolveChannel(getWithInput(workflow, jobId, 'deployer-module'), gate.channel),
                    `${context}: deployer module`,
                ).toBe(gate.deployerModule);
                expect(
                    resolveChannel(getWithInput(workflow, jobId, 'artifact-name'), gate.channel),
                    `${context}: artifact`,
                ).toBe(gate.artifactName);
            }
        }
    });

    it('each static deploy job runs only on its own channels', () => {
        const workflow = getWorkflow('publish-release.yml');

        for (const [jobId, channel] of Object.entries(STATIC_DEPLOY_CHANNEL_FILTERS)) {
            const condition = getJobIf(workflow, jobId);

            if (channel === undefined) {
                expect(condition, `${jobId} must run on both channels`).toBeUndefined();
                continue;
            }

            expect(condition, `${jobId} channel filter`)
                .toBe(`needs.resolve-version.outputs.channel == '${channel}'`);
        }
    });

    it('each static deploy job keeps its exact dependencies', () => {
        const workflow = getWorkflow('publish-release.yml');

        for (const [jobId, needs] of Object.entries(STATIC_DEPLOY_NEEDS)) {
            expect(parseJobNeeds(workflow, jobId).sort(), `${jobId} needs`).toEqual(needs);
        }
    });

    it('every job deploying to static storage has its own documented environment', () => {
        const workflow = getWorkflow('publish-release.yml');
        const jobsByEnvironment = new Map<string, Set<string>>();

        expect(APPROVAL_ENVIRONMENTS, 'DEPLOYMENT.md lists the approval environments').not.toBe('');

        for (const jobId of parseJobIds(workflow)) {
            const jobBlock = getJobBlock(workflow, jobId);
            // Match the reusable workflow reference itself, not a comment that
            // happens to mention it.
            const deploysToStatic = jobBlock.some((line) => /^\s+uses: \S*deploy-to-static\.yml@\S+/.test(line));

            if (!deploysToStatic) {
                continue;
            }

            // Throws when the job has no `environment` input at all.
            const environment = getWithInput(workflow, jobId, 'environment');
            const channels = getJobChannels(workflow, jobId);

            // A job that runs on both channels must not resolve to one
            // environment, or a single approval would release both.
            if (channels.length > 1) {
                expect(
                    new Set(channels.map((channel) => resolveChannel(environment, channel))).size,
                    `${jobId} runs on both channels but uses one environment`,
                ).toBe(channels.length);
            }

            // Only the channels the job actually runs on are recorded, so a
            // channel-filtered job cannot collide with its sibling.
            for (const channel of channels) {
                const name = resolveChannel(environment, channel);
                const jobIds = jobsByEnvironment.get(name) ?? new Set<string>();

                expect(APPROVAL_ENVIRONMENTS, `${name} must be in the approval list`)
                    .toContain(`\`${name}\``);
                jobIds.add(jobId);
                jobsByEnvironment.set(name, jobIds);
            }
        }

        // Two jobs behind one environment would release both browsers with a
        // single approval.
        for (const [name, jobIds] of jobsByEnvironment) {
            expect([...jobIds], `${name} must gate a single job`).toHaveLength(1);
        }
    });

    it('no workflow references the shared static environments', () => {
        for (const [fileName, source] of WORKFLOWS) {
            expect(source, `shared static environment in ${fileName}`)
                .not.toMatch(SHARED_STATIC_ENVIRONMENT_RE);
        }
    });
});
