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

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { parse, type SemVer } from 'semver';
import { merge } from 'webpack-merge';
import { type Manifest } from 'webextension-polyfill';

import { Redirects } from '@adguard/scriptlets/redirects';

import packageJson from '../package.json';
import { BuildTargetEnv, WEB_ACCESSIBLE_RESOURCES_OUTPUT_REDIRECTS } from '../constants';

import { Browser } from './constants';
import { LOCALES_ABSOLUTE_PATH, LOCALE_DATA_FILENAME } from './locales/locales-constants';

/* eslint-disable @typescript-eslint/naming-convention */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type ManifestBase = Manifest.ManifestBase;
type WebExtensionManifest = Manifest.WebExtensionManifest;

/**
 * Parsed version components from package.json.
 *
 * @example
 * Original: "5.3.0+88.build.20251001150205"
 * After clearing build metadata: "5.3.0"
 */
export type ParsedVersion = {
    /**
     * Parsed SemVer object.
     */
    parsedVersion: SemVer;
    /**
     * Build increment number.
     */
    incrementVersion: string;
    /**
     * Build tag identifier.
     */
    buildMetatag: string;
    /**
     * DNR version timestamp in YYYYMMDDHHmmss format.
     */
    dnrVersion: string;
};

/**
 * Retrieves the sha value for the click2load.html redirects resource.
 * This value is needed to ensure that the extension's Content Security Policy (CSP)
 * includes the correct sha value, which is used to verify
 * that scripts loaded via the redirect are legitimate and have not been tampered with.
 *
 * This hash is not for a remote script, but for an inline script inside the local resource:
 * web-accessible-resources/redirects/click2load.html.
 * This web resource is used for replacing iframe content,
 * i.e. it inherits the CSP of the parent page.
 * It may disable the inline script inside unless an exclusion is specified in the manifest.
 *
 * @returns Hash of click2load.html redirect resource.
 *
 * @throws Error when click2load.html redirect source not found.
 */
const getClickToLoadSha = () => {
    const redirectsYamlPath = path.resolve(__dirname, `../Extension/${WEB_ACCESSIBLE_RESOURCES_OUTPUT_REDIRECTS}.yml`);
    const rawYaml = fs.readFileSync(redirectsYamlPath);
    const redirects = new Redirects(rawYaml.toString());
    const click2loadSource = redirects.getRedirect('click2load.html');

    if (!click2loadSource || !click2loadSource.sha) {
        throw new Error('click2load.html redirect source not found');
    }

    return click2loadSource.sha;
};

/**
 * Returns the content security policy for the given environment and browser.
 *
 * @param env The build environment.
 * @param browser The target browser.
 */
const getEnvPolicy = (env: BuildTargetEnv, browser: Browser) => {
    switch (browser) {
        case Browser.ChromeMv3:
            return { content_security_policy: { extension_pages: "script-src 'self'; object-src 'self'" } };
        default:
            return env === BuildTargetEnv.Dev
                // eslint-disable-next-line max-len
                ? { content_security_policy: `script-src 'self' 'unsafe-eval' '${getClickToLoadSha()}'; object-src 'self'` }
                : { content_security_policy: `script-src 'self' '${getClickToLoadSha()}'; object-src 'self'` };
    }
};

/**
 * Parses and validates the package.json version string.
 *
 * Extracts and validates all required build metadata components from the version string.
 * The expected version format is: `major.minor.patch+increment.build.dnrVersion`
 * (e.g., "5.3.0+88.build.20251001150205").
 *
 * @returns Parsed version object.
 *
 * @throws Error if package version cannot be parsed.
 */
const parseAndValidateVersion = (version: string): ParsedVersion => {
    const parsedVersion = parse(version);

    if (!parsedVersion) {
        throw new Error(`Cannot parse package version: ${packageJson.version}`);
    }

    const { build } = parsedVersion;

    const [
        incrementVersion,
        buildMetatag,
        dnrVersion,
    ] = build;

    if (incrementVersion === undefined) {
        throw new Error(`Invalid increment version format: ${packageJson.version}`);
    }

    if (buildMetatag === undefined) {
        throw new Error(`Invalid build metatag format: ${packageJson.version}`);
    }

    if (dnrVersion === undefined) {
        throw new Error(`Invalid dnr version format: ${packageJson.version}`);
    }

    return {
        parsedVersion,
        incrementVersion,
        buildMetatag,
        dnrVersion,
    };
};

/**
 * Parses the package.json version and returns the formatted version string
 * in the format major.minor.patch.increment (e.g., "5.3.0.88").
 *
 * This function extracts the increment version from the build metadata
 * and formats it for use in manifest.json and build.txt files.
 *
 * @param version The version string to format.
 *
 * @returns The formatted version string.
 *
 * @throws Error when package version cannot be parsed or has invalid format.
 */
export const getFormattedVersion = (version: string): string => {
    const { parsedVersion, incrementVersion } = parseAndValidateVersion(version);

    // Clear the build metatag since it's not allowed in manifest version.
    parsedVersion.build = [];

    return `${parsedVersion.format()}.${incrementVersion}`;
};

/**
 * Updates a manifest object with new values and returns the updated manifest.
 * Also updates the version and name fields based on the package.json version,
 * since package.json version contains the build metatag, which itself contains
 * the increment version that should be passed to the manifest version to make
 * each build unique.
 *
 * @param buildEnv The build environment.
 * @param browser The target browser.
 * @param targetPart The existing manifest content.
 * @param addedPart The additional manifest content to merge.
 *
 * @returns The updated manifest object.
 *
 * @throws Error when package version cannot be parsed or has invalid format.
 */
