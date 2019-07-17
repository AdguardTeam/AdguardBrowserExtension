/**
 * This task updates locales in repository
 */
import axios from 'axios';
import path from 'path';
import fs from 'fs';
import Log from './log';
import { LOCALES, LOCALES_DIR, LOCALES_DOWNLOAD_URL } from './consts';

const fsPromises = fs.promises;
const log = new Log();

/**
 * We use this pairs because we have different locale codes in the crowdin and the extension
 */
const LOCALE_PAIRS = {
    /**
     * Norvegian language locale code in Crowdin is 'no'
     * Chrome recognizes both locale code 'nb' and 'no',
     * Firefox recognizes only 'nb'
     */
    nb: 'no',
    /**
     * We duplicate es language for Spanish (Latin America and Caribbean)
     */
    es_419: 'es',
};

const FILE_NAME = 'messages.json';

const downloadMessagesByUrl = async (url) => {
    let response;
    try {
        log.info(`Downloading url: ${url}...`);
        response = await axios.get(url, { responseType: 'arraybuffer' });
        log.info('Url downloaded successfully!');
    } catch (e) {
        log.error(`Unable to download by url: ${url} with error ${JSON.stringify(e.response.data)}`);
    }
    return response.data;
};

const downloadLocales = async () => {
    const localeUrlPairs = LOCALES.map((locale) => {
        const crowdinLocale = LOCALE_PAIRS[locale] || locale;
        return { locale, url: `${LOCALES_DOWNLOAD_URL}&language=${crowdinLocale}&filename=${FILE_NAME}` };
    });

    const localeDataPairs = [];

    // eslint-disable-next-line no-restricted-syntax
    for (const localeUrlPair of localeUrlPairs) {
        const { locale, url } = localeUrlPair;
        // eslint-disable-next-line no-await-in-loop
        const data = await downloadMessagesByUrl(url);
        localeDataPairs.push({ locale, data });
    }

    return localeDataPairs;
};

const saveFile = async (path, data) => {
    try {
        await fsPromises.writeFile(path, data);
    } catch (e) {
        log.error(`Was unable do save data in path: ${path}. Error: ${e.message}`);
    }
};

const saveLocales = async (localeDataPairs) => {
    const promises = localeDataPairs.map((localeDataPair) => {
        const { locale, data } = localeDataPair;
        const localeFilePath = path.resolve(LOCALES_DIR, locale, FILE_NAME);
        const localeDirPath = path.resolve(LOCALES_DIR, locale);
        if (!fs.existsSync(localeDirPath)) {
            fs.mkdirSync(localeDirPath);
        }
        return saveFile(localeFilePath, data);
    });

    return Promise.all(promises);
};

const updateLocales = async () => {
    const localeDataPairs = await downloadLocales();
    await saveLocales(localeDataPairs);
};

export default updateLocales;
