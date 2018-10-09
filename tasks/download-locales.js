/**
 * Update locales in repository
 */

/* global __dirname */
import fs from 'fs';
import path from 'path';
import gulp from 'gulp';
import download from 'gulp-download2';
import md5 from 'gulp-hash-creator';
import { LOCALES, LOCALES_DIR, PRIVATE_FILES } from './consts';
import Logs from './log';

/**
 * We use this pairs because we have different locale codes in the onesky and the extension
 */
export const LOCALE_PAIRS = {
    /**
     * Norvegian language locale code in oneskyapp is 'no'
     * chrome recognizes both locale code 'nb' and 'no',
     * but firefox recognizes only 'nb'
     */
    nb: 'no',
    /**
     * Belarusian language locale code in oneskyapp is 'be-BY'
     * chrome doesn't recognize belarusian language at all
     * firefox regognizes 'be' code
     */
    be: 'be-BY',
};

const logs = new Logs();

const hashString = (stringContent) => {
    return md5({
        content: stringContent
    });
};

const prepare = () => {
    let options = {
        locales: LOCALES,
        sourceFile: 'messages.json',
    };

    let oneskyapp;

    try {
        oneskyapp = JSON.parse(fs.readFileSync(path.resolve(PRIVATE_FILES, 'oneskyapp.json')));
    } catch (err) {
        logs.error(err);
        return false;
    }

    options = Object.assign(options, oneskyapp);

    let urls = [];

    options.locales.forEach((localization) => {
        const timestamp = Math.round(new Date().getTime() / 1000);
        let url = [];

        /**
         * GET oneskyapp locale code
         */
        const oneSkyLocalization = LOCALE_PAIRS[localization] || localization;

        url.push(options.url + options.projectId);
        url.push('/translations?locale=' + oneSkyLocalization);
        url.push('&source_file_name=' + options.sourceFile);
        url.push('&export_file_name=' + oneSkyLocalization + '.json');
        url.push('&api_key=' + options.apiKey);
        url.push('&timestamp=' + timestamp);
        url.push('&dev_hash=' + hashString(timestamp + options.secretKey));

        // choose locale code for the extension
        urls.push({
            file: `${localization}/${options.sourceFile}`,
            url: url.join(''),
        });
    });

    return urls;
};

const downloadLocales = () => download(prepare()).pipe(gulp.dest(LOCALES_DIR));

export default downloadLocales;
