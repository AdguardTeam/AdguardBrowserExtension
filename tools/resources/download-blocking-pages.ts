/**
 * Copyright (c) 2015-2025 Adguard Software Ltd.
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
import dotenv from 'dotenv';
import { ensureDir } from 'fs-extra';

import { cliLog } from '../cli-log';
import {
    BLOCKING_BLOCKED_OUTPUT,
    BLOCKING_SAFEBROWSING_OUTPUT,
    INDEX_HTML_FILE_NAME,
} from '../../constants';

// Retrieves config from .env file and assigns it to the process.env
dotenv.config();

/**
 * Web page for request blocked by the rules.
 */
const REMOTE_BLOCKED_PAGE_NAME = 'adblocker_blocked.html';

/**
 * Script for {@link REMOTE_BLOCKED_PAGE_NAME}.
 */
const REMOTE_BLOCKED_SCRIPT_NAME = 'adblocker_blocked.js';

/**
 * Web page for request blocked by Safebrowsing.
 */
const REMOTE_SAFEBROWSING_PAGE_NAME = 'adblocker_safebrowsing.html';

/**
 * Script for {@link REMOTE_SAFEBROWSING_PAGE_NAME}.
 */
const REMOTE_SAFEBROWSING_SCRIPT_NAME = 'adblocker_safebrowsing.js';

/**
 * Local script name for imported scripts.
 */
const LOCAL_IMPORTED_SCRIPT_NAME = 'imported-script.js';

/* eslint-disable @typescript-eslint/naming-convention */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
/* eslint-enable @typescript-eslint/naming-convention */

const outputDirPath = path.join(__dirname, '../../Extension');

const blockedPageOutputPath = path.join(outputDirPath, BLOCKING_BLOCKED_OUTPUT, INDEX_HTML_FILE_NAME);
const blockedScriptOutputPath = path.join(outputDirPath, BLOCKING_BLOCKED_OUTPUT, LOCAL_IMPORTED_SCRIPT_NAME);
const safebrowsingPageOutputPath = path.join(outputDirPath, BLOCKING_SAFEBROWSING_OUTPUT, INDEX_HTML_FILE_NAME);
const safebrowsingScriptOutputPath = path.join(outputDirPath, BLOCKING_SAFEBROWSING_OUTPUT, LOCAL_IMPORTED_SCRIPT_NAME);

/**
 * Returns the path to the remote source directory with blocking pages for the extension.
 *
 * @param remoteDomain Remote domain.
 *
 * @returns Path to the remote source directory.
 */
const getRemoteSrcDirPath = (remoteDomain: string): string => {
    return `https://${remoteDomain}/artifactory/generic-local/blocking-pages/latest/blocking-pages.tar.gz!/dist/extension/`;
};

/**
 * Downloads remote file placed in {@link REMOTE_BLOCKING_PAGES_SOURCE_URL}.
 *
 * @param sourceDirPath Path to the remote directory.
 * @param sourceFileName Name of the source file.
 * @param outputPath Path to the output file.
 */
const downloadFile = async (sourceDirPath: string, sourceFileName: string, outputPath: string): Promise<void> => {
    cliLog.info(`Downloading ${sourceFileName}...`);

    const url = `${sourceDirPath}${sourceFileName}`;

    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const content = response.data.toString();

    const outputDir = path.dirname(outputPath);
    await ensureDir(outputDir);

    await fsPromises.writeFile(outputPath, content);
    cliLog.info(`Downloaded ${sourceFileName} to ${outputPath}`);
};

/**
 * Updates blocking pages.
 */
const updateBlockingPages = async (): Promise<void> => {
    const remoteSrcDomain = process.env.ARTIFACTORY_DOMAIN;

    if (!remoteSrcDomain) {
        throw new Error('ARTIFACTORY_DOMAIN is not set');
    }

    const remoteSrcDirPath = getRemoteSrcDirPath(remoteSrcDomain);

    await downloadFile(remoteSrcDirPath, REMOTE_BLOCKED_PAGE_NAME, blockedPageOutputPath);
    await downloadFile(remoteSrcDirPath, REMOTE_BLOCKED_SCRIPT_NAME, blockedScriptOutputPath);
    await downloadFile(remoteSrcDirPath, REMOTE_SAFEBROWSING_PAGE_NAME, safebrowsingPageOutputPath);
    await downloadFile(remoteSrcDirPath, REMOTE_SAFEBROWSING_SCRIPT_NAME, safebrowsingScriptOutputPath);
};

updateBlockingPages();
