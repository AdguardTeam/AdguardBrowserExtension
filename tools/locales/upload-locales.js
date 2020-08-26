import path from 'path';
import fs from 'fs';
import axios from 'axios';
import { LOCALES_DIR, LOCALES_UPLOAD_URL } from '../constants';
import { LOCALE_PAIRS } from './locales-constants';

const FormData = require('form-data');
const twoskyConfig = require('../../.twosky.json')[0];

const { base_locale: baseLocale, project_id: projectId } = twoskyConfig;

const prepare = (locale) => {
    const formData = new FormData();
    formData.append('format', 'json');
    formData.append('language', LOCALE_PAIRS[locale] || locale);
    formData.append('filename', 'messages.json');
    formData.append('project', projectId);
    formData.append('file', fs.createReadStream(path.resolve(LOCALES_DIR, `${locale}/messages.json`)));
    const headers = {
        ...formData.getHeaders(),
    };
    return { formData, url: LOCALES_UPLOAD_URL, headers };
};

const uploadLocale = async (locale) => {
    const { url, formData, headers } = prepare(locale);
    const response = await axios.post(url, formData, { headers });
    return response.data;
};

export const uploadLocales = async () => {
    return uploadLocale(baseLocale);
};
