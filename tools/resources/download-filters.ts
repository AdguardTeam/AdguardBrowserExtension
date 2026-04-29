/**
 * Copyright (c) 2015-2026 Adguard Software Ltd.
 *
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
import path from 'node:path';
import fs from 'node:fs';

import fse from 'fs-extra';
import axios from 'axios';
import pMap from 'p-map';
import cliProgress from 'cli-progress';

import { AssetsLoader } from '@adguard/dnr-rulesets';

import { cliLog } from '../cli-log';
import {
    METADATA_DOWNLOAD_URL_FORMAT,
    FILTERS_DEST,
    METADATA_I18N_DOWNLOAD_URL_FORMAT,
    FILTER_DOWNLOAD_URL_FORMAT,
    OPTIMIZED_FILTER_DOWNLOAD_URL_FORMAT,
    AssetsFiltersBrowser,
    type Mv3AssetsFiltersBrowser,
    MV3_ASSETS_FILTERS_BROWSER_TO_DNR_BROWSER_MAP,
} from '../constants';
import {
    ADGUARD_FILTERS_IDS,
    LOCAL_METADATA_FILE_NAME,
    LOCAL_I18N_METADATA_FILE_NAME,
} from '../../constants';
import { calculateChecksum } from '../utils/checksum';

// Re-export for backward compatibility
export { calculateChecksum };

const CHECKSUM_PATTERN = /^\s*!\s*checksum[\s-:]+([\w\+/=]+).*[\r\n]+/i;

/**
 * Data for downloading a resource.
 */
type DownloadResourceData = {
    /**
     * URL to download the resource.
     */
    url: string;

    /**
     * File name to save the resource.
     */
    fileName: string;

    /**
     * Target browser for the resource.
     */
    browser: AssetsFiltersBrowser;

    /**
     * Whether to validate the checksum of the downloaded resource.
     */
    validate?: boolean;
};

const getFiltersMetadataDownloadData = (browser: AssetsFiltersBrowser): DownloadResourceData => {
    return {
        url: METADATA_DOWNLOAD_URL_FORMAT.replace('%browser', browser),
        fileName: LOCAL_METADATA_FILE_NAME,
        browser,
    };
};

const getFiltersI18nMetadataDownloadData = (browser: AssetsFiltersBrowser): DownloadResourceData => {
    return {
        url: METADATA_I18N_DOWNLOAD_URL_FORMAT.replace('%browser', browser),
        fileName: LOCAL_I18N_METADATA_FILE_NAME,
        browser,
    };
};

/**
 * Returns an array needed for downloading filters resources:
 * - filters metadata
 * - i18n metadata
 * - filters and their optimized versions — only {@link ADGUARD_FILTERS_IDS}
 *
 * @param browser Which browser filters to download
 *
 * @returns Array of resources download data.
 */
