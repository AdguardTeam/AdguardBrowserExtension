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
 * This task updates locales in repository
 */
import axios from 'axios';
import path from 'path';
import fs from 'fs';
import querystring from 'querystring';
import { cliLog } from '../cli-log';
import { chunkArray, getLocaleTranslations } from '../helpers';

import {
    PROJECT_ID,
    BASE_LOCALE,
    LANGUAGES,
    LOCALE_PAIRS,
    API_URL,
    LOCALES_RELATIVE_PATH,
    FORMAT,
    LOCALE_DATA_FILENAME,
    PERSISTENT_MESSAGES,
} from './locales-constants';

const LOCALES_DOWNLOAD_URL = `${API_URL}/download`;
const LOCALES_DIR = path.resolve(__dirname, LOCALES_RELATIVE_PATH);

const locales = Object.keys(LANGUAGES);

const downloadMessagesByUrl = async (url) => {
    let response;
    try {
        cliLog.info(`Downloading url: ${url}...`);
        response = await axios.get(url, { responseType: 'arraybuffer' });
        cliLog.info(`Downloaded: ${url}`);
    } catch (e) {
        let errorMessage;
        if (e.response && e.response.data) {
            const decoder = new TextDecoder();
            errorMessage = decoder.decode(e.response.data);
        } else {
            errorMessage = e.message;
        }
        cliLog.error(`Error occurred: ${errorMessage}, while downloading: ${url}`);
    }
    return response.data;
};

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
        // eslint-disable-next-line no-await-in-loop
        const data = await Promise.all(promises);
        result.push(data);
    }

    return result.flat(Infinity);
};

const downloadLocales = async (locales) => {
    const localeUrlPairs = locales.map((locale) => {
        const crowdinLocale = LOCALE_PAIRS[locale] || locale;
        const downloadUrl = `${LOCALES_DOWNLOAD_URL}?${getQueryString(crowdinLocale)}`;
        return { locale, url: downloadUrl };
    });

    // Decrease this value if you encounter error:
    // "Maximum number of concurrent requests for this endpoint is reached"
    const LOCALES_DOWNLOAD_BATCH_SIZE = 2;

    return promiseBatchMap(localeUrlPairs, LOCALES_DOWNLOAD_BATCH_SIZE, async (localeUrlPair) => {
        const { locale, url } = localeUrlPair;
        const data = await downloadMessagesByUrl(url);
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
    const promises = locales.map(async (locale) => {
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
