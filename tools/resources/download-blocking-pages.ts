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

import { promises as fsPromises } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import axios from 'axios';

import { cliLog } from '../cli-log';

import {
    copyBlockingPages,
    extractBlockingPagesArchive,
    getBlockingPagesFiles,
    readBlockingPagesVersionFromArchive,
    verifyBlockingPagesRelease,
    withTempDir,
} from './blocking-pages-archive';

/**
 * Expected build version of the blocking pages release.
 */
const BLOCKING_PAGES_VERSION = '2.1.0.184557088';

/**
 * SHA-256 digest of the blocking pages release archive.
 */
const BLOCKING_PAGES_ARCHIVE_SHA256 = '7f1480870f10414fe492255050dd423bcf548cdc196524c3077fabba6026d960';

/**
 * URL of the blocking-pages release archive.
 *
 * Artifact Keeper exposes only the moving `release` and `preview` channels,
 * so the exact build is pinned by `BLOCKING_PAGES_VERSION` and the archive
 * digest.
 */
const BLOCKING_PAGES_ARCHIVE_URL = 'https://ak.int.agrd.dev/api/v1/repositories/misc-general/download/blocking-pages-v2/release/blocking-pages.tar.gz';

/**
 * HTTP request timeout in milliseconds.
 */
const REQUEST_TIMEOUT_MS = 30_000;

/**
 * Name of the downloaded archive.
 */
const ARCHIVE_FILE_NAME = 'blocking-pages.tar.gz';

/* eslint-disable @typescript-eslint/naming-convention */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
/* eslint-enable @typescript-eslint/naming-convention */

const outputDirPath = path.join(__dirname, '../../Extension');

const filesToCopy = getBlockingPagesFiles(outputDirPath);

/**
 * Updates blocking pages.
 */
const updateBlockingPages = async (): Promise<void> => {
    await withTempDir(async (tempDir) => {
        const archivePath = path.join(tempDir, ARCHIVE_FILE_NAME);
        const extractDir = path.join(tempDir, 'extracted');

        cliLog.info(`Downloading ${BLOCKING_PAGES_ARCHIVE_URL}...`);
        const response = await axios.get(BLOCKING_PAGES_ARCHIVE_URL, {
            responseType: 'arraybuffer',
            timeout: REQUEST_TIMEOUT_MS,
        });
        const archive = Buffer.from(response.data as ArrayBuffer);
        await fsPromises.writeFile(archivePath, archive);

        const version = await readBlockingPagesVersionFromArchive(archivePath);
        verifyBlockingPagesRelease(
            archive,
            version,
            BLOCKING_PAGES_VERSION,
            BLOCKING_PAGES_ARCHIVE_SHA256,
        );

        await extractBlockingPagesArchive(archivePath, extractDir);
        await copyBlockingPages(extractDir, filesToCopy);

        cliLog.info(`Blocking pages updated in ${outputDirPath}`);
    });
};

updateBlockingPages().catch((error) => {
    cliLog.warningRed(String(error));
    process.exit(1);
});
