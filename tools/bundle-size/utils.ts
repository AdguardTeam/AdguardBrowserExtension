/**
 * @file Bundle size utilities
 * Common utility functions for the bundle size monitoring system.
 *
 * Provides:
 * - File and directory size calculation helpers
 * - Read/write helpers for .bundle-sizes.json
 * - Build stats extraction for CI and local use
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { type Browser, type BuildTargetEnv } from '../constants';
import { getBrowserConf } from '../bundle/helpers';

import type { SizesFile, TargetInfo } from './constants';
import {
    BUILD_DIRNAME,
    PAGES_DIRNAME,
    SHARED_DIRNAME,
    VENDORS_DIRNAME,
    ZIP_EXTENSION,
} from './constants';

/* eslint-disable @typescript-eslint/naming-convention */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
/* eslint-enable @typescript-eslint/naming-convention */

// Path constants
/**
 * Root directory of the project.
 */
export const ROOT_DIR = path.resolve(__dirname, '../../');

/**
 * Path to the .bundle-sizes.json file.
 */
export const SIZES_FILE_PATH = path.resolve(ROOT_DIR, '.bundle-sizes.json');

/**
 * Get file size in bytes.
 *
 * @param filePath Path to the file.
 *
 * @returns File size in bytes.
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
 * Get all files in a directory and its subdirectories.
 *
 * @param dirPath Path to the directory.
 *
 * @returns List of file paths.
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
 * Read the saved sizes file (.bundle-sizes.json).
 *
 * @returns Parsed sizes data.
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
 * @returns Object mapping file paths to sizes in bytes.
 */
export const getFilesWithSizes = async (dirPath: string): Promise<Record<string, number>> => {
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
 * Get the size statistics for the current build.
 *
 * @param buildType Build environment (beta, release, etc.).
 * @param target Browser target.
 *
 * @returns Bundle size stats for the current build.
 */
export async function getCurrentBuildStats(buildType: BuildTargetEnv, target: Browser): Promise<TargetInfo> {
    const buildDir = path.resolve(ROOT_DIR, BUILD_DIRNAME, buildType);

    const zipArchiveName = `${getBrowserConf(target).zipName}${ZIP_EXTENSION}`;
    const zip = await getFileSize(path.join(buildDir, zipArchiveName));

    // Find unzipped directory for the specified target
    const targetDir = path.join(buildDir, getBrowserConf(target).buildDir);

    // Check if the target directory exists.
    if (!fs.existsSync(targetDir)) {
        throw new Error(`Target directory ${targetDir} does not exist`);
    }

    // Get pages sizes
    const pages = await getFilesWithSizes(path.join(targetDir, PAGES_DIRNAME));

    // Get vendors sizes
    const vendors = await getFilesWithSizes(path.join(targetDir, VENDORS_DIRNAME));

    // Get shared sizes
    const shared = await getFilesWithSizes(path.join(targetDir, SHARED_DIRNAME));

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
            shared,
        },
        version,
        // In human-readable format, for quick debugging.
        updatedAt: new Date().toISOString(),
    };
}

/**
 * Save the build statistics to the sizes file.
 *
 * @param buildType Build environment.
 * @param target Browser target.
 * @param currentStats Current build stats.
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
 * Write the sizes data to the sizes file.
 *
 * @param sizesData Data to write.
 */
export async function writeSizesFile(sizesData: SizesFile): Promise<void> {
    try {
        await fs.promises.writeFile(SIZES_FILE_PATH, JSON.stringify(sizesData, null, 2));
    } catch (error) {
        throw new Error(`Failed to write sizes file: ${error}`);
    }
}

/**
 * Format a file size in human-readable format.
 *
 * @returns Formatted size string.
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
 * Format a percentage with sign (e.g., "+5.00%", "-3.20%").
 *
 * @param oldValue Old value.
 * @param newValue New value.
 *
 * @returns Formatted percentage string.
 */
export function formatPercentage(oldValue: number, newValue: number): string {
    const diff = newValue - oldValue;
    const percentage = (diff / oldValue) * 100;

    return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(2)}%`;
}
