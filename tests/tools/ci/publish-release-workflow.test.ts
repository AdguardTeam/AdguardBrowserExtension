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
