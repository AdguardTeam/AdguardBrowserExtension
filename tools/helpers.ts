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

import fs from 'fs';
import path from 'path';

import { merge } from 'webpack-merge';
import { Manifest } from 'webextension-polyfill';

import { redirects } from '@adguard/scriptlets';

import packageJson from '../package.json';

import {
    BuildTargetEnv,
    ENV_CONF,
    Browser,
    BROWSERS_CONF,
    BrowserConfig,
    EnvConfig,
} from './constants';
import { LOCALES_ABSOLUTE_PATH, LOCALE_DATA_FILENAME } from './locales/locales-constants';

import ManifestBase = Manifest.ManifestBase;
import WebExtensionManifest = Manifest.WebExtensionManifest;

const { Redirects } = redirects;

export const getEnvConf = (env: BuildTargetEnv): EnvConfig => {
    const envConfig = ENV_CONF[env];
    if (!envConfig) {
        throw new Error(`No env config for: "${env}"`);
    }
    return envConfig;
};

export const getBrowserConf = (browser: Browser): BrowserConfig => {
    const browserConf = BROWSERS_CONF[browser];
    if (!browserConf) {
        throw new Error(`No browser config for: "${browser}"`);
    }
    return browserConf;
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
 */
const getClickToLoadSha = () => {
    const redirectsYamlPath = path.resolve(__dirname, '../Extension/assets/libs/scriptlets/redirects.yml');
    const rawYaml = fs.readFileSync(redirectsYamlPath);
    const redirects = new Redirects(rawYaml.toString());
    const click2loadSource = redirects.getRedirect('click2load.html');
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
 * Updates manifest object with new values
 *
 * @param env
 * @param browser
 * @param targetPart
 * @param addedPart
 * @returns {*&{content_security_policy: string, version: string}}
 *
 * @throws Error when directory with declarative rulesets doesn't exist.
 */
export const updateManifest = (
    env: BuildTargetEnv,
    browser: Browser,
    targetPart: Partial<ManifestBase>,
    addedPart: Partial<ManifestBase>,
): WebExtensionManifest => {
    const union = merge(targetPart, addedPart);

    const devPolicy = getEnvPolicy(env, browser);

    delete union.version;

    const result = {
        version: packageJson.version,
        ...devPolicy,
        ...union,
    };

    // FIXME later
    // @ts-ignore
    return result;
};

/**
 * Updates a manifest buffer with new values and returns the updated buffer.
 *
 * @param env The build environment.
 * @param browser The target browser.
 * @param targetPart The existing manifest content as a buffer.
 * @param addedPart The additional manifest content to merge.
 * @returns A buffer containing the updated manifest.
 */
export const updateManifestBuffer = (
    env: BuildTargetEnv,
    browser: Browser,
    targetPart: Buffer,
    addedPart: Partial<WebExtensionManifest>,
): Buffer => {
    const target = JSON.parse(targetPart.toString());

    const result = updateManifest(env, browser, target, addedPart);

    return Buffer.from(JSON.stringify(result, null, 4));
};

const capitalize = (str: string) => {
    return str.charAt(0)
        .toUpperCase() + str.slice(1);
};

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
                return ' (MV3 Beta)';
            }
            if (buildEnv === BuildTargetEnv.Dev) {
                return ' (MV3 Dev)';
            }
            break;
        }
        default:
            if (buildEnv !== BuildTargetEnv.Release) {
                return ` (${capitalize(buildEnv)})`;
            }
            break;
    }
    return '';
};

export const updateLocalesMSGName = (content: Buffer, env: Env, browser: Browser) => {
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
 * @returns An array of chunks.
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
 * @returns A promise that resolves to an object containing key-value pairs of translation strings.
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
