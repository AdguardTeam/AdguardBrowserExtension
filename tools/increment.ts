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

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { parse } from 'semver';

import { getVersion } from '@adguard/dnr-rulesets/utils';

/* eslint-disable @typescript-eslint/naming-convention */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
/* eslint-enable @typescript-eslint/naming-convention */

/**
 * Increments the package version according to the specified rules:
 * - Increments the first number in build metatag (incrementVersion)
 * - Replaces the last number with the patch version from dnr-rulesets (dnrVersion)
 * - Keeps the middle build metatag unchanged
 */
const incrementVersion = async (): Promise<void> => {
    const packageJsonPath = path.resolve(__dirname, '../package.json');
    const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf-8');
    const packageJson = JSON.parse(packageJsonContent);

    const currentVersion = packageJson.version;
    console.log(`Current version: ${currentVersion}`);

    // Parse the current version
    const parsedVersion = parse(currentVersion);
    if (!parsedVersion) {
        throw new Error(`Cannot parse package version: ${currentVersion}`);
    }

    const { build } = parsedVersion;
    if (!build || build.length !== 3) {
        throw new Error(`Invalid build format in version: ${currentVersion}. Expected format: major.minor.patch+incrementVersion.buildMetatag.dnrVersion`);
    }

    const [
        incrementVersionStr,
        buildMetatag,
        dnrVersionStr,
    ] = build;

    if (!incrementVersionStr || !buildMetatag || !dnrVersionStr) {
        throw new Error(`Invalid build components in version: ${currentVersion}. Expected format: major.minor.patch+incrementVersion.buildMetatag.dnrVersion`);
    }

    // Increment the first number (incrementVersion)
    const currentIncrementVersion = parseInt(incrementVersionStr, 10);
    if (Number.isNaN(currentIncrementVersion)) {
        throw new Error(`Invalid increment version: ${incrementVersionStr}`);
    }
    const newIncrementVersion = currentIncrementVersion + 1;

    // Get the patch version from dnr-rulesets
    const dnrVersion = getVersion();
    const parsedDnrVersion = parse(dnrVersion);
    if (!parsedDnrVersion) {
        throw new Error(`Cannot parse dnr version: ${dnrVersion}`);
    }

    const newDnrPatchVersion = parsedDnrVersion.patch;

    // Construct the new version manually
    const baseVersion = `${parsedVersion.major}.${parsedVersion.minor}.${parsedVersion.patch}`;
    const newBuildString = `${newIncrementVersion}.${buildMetatag}.${newDnrPatchVersion}`;
    const newVersion = `${baseVersion}+${newBuildString}`;

    console.log(`New version: ${newVersion}`);
    console.log('Changes:');
    console.log(`  - Increment version: ${incrementVersionStr} -> ${newIncrementVersion}`);
    console.log(`  - Build metatag: ${buildMetatag} (unchanged)`);
    if (dnrVersionStr === String(newDnrPatchVersion)) {
        console.log(`  - DNR version: ${dnrVersionStr} (unchanged)`);
    } else {
        console.log(`  - DNR version: ${dnrVersionStr} -> ${newDnrPatchVersion}`);
    }

    // Update package.json
    packageJson.version = newVersion;

    const updatedPackageJsonContent = `${JSON.stringify(packageJson, null, 4)}\n`;
    fs.writeFileSync(packageJsonPath, updatedPackageJsonContent, 'utf-8');

    console.log('package.json updated successfully.');
};

incrementVersion().catch((error) => {
    console.error('Error incrementing version:', error);
    process.exit(1);
});
