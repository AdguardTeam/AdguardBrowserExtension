/**
 * Update filters in repository
 */
import path from 'path';
import fs from 'fs';
import fse from 'fs-extra';
import crypto from 'crypto';
import axios from 'axios';
import { log } from '../log';
import {
    METADATA_DOWNLOAD_URL_FORMAT,
    FILTERS_DEST,
    METADATA_I18N_DOWNLOAD_URL_FORMAT,
    LAST_ADGUARD_FILTER_ID,
    FILTER_DOWNLOAD_URL_FORMAT,
    OPTIMIZED_FILTER_DOWNLOAD_URL_FORMAT,
} from '../constants';

const CHECKSUM_PATTERN = /^\s*!\s*checksum[\s-:]+([\w\+/=]+).*[\r\n]+/i;

/**
 * Getting filters array
 *
 * @param browser Which browser filters to download
 * @return array
 */
const getUrlsOfFiltersResources = (browser) => {
    const filters = [];
    const filtersMobile = [];
    const meta = [];

    meta.push({
        url: METADATA_DOWNLOAD_URL_FORMAT.replace('%browser', browser),
        file: 'filters.json',
    });

    meta.push({
        url: METADATA_I18N_DOWNLOAD_URL_FORMAT.replace('%browser', browser),
        file: 'filters_i18n.json',
    });

    // TODO update filters list to download
    // list of filters is here https://github.com/AdguardTeam/FiltersRegistry/tree/master/filters
    for (let i = 1; i <= LAST_ADGUARD_FILTER_ID; i += 1) {
        filters.push({
            url: FILTER_DOWNLOAD_URL_FORMAT.replace('%browser', browser).replace('%filter', i),
            file: `filter_${i}.txt`,
            validate: true,
        });

        filtersMobile.push({
            url: OPTIMIZED_FILTER_DOWNLOAD_URL_FORMAT.replace('%browser', browser).replace('%s', i),
            file: `filter_mobile_${i}.txt`,
            validate: true,
        });
    }

    return [
        ...meta,
        ...filters,
        ...filtersMobile,
    ];
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
 * Validates filter rules checksum
 * See https://adblockplus.org/en/filters#special-comments for details
 *
 * @param url   Download URL
 * @param body  Filter rules response
 * @throws Error
 */
const validateChecksum = (url, body) => {
    const partOfResponse = body.substring(0, 200);
    const checksumMatch = partOfResponse.match(CHECKSUM_PATTERN);

    if (!checksumMatch[1]) {
        log.error(`Filter rules from ${url.url} doesn't contain a checksum ${partOfResponse}`);
    }

    const bodyChecksum = crypto.createHash('md5').update(normalizeResponse(body)).digest('base64').replace(/=/g, '');

    if (bodyChecksum !== checksumMatch[1]) {
        log.error(`Wrong checksum: found ${bodyChecksum}, expected ${checksumMatch[1]}`);
    }

    log.info('Checksum is valid');
};

const downloadFilter = async (url, browser) => {
    const filtersDir = FILTERS_DEST.replace('%browser', browser);

    fse.ensureDirSync(filtersDir);

    log.info(`Download ${url.url}...`);

    const response = await axios.get(url.url);

    if (url.validate) {
        validateChecksum(url, response.data);
    }

    await fs.promises.writeFile(path.join(filtersDir, url.file), response.data);

    log.info('Done');
};

/**
 * Download filter
 * @param browser Which browser filters to download
 */
const startDownload = async (browser) => {
    const urls = getUrlsOfFiltersResources(browser);
    for (let i = 1; i < urls.length; i += 1) {
        const url = urls[i];
        // eslint-disable-next-line no-await-in-loop
        await downloadFilter(url, browser);
    }
};

export const downloadFilters = async () => {
    await startDownload('chromium');
    await startDownload('edge'); // TODO consider removing edge filters
    await startDownload('firefox');
    await startDownload('opera');
};
