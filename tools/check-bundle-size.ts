/**
 * @file Bundle size checker script
 * Tracks and compares bundle sizes across builds to detect significant size
 * increases.
 */
import fs from 'fs';
import path from 'path';
import util from 'util';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';

import { Browser } from './constants';

/* eslint-disable no-console */

const execAsync = util.promisify(exec);

/* eslint-disable @typescript-eslint/naming-convention */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
/* eslint-enable @typescript-eslint/naming-convention */

// Constants
const DEFAULT_SIZE_THRESHOLD = 10; // 10% threshold
const SKIP_SIZE_CHECK_VALUE = '-1';
const SIZES_FILE_PATH = path.resolve(__dirname, '.bundle-sizes.json');
const MAX_MV3_SIZE_BYTES = 30 * 1024 * 1024; // 30MB limit for MV3
const BUILD_DIRNAME = 'build';
const ZIP_EXTENSION = '.zip';

// Interface for bundle statistics
interface BundleSizes {
    /**
     * For compare bundled zips.
     */
    zips: Record<string, number>;

    /**
     * For compare unzipped files in pages/ folder.
     */
    pages: Record<string, number>;

    /**
     * For compare unzipped files in vendors/ folder.
     */
    vendors: Record<string, number>;
}

/**
 * Contains the bundle size for a specific target.
 */
interface TargetInfo {
  stats: BundleSizes;
  version: string;
  updatedAt: string;
}

/**
 * Describes sizes for all builds and targets.
 */
interface SizesFile {
  [buildType: string]: {
    [target: string]: TargetInfo;
  };
}

/**
 * Get the configured size threshold or default
 */
function getSizeThreshold(): number {
    const thresholdVar = process.env.BUNDLE_SIZE_THRESHOLD;

    const threshold = Number(thresholdVar);
    return !Number.isNaN(threshold) ? threshold : DEFAULT_SIZE_THRESHOLD;
}

/**
 * Read the saved sizes file
 */
async function readSizesFile(): Promise<SizesFile> {
    try {
        if (!fs.existsSync(SIZES_FILE_PATH)) {
            throw new Error('Sizes file does not exist');
        }

        const sizesData = fs.readFileSync(SIZES_FILE_PATH, 'utf-8');
        return JSON.parse(sizesData);
    } catch (error) {
        throw new Error('Failed to read sizes file', { cause: error });
    }
}

/**
 * Get file size in bytes
 *
 * @param filePath Path to the file
 *
 * @throws Error If the file size cannot be retrieved
 */
async function getFileSize(filePath: string): Promise<number> {
    try {
        const stats = await fs.promises.stat(filePath);
        return stats.size;
    } catch (error) {
        throw new Error('Failed to get file size', { cause: error });
    }
}

/**
 * Get all files in a directory and its subdirectories
 *
 * @param dirPath Path to the directory
 *
 * @throws Error If the directory cannot be read
 */
async function getAllFilesInDir(dirPath: string): Promise<string[]> {
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
        throw new Error('Failed to get all files in directory', { cause: error });
    }
}

/**
 * Get the size statistics for the current build
 */
async function getCurrentBuildStats(buildType: string, target: string): Promise<TargetInfo> {
    const buildDir = path.resolve(__dirname, BUILD_DIRNAME, buildType);

    // Get zip file sizes
    const zips: Record<string, number> = {};
    const buildFiles = await fs.promises.readdir(buildDir);
    const zipFiles = buildFiles.filter((file) => file.endsWith(ZIP_EXTENSION));

    zipFiles.forEach(async (zipFile) => {
        const filePath = path.join(buildDir, zipFile);
        zips[zipFile] = await getFileSize(filePath);
    });

    if (!fs.existsSync(path.join(buildDir, target))) {
        throw new Error(`Target directory ${target} does not exist in build directory`);
    }

    // Find unzipped directory for the specified target
    const targetDir = path.join(buildDir, target);

    // Get pages sizes
    const pages: Record<string, number> = {};
    const pagesDir = path.join(targetDir, 'pages');
    if (!fs.existsSync(pagesDir)) {
        throw new Error(`Pages directory ${pagesDir} does not exist`);
    }
    const filesInPagesDir = await getAllFilesInDir(pagesDir);
    filesInPagesDir.forEach(async (file) => {
        const relativePath = path.relative(pagesDir, file);
        pages[relativePath] = await getFileSize(file);
    });

    // Get vendors sizes
    const vendors: Record<string, number> = {};
    const vendorsDir = path.join(targetDir, 'vendors');
    if (fs.existsSync(vendorsDir)) {
        throw new Error(`Vendors directory ${vendorsDir} does not exist`);
    }
    const filesInVendorsDir = await getAllFilesInDir(vendorsDir);
    filesInVendorsDir.forEach(async (file) => {
        const relativePath = path.relative(vendorsDir, file);
        vendors[relativePath] = await getFileSize(file);
    });

    // Get version from package.json
    let version = '0.0.0';
    const packageJsonPath = path.resolve(__dirname, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
        throw new Error('package.json does not exist');
    }
    const packageJson = await fs.promises.readFile(packageJsonPath, 'utf-8');
    const parsedPackageJson = JSON.parse(packageJson);
    version = parsedPackageJson.version;

    return {
        stats: { zips, pages, vendors },
        version,
        updatedAt: new Date().toISOString(),
    };
}

