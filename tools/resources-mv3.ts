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

import { excludeUnsafeRules } from '@adguard/dnr-rulesets';

import { findDangerousRules } from './resources/dangerous-rules';
import { downloadAndPrepareMv3Filters } from './resources/download-filters';
import { updateLocalResourcesForMv3 } from './resources/update-local-script-rules';
import { AssetsFiltersBrowser, DECLARATIVE_FILTERS_DEST } from './constants';

// TODO: worth refactoring since this function is separated from ./resources.ts

/**
 * Downloads resources for MV3, checks if there are dangerous rules,
 * and converts filters to rulesets.
 *
 * @param skipLocalResources If true, skips updating local resources for MV3.
 */
const resourcesMv3 = async (skipLocalResources = false) => {
    console.log('Downloading resources for MV3...');
    await Promise.all([
        downloadAndPrepareMv3Filters(AssetsFiltersBrowser.ChromiumMv3),
        downloadAndPrepareMv3Filters(AssetsFiltersBrowser.OperaMv3),
    ]);
    console.log('Resources for MV3 downloaded');

    if (!skipLocalResources) {
        console.log('Updating local resources for MV3...');
        await Promise.all([
            updateLocalResourcesForMv3(AssetsFiltersBrowser.ChromiumMv3),
            updateLocalResourcesForMv3(AssetsFiltersBrowser.OperaMv3),
        ]);
        console.log('Local resources for MV3 updated');
    } else {
        console.log('Skipping update of local resources for MV3 (--skip-local-resources flag set)');
    }

    if (process.env.OPENAI_API_KEY) {
        console.log('Finding dangerous rules...');
        await findDangerousRules(process.env.OPENAI_API_KEY);
        console.log('Dangerous rules check completed');
    } else {
        console.log('OpenAI API key is not provided, skipping dangerous rules check');
    }

    /**
     * Extract unsafe rules from the filters and save them to the metadata
     * for each rulesets to use "skip review" feature in the Chrome Web Store
     * with limitation of the number of unsafe rules to 4900, since quota
     * for session rules is 5000 and we need to leave some space for other
     * rules, e.g. general $stealth rules from Tracking Protection filter.
     */
    await Promise.all([
        excludeUnsafeRules({
            dir: DECLARATIVE_FILTERS_DEST.replace('%browser', AssetsFiltersBrowser.ChromiumMv3),
            limit: 4900,
        }),
        excludeUnsafeRules({
            dir: DECLARATIVE_FILTERS_DEST.replace('%browser', AssetsFiltersBrowser.OperaMv3),
            limit: 4900,
        }),
    ]);
};

(async () => {
    const skipLocalResources = process.argv.includes('--skip-local-resources');
    await resourcesMv3(skipLocalResources);
})();
