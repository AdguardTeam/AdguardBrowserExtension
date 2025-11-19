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

/**
 * This task downloads locales from Crowdin and saves them to the locales directory.
 */
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import querystring from 'querystring';

import axios from 'axios';

import { cliLog } from '../cli-log';
import { chunkArray, getLocaleTranslations } from '../helpers';

import {
    PROJECT_ID,
    BASE_LOCALE,
    LOCALE_PAIRS,
    API_URL,
    LOCALES_RELATIVE_PATH,
    FORMAT,
    LOCALE_DATA_FILENAME,
    PERSISTENT_MESSAGES,
    LOCALES,
} from './locales-constants';

/* eslint-disable @typescript-eslint/naming-convention */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
/* eslint-enable @typescript-eslint/naming-convention */

const LOCALES_DOWNLOAD_URL = `${API_URL}/download`;
const LOCALES_DIR = path.resolve(__dirname, LOCALES_RELATIVE_PATH);

const getQueryString = (lang) => {
    const options = {
        project: PROJECT_ID,
        language: lang,
        format: FORMAT,
        filename: LOCALE_DATA_FILENAME,
    };
    return querystring.stringify(options);
};

const promiseBatchMap = async (arr, batchSize, handler) => {
    const batches = chunkArray(arr, batchSize);

    const result = [];

    // eslint-disable-next-line no-restricted-syntax
    for (const batch of batches) {
        const promises = batch.map(handler);
        const data = await Promise.all(promises);
        result.push(data);
    }

    return result.flat(Infinity);
};

/**
 * Extracts the error message from the error object.
 *
 * @param {Error} error - The error object.
 *
 * @returns {object} An object containing the extracted error message.
 */
const extractErrorMessage = (error) => {
    if (error.response && error.response.data) {
        const decoder = new TextDecoder();
        return JSON.parse(decoder.decode(error.response.data));
    }
    return { message: error.message };
};

/**
 * Downloads messages from a given URL.
 *
 * @async
 *
 * @param {string} url - The URL to download the messages from.
 *
 * @returns {Promise<Buffer>} The downloaded data as an array buffer.
 *
 * @throws {Error} When the download fails.
 */
const downloadMessagesByUrl = async (url) => {
    let response;
    try {
        cliLog.info(`Downloading url: ${url}...`);
        response = await axios.get(url, { responseType: 'arraybuffer' });
        cliLog.info(`Downloaded: ${url}`);
    } catch (e) {
        const errorMessage = extractErrorMessage(e);
        throw new Error(JSON.stringify(errorMessage));
    }
    return response.data;
};

/**
 * Determines if a download attempt should be retried based on the error details.
 *
 * @param {string} errorMessage - The details of the error.
 *
 * @returns {boolean} True if the download should be retried, false otherwise.
 */
const shouldRetry = (errorMessage) => {
    const errorDetails = JSON.parse(errorMessage);
    return (
        (errorDetails.details && errorDetails.details.code === '55')
        || (errorDetails.message && errorDetails.message.includes('getaddrinfo ENOTFOUND'))
    );
};

/**
 * Delays the execution for a specific time.
 *
 * @param {number} delay - Time in milliseconds to delay.
 *
 * @returns {Promise<void>} Resolves after the specified delay.
 */
const delayExecution = (delay) => {
    return new Promise((resolve) => {
        setTimeout(resolve, delay);
    });
};

/**
 * Downloads a URL with retries and exponentially increasing delays in case of errors.
 *
 * @async
 *
 * @param {string} url - The URL to download from.
 * @param {number} [retries=100] - The number of times to retry the download.
 * @param {number} [initialDelay=2000] - The initial delay in milliseconds between retries.
 * @param {number} [factor=1.5] - The multiplier to increase the delay between retries.
 *
 * @returns {Promise<Buffer|null>} The downloaded data as an array buffer, or null if retries exhausted.
 *
 * @throws {Error} When max retries are reached or a non-retryable error occurs.
 */
