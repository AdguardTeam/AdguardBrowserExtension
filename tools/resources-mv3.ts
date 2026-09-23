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

import { updateAllMv3LocalResources, excludeAllMv3UnsafeRules } from './resources/mv3';
import { findDangerousRules } from './resources/dangerous-rules';
import { downloadAndPrepareMv3Filters } from './resources/download-filters';
import { MV3_ASSETS_FILTERS_BROWSERS } from './constants';
import { updateTestcasesScriptRules } from './resources/update-local-test-script-rules';

/**
 * Prepares bundled MV3 resources, checks for dangerous rules,
 * and extracts unsafe rules into ruleset metadata.
 *
 * @param skipLocalResources If true, skips updating local resources for MV3.
 */
const resourcesMv3 = async (skipLocalResources = false) => {
    console.log('Downloading resources for MV3...');
    // Skip translations and local resources only during fast auto-build with
    // skip review flow to minimize changes and stay eligible for expedited
    // review.
    await Promise.all(MV3_ASSETS_FILTERS_BROWSERS.map(
        (browser) => downloadAndPrepareMv3Filters(browser, skipLocalResources),
    ));
    console.log('Resources for MV3 downloaded');

    if (!skipLocalResources) {
        console.log('Updating local resources for MV3...');
        await updateTestcasesScriptRules();
        console.log('Local script rules from testcases updated');
        await updateAllMv3LocalResources();
        console.log('Local resources for MV3 updated');
    } else {
        console.log('Skipping update of local resources for MV3 (--skip-local-resources flag set)');
    }

    if (process.env.TOKENGUARD_API_KEY) {
        console.log('Finding dangerous rules...');
        await findDangerousRules(process.env.TOKENGUARD_API_KEY, true);
        console.log('Dangerous rules check completed');
    } else {
        console.log('TokenGuard API key is not provided, skipping dangerous rules check');
    }

    await excludeAllMv3UnsafeRules();
};

(async () => {
    const skipLocalResources = process.argv.includes('--skip-local-resources');
    await resourcesMv3(skipLocalResources);
})();
