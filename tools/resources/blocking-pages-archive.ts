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

import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { promises as fsPromises, type Stats } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

import { cliLog } from '../cli-log';
import {
    BLOCKING_BLOCKED_OUTPUT,
    BLOCKING_SAFEBROWSING_OUTPUT,
    INDEX_HTML_FILE_NAME,
} from '../../constants';

const execFileAsync = promisify(execFile);

/**
 * Directory with the extension pages inside the blocking-pages archive.
 */
export const BLOCKING_PAGES_EXTENSION_DIR = 'dist/extension';

/**
 * Local script name for imported scripts.
 */
const LOCAL_IMPORTED_SCRIPT_NAME = 'imported-script.js';

/**
 * File with the blocking pages build version inside the archive.
 */
const VERSION_FILE = 'dist/version.txt';

/**
 * File to copy from the blocking-pages archive.
 */
export type BlockingPagesFile = {
    /**
     * Name of the file in the archive.
     */
    source: string;

    /**
     * Path to the destination file.
     */
    destination: string;
};

/**
 * Returns the files to copy from the blocking-pages archive.
 *
 * @param outputDirPath Path to the extension directory.
 *
 * @returns Files with their sources and destinations.
 */
export const getBlockingPagesFiles = (outputDirPath: string): BlockingPagesFile[] => [
    {
        source: 'adblocker_blocked.html',
        destination: path.join(outputDirPath, BLOCKING_BLOCKED_OUTPUT, INDEX_HTML_FILE_NAME),
    },
    {
        source: 'adblocker_blocked.js',
        destination: path.join(outputDirPath, BLOCKING_BLOCKED_OUTPUT, LOCAL_IMPORTED_SCRIPT_NAME),
    },
    {
        source: 'adblocker_safebrowsing.html',
        destination: path.join(outputDirPath, BLOCKING_SAFEBROWSING_OUTPUT, INDEX_HTML_FILE_NAME),
    },
    {
        source: 'adblocker_safebrowsing.js',
        destination: path.join(outputDirPath, BLOCKING_SAFEBROWSING_OUTPUT, LOCAL_IMPORTED_SCRIPT_NAME),
    },
];

/**
 * Verifies that the downloaded archive matches the pinned build version and
 * SHA-256 digest.
 *
 * @param archive Archive contents.
 * @param actualVersion Version from `dist/version.txt`.
 * @param expectedVersion Expected blocking pages build version.
 * @param expectedSha256 Expected archive SHA-256 digest.
 *
 * @throws Error listing both actual values when either pin does not match.
 */
export const verifyBlockingPagesRelease = (
    archive: Buffer,
    actualVersion: string,
    expectedVersion: string,
    expectedSha256: string,
): void => {
    const actualSha256 = createHash('sha256').update(archive).digest('hex');

    if (actualVersion === expectedVersion && actualSha256 === expectedSha256) {
        return;
    }

    throw new Error(
        `Blocking pages release mismatch: expected ${expectedVersion} `
        + `(SHA-256 ${expectedSha256}), got ${actualVersion} (SHA-256 ${actualSha256}). `
        + 'Update BLOCKING_PAGES_VERSION and BLOCKING_PAGES_ARCHIVE_SHA256.',
    );
};

/**
 * Reads the blocking pages build version from the archive.
 *
 * @param archivePath Path to the archive.
 *
 * @returns Version from `dist/version.txt`.
 *
 * @throws Error if the version file cannot be read.
 */
export const readBlockingPagesVersionFromArchive = async (archivePath: string): Promise<string> => {
    try {
        const { stdout } = await execFileAsync('tar', ['-xzOf', archivePath, VERSION_FILE]);

        return stdout.trim();
    } catch (e) {
        throw new Error(`Cannot read the blocking pages version from ${VERSION_FILE}`, { cause: e });
    }
};

