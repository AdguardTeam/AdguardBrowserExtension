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

/**
 * Update filters in repository
 */
import path from 'path';
import fs from 'fs';
import fse from 'fs-extra';
import crypto from 'crypto';
import axios from 'axios';
import { cliLog } from '../cli-log';
import {
    METADATA_DOWNLOAD_URL_FORMAT,
    FILTERS_DEST,
    METADATA_I18N_DOWNLOAD_URL_FORMAT,
    FILTER_DOWNLOAD_URL_FORMAT,
    OPTIMIZED_FILTER_DOWNLOAD_URL_FORMAT,
    ADGUARD_FILTERS_IDS,
} from '../constants';

const CHECKSUM_PATTERN = /^\s*!\s*checksum[\s-:]+([\w\+/=]+).*[\r\n]+/i;

/**
 * Getting filters array
 *
 * @param browser Which browser filters to download
 * @returns array
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

    // eslint-disable-next-line no-restricted-syntax
    for (const filterId of ADGUARD_FILTERS_IDS) {
        filters.push({
            url: FILTER_DOWNLOAD_URL_FORMAT.replace('%browser', browser).replace('%filter', filterId),
            file: `filter_${filterId}.txt`,
            validate: true,
        });

        filtersMobile.push({
            url: OPTIMIZED_FILTER_DOWNLOAD_URL_FORMAT.replace('%browser', browser).replace('%s', filterId),
            file: `filter_mobile_${filterId}.txt`,
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
 * @returns Normalized response
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
        cliLog.error(`Filter rules from ${url.url} doesn't contain a checksum ${partOfResponse}`);
    }

    const bodyChecksum = crypto.createHash('md5').update(normalizeResponse(body)).digest('base64').replace(/=/g, '');

    if (bodyChecksum !== checksumMatch[1]) {
        cliLog.error(`Wrong checksum: found ${bodyChecksum}, expected ${checksumMatch[1]}`);
    }

    cliLog.info('Checksum is valid');
};

const downloadFilter = async (url, browser) => {
    const filtersDir = FILTERS_DEST.replace('%browser', browser);

    fse.ensureDirSync(filtersDir);

    cliLog.info(`Download ${url.url}...`);

    const response = await axios.get(url.url, { responseType: 'arraybuffer' });

    if (url.validate) {
        validateChecksum(url, response.data.toString());
    }

    await fs.promises.writeFile(path.join(filtersDir, url.file), response.data);

    cliLog.info('Done');
};

/**
 * Download filter
 *
 * @param browser Which browser filters to download
 */
const startDownload = async (browser) => {
    const urls = getUrlsOfFiltersResources(browser);
    for (let i = 0; i < urls.length; i += 1) {
        const url = urls[i];
        // eslint-disable-next-line no-await-in-loop
        await downloadFilter(url, browser);
    }
};

export const downloadFilters = async () => {
    await startDownload('chromium');
    await startDownload('edge');
    await startDownload('firefox');
    await startDownload('opera');
};