const downloadUrlWithRetry = async (url, retries = 100, initialDelay = 2000, factor = 1.5) => {
    let delay = initialDelay;
    for (let i = 0; i < retries; i += 1) {
        try {
            return await downloadMessagesByUrl(url);
        } catch (error) {
            if (shouldRetry(error.message)) {
                cliLog.info(`Attempt ${i + 1} failed due to rate limiting. Retrying in ${delay} ms...`);
                await delayExecution(delay);
                delay *= factor;
            } else {
                throw new Error(`Failed with non-retryable error: ${error.message}`);
            }
        }
    }
    throw new Error(`Max retries reached for ${url}`);
};

const downloadLocales = async (locales) => {
    const localeUrlPairs = locales.map((locale) => {
        const crowdinLocale = LOCALE_PAIRS[locale] || locale;
        const downloadUrl = `${LOCALES_DOWNLOAD_URL}?${getQueryString(crowdinLocale)}`;
        return { locale, url: downloadUrl };
    });

    // Decrease this value if you encounter error:
    // "Maximum number of concurrent requests for this endpoint is reached"
    const LOCALES_DOWNLOAD_BATCH_SIZE = 1;

    return promiseBatchMap(localeUrlPairs, LOCALES_DOWNLOAD_BATCH_SIZE, async (localeUrlPair) => {
        const { locale, url } = localeUrlPair;
        const data = await downloadUrlWithRetry(url);
        return { locale, data };
    });
};

const saveFile = async (path, data) => {
    try {
        await fs.promises.writeFile(path, data);
    } catch (e) {
        cliLog.error(`Was unable do save data in path: ${path}. Error: ${e.message}`);
    }
};

const saveLocales = async (localeDataPairs) => {
    const promises = localeDataPairs.map((localeDataPair) => {
        const { locale, data } = localeDataPair;
        const localeFilePath = path.join(LOCALES_DIR, locale, LOCALE_DATA_FILENAME);
        const localeDirPath = path.join(LOCALES_DIR, locale);
        if (!fs.existsSync(localeDirPath)) {
            fs.mkdirSync(localeDirPath);
        }
        return saveFile(localeFilePath, data);
    });

    return Promise.all(promises);
};

/**
 * Checks messages for required locales, if doesn't find them, then adds from baseMessages
 *
 * @param {string} locale - locale
 * @param {object} messages - locale messages
 * @param {object} baseMessages - base locale messages
 */
const checkRequiredFields = (locale, messages, baseMessages) => {
    const requiredFields = PERSISTENT_MESSAGES;
    const resultMessages = { ...messages };
    requiredFields.forEach((requiredField) => {
        const fieldData = resultMessages[requiredField];
        if (!fieldData) {
            cliLog.info(` - "${locale}" locale does't have required field: "${requiredField}"`);
            cliLog.info('   Will be added message from base locale');
            resultMessages[requiredField] = baseMessages[requiredField];
        }
    });
    return resultMessages;
};

const validateRequiredFields = async () => {
    const baseMessages = await getLocaleTranslations(BASE_LOCALE);
    const promises = LOCALES.map(async (locale) => {
        const pathToLocale = path.join(LOCALES_DIR, locale, LOCALE_DATA_FILENAME);
        const messages = JSON.parse(await fs.promises.readFile(pathToLocale, 'utf-8'));
        const checkedMessages = checkRequiredFields(locale, messages, baseMessages);
        const checkedMessagesString = JSON.stringify(checkedMessages, null, 4).replace(/\//g, '\\/');
        await fs.promises.writeFile(pathToLocale, checkedMessagesString);
    });
    await Promise.all(promises).catch((e) => {
        cliLog.error(e);
    });
};

export const downloadAndSave = async (locales) => {
    const localeDataPairs = await downloadLocales(locales);
    await saveLocales(localeDataPairs);
    await validateRequiredFields();
};
