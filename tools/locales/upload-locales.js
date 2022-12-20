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

import path from 'path';
import fs from 'fs';
import axios from 'axios';

import {
    PROJECT_ID,
    BASE_LOCALE,
    LOCALE_PAIRS,
    API_URL,
    LOCALES_RELATIVE_PATH,
    FORMAT,
    LOCALE_DATA_FILENAME,
} from './locales-constants';

const LOCALES_UPLOAD_URL = `${API_URL}/upload`;
const LOCALES_DIR = path.resolve(__dirname, LOCALES_RELATIVE_PATH);

// eslint-disable-next-line @typescript-eslint/no-var-requires
const FormData = require('form-data');

const prepare = (locale) => {
    const formData = new FormData();
    formData.append('format', FORMAT);
    formData.append('language', LOCALE_PAIRS[locale] || locale);
    formData.append('filename', LOCALE_DATA_FILENAME);
    formData.append('project', PROJECT_ID);
    formData.append('file', fs.createReadStream(path.join(LOCALES_DIR, `${locale}/${LOCALE_DATA_FILENAME}`)));
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
    return uploadLocale(BASE_LOCALE);
};