/**
 * Helper to handle async iteration without await in loop
 */
async function processDependencies(dependencies: any[]): Promise<{ duplicateFound: boolean; result: string }> {
    let duplicateFound = false;
    let result = '';

    // Process dependencies in sequence with Promise.all
    const results = await Promise.all(dependencies.map(async (pkg) => {
        const pkgName = Object.keys(pkg)[0] || '';
        if (!pkgName) {
            return null;
        }

        const { stdout } = await execAsync(`pnpm why ${pkgName}`);

        // Check if there are multiple versions
        const packageNameAsRegex = new RegExp(`^${pkgName.replaceAll('/', '\\/')}@`, 'gm');
        const instanceMatch = stdout.match(packageNameAsRegex);
        if (instanceMatch && instanceMatch[1] && parseInt(instanceMatch[1], 10) > 1) {
            return { isDuplicate: true, pkgName, stdout };
        }

        return { isDuplicate: false };
    }));

    // Process results
    results.filter((item) => item !== null).forEach((item) => {
        if (item && item.isDuplicate) {
            duplicateFound = true;
            result += `\n\u26A0\uFE0F Multiple versions of ${item.pkgName} found:\n${item.stdout}\n`;
        }
    });

    return { duplicateFound, result };
}

/**
 * Check for duplicate package versions using pnpm why
 */
