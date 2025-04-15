/**
 * @file Bundle size utilities
 * Common utility functions for the bundle size monitoring system
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { Browser, BuildTargetEnv } from '../constants';

import type { SizesFile, TargetInfo } from './constants';
import {
    BUILD_DIRNAME,
    PAGES_DIRNAME,
    VENDORS_DIRNAME,
    ZIP_EXTENSION,
} from './constants';

/* eslint-disable @typescript-eslint/naming-convention */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
/* eslint-enable @typescript-eslint/naming-convention */

// Path constants
export const ROOT_DIR = path.resolve(__dirname, '../../');
export const SIZES_FILE_PATH = path.resolve(ROOT_DIR, '.bundle-sizes.json');

/**
 * Get file size in bytes
 *
 * @param filePath Path to the file
 */
export async function getFileSize(filePath: string): Promise<number> {
    try {
        const stats = await fs.promises.stat(filePath);
        return stats.size;
    } catch (error) {
        throw new Error(`Failed to get file size: ${error}`);
    }
}

/**
 * Get all files in a directory and its subdirectories
 *
 * @param dirPath Path to the directory
 */
export async function getAllFilesInDir(dirPath: string): Promise<string[]> {
    try {
        const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
        const files = entries
            .filter((entry) => entry.isFile())
            .map((entry) => path.join(dirPath, entry.name));

        const directories = entries
            .filter((entry) => entry.isDirectory())
            .map((entry) => path.join(dirPath, entry.name));

        const nestedFiles = await Promise.all(
            directories.flatMap(async (directory) => getAllFilesInDir(directory)),
        );

        return [...files, ...nestedFiles.flat()];
    } catch (error) {
        throw new Error(`Failed to get all files in directory: ${error}`);
    }
}

/**
 * Read the saved sizes file
 */
export async function readSizesFile(): Promise<SizesFile> {
    try {
        if (!fs.existsSync(SIZES_FILE_PATH)) {
            // Create empty file if it doesn't exist
            await fs.promises.writeFile(SIZES_FILE_PATH, JSON.stringify({}, null, 2));
        }

        const sizesData = await fs.promises.readFile(SIZES_FILE_PATH, 'utf-8');
        return JSON.parse(sizesData);
    } catch (error) {
        throw new Error(`Failed to read sizes file: ${error}`);
    }
}

/**
 * Get all files in a directory with their sizes.
 *
 * @param dirPath Path to the directory.
 *
 * @returns A promise that resolves to an object mapping file paths to their sizes.
 */
const getFilesWithSizes = async (dirPath: string): Promise<Record<string, number>> => {
    if (!fs.existsSync(dirPath)) {
        throw new Error(`Directory ${dirPath} does not exist, cannot get file sizes`);
    }

    const files = await getAllFilesInDir(dirPath);
    const sizes: Record<string, number> = {};

    await Promise.all(files.map(async (file) => {
        const relativePath = path.relative(dirPath, file);
        sizes[relativePath] = await getFileSize(file);
    }));

    return sizes;
};

/**
 * Get the size statistics for the current build
 */
export async function getCurrentBuildStats(buildType: string, target: string): Promise<TargetInfo> {
    const buildDir = path.resolve(ROOT_DIR, BUILD_DIRNAME, buildType);

    // Get zip file size
    let fileName = `${target}${ZIP_EXTENSION}`;
    // Handle Firefox special case
    // TODO: Remove this extra case (here and in webpack)
    if (buildType !== BuildTargetEnv.Dev && (target === Browser.FirefoxAmo || target === Browser.FirefoxStandalone)) {
        fileName = `firefox${ZIP_EXTENSION}`;
    }
    const zip = await getFileSize(path.join(buildDir, fileName));

    // Check if the target directory exists.
    if (!fs.existsSync(path.join(buildDir, target))) {
        throw new Error(`Target directory ${path.join(buildDir, target)} does not exist`);
    }

    // Find unzipped directory for the specified target
    const targetDir = path.join(buildDir, target);

    // Get pages sizes
    const pages = await getFilesWithSizes(path.join(targetDir, PAGES_DIRNAME));

    // Get vendors sizes
    const vendors = await getFilesWithSizes(path.join(targetDir, VENDORS_DIRNAME));

    // Get version from package.json
    const packageJsonPath = path.resolve(ROOT_DIR, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
        throw new Error('package.json does not exist');
    }
    const packageJson = JSON.parse(await fs.promises.readFile(packageJsonPath, 'utf-8'));
    const version = packageJson.version || 'unknown';

    return {
        stats: {
            zip,
            pages,
            vendors,
        },
        version,
        // In human-readable format, for quick debugging.
        updatedAt: new Date().toISOString(),
    };
}

/**
 * Save the build statistics to the sizes file
 */
export async function saveBuildStats(
    buildType: BuildTargetEnv,
    target: Browser,
    currentStats: TargetInfo,
): Promise<void> {
    // Read the existing sizes file
    const sizesData = await readSizesFile();

    // Update the sizes data with the new statistics
    // Use type assertion for buildType as key to address TypeScript indexing issue
    if (!sizesData[buildType]) {
        // @ts-expect-error Special case for handle not filled sizesData.
        sizesData[buildType] = {};
    }

    // Update the target information
    // Use type assertion for proper indexing
    sizesData[buildType][target] = currentStats;

    // Write the updated sizes data back to the file
    await writeSizesFile(sizesData);
}

/**
 * Write the sizes data to the sizes file
 */
export async function writeSizesFile(sizesData: SizesFile): Promise<void> {
    try {
        await fs.promises.writeFile(SIZES_FILE_PATH, JSON.stringify(sizesData, null, 2));
    } catch (error) {
        throw new Error(`Failed to write sizes file: ${error}`);
    }
}

/**
 * Format a file size in human-readable format
 */
export function formatSize(bytes: number): string {
    if (bytes < 1024) {
        return `${bytes.toFixed(2)} bytes`;
    }
    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(2)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Format a percentage with sign
 */
export function formatPercentage(value: number): string {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
}
