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
 * @param {string} locale - locale
 * @param {Object} messages - locale messages
 * @param {Object} baseMessages - base locale messages
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
