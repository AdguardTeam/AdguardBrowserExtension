/* eslint-disable no-console */
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

import path from 'node:path';
import fs from 'node:fs';

import unzipper from 'unzipper';
import { ensureDir } from 'fs-extra';

import { BuildTargetEnv, ExtensionsIds } from '../../constants';
import { getCrxUrl } from '../../Extension/src/common/update-mv3';

/**
 * Local directory containing the previous extension, ignored by git.
 */
const TMP_DIR = path.join(process.cwd(), 'tmp');

/**
 * Magic string for CRX file header.
 */
const CRX_HEADER_MAGIC_STRING = 'Cr24';

/**
 * Downloads the CRX file for the given extension ID and Chrome version,
 * following redirects.
 *
 * @param extensionId The extension ID in the Chrome Web Store.
 * @param destPath The destination path for the downloaded CRX file.
 */
const downloadCrxFile = async (
    extensionId: string,
    destPath: string,
) => {
    const url = getCrxUrl(extensionId);

    console.log(`Checking for updates at ${url}`);

    // First fetch for receive redirect
    const res = await fetch(url, { redirect: 'manual' });
    if (![302, 303, 307].includes(res.status)) {
        throw new Error(`No update found, got HTTP ${res.status}`);
    }
    const redirectUrl = res.headers.get('location');
    if (!redirectUrl) {
        throw new Error('No redirect location header found');
    }

    console.log(`Loading CRX from ${redirectUrl}`);

    // Second fetch for download .crx
    await downloadFileWithProgress(redirectUrl, destPath);
};

/**
 * Prints a progress bar for file downloads.
 *
 * @param downloaded Number of bytes downloaded so far.
 * @param total Total number of bytes to download.
 * @param barLength Length of the progress bar (default: 30).
 */
const printProgress = (downloaded: number, total: number, barLength = 30) => {
    if (!total) {
        return;
    }
    const percent = Math.floor((downloaded / total) * 100);
    const filled = Math.floor((downloaded / total) * barLength);
    const bar = '#'.repeat(filled) + '-'.repeat(barLength - filled);
    process.stdout.write(`\rDownloading: [${bar}] ${percent}% (${downloaded}/${total} bytes)`);
};

/**
 * Downloads a file from a URL to a destination path, showing progress.
 *
 * @param url The file URL to download.
 * @param destPath The destination file path.
 */
const downloadFileWithProgress = async (url: string, destPath: string) => {
    const res = await fetch(url);
    if (!res.ok || !res.body) {
        throw new Error(`Failed to fetch: HTTP ${res.status}`);
    }
    const total = Number(res.headers.get('content-length')) || 0;
    const fileStream = fs.createWriteStream(destPath);
    let downloaded = 0;
    const reader = res.body.getReader();

    // eslint-disable-next-line no-constant-condition
    while (true) {
        const { done, value } = await reader.read();
        if (done) {
            break;
        }
        fileStream.write(value);
        downloaded += value.length;
        printProgress(downloaded, total);
    }

    // Wait for the file stream to finish writing
    await new Promise<void>((resolve, reject) => {
        fileStream.end();
        fileStream.on('finish', () => resolve());
        fileStream.on('error', reject);
    });

    if (total) {
        process.stdout.write('\n');
    }
    console.log(`Downloaded to ${destPath}`);
};

/**
 * CRX is a wrapper for a ZIP archive, so we need to extract the ZIP from it.
 * First 4 bytes are the magic string,
 * then 4 bytes for version,
 * then 4 bytes for header size,
 * and the rest is the ZIP archive.
 *
 * @param crxPath The path to the CRX file.
 * @param zipPath The path to save the extracted ZIP file.
 *
 * @throws {Error} If the CRX file is not valid or not a CRX3.
 */
const extractZipFromCrx = async (crxPath: string, zipPath: string) => {
    const crxBuffer = await fs.promises.readFile(crxPath);

    if (crxBuffer.toString('utf8', 0, 4) !== CRX_HEADER_MAGIC_STRING) {
        throw new Error('Not a CRX file');
    }
    const version = crxBuffer.readUInt32LE(4);
    if (version !== 3) {
        throw new Error('Only CRX3 is supported');
    }
    console.log(`CRX version: ${version}`);

    const headerSize = crxBuffer.readUInt32LE(8);
    const zipStart = 12 + headerSize;

    const zipBuffer = crxBuffer.subarray(zipStart);

    await fs.promises.writeFile(zipPath, zipBuffer);
    console.log(`ZIP extracted from CRX to ${zipPath}`);
};

/**
 * Unzips the extension ZIP archive to the specified directory.
 *
 * @param zipPath The path to the ZIP file.
 * @param unpackedPath The directory to extract the extension to.
 */
const unzipExtension = async (zipPath: string, unpackedPath: string) => {
    await fs.createReadStream(zipPath)
        .pipe(unzipper.Extract({ path: unpackedPath }))
        .promise();
    console.log('Extension unpacked to', unpackedPath);
};

/**
 * Removes the internal metadata folder from the unpacked extension directory,
 * if present.
 *
 * @param unpackedPath The path to the unpacked extension directory.
 */
const removeMetadataFolder = async (unpackedPath: string) => {
    const metadataPath = path.join(unpackedPath, 'metadata');
    if (fs.existsSync(metadataPath)) {
        await fs.promises.rm(metadataPath, { recursive: true, force: true });
        console.log('Removed metadata folder:', metadataPath);
    } else {
        console.log('No metadata folder found to remove, skipping.');
    }
};

/**
 * Downloads, extracts, and unpacks the latest extension for the given channel
 * (Beta or Release).
 *
 * @param target The build target environment (Beta or Release).
 */
const downloadAndUnpackExtension = async (target: BuildTargetEnv.Beta | BuildTargetEnv.Release) => {
    const extensionId = ExtensionsIds[target];
    const crxPath = path.join(TMP_DIR, `extension-${target}-latest.crx`);
    const zipPath = path.join(TMP_DIR, `extension-${target}-latest.zip`);
    const unpackedExtensionPath = path.join(TMP_DIR, `extension-${target}-latest`);

    console.log(`Downloading and unpacking extension for target: ${target} and extension ID: ${extensionId}`);

    try {
        await ensureDir(TMP_DIR);
        await downloadCrxFile(extensionId, crxPath);
        await extractZipFromCrx(crxPath, zipPath);
        await unzipExtension(zipPath, unpackedExtensionPath);
        await removeMetadataFolder(unpackedExtensionPath);

        console.log(`Extension downloaded and unpacked to ${unpackedExtensionPath}`);
    } catch (e) {
        console.error('Error:', e);
        throw e;
    }
};

const channel = process.argv[2] as BuildTargetEnv.Beta | BuildTargetEnv.Release;
if (!channel || (BuildTargetEnv.Beta !== channel && BuildTargetEnv.Release !== channel)) {
    console.error(`Invalid or missing channel argument. Expected ${BuildTargetEnv.Beta} or ${BuildTargetEnv.Release}.`);
    process.exit(1);
}

downloadAndUnpackExtension(channel);
