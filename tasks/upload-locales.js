import path from 'path';
import fs from 'fs';
import axios from 'axios';
import Logs from './log';
import { LOCALES_DIR, LOCALES_UPLOAD_URL } from './consts';

const FormData = require('form-data');

const logs = new Logs();

const prepare = () => {
    const formData = new FormData();
    formData.append('format', 'json');
    formData.append('language', 'en');
    formData.append('filename', 'messages.json');
    formData.append('project', 'browser-extension');
    formData.append('file', fs.createReadStream(path.resolve(LOCALES_DIR, 'en/messages.json')));
    const headers = {
        ...formData.getHeaders(),
    };
    return { formData, url: LOCALES_UPLOAD_URL, headers };
};

const uploadLocal = async () => {
    const { url, formData, headers } = prepare();

    try {
        const response = await axios.post(url, formData, { headers });
        logs.info(`Upload successful! Server responded with: ${JSON.stringify(response.data)}`);
    } catch (e) {
        logs.error(JSON.stringify(e.response.data));
    }
};

export default uploadLocal;
