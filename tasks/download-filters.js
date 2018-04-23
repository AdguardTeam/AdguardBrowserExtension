/**
 * Update filters in repository
 */

import path from 'path';
import request from 'request';
import fs from 'fs';
import fse from 'fs-extra';
import crypto from 'crypto';
import Logs from './log';
import gulp from 'gulp';
import 'babel-polyfill';
import {METADATA_DOWNLOAD_URL_FORMAT, FILTERS_DEST, METADATA_I18N_DOWNLOAD_URL_FORMAT, LAST_ADGUARD_FILTER_ID, FILTER_DOWNLOAD_URL_FORMAT, OPTIMIZED_FILTER_DOWNLOAD_URL_FORMAT} from './consts';

const CHECKSUM_PATTERN = /^\s*!\s*checksum[\s-:]+([\w\+/=]+).*[\r\n]+/i;
const logs = new Logs();

/**
 * Getting filters array
 *
 * @param browser Which browser filters to download
 * @return array
 */
const filtersList = (browser) => {
    const filters = [];
    const filtersMobile = [];
    const meta = [];

    meta.push({
        url: METADATA_DOWNLOAD_URL_FORMAT.replace('%browser', browser),
        file: 'filters.json'
    });

    meta.push({
        url: METADATA_I18N_DOWNLOAD_URL_FORMAT.replace('%browser', browser),
        file: 'filters_i18n.json'
    });

    for (let i = 1; i <= LAST_ADGUARD_FILTER_ID; i++) {
        filters.push({
            url: FILTER_DOWNLOAD_URL_FORMAT.replace('%browser', browser).replace('%filter', i),
            file: `filter_${i}.txt`,
            validate: true
        });

        filtersMobile.push({
            url: OPTIMIZED_FILTER_DOWNLOAD_URL_FORMAT.replace('%browser', browser).replace('%s', i),
            file: `filter_mobile_${i}.txt`,
            validate: true
        });
    }

    return [
        ...meta,
        ...filters,
        ...filtersMobile
    ];
};

/**
 * Validates filter rules checksum
 * See https://adblockplus.org/en/filters#special-comments for details
 *
 * @param url      Download URL
 * @param response Filter rules response
 * @throws Error
 */
const validateChecksum = (url, body) => {
    const partOfResponse = body.substring(0,200);
    const checksumMatch = partOfResponse.match(CHECKSUM_PATTERN);

    if (!checksumMatch[1]) {
        logs.error(`Filter rules from ${url.url} doesn't contain a checksum ${partOfResponse}`);
    }

    const bodyChecksum = crypto.createHash('md5').update(normalizeResponse(body)).digest('base64').replace(/=/g,'');

    if (bodyChecksum !== checksumMatch[1]) {
        logs.error(`Wrong checksum: found ${bodyChecksum}, expected ${checksumMatch[1]}`);
    }

    logs.info('checksum is valid');
};

/**
 * Normalize response
 *
 * @param response Filter rules response
 * @return Normalized response
 */
const normalizeResponse = (response) => {
    const partOfResponse = response.substring(0, 200);
    response = response.replace(partOfResponse.match(CHECKSUM_PATTERN)[0], '');
    response = response.replace(/\r/g, '');
    response = response.replace(/\n+/g, '\n');
    return response;
};

/**
 * Download filters
 *
 * @param browser Which browser filters to download
 * @param done  stream
 * @return done
 */
const startDownload = async (browser, done) => {
    for (const item of filtersList(browser)) {
        await downloadFilters(item, browser);
    }

    return done();
}

const downloadFilters = (url, browser) => {
    const filtersDir = FILTERS_DEST.replace('%browser', browser);

    fse.ensureDirSync(filtersDir);

    return new Promise(resolve => {
        logs.info(`Download ${url.url}...`);
        request(url, (error, response, body) => {
            if (url.validate) {
                validateChecksum(url, body);
            }

            logs.info('Done');
            resolve();
        })
        .pipe(fs.createWriteStream(path.join(filtersDir, url.file)));
    });
};

const chromium = (done) => startDownload('chromium', done);
const edge = (done) => startDownload('edge', done);
const firefox = (done) => startDownload('firefox', done);
const safari = (done) => startDownload('safari', done);
const opera = (done) => startDownload('opera', done);

export default gulp.series(chromium, edge, firefox, safari, opera);
