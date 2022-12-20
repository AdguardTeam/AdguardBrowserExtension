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

import path from 'path';
import fs from 'fs';

import inputConfig from './config.json';

const {
    twosky_config_path: TWOSKY_CONFIG_PATH,
    api_url: API_URL,
    source_relative_path: SRC_RELATIVE_PATH,
    supported_source_filename_extensions: SRC_FILENAME_EXTENSIONS,
    persistent_messages: PERSISTENT_MESSAGES,
    locales_relative_path: LOCALES_RELATIVE_PATH,
    locales_data_format: FORMAT,
    locales_data_filename: LOCALE_DATA_FILENAME,
    required_locales: REQUIRED_LOCALES,
    threshold_percentage: THRESHOLD_PERCENTAGE,
} = inputConfig;

const twoskyPath = path.join(__dirname, TWOSKY_CONFIG_PATH);
const twoskyContent = fs.readFileSync(twoskyPath, { encoding: 'utf8' });
const twoskyConfig = JSON.parse(twoskyContent)[0];
const {
    base_locale: BASE_LOCALE,
    languages: LANGUAGES,
    project_id: PROJECT_ID,
} = twoskyConfig;

const LOCALES_ABSOLUTE_PATH = path.join(__dirname, LOCALES_RELATIVE_PATH);

/**
 * We use this pairs because we have different locale codes in the crowdin and the extension
 */
const LOCALE_PAIRS = {
    /**
     * Norvegian language locale code in Crowdin is 'no'
     * Chrome recognizes both locale code 'nb' and 'no',
     * Firefox recognizes only 'nb'
     */
    nb: 'no',
    /**
     * We duplicate es language for Spanish (Latin America and Caribbean)
     */
    es_419: 'es',
};

export {
    BASE_LOCALE,
    LANGUAGES,
    PROJECT_ID,
    TWOSKY_CONFIG_PATH,
    API_URL,
    SRC_RELATIVE_PATH,
    SRC_FILENAME_EXTENSIONS,
    LOCALE_PAIRS,
    PERSISTENT_MESSAGES,
    LOCALES_RELATIVE_PATH,
    LOCALES_ABSOLUTE_PATH,
    FORMAT,
    LOCALE_DATA_FILENAME,
    REQUIRED_LOCALES,
    THRESHOLD_PERCENTAGE,
};
