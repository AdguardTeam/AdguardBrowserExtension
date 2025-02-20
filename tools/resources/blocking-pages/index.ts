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

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import axios from 'axios';

import { cliLog } from '../../cli-log';
import {
    BLOCKING_BLOCKED_OUTPUT,
    BLOCKING_SAFEBROWSING_OUTPUT,
    INDEX_HTML_FILE_NAME,
} from '../../../constants';

/**
 * Remote directory with blocking pages.
 */
const REMOTE_BLOCKING_PAGES_SOURCE_URL = 'https://art.int.agrd.dev/artifactory/generic-local/blocking-pages/latest/blocking-pages.tar.gz!/dist/extension/';

/**
 * Web page for request blocked by the rules.
 */
const REMOTE_BLOCKED_PAGE_NAME = 'adblocker_blocked.html';

/**
 * Web page for request blocked by Safebrowsing.
 */
const REMOTE_SAFEBROWSING_PAGE_NAME = 'adblocker_safebrowsing.html';

/* eslint-disable @typescript-eslint/naming-convention */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
/* eslint-enable @typescript-eslint/naming-convention */

const outputDirPath = path.join(__dirname, '../../../Extension');

const blockedPageOutputPath = path.join(outputDirPath, BLOCKING_BLOCKED_OUTPUT, INDEX_HTML_FILE_NAME);
const safebrowsingPageOutputPath = path.join(outputDirPath, BLOCKING_SAFEBROWSING_OUTPUT, INDEX_HTML_FILE_NAME);

/**
 * Downloads remote file placed in {@link REMOTE_BLOCKING_PAGES_SOURCE_URL}.
 *
 * @param sourceFileName Name of the source file.
 * @param outputPath Path to the output file.
 */
const downloadFile = async (sourceFileName: string, outputPath: string) => {
    cliLog.info(`Downloading ${sourceFileName}...`);

    const url = `${REMOTE_BLOCKING_PAGES_SOURCE_URL}${sourceFileName}`;

    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const content = response.data.toString();

    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, content);
    cliLog.info(`Downloaded ${sourceFileName} to ${outputPath}`);
};

/**
 * Updates blocking pages.
 */
const updateBlockingPages = async () => {
    await downloadFile(REMOTE_BLOCKED_PAGE_NAME, blockedPageOutputPath);
    await downloadFile(REMOTE_SAFEBROWSING_PAGE_NAME, safebrowsingPageOutputPath);
};

updateBlockingPages();
