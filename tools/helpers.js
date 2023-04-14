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

import { redirects } from '@adguard/scriptlets';

import packageJson from '../package.json';

import {
    ENVS,
    ENV_CONF,
    BROWSERS,
    BROWSERS_CONF,
} from './constants';
import { LOCALES_ABSOLUTE_PATH, LOCALE_DATA_FILENAME } from './locales/locales-constants';

const { Redirects } = redirects;

export const getEnvConf = (env) => {
    const envConfig = ENV_CONF[env];
    if (!envConfig) {
        throw new Error(`No env config for: "${env}"`);
    }
    return envConfig;
};

export const getBrowserConf = (browser) => {
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
    const redirects = new Redirects(rawYaml);
    const click2loadSource = redirects.getRedirect('click2load.html');
    return click2loadSource.sha;
};

/**
 * Updates manifest object with new values
 *
 * @param env
 * @param targetPart
 * @param addedPart
 * @returns {*&{content_security_policy: string, version: string}}
 */
export const updateManifest = (env, targetPart, addedPart) => {
    const union = merge(targetPart, addedPart);

    const devPolicy = env === ENVS.DEV
        ? { content_security_policy: `script-src 'self' 'unsafe-eval' '${getClickToLoadSha()}'; object-src 'self'` }
        : { content_security_policy: `script-src 'self' '${getClickToLoadSha()}'; object-src 'self'` };

    delete union.version;

    const result = {
        version: packageJson.version,
        ...union,
        ...devPolicy,
    };

    return result;
};

/**
 * Receives targetPart as a buffer updates it and returns it as a buffer
 *
 * @param env
 * @param targetPart
 * @param addedPart
 * @returns {Buffer}
 */
export const updateManifestBuffer = (env, targetPart, addedPart) => {
    const target = JSON.parse(targetPart.toString());

    const result = updateManifest(env, target, addedPart);

    return Buffer.from(JSON.stringify(result, null, 4));
};

const capitalize = (str) => {
    return str.charAt(0)
        .toUpperCase() + str.slice(1);
};

const getNameSuffix = (buildEnv, browser) => {
    switch (browser) {
        case BROWSERS.FIREFOX_STANDALONE: {
            if (buildEnv === ENVS.BETA) {
                return ' (Standalone)';
            }
            if (buildEnv === ENVS.DEV) {
                return ' (Standalone Dev)';
            }
            break;
        }
        case BROWSERS.FIREFOX_AMO: {
            if (buildEnv === ENVS.BETA) {
                return ' (Beta)';
            }
            if (buildEnv === ENVS.DEV) {
                return ' (AMO Dev)';
            }
            break;
        }
        default:
            if (buildEnv !== ENVS.RELEASE) {
                return ` (${capitalize(buildEnv)})`;
            }
            break;
    }
    return '';
};

export const updateLocalesMSGName = (content, env, browser) => {
    const suffix = getNameSuffix(env, browser);

    const messages = JSON.parse(content.toString());
    messages.name.message += suffix;

    return JSON.stringify(messages, null, 4);
};

export const chunkArray = (arr, size) => arr.reduce((chunks, el, idx) => {
    if (idx % size === 0) {
        chunks.push([el]);
    } else {
        chunks[chunks.length - 1].push(el);
    }
    return chunks;
}, []);

/**
 * Gets strings for certain locale
 *
 * @param {string} locale
 * @returns {object}
 */
export const getLocaleTranslations = async (locale) => {
    const filePath = path.join(LOCALES_ABSOLUTE_PATH, locale, LOCALE_DATA_FILENAME);
    const fileContent = await fs.promises.readFile(filePath, 'utf-8');
    return JSON.parse(fileContent);
};

/**
 * Compares two arrays
 *
 * @param {Array} arr1
 * @param {Array} arr2
 * @returns {boolean}
 */
export const areArraysEqual = (arr1, arr2) => {
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
