/* global __dirname */
import fs from 'fs';
import path from 'path';
import gulp from 'gulp';
import download from 'gulp-download2';
import md5 from 'gulp-hash-creator';
import {LOCALES, LOCALES_DIR} from './consts';

const hashString = (stringContent) => {
    return md5({
        content: stringContent
    });
};

const prepare = () => {
    let options = {
        locales: LOCALES,
        sourceFile: 'messages.json'
    };

    let oneskyapp;

    try {
        oneskyapp = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../oneskyapp.json')));
    } catch (err) {
        console.error(err);
        return false;
    }

    options = Object.assign(options, oneskyapp);

    let urls = [];

    options.locales.forEach((localization) => {
        const timestamp = Math.round(new Date().getTime() / 1000);
        let url = [];

        url.push(options.url + options.projectId);
        url.push('/translations?locale=' + localization);
        url.push('&source_file_name=' + options.sourceFile);
        url.push('&export_file_name=' + localization + '.json');
        url.push('&api_key=' + options.apiKey);
        url.push('&timestamp=' + timestamp);
        url.push('&dev_hash=' + hashString(timestamp + options.secretKey));

        urls.push({
            file: `${localization}/${options.sourceFile}`,
            url: url.join('')
        });
    });

    return urls;
};

const downloadLocales = () => {
    return download(prepare())
        .pipe(gulp.dest(LOCALES_DIR));
};

export default downloadLocales;
