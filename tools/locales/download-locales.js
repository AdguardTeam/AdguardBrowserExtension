/**
 * This task updates locales in repository
 */
import axios from 'axios';
import path from 'path';
import fs from 'fs';
import querystring from 'querystring';
import { log } from '../log';
import { chunkArray } from '../helpers';
import { LOCALES_DIR, LOCALES_DOWNLOAD_URL } from '../constants';
import { LOCALE_PAIRS } from './locales-constants';

const [twoskyConfig] = require('../../.twosky.json');

const { project_id: projectId, languages, base_locale: baseLocale } = twoskyConfig;
const locales = Object.keys(languages);

const FILE_NAME = 'messages.json';

const downloadMessagesByUrl = async (url) => {
    let response;
    try {
        log.info(`Downloading url: ${url}...`);
        response = await axios.get(url, { responseType: 'arraybuffer' });
        log.info(`Downloaded: ${url}`);
    } catch (e) {
        let errorMessage;
        if (e.response && e.response.data) {
            const decoder = new TextDecoder();
            errorMessage = decoder.decode(e.response.data);
        } else {
            errorMessage = e.message;
        }
        log.error(`Error occurred: ${errorMessage}, while downloading: ${url}`);
    }
    return response.data;
};

const getQueryString = (lang) => {
    const options = {
        project: projectId,
        language: lang,
        format: 'json',
        filename: FILE_NAME,
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

const downloadAllLocales = async () => {
    const localeUrlPairs = locales.map((locale) => {
        const crowdinLocale = LOCALE_PAIRS[locale] || locale;
        const downloadUrl = `${LOCALES_DOWNLOAD_URL}?${getQueryString(crowdinLocale)}`;
        return { locale, url: downloadUrl };
    });

    // Decrease this value if you encounter error:
    // "Maximum number of concurrent requests for this endpoint is reached"
    const LOCALES_DOWNLOAD_BATCH_SIZE = 20;

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
        log.error(`Was unable do save data in path: ${path}. Error: ${e.message}`);
    }
};

const saveLocales = async (localeDataPairs) => {
    const promises = localeDataPairs.map((localeDataPair) => {
        const { locale, data } = localeDataPair;
        const localeFilePath = path.join(LOCALES_DIR, locale, FILE_NAME);
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
    const requiredFields = ['name', 'short_name', 'description'];
    const resultMessages = { ...messages };
    requiredFields.forEach((requiredField) => {
        const fieldData = resultMessages[requiredField];
        if (!fieldData) {
            log.info(`"${locale}" locale does't have required field: "${requiredField}"`);
            log.info('Will be added message from base locale');
            resultMessages[requiredField] = baseMessages[requiredField];
        }
    });
    return resultMessages;
};

const validateLocales = async () => {
    const baseLocalePath = path.join(LOCALES_DIR, baseLocale, FILE_NAME);
    const baseMessages = JSON.parse(await fs.promises.readFile(baseLocalePath, 'utf-8'));
    const promises = locales.map(async (locale) => {
        const pathToLocale = path.join(LOCALES_DIR, locale, FILE_NAME);
        const messages = JSON.parse(await fs.promises.readFile(pathToLocale, 'utf-8'));
        const checkedMessages = checkRequiredFields(locale, messages, baseMessages);
        const checkedMessagesString = JSON.stringify(checkedMessages, null, 4).replace(/\//g, '\\/');
        await fs.promises.writeFile(pathToLocale, checkedMessagesString);
    });
    await Promise.all(promises).catch((e) => {
        log.error(e);
    });
};

export const downloadLocales = async () => {
    const localeDataPairs = await downloadAllLocales();
    await saveLocales(localeDataPairs);
    await validateLocales();
};