/**
 * Extracts the extension pages from the blocking-pages archive.
 *
 * @param archivePath Path to the archive.
 * @param extractDir Directory for the extracted files.
 *
 * @throws Error if the tar command is unavailable or fails.
 */
export const extractBlockingPagesArchive = async (
    archivePath: string,
    extractDir: string,
): Promise<void> => {
    await fsPromises.mkdir(extractDir, { recursive: true });

    try {
        await execFileAsync('tar', [
            '-xzf',
            archivePath,
            '-C',
            extractDir,
            BLOCKING_PAGES_EXTENSION_DIR,
        ]);
    } catch (e) {
        const error = e as NodeJS.ErrnoException & { stderr?: string | Buffer };

        if (error.code === 'ENOENT') {
            throw new Error(
                'Cannot extract the blocking pages archive: the tar command is not available in PATH',
                { cause: e },
            );
        }

        const details = error.stderr ? error.stderr.toString().trim() : error.message;

        throw new Error(`Cannot extract the blocking pages archive: ${details}`, { cause: e });
    }
};

/**
 * Returns stats for a source file in the extracted archive.
 *
 * @param source Source file name.
 * @param sourcePath Resolved path to the source file.
 *
 * @returns Source file stats.
 *
 * @throws Error if the file is missing or cannot be accessed.
 */
const getBlockingPagesSourceStats = async (
    source: string,
    sourcePath: string,
): Promise<Stats> => {
    try {
        return await fsPromises.lstat(sourcePath);
    } catch (e) {
        const error = e as NodeJS.ErrnoException;

        if (error.code === 'ENOENT') {
            throw new Error(`Cannot find ${source} in the blocking pages archive`, { cause: e });
        }

        throw new Error(
            `Cannot access ${source} in the blocking pages archive: ${error.message}`,
            { cause: e },
        );
    }
};

/**
 * Copies the blocking page files from the extracted archive.
 *
 * Validates that every source is present and is a regular file before copying
 * any file, so a missing file does not leave a partially updated extension.
 *
 * @param extractDir Directory with the extracted archive.
 * @param files Files to copy.
 *
 * @throws Error if a file from `files` is absent in the archive, is not a
 * regular file, or resolves outside the extension directory.
 */
export const copyBlockingPages = async (
    extractDir: string,
    files: BlockingPagesFile[],
): Promise<void> => {
    const extensionDir = path.resolve(extractDir, BLOCKING_PAGES_EXTENSION_DIR);
    const validatedFiles: Array<{ sourcePath: string; destination: string }> = [];

    for (const { source, destination } of files) {
        const sourcePath = path.resolve(extensionDir, source);

        if (!sourcePath.startsWith(`${extensionDir}${path.sep}`)) {
            throw new Error(
                `Refusing to copy ${source}: path is outside the blocking pages extension directory`,
            );
        }

        const stats = await getBlockingPagesSourceStats(source, sourcePath);

        if (!stats.isFile()) {
            throw new Error(
                `Cannot copy ${source}: not a regular file in the blocking pages archive`,
            );
        }

        validatedFiles.push({ sourcePath, destination });
    }

    for (const { sourcePath, destination } of validatedFiles) {
        await fsPromises.mkdir(path.dirname(destination), { recursive: true });
        await fsPromises.copyFile(sourcePath, destination);
    }
};

/**
 * Runs a callback with a new temporary directory and removes the directory afterwards.
 *
 * @param callback Callback that receives the path to the temporary directory.
 *
 * @returns Result of the callback.
 */
export const withTempDir = async <T>(callback: (tempDir: string) => Promise<T>): Promise<T> => {
    const tempDir = await fsPromises.mkdtemp(path.join(os.tmpdir(), 'blocking-pages-'));

    try {
        return await callback(tempDir);
    } finally {
        try {
            await fsPromises.rm(tempDir, { recursive: true, force: true });
        } catch (cleanupError) {
            cliLog.warning(`Cannot remove temporary directory ${tempDir}: ${String(cleanupError)}`);
        }
    }
};
