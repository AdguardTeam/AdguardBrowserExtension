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

import {
    excludeAllMv3UnsafeRules,
    LOCAL_RESOURCES_NONE,
    LOCAL_RESOURCES_OPTION,
    resolveLocalResourcesBrowsers,
    updateMv3LocalResources,
} from './resources/mv3';
import { findDangerousRules } from './resources/dangerous-rules';
import { downloadAndPrepareMv3Filters } from './resources/download-filters';
import { MV3_ASSETS_FILTERS_BROWSERS, type Mv3AssetsFiltersBrowser } from './constants';
import { updateTestcasesScriptRules } from './resources/update-local-test-script-rules';

/**
 * Prepares bundled MV3 resources, checks for dangerous rules,
 * and extracts unsafe rules into ruleset metadata.
 *
 * @param localResourcesBrowsers MV3 targets to update local resources for; an
 * empty list skips the local resources update.
 */
const resourcesMv3 = async (localResourcesBrowsers: readonly Mv3AssetsFiltersBrowser[]) => {
    console.log('Downloading resources for MV3...');
    // Skip translations and local resources only during fast auto-build with
    // skip review flow to minimize changes and stay eligible for expedited
    // review. Targets whose local resources are not refreshed keep their
    // committed local script rules and filter translations, so only the
    // declarative rulesets are copied for them.
    await Promise.all(MV3_ASSETS_FILTERS_BROWSERS.map((browser) => {
        const onlyDeclarativeRulesets = !localResourcesBrowsers.includes(browser);
        return downloadAndPrepareMv3Filters(browser, onlyDeclarativeRulesets);
    }));
    console.log('Resources for MV3 downloaded');

    if (localResourcesBrowsers.length === 0) {
        console.log(`Skipping update of local resources for MV3 (${LOCAL_RESOURCES_OPTION}${LOCAL_RESOURCES_NONE})`);
    } else {
        console.log(`Updating local resources for MV3 (${localResourcesBrowsers.join(', ')})...`);
        // The testcases refresh (step 3) runs only on a full update: it depends
        // on the testcases API, which a scoped expedited update must not. The
        // MV3 local script rules embed the statically imported TESTCASES_RULES,
        // so a scoped update still uses the committed list.
        if (localResourcesBrowsers.length === MV3_ASSETS_FILTERS_BROWSERS.length) {
            await updateTestcasesScriptRules();
            console.log('Local script rules from testcases updated');
        }
        await updateMv3LocalResources(localResourcesBrowsers);
        console.log('Local resources for MV3 updated');
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
    await resourcesMv3(resolveLocalResourcesBrowsers(process.argv));
})();
