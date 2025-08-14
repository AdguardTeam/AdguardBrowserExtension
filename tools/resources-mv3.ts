/* eslint-disable no-console */
/**
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

import { findDangerousRules } from './resources/dangerous-rules';
import { downloadAndPrepareMv3Filters } from './resources/download-filters';
import { updateLocalResourcesForChromiumMv3 } from './resources/update-local-script-rules';

// TODO: worth refactoring since this function is separated from ./resources.ts

/**
 * Downloads resources for MV3, checks if there are dangerous rules,
 * and converts filters to rulesets.
 */
const resourcesMv3 = async () => {
    console.log('Downloading resources for MV3...');
    await downloadAndPrepareMv3Filters();
    console.log('Resources for MV3 downloaded');

    console.log('Updating local resources for MV3...');
    await updateLocalResourcesForChromiumMv3();
    console.log('Local resources for MV3 updated');

    if (process.env.OPENAI_API_KEY) {
        console.log('Finding dangerous rules...');
        await findDangerousRules(process.env.OPENAI_API_KEY);
        console.log('Dangerous rules check completed');
    } else {
        console.log('OpenAI API key is not provided, skipping dangerous rules check');
    }
};

(async () => {
    await resourcesMv3();
})();
