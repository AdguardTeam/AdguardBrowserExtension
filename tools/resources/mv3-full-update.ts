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

import path from 'node:path';
import fs from 'node:fs';

import * as packageJson from '../../package.json';

import { FULL_UPDATE_DNR_RULESETS_VERSION_FILE_PATH } from './constants';

const DNR_RULESETS_DEPENDENCY_NAME = '@adguard/dnr-rulesets';

const getDnrRulesetsVersion = (packageJson: any): string | null => {
    let dnrRulesetsVersion = null;

    try {
        // Extract the dnr-rulesets version from dependencies or devDependencies
        dnrRulesetsVersion = packageJson.dependencies?.[DNR_RULESETS_DEPENDENCY_NAME]
            || packageJson.devDependencies?.[DNR_RULESETS_DEPENDENCY_NAME];

        if (!dnrRulesetsVersion) {
            throw new Error(`Could not find ${DNR_RULESETS_DEPENDENCY_NAME} in package.json dependencies`);
        }

        dnrRulesetsVersion = dnrRulesetsVersion.replace('^', '').replace('~', '');
    } catch (error: unknown) {
        // eslint-disable-next-line no-console
        console.error(`Error getting version of ${DNR_RULESETS_DEPENDENCY_NAME} due to ${error}`);
    }

    return dnrRulesetsVersion;
};

/**
 * Writes the current dnr-rulesets version to dnr-rulesets-version.txt file in the filters directory.
 */
const updateRulesetsFully = (): void => {
    const filePath = path.join(process.cwd(), FULL_UPDATE_DNR_RULESETS_VERSION_FILE_PATH);

    const dnrRulesetsVersion = getDnrRulesetsVersion(packageJson);

    if (!dnrRulesetsVersion) {
        // eslint-disable-next-line no-console
        console.error(`Could not find version of ${DNR_RULESETS_DEPENDENCY_NAME}`);
        process.exit(1);
    }

    fs.writeFile(filePath, dnrRulesetsVersion, (err) => {
        if (err) {
            // eslint-disable-next-line no-console
            console.error(`Error writing version of ${DNR_RULESETS_DEPENDENCY_NAME} to file: ${err}`);
            process.exit(1);
        }
    });
};

updateRulesetsFully();
