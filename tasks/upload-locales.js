import path from 'path';
import fs from 'fs';
import axios from 'axios';
import Logs from './log';
import {
    LOCALES_DIR,
    LOCALES_UPLOAD_URL,
    LOCALES_PROJECT_NAME,
    BASE_LOCALE,
} from './consts';

const FormData = require('form-data');

const logs = new Logs();

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

const prepare = (locale) => {
    const formData = new FormData();
    formData.append('format', 'json');
    formData.append('language', LOCALE_PAIRS[locale] || locale);
    formData.append('filename', 'messages.json');
    formData.append('project', LOCALES_PROJECT_NAME);
    formData.append('file', fs.createReadStream(path.resolve(LOCALES_DIR, `${locale}/messages.json`)));
    const headers = {
        ...formData.getHeaders(),
    };
    return { formData, url: LOCALES_UPLOAD_URL, headers };
};

const uploadLocale = async (locale) => {
    const { url, formData, headers } = prepare(locale);

    try {
        const response = await axios.post(url, formData, { headers });
        logs.info(`Upload successful! Server responded with: ${JSON.stringify(response.data)}`);
    } catch (e) {
        logs.error(JSON.stringify(e.response.data));
    }
};

const uploadBaseLocale = async () => {
    await uploadLocale(BASE_LOCALE);
};

export default uploadBaseLocale;
