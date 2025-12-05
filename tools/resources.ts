/* eslint-disable no-console */
/**
 * Copyright (c) 2015-2025 Adguard Software Ltd.
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

import { findDangerousRules } from './resources/dangerous-rules';
import { downloadFilters } from './resources/download-filters';
import { updateLocalScriptRulesForFirefox } from './resources/update-local-script-rules';

const resources = async () => {
    console.log('Downloading resources...');
    await downloadFilters();
    console.log('Resources downloaded');

    console.log('Updating local script rules...');
    await updateLocalScriptRulesForFirefox();
    console.log('Local script rules updated');

    if (process.env.OPENAI_API_KEY) {
        console.log('Finding dangerous rules...');
        await findDangerousRules(process.env.OPENAI_API_KEY);
        console.log('Dangerous rules check completed');
    } else {
        console.log('OpenAI API key is not provided, skipping dangerous rules check');
    }
};

(async () => {
    await resources();
})();
