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
 * A build that is not eligible for the requested CWS review must not be
 * submitted to CWS, but it must not block the Edge submission either: Edge
 * reviews every submission and has no skip-review mode, so the auto-build
 * skips only the CWS publish jobs and keeps publishing to Edge. These tests
 * pin the workflow wiring that keeps the two paths apart (AG-59945).
 */
const AUTO_BUILD_PATH = path.resolve(__dirname, '../../../.github/workflows/auto-build.yml');

/**
 * Contents of the auto-build workflow, read once at module load.
 */
const AUTO_BUILD = fs.readFileSync(AUTO_BUILD_PATH, 'utf8');

/**
 * Extract a top-level job block from a workflow source: from the job id to the
 * next job id, without the blank lines and the comment block that document the
 * next job.
 *
 * @param source Workflow YAML source.
 * @param jobId Job identifier, e.g. `publish-edge`.
 *
 * @returns The job block.
 */
const getJobBlock = (source: string, jobId: string): string => {
    const start = source.indexOf(`\n  ${jobId}:`);
    expect(start).toBeGreaterThan(-1);

    const rest = source.slice(start + 1);
    const nextJob = /\n {2}[a-zA-Z0-9_-]+:/.exec(rest);
    if (nextJob === null) {
        return rest;
    }

    const lines = rest.slice(0, nextJob.index + 1).split('\n');
    while (lines.length > 0) {
        const last = lines[lines.length - 1] ?? '';
        if (last.trim() !== '' && !/^ {2}#/.test(last)) {
            break;
        }
        lines.pop();
    }

    return lines.join('\n');
};

describe('auto-build CWS scope wiring', () => {
    it('skips the beta CWS publish when the scope check marked the build ineligible', () => {
        const block = getJobBlock(AUTO_BUILD, 'publish-cws-beta');

        expect(block).toContain("needs.update-filters-and-build.outputs.beta-scope != 'ineligible'");
    });

    it('skips the release CWS publish when the scope check marked the build ineligible', () => {
        const block = getJobBlock(AUTO_BUILD, 'publish-cws-release');

        expect(block).toContain("needs.update-filters-and-build.outputs.release-scope != 'ineligible'");
    });

    it('does not gate the Edge publish on the CWS scope outcome', () => {
        const block = getJobBlock(AUTO_BUILD, 'publish-edge');

        expect(block).toContain('needs: [update-filters-and-build, integration-tests]');
        expect(block).not.toContain('beta-scope');
        expect(block).not.toContain('release-scope');
    });

    it('reports the skipped CWS publish after the Edge publish', () => {
        const block = getJobBlock(AUTO_BUILD, 'report-cws-scope');

        expect(block).toContain('always()');
        expect(block).toContain(
            'needs: [update-filters-and-build, integration-tests, publish-cws-beta, publish-cws-release, publish-edge]',
        );
        expect(block).toContain("needs.update-filters-and-build.outputs.beta-scope == 'ineligible'");
        expect(block).toContain("needs.update-filters-and-build.outputs.release-scope == 'ineligible'");
        expect(block).toContain('exit 1');
    });

    it('keeps the report job in the failure notification', () => {
        const block = getJobBlock(AUTO_BUILD, 'notify-failure');

        expect(block).toMatch(/report-cws-scope=\$\{\{ needs\.report-cws-scope\.result \}\}/);
        expect(block).toMatch(/cws-scope: \$\{\{ needs\.report-cws-scope\.result \}\}/);
    });

    it('parses and validates the per-channel scope outcomes', () => {
        expect(AUTO_BUILD).toMatch(/beta-scope: \$\{\{ steps\.publish-mode\.outputs\.beta-scope \}\}/);
        expect(AUTO_BUILD).toMatch(/release-scope: \$\{\{ steps\.publish-mode\.outputs\.release-scope \}\}/);
        expect(AUTO_BUILD).toMatch(/expected 'ok' or 'ineligible' for \$\{channel\}-scope/);
    });
});
