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

import path from 'node:path';
import fs from 'node:fs';
import https from 'node:https';
import { type IncomingMessage } from 'node:http';
import { execSync } from 'node:child_process';

import { MIN_SUPPORTED_VERSION } from '../../constants';

import { FULL_UPDATE_DNR_RULESETS_VERSION_FILE_PATH } from './constants';
import { downloadAndPrepareMv3Filters } from './download-filters';

/**
 * ID of the release extension in Chrome Web Store.
 */
const EXTENSION_ID = 'bgnkhhnnamicmpeenaelnjfhikgbkllg';

/**
 * Directory containing the previous rulesets.
 */
const previousRulesetsDir = path.join(process.cwd(), 'tmp', 'prev-rulesets');

// TODO: may be useful for the Update button in Filters tab on the options page
/**
 * Gets the latest version of the extension published in Chrome Web Store.
 *
 * @param id The extension ID.
 * @param chromeVer Chrome version to check against.
 *
 * @returns The extension version.
 */
const getLatestExtensionVersion = async (
    id: string,
    chromeVer = `${MIN_SUPPORTED_VERSION.CHROMIUM_MV3}.0.0.0`,
): Promise<string> => {
    const url = new URL('https://clients2.google.com/service/update2/crx');
    url.searchParams.set('response', 'redirect');
    url.searchParams.set('acceptformat', 'crx3');
    url.searchParams.set('prodversion', chromeVer);
    url.searchParams.set('x', `id=${id}&installsource=ondemand&uc`);

    const response = await new Promise<IncomingMessage>((resolve, reject) => {
        https.get(url.href, resolve).on('error', reject);
    });

    if (
        response.statusCode !== 302
        && response.statusCode !== 303
        && response.statusCode !== 307
    ) {
        const error = new Error(`No update found for "${id}" (Chrome ${chromeVer})`);
        (error as any).status = response.statusCode;
        throw error;
    }

    const redirectUrl = response.headers.location;

    if (!redirectUrl) {
        const error = new Error(`No update found for "${id}" (Chrome ${chromeVer})`);
        (error as any).status = response.statusCode;
        throw error;
    }

    const match = redirectUrl.match(/_([0-9_]+)\.crx$/);

    if (!match) {
        throw new Error('Could not parse version from redirect URL.');
    }

    if (!match[1]) {
        throw new Error('Could not parse version from redirect URL.');
    }

    const stableExtensionVersion = match[1]
        // '5_1_111_0' -> '5.1.111.0'
        .replace(/_/g, '.')
        // '5.1.111.0' -> '5.1.111'
        .replace(/\.0$/g, '');

    return stableExtensionVersion;
};

/**
 * Download previous stable version of dnr-rulesets.
 *
 * @param dnrRulesetsVersion The version to download.
 */
const downloadPreviousVersion = async (dnrRulesetsVersion: string): Promise<void> => {
    console.log(`Preparing previous dnr-rulesets version ${dnrRulesetsVersion}...`);
    execSync(`pnpm remove @adguard/dnr-rulesets && pnpm add -D @adguard/dnr-rulesets@${dnrRulesetsVersion}`);
    console.log('Previous dnr-rulesets version installed successfully');

    // clean up files from previous run
    if (fs.existsSync(previousRulesetsDir)) {
        fs.rmSync(previousRulesetsDir, { recursive: true, force: true });
    }
    fs.mkdirSync(previousRulesetsDir, { recursive: true });

    await downloadAndPrepareMv3Filters(previousRulesetsDir);
    console.log(`Filters for previous dnr-rulesets version ${dnrRulesetsVersion} downloaded successfully`);

    // when previous dnr-rulesets version is loaded, re-install the latest one to keep the lock file up-to-date
    console.log('Re-installing latest dnr-rulesets...');
    execSync('pnpm resources:mv3-install-latest');
};

/**
 * Updates rulesets using the dnr-rulesets package.
 */
const updateRulesetsToSkipReview = (): void => {
    console.log('Updating rulesets...');

    // FIXME: use dnr-rulesets method to compare rulesets
    // from 'tmp/prev-rulesets' and 'Extension/filters/chromium-mv3'
};

/**
 * Gets the tag name for the given extension version.
 *
 * @param extensionVersion The extension version.
 *
 * @returns Valid tag name or empty string if not found.
 *
 * @example
 * getTagNameForExtensionVersion('5.1.110') -> 'autobuild-v5.1.110'
 * getTagNameForExtensionVersion('5.1.111') -> 'v5.1.111'
 * getTagNameForExtensionVersion('5.1.999') -> ''
 */
const getTagNameForExtensionVersion = (extensionVersion: string): string => {
    const tagName = execSync(
        `git tag -l "*v${extensionVersion}*"`,
        { encoding: 'utf-8' },
    ).trim();

    return tagName;
};

/**
 * Gets the last full update dnr-rulesets version for the given extension version.
 *
 * @param extensionVersion Extension version.
 *
 * @returns DNR-Rulesets version.
 *
 * @throws Error if dnr-rulesets version cannot be retrieved (due to no tag for given extension version
 * or no file with last full update dnr-rulesets version, etc.).
 */
const getLastFullUpdateDnrRulesetsVersion = (extensionVersion: string): string => {
    console.log(`Getting dnr-rulesets version for extension ${extensionVersion}...`);

    try {
        const tagName = getTagNameForExtensionVersion(extensionVersion);

        console.log(`Tag name: ${tagName}`);

        if (!tagName) {
            throw new Error(`Could not find tag for extension version ${extensionVersion}`);
        }

        // Use git show to get the content of specific file at specific tag
        const prevDnrRulesetsVersion = execSync(
            `git show ${tagName}:${FULL_UPDATE_DNR_RULESETS_VERSION_FILE_PATH}`,
            { encoding: 'utf-8' },
        ).trim();

        if (!prevDnrRulesetsVersion) {
            throw new Error(`Could not find Full update dnr-rulesets version for tag ${tagName}`);
        }

        return prevDnrRulesetsVersion;
    } catch (error: unknown) {
        console.error(`Error getting dnr-rulesets version: ${error}`);
        throw error;
    }
};

/**
 * Main function to run the update process.
 *
 * @throws Error if ruleset update fails.
 */
const main = async (): Promise<void> => {
    try {
        const latestExtensionVersion = await getLatestExtensionVersion(EXTENSION_ID);
        console.log(`Latest published extension version: ${latestExtensionVersion}`);

        const prevDnrRulesetsVersion = getLastFullUpdateDnrRulesetsVersion(latestExtensionVersion);

        console.log(`Previous dnr-rulesets version: ${prevDnrRulesetsVersion}`);

        // Latest dnr-rulesets should already be downloaded, so we can skip this step.
        // Download previous version of dnr-rulesets
        await downloadPreviousVersion(prevDnrRulesetsVersion);

        updateRulesetsToSkipReview();

        console.log('Successfully completed Skip-review rulesets update!');
        process.exit(0);
    } catch (error: unknown) {
        console.error(`Error during ruleset update due to ${error}`);
        process.exit(1);
    }
};

// (async () => {
//     await main();
// })();

main();
