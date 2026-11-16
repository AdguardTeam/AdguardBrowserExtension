/**
 * Copyright (c) 2015-2026 Adguard Software Ltd.
 *
 * @file
 * Chrome Web Store rollout percentage for the release channel: parsing,
 * resolution, and GitHub Actions outputs.
 *
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

/**
 * Rollout percentage used when no other value is provided.
 */
export const DEFAULT_CWS_ROLLOUT_PERCENTAGE = 1;

/**
 * Highest rollout percentage accepted by the Chrome Web Store API.
 */
export const MAX_CWS_ROLLOUT_PERCENTAGE = 100;

/**
 * Prefix of the rollout line in the release-bump pull request body.
 */
export const CWS_ROLLOUT_BODY_PREFIX = 'Chrome Web Store rollout:';

/**
 * Rollout settings for a Chrome Web Store publish job. Every channel is
 * staged: the version goes to review and waits for a manual publish. The
 * store fixes the percentage at submission, so it is sent with the staged
 * submission.
 */
export type CwsRollout = {
    /**
     * Rollout percentage for the submission; empty for a channel that has no
     * rollout percentage.
     */
    percentage: string;

    /**
     * Problem found while reading a value from the release-bump PR body. The
     * default percentage is used; the caller reports this as a warning.
     */
    warning?: string;
};

/**
 * Matches an integer percentage without leading zeros.
 */
const PERCENTAGE_RE = /^[1-9]\d{0,2}$/;

/**
 * Matches the value part of the rollout line, e.g. ` 5%`.
 */
const BODY_VALUE_RE = /^\s*(\d{1,3})\s*%\s*$/;

/**
 * Converts a rollout percentage input to a number.
 *
 * @param raw Raw input value.
 *
 * @returns The percentage; the default when the value is empty.
 *
 * @throws Error when the value is not an integer from 1 to 100.
 */
export const parseCwsRolloutPercentage = (raw: string | undefined): number => {
    const value = raw?.trim() ?? '';

    if (value === '') {
        return DEFAULT_CWS_ROLLOUT_PERCENTAGE;
    }
    if (!PERCENTAGE_RE.test(value)) {
        throw new Error(`CWS rollout percentage must be an integer from 1 to 100, got '${raw}'`);
    }

    const percentage = Number(value);
    if (percentage > MAX_CWS_ROLLOUT_PERCENTAGE) {
        throw new Error(`CWS rollout percentage must be an integer from 1 to 100, got '${raw}'`);
    }

    return percentage;
};

/**
 * Reads the rollout percentage from the release-bump pull request body.
 *
 * @param body Pull request body.
 *
 * @returns The percentage from the first rollout line, or undefined when the
 * body has no rollout line.
 *
 * @throws Error when the rollout line exists but its value is invalid.
 */
export const parseCwsRolloutBodyLine = (body: string | undefined): number | undefined => {
    if (!body) {
        return undefined;
    }

    for (const line of body.split('\n')) {
        const trimmed = line.trim();

        if (!trimmed.startsWith(CWS_ROLLOUT_BODY_PREFIX)) {
            continue;
        }

        const value = trimmed.slice(CWS_ROLLOUT_BODY_PREFIX.length);
        const match = BODY_VALUE_RE.exec(value);

        if (!match || match[1] === undefined) {
            throw new Error(`Invalid CWS rollout line: '${trimmed}'`);
        }

        return parseCwsRolloutPercentage(match[1]);
    }

    return undefined;
};

/**
 * Resolves the rollout settings for a Chrome Web Store publish job.
 *
 * Only the `release` channel has a rollout percentage; any other value,
 * including `beta`, gets an empty one. The release channel uses the dispatch
 * input, then the release-bump pull request body, then the default. A
 * malformed value in the PR body does not abort the release: it returns a
 * warning and the default percentage. A malformed dispatch input throws,
 * because the operator supplied it for this run.
 *
 * @param params Resolution parameters.
 * @param params.channel Release channel resolved from the changelog.
 * @param params.prBody Body of the merged release-bump pull request.
 * @param params.input Manual dispatch input value.
 *
 * @returns Rollout settings for the publish job.
 *
 * @throws Error when the dispatch input is not an integer from 1 to 100.
 */
export const resolveCwsRollout = ({
    channel,
    prBody,
    input,
}: {
    channel: string;
    prBody: string | undefined;
    input: string | undefined;
}): CwsRollout => {
    if (channel !== 'release') {
        return { percentage: '' };
    }

    const inputValue = input?.trim() ?? '';

    if (inputValue !== '') {
        return { percentage: String(parseCwsRolloutPercentage(inputValue)) };
    }

    try {
        const percentage = parseCwsRolloutBodyLine(prBody) ?? DEFAULT_CWS_ROLLOUT_PERCENTAGE;

        return { percentage: String(percentage) };
    } catch (error) {
        return {
            percentage: String(DEFAULT_CWS_ROLLOUT_PERCENTAGE),
            warning: `CWS rollout line in the release PR body is invalid (${
                error instanceof Error ? error.message : error
            }); using the default ${DEFAULT_CWS_ROLLOUT_PERCENTAGE}%`,
        };
    }
};

/**
 * Builds the rollout line that publish-release reads from the release-bump
 * pull request body.
 *
 * @param percentage Rollout percentage.
 *
 * @returns The marker line, e.g. `Chrome Web Store rollout: 1%`.
 */
export const formatCwsRolloutMarker = (percentage: number): string => (
    `${CWS_ROLLOUT_BODY_PREFIX} ${percentage}%`
);

/**
 * Appends the rollout marker line to a GitHub Actions output file. Does
 * nothing when no output file is set, as in a local run.
 *
 * @param outputFile Value of `$GITHUB_OUTPUT`.
 * @param percentage Resolved rollout percentage.
 */
export const appendCwsRolloutMarker = (outputFile: string | undefined, percentage: number): void => {
    if (!outputFile) {
        return;
    }

    fs.appendFileSync(outputFile, `rollout-marker=${formatCwsRolloutMarker(percentage)}\n`);
};

/**
 * Renders the rollout settings as a GitHub Actions step output.
 *
 * @param rollout Rollout settings.
 *
 * @returns One line for `$GITHUB_OUTPUT`.
 */
export const renderCwsRolloutOutputs = (rollout: CwsRollout): string => (
    `rollout-percentage=${rollout.percentage}`
);
