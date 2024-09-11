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
import { downloadFilters } from './resources/download-filters';
import { updateLocalScriptRules } from './resources/update-local-script-rules';

const DEFAULT_OPENAI_API_TOKEN = '<openai_api_key>';

const isOpenAiTokenProvided = () => {
    const token = process.env.OPENAI_API_KEY;
    return token !== undefined && token !== DEFAULT_OPENAI_API_TOKEN;
};

const resources = async () => {
    console.log('Downloading resources...');
    await downloadFilters();
    console.log('Resources downloaded');

    console.log('Updating local script rules...');
    await updateLocalScriptRules();
    console.log('Local script rules updated');

    if (isOpenAiTokenProvided()) {
        console.log('Finding dangerous rules...');
        await findDangerousRules();
        console.log('Dangerous rules check completed');
    } else {
        console.log('OpenAI API key is not provided, skipping dangerous rules check');
    }
};

(async () => {
    await resources();
})();