const getUrlsOfFiltersResources = (browser: AssetsFiltersBrowser): DownloadResourceData[] => {
    const filters = [];
    const filtersMobile = [];
    const meta = [];

    meta.push(getFiltersMetadataDownloadData(browser));

    meta.push(getFiltersI18nMetadataDownloadData(browser));

    // eslint-disable-next-line no-restricted-syntax
    for (const filterId of ADGUARD_FILTERS_IDS) {
        filters.push({
            url: FILTER_DOWNLOAD_URL_FORMAT.replace('%browser', browser).replace('%filter', String(filterId)),
            fileName: `filter_${filterId}.txt`,
            browser,
            validate: true,
        });

        filtersMobile.push({
            url: OPTIMIZED_FILTER_DOWNLOAD_URL_FORMAT.replace('%browser', browser).replace('%s', String(filterId)),
            fileName: `filter_mobile_${filterId}.txt`,
            browser,
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
 * Result of checksum validation.
 */
export type ChecksumValidationResult = {
    /**
     * Whether the checksum is valid.
     */
    valid: boolean;

    /**
     * Error message if the checksum is invalid.
     */
    message?: string;
};

/**
 * Validates filter rules checksum.
 * See https://adblockplus.org/en/filters#special-comments for details.
 *
 * @param url URL the content was downloaded from (used in error messages).
 * @param body Filter rules response.
 *
 * @returns Validation result with `valid` flag and optional error message.
 */
export const validateChecksum = (url: string, body: string): ChecksumValidationResult => {
    const partOfResponse = body.substring(0, 200);
    const checksumMatch = partOfResponse.match(CHECKSUM_PATTERN);

    if (!checksumMatch || !checksumMatch[1]) {
        return {
            valid: false,
            message: `Filter rules from ${url} does not contain a checksum ${partOfResponse}`,
        };
    }

    const bodyChecksum = calculateChecksum(body);

    if (bodyChecksum !== checksumMatch[1]) {
        return {
            valid: false,
            message: `Wrong checksum: found ${bodyChecksum}, expected ${checksumMatch[1]}`,
        };
    }

    return { valid: true };
};

/**
 * Default concurrency for parallel downloads.
 */
const DEFAULT_CONCURRENCY = 10;

/**
 * HTTP request timeout in milliseconds.
 */
const REQUEST_TIMEOUT_MS = 30_000;

/**
 * Downloads a filter resource, saves it to the filters directory, and returns its content.
 *
 * @param task Data for downloading a resource (includes browser).
 *
 * @returns Response content as a string.
 */
const downloadFilter = async (task: DownloadResourceData): Promise<string> => {
    const {
        url,
        fileName,
        browser,
        validate,
    } = task;

    const filtersDir = FILTERS_DEST.replace('%browser', browser);

    fse.ensureDirSync(filtersDir);

    const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: REQUEST_TIMEOUT_MS,
    });

    const content = response.data.toString();

    if (validate) {
        const result = validateChecksum(url, content);
        if (!result.valid) {
            cliLog.error(result.message!);
        }
    }

    await fs.promises.writeFile(path.join(filtersDir, fileName), response.data);

    return content;
};

// FIXME make sure that works as expected
/**
 * Copies the DNR rulesets from the @adguard/dnr-rulesets internal directory to
 * the declarative filters directory in browser extension.
 *
 * @param browser Target MV3 browser.
 * @param onlyDeclarativeRulesets If true, copies only declarative rulesets.
 * Should be true only for fast auto-build reviews (skip review)
 * to minimize changes and stay eligible for expedited review.
 */
export const downloadAndPrepareMv3Filters = async (
    browser: Mv3AssetsFiltersBrowser,
    onlyDeclarativeRulesets = false,
) => {
    const loader = new AssetsLoader();

    // Note: it is just copying the files from the @adguard/dnr-rulesets package
    // to the filters directory. The files are already downloaded.
    return loader.load(
        FILTERS_DEST.replace('%browser', browser),
        {
            browser: MV3_ASSETS_FILTERS_BROWSER_TO_DNR_BROWSER_MAP[browser],
            onlyDeclarativeRulesets,
        },
    );
};

/**
 * MV2 browsers that need filter downloads.
 */
const MV2_BROWSERS: AssetsFiltersBrowser[] = [
    AssetsFiltersBrowser.Chromium,
    AssetsFiltersBrowser.Edge,
    AssetsFiltersBrowser.Firefox,
    AssetsFiltersBrowser.Opera,
];

/**
 * Collects download tasks for all MV2 browsers into a single flat array.
 *
 * @returns Flat array of all download tasks across all browsers.
 */
export const getAllDownloadTasks = (): DownloadResourceData[] => {
    return MV2_BROWSERS.flatMap((browser) => getUrlsOfFiltersResources(browser));
};

/**
 * Downloads all filter resources in parallel with bounded concurrency
 * and a progress bar.
 *
 * @param concurrency Maximum number of concurrent downloads.
 *
 * @returns Number of successfully downloaded files.
 */
export const downloadAllFilters = async (concurrency = DEFAULT_CONCURRENCY): Promise<number> => {
    const tasks = getAllDownloadTasks();
    const total = tasks.length;

    const isTTY = process.stdout.isTTY;

    let bar: cliProgress.SingleBar | null = null;
    let completed = 0;

    if (isTTY) {
        bar = new cliProgress.SingleBar({
            format: ' {bar} {percentage}% | {value}/{total} files',
            barCompleteChar: '\u2588',
            barIncompleteChar: '\u2591',
            hideCursor: true,
        });
        bar.start(total, 0);
    }

    await pMap(tasks, async (task) => {
        await downloadFilter(task);

        completed += 1;

        if (isTTY && bar) {
            bar.increment();
        } else if (!isTTY && completed % Math.max(1, Math.floor(total / 10)) === 0) {
            cliLog.info(`Downloaded ${completed}/${total} files (${Math.round((completed / total) * 100)}%)`);
        }
    }, { concurrency });

    if (bar) {
        bar.stop();
    }

    return total;
};

/**
 * Downloads all MV2 filter resources and prepares MV3 filters.
 *
 * @returns Number of MV2 filter files downloaded.
 */
export const downloadFilters = async (): Promise<number> => {
    const count = await downloadAllFilters();
    await downloadAndPrepareMv3Filters(AssetsFiltersBrowser.ChromiumMv3);
    await downloadAndPrepareMv3Filters(AssetsFiltersBrowser.OperaMv3);
    return count;
};
