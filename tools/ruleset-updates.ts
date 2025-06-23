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

/**
 * Script for updating rulesets in the AdGuard Browser Extension.
 *
 * Handles both Full and Skip-review updates.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import { execSync } from 'child_process';

const EXTENSION_ID = 'bgnkhhnnamicmpeenaelnjfhikgbkllg'; // AdGuard Chrome extension ID
const FILTERS_DIR = path.join(process.cwd(), 'Extension', 'filters');
const TEMP_DIR = path.join(process.cwd(), 'temp_rulesets');
const PREVIOUS_VERSION_DIR = path.join(TEMP_DIR, 'previous');
const CURRENT_VERSION_DIR = path.join(TEMP_DIR, 'current');

interface VersionInfo {
    version: string;
    timestamp: string;
    type: 'stable' | 'patch';
}

/**
 * Gets the latest published version of the Chrome extension
 *
 * @param id The extension ID
 * @param chromeVer Chrome version to check against
 *
 * @returns The extension version
 */
async function getLatestVersion(id: string, chromeVer = '124.0.0.0'): Promise<string> {
    return new Promise((resolve, reject) => {
        const url = new URL('https://clients2.google.com/service/update2/crx');
        url.searchParams.set('response', 'redirect');
        url.searchParams.set('acceptformat', 'crx3');
        url.searchParams.set('prodversion', chromeVer);
        url.searchParams.set('x', `id=${id}&installsource=ondemand&uc`);

        https.get(url.href, (res) => {
            if (res.statusCode !== 302 && res.statusCode !== 303 && res.statusCode !== 307) {
                const error = new Error(`No update found for "${id}" (Chrome ${chromeVer})`);
                (error as any).status = res.statusCode;
                return reject(error);
            }

            const redirectUrl = res.headers.location;
            console.log(`Redirect URL: ${redirectUrl}`);

            if (!redirectUrl) {
                const error = new Error(`No update found for "${id}" (Chrome ${chromeVer})`);
                (error as any).status = res.statusCode;
                return reject(error);
            }

            const match = redirectUrl.match(/_([0-9_]+)\.crx$/);
            if (!match) {
                return reject(new Error('Could not parse version from redirect URL.'));
            }

            if (!match[1]) {
                return reject(new Error('Could not parse version from redirect URL.'));
            }

            resolve(match[1].replace(/_/g, '.'));
        }).on('error', reject);
    });
}

/**
 * Create necessary directories
 */
function createDirectories(): void {
    [TEMP_DIR, PREVIOUS_VERSION_DIR, CURRENT_VERSION_DIR].forEach((dir) => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    });
}

/**
 * Download previous stable version of dnr-rulesets
 *
 * @param version - The version to download
 */
function downloadPreviousVersion(version: string): void {
    console.log(`Downloading previous stable version: ${version}...`);
    // TODO: Implement npm download of specific version of @adguard/dnr-rulesets
    execSync(`npm pack @adguard/dnr-rulesets@${version} --pack-destination=${PREVIOUS_VERSION_DIR}`);
}

/**
 * Download latest version of dnr-rulesets
 */
function downloadLatestVersion(): void {
    console.log('Downloading latest dnr-rulesets version...');
    // TODO: Implement npm download of latest version of @adguard/dnr-rulesets
    execSync(`npm pack @adguard/dnr-rulesets@latest --pack-destination=${CURRENT_VERSION_DIR}`);
}

/**
 * Updates rulesets using the dnr-rulesets package.
 *
 * @param isFullUpdate Whether this is a Friday full update
 */
function updateRulesets(isFullUpdate: boolean): void {
    console.log(`Updating rulesets (${isFullUpdate ? 'Friday full update' : 'hourly patch'})...`);

    // TODO: use some dnr-rulesets method to compare and update rulesets
    // This would involve extracting the previously reviewed ruleset and comparing with the current one

    // For example:
    // import { compareRulesets } from '@adguard/dnr-rulesets';
    // compareRulesets(PREVIOUS_VERSION_DIR, CURRENT_VERSION_DIR, {
    //     output: FILTERS_DIR,
    //     extensionType: 'chromium-mv3'
    // });
}

/**
 * Saves the dnr-rulesets version information.
 *
 * @param isFullUpdate Whether this is a Friday full update.
 * @param version The version being used.
 *
 * @returns The version info object.
 */
function saveVersionInfo(isFullUpdate: boolean, version: string): VersionInfo {
    console.log(`Saving version info: ${version} (${isFullUpdate ? 'stable' : 'patch'})...`);

    // Create version info object
    const versionInfo: VersionInfo = {
        version,
        timestamp: new Date().toISOString(),
        type: isFullUpdate ? 'stable' : 'patch',
    };

    // Save in the filters directory for reference
    fs.writeFileSync(
        path.join(FILTERS_DIR, 'dnr-rulesets-version.json'),
        JSON.stringify(versionInfo, null, 2),
    );

    return versionInfo;
}

/**
 * Verifies that only safe changes are included in the update.
 *
 * @returns Whether the changes are safe.
 */
function verifySafeChanges(): boolean {
    console.log('Verifying only safe changes are included...');

    try {
        // Use the verify-ruleset-safety script
        execSync(`ts-node tools/verify-ruleset-safety.ts "${PREVIOUS_VERSION_DIR}" "${CURRENT_VERSION_DIR}"`);
        return true;
    } catch (error) {
        console.error('Safety verification failed:', error);
        return false;
    }
}

/**
 * Main function to run the update process
 */
async function main(): Promise<number> {
    try {
        // Check if this is a Friday update based on command line args
        const isFullUpdate = process.argv.includes('--full');

        console.log(`Starting ${isFullUpdate ? 'Friday full' : 'hourly patch'} update...`);

        // Create directories
        createDirectories();

        // Get the latest published version
        const latestVersion = await getLatestVersion(EXTENSION_ID);
        console.log(`Latest published extension version: ${latestVersion}`);

        // Download previous stable version
        downloadPreviousVersion(latestVersion);

        // Download latest version
        downloadLatestVersion();

        // Update rulesets
        updateRulesets(isFullUpdate);

        // Save version info
        const versionInfo = saveVersionInfo(isFullUpdate, latestVersion);

        // Verify changes are safe
        const isSafe = verifySafeChanges();
        if (!isSafe) {
            throw new Error('Safety verification failed - update contains unsafe changes');
        }

        console.log(`Successfully completed ${isFullUpdate ? 'Friday full' : 'hourly patch'} update!`);
        console.log(`Version info: ${JSON.stringify(versionInfo)}`);

        return 0;
    } catch (error) {
        console.error('Error during ruleset update:', error);
        return 1;
    }
}

if (require.main === module) {
    main().then(process.exit);
}

export { main, getLatestVersion };
