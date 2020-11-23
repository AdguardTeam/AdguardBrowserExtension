import { merge } from 'webpack-merge';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import {
    ENVS,
    ENV_CONF,
    BROWSERS,
    BROWSERS_CONF,
} from './constants';
import packageJson from '../package.json';

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

export const updateManifest = (env, targetPart, addedPart) => {
    const target = JSON.parse(targetPart.toString());
    const union = merge(target, addedPart);

    const devPolicy = env === ENVS.DEV
        ? { content_security_policy: "script-src 'self' 'unsafe-eval'; object-src 'self'" }
        : {};

    delete union.version;

    const result = {
        version: packageJson.version,
        ...union,
        ...devPolicy,
    };

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
    messages.short_name.message += suffix;

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
 * @param {string} localesDir
 * @param {string} locale
 * @param {string} localesDataFilename
 * @returns {Object}
 */
export const getLocaleTranslations = async (localesDir, locale, localesDataFilename) => {
    const filePath = path.join(localesDir, locale, localesDataFilename);
    const fileContent = await fs.promises.readFile(filePath, 'utf-8');
    return JSON.parse(fileContent);
};

/**
 * Compares two arrays
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