export const updateManifest = (
    buildEnv: BuildTargetEnv,
    browser: Browser,
    targetPart: ManifestBase,
    addedPart: Partial<ManifestBase>,
): WebExtensionManifest => {
    // Merge the parts, ensuring the merged object has the expected type
    const union = merge(targetPart, addedPart);

    const devPolicy = getEnvPolicy(buildEnv, browser);

    // Ensure that version and name are properly set
    const manifestVersion = union.manifest_version || targetPart.manifest_version;
    const name = union.name || targetPart.name;

    // Build the final manifest object
    const result: WebExtensionManifest = {
        // Passing build increment version to the version in the manifest
        // to make each build unique and easily identifiable, since we often
        // update builds for MV3 via skip review process.
        version: getFormattedVersion(packageJson.version),
        manifest_version: manifestVersion,
        name,
        ...devPolicy,
        ...union, // Spread other properties from the merged object
    };

    return result;
};

/**
 * Updates a manifest buffer with new values and returns the updated buffer.
 *
 * @param buildEnv The build environment.
 * @param browser The target browser.
 * @param targetPart The existing manifest content as a buffer.
 * @param addedPart The additional manifest content to merge.
 *
 * @returns A buffer containing the updated manifest.
 *
 * @throws Error when package version cannot be parsed or has invalid format.
 */
export const updateManifestBuffer = (
    buildEnv: BuildTargetEnv,
    browser: Browser,
    targetPart: Buffer,
    addedPart: Partial<WebExtensionManifest>,
): Buffer => {
    const target = JSON.parse(targetPart.toString());

    const result = updateManifest(buildEnv, browser, target, addedPart);

    return Buffer.from(JSON.stringify(result, null, 4));
};

/**
 * Capitalizes the first letter of a string.
 *
 * @param str The string to capitalize.
 *
 * @returns The string with the first letter capitalized.
 */
const capitalize = (str: string) => {
    return str.charAt(0)
        .toUpperCase() + str.slice(1);
};

/**
 * Gets the name suffix for the extension based on build environment and browser.
 *
 * @param buildEnv The build environment.
 * @param browser The target browser.
 *
 * @returns The name suffix string.
 */
const getNameSuffix = (buildEnv: BuildTargetEnv, browser: Browser) => {
    switch (browser) {
        case Browser.FirefoxStandalone: {
            if (buildEnv === BuildTargetEnv.Beta) {
                return ' (Standalone)';
            }
            if (buildEnv === BuildTargetEnv.Dev) {
                return ' (Standalone Dev)';
            }
            break;
        }
        case Browser.FirefoxAmo: {
            if (buildEnv === BuildTargetEnv.Beta) {
                return ' (Beta)';
            }
            if (buildEnv === BuildTargetEnv.Dev) {
                return ' (AMO Dev)';
            }
            break;
        }
        case Browser.ChromeMv3: {
            if (buildEnv === BuildTargetEnv.Beta) {
                return ' (Beta)';
            }
            if (buildEnv === BuildTargetEnv.Dev) {
                return ' (Dev)';
            }
            break;
        }
        case Browser.Chrome: {
            if (buildEnv === BuildTargetEnv.Release) {
                return ' MV2';
            }
            return ` (MV2 ${capitalize(buildEnv)})`;
        }
        default:
            if (buildEnv !== BuildTargetEnv.Release) {
                return ` (${capitalize(buildEnv)})`;
            }
            break;
    }
    return '';
};

/**
 * Updates the locales message name with environment-specific suffix.
 *
 * @param content The content buffer containing locale messages.
 * @param env The build environment.
 * @param browser The target browser.
 *
 * @returns The updated JSON string with modified name message.
 */
export const updateLocalesMSGName = (content: Buffer, env: BuildTargetEnv, browser: Browser) => {
    const suffix = getNameSuffix(env, browser);

    const messages = JSON.parse(content.toString());
    messages.name.message += suffix;

    return JSON.stringify(messages, null, 4);
};

/**
 * Splits an array into chunks of a specified size.
 *
 * @param arr The array to be split into chunks.
 * @param size The size of each chunk.
 *
 * @returns An array of chunks.
 *
 * @throws Error if size is less than or equal to 0.
 */
export const chunkArray = <T>(arr: T[], size: number): T[][] => {
    if (size <= 0) {
        throw new Error('Size must be greater than 0');
    }

    return arr.reduce((chunks: T[][], el: T, idx: number) => {
        if (idx % size === 0) {
            chunks.push([el]);
        } else {
            const lastChunk = chunks[chunks.length - 1];
            if (lastChunk) {
                lastChunk.push(el);
            }
        }
        return chunks;
    }, []);
};

/**
 * Retrieves translations for a specific locale.
 *
 * @param locale - The locale identifier (e.g., 'en', 'fr') to fetch translations for.
 *
 * @returns A promise that resolves to an object containing key-value pairs of translation strings.
 *
 * @throws If the file for the specified locale cannot be read or parsed.
 */
export const getLocaleTranslations = async (locale: string) => {
    const filePath = path.join(LOCALES_ABSOLUTE_PATH, locale, LOCALE_DATA_FILENAME);
    const fileContent = await fs.promises.readFile(filePath, 'utf-8');
    return JSON.parse(fileContent);
};

/**
 * Compares two arrays for equality
 *
 * @param arr1 - First array
 * @param arr2 - Second array
 *
 * @returns Returns true if arrays are equal, else false
 */
export const areArraysEqual = <T>(arr1: T[], arr2: T[]): boolean => {
    if (!arr1 || !arr2) {
        return false;
    }
    if (arr1.length !== arr2.length) {
        return false;
    }
    for (let i = 0; i < arr1.length; i += 1) {
        if (arr1[i] !== arr2[i]) {
            return false;
        }
    }
    return true;
};
