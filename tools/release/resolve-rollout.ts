/* eslint-disable no-console */
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

import { renderCwsRolloutOutputs, resolveCwsRollout } from './cws-rollout';

/**
 * Resolves the Chrome Web Store rollout settings for the publish-release
 * workflow from the dispatch input, the merged release-bump pull request body,
 * and the release channel. Appends `rollout-percentage=` to $GITHUB_OUTPUT, or
 * prints it when no output file is set. A malformed PR-body line is reported
 * as a warning and the default percentage is used.
 */
const main = (): void => {
    const rollout = resolveCwsRollout({
        channel: process.env.CHANNEL ?? '',
        prBody: process.env.PR_BODY,
        input: process.env.ROLLOUT_INPUT,
    });

    if (rollout.warning) {
        console.log(`::warning::${rollout.warning}`);
    }

    const outputFile = process.env.GITHUB_OUTPUT;

    if (outputFile) {
        fs.appendFileSync(outputFile, `${renderCwsRolloutOutputs(rollout)}\n`);
        return;
    }

    console.log(renderCwsRolloutOutputs(rollout));
};

try {
    main();
} catch (error) {
    console.error(`Error resolving CWS rollout: ${error instanceof Error ? error.message : error}`);
    process.exit(1);
}
