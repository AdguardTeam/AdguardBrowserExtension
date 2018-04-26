import gulp from 'gulp';
import path from 'path';
import md5 from 'gulp-hash-creator';
import fs from 'fs';
import request from 'request';
import Logs from './log';
import {LOCALES_DIR, PRIVATE_FILES} from './consts';

const logs = new Logs();

const hashString = (stringContent) => {
    return md5({
        content: stringContent
    });
};

const prepare = () => {
    let oneskyapp;

    try {
        oneskyapp = JSON.parse(fs.readFileSync(path.resolve(PRIVATE_FILES, 'oneskyapp.json')));
    } catch (err) {
        logs.error(err);
        return false;
    }

    const timestamp = Math.round(new Date().getTime() / 1000);
    const formData = {
        'file': fs.createReadStream(path.resolve(LOCALES_DIR, 'en/messages.json')),
        'file_format': 'HIERARCHICAL_JSON',
        'locale': 'en',
        'is_keeping_all_strings': 'false',
        'api_key': oneskyapp.apiKey,
        'dev_hash': hashString(timestamp + oneskyapp.secretKey),
        'timestamp': timestamp
    };

    const url = oneskyapp.url + oneskyapp.projectId + '/files';

    return {formData, url};
};

const uploadLocal = () => {
    const data = prepare();

    return request.post({
        url: data.url,
        formData: data.formData
    }, function optionalCallback(err, httpResponse, body) {
        if (err) {
            logs.error(err);
        } else {
            logs.info('Upload successful! Server responded with: ' + body);
        }
    });
};

export default gulp.series(uploadLocal);