async function checkForDuplicatePackages(): Promise<{ hasIssues: boolean; output: string }> {
    // Get a list of all packages
    try {
        const { stdout: packageListOutput } = await execAsync('pnpm list --json');
        let packageData;
        try {
            packageData = JSON.parse(packageListOutput);
        } catch (error) {
            return { hasIssues: false, output: 'Failed to parse package list output.' };
        }

        // Ensure dependencies is always an array
        const dependencies = Array.isArray(packageData[0]?.dependencies)
            ? packageData[0].dependencies
            : Object.entries(packageData[0]?.dependencies || {}).map(([name, info]: [string, any]) => {
                // Ensure name is a string
                const pkgName = name || '';
                return { [pkgName]: info };
            });

        if (!dependencies || dependencies.length === 0) {
            return { hasIssues: false, output: 'No dependencies found to check.' };
        }

        let result = 'Checking for duplicate package versions:\n';

        const { duplicateFound, result: duplicateResults } = await processDependencies(dependencies);

        if (duplicateFound) {
            result += duplicateResults;
        } else {
            result += 'All packages have single versions. \u2705\n';
        }

        return { hasIssues: duplicateFound, output: result };
    } catch (error) {
        return {
            hasIssues: false,
            output: `Failed to check for duplicate packages: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
}

/**
 * Compare current build sizes with reference sizes
 */
function compareBuildSizes(
    current: TargetInfo,
    reference: TargetInfo,
    threshold: number,
): {
  hasIssues: boolean;
  output: string;
} {
    let output = 'Size comparison results:\n';
    let hasIssues = false;

    // Helper function to format size
    const formatSize = (bytes: number): string => {
        if (bytes < 1024) {
            return `${bytes} B`;
        }
        if (bytes < 1024 * 1024) {
            return `${(bytes / 1024).toFixed(2)} KB`;
        }
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };

    // Helper function to format percentage change
    const formatChange = (oldSize: number, newSize: number): string => {
        const change = ((newSize - oldSize) / oldSize) * 100;
        return change >= 0 ? `+${change.toFixed(2)}%` : `${change.toFixed(2)}%`;
    };

    // Compare zip files
    output += '\nZIP Files:\n';
    Object.entries(current.stats.zips).forEach(([fileName, newSize]) => {
        const oldSize = reference.stats.zips[fileName] || 0;
        const changePercent = oldSize > 0 ? ((newSize - oldSize) / oldSize) * 100 : 0;

        if (fileName === `${Browser.ChromeMv3}${ZIP_EXTENSION}` && newSize > MAX_MV3_SIZE_BYTES) {
            hasIssues = true;
            output += ` ${fileName}: ${formatSize(newSize)} - Exceeds maximum allowed size of 30MB!\n`;
        } else if (oldSize > 0 && changePercent > threshold) {
            hasIssues = true;
            output += ` ${fileName}: ${formatSize(oldSize)} → ${formatSize(newSize)} (${formatChange(oldSize, newSize)}) - Exceeds ${threshold}% threshold!\n`;
        } else {
            output += ` ${fileName}: ${formatSize(oldSize)} → ${formatSize(newSize)} ${oldSize > 0 ? `(${formatChange(oldSize, newSize)})` : '(new file)'}\n`;
        }
    });

    // Compare pages files if they exist in reference
    if (Object.keys(reference.stats.pages).length > 0) {
        output += '\nPages Files:\n';
        Object.entries(current.stats.pages).forEach(([fileName, newSize]) => {
            const oldSize = reference.stats.pages[fileName] || 0;
            const changePercent = oldSize > 0 ? ((newSize - oldSize) / oldSize) * 100 : 0;

            if (oldSize > 0 && changePercent > threshold) {
                hasIssues = true;
                output += ` ${fileName}: ${formatSize(oldSize)} → ${formatSize(newSize)} (${formatChange(oldSize, newSize)}) - Exceeds ${threshold}% threshold!\n`;
            } else if (changePercent > 0) {
                output += ` ${fileName}: ${formatSize(oldSize)} → ${formatSize(newSize)} ${oldSize > 0 ? `(${formatChange(oldSize, newSize)})` : '(new file)'}\n`;
            }
        });
    }

    // Compare vendors files if they exist in reference
    if (Object.keys(reference.stats.vendors).length > 0) {
        output += '\nVendors Files:\n';
        Object.entries(current.stats.vendors).forEach(([fileName, newSize]) => {
            const oldSize = reference.stats.vendors[fileName] || 0;
            const changePercent = oldSize > 0 ? ((newSize - oldSize) / oldSize) * 100 : 0;

            if (oldSize > 0 && changePercent > threshold) {
                hasIssues = true;
                output += ` ${fileName}: ${formatSize(oldSize)} → ${formatSize(newSize)} (${formatChange(oldSize, newSize)}) - Exceeds ${threshold}% threshold!\n`;
            } else if (changePercent > 0) {
                output += ` ${fileName}: ${formatSize(oldSize)} → ${formatSize(newSize)} ${oldSize > 0 ? `(${formatChange(oldSize, newSize)})` : '(new file)'}\n`;
            }
        });
    }

    return { hasIssues, output };
}

/**
 * Save build stats to the sizes file
 */
async function saveBuildStats(buildType: string, target: string, stats: TargetInfo): Promise<void> {
    try {
        const sizesData: SizesFile = await readSizesFile();

        if (!sizesData[buildType]) {
            sizesData[buildType] = {};
        }

        sizesData[buildType][target] = stats;

        await fs.promises.writeFile(SIZES_FILE_PATH, JSON.stringify(sizesData, null, 2));
    } catch {
    // Silently handle error
    }
}

/**
 * Main function to check bundle sizes
 */
async function checkBundleSizes(): Promise<void> {
    // Require BUILD_ENV to be set
    const buildType = process.env.BUILD_ENV;
    if (!buildType) {
        throw new Error('BUILD_ENV environment variable is required');
    }

    // Get the size threshold
    const threshold = getSizeThreshold();
    if (threshold === Number(SKIP_SIZE_CHECK_VALUE)) {
        console.log(`Skipping size check, because threshold is set to special skip value: ${threshold}`);
        return;
    }

    // Read the sizes file
    let sizesData: SizesFile;
    try {
        sizesData = await readSizesFile();
    } catch (error) {
        throw new Error('Failed to read sizes file', { cause: error });
    }

    // Define all possible targets to check
    const targets = Object.values(Browser).filter((target) => typeof target === 'string');

    // Process all targets asynchronously and collect results
    const targetResults = await Promise.all(targets.map(async (target) => {
        console.log(`\n\nChecking target: ${target}`);

        // Get current build stats for this target
        const currentStats = await getCurrentBuildStats(buildType, target);

        // Compare with reference sizes if available
        let hasSizeIssues = false;
        if (sizesData[buildType] && sizesData[buildType][target]) {
            const result = compareBuildSizes(currentStats, sizesData[buildType][target], threshold);
            hasSizeIssues = result.hasIssues;
            console.log(result.output);

            return { target, hasSizeIssues };
        }

        // No reference sizes available, save current stats as reference
        console.log(`No reference sizes available for comparison for ${target}. This build will be used as reference.`);
        await saveBuildStats(buildType, target, currentStats);

        // Check only MV3 max size for chrome-mv3 target
        if (target === Browser.ChromeMv3) {
            const mv3Size = currentStats.stats.zips[`${Browser.ChromeMv3}${ZIP_EXTENSION}`];
            if (mv3Size && mv3Size > MAX_MV3_SIZE_BYTES) {
                console.error(`${Browser.ChromeMv3}${ZIP_EXTENSION}: ${(mv3Size / (1024 * 1024)).toFixed(2)}MB - Exceeds maximum allowed size of 30MB!`);
                hasSizeIssues = true;
            }
        }

        return { target, hasSizeIssues };
    }));

    // Check for duplicate packages (do this only once for all targets)
    const { hasIssues: hasDuplicates, output: duplicatesOutput } = await checkForDuplicatePackages();
    console.log(`\n${duplicatesOutput}`);

    // Check if any target had issues
    const hasAnyIssues = targetResults.some((result) => result.hasSizeIssues);

    // Exit with error if there are issues in any target
    if (hasAnyIssues || hasDuplicates) {
        process.exit(1);
    }

    console.log('Bundle size check completed successfully.');
}

// Run the script
checkBundleSizes().catch((err) => {
    console.error(`Error checking bundle sizes: ${err}`);
    process.exit(1);
});
