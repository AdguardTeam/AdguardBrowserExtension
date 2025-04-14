/* eslint-disable max-len */
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

import {
    Browser,
    BuildTargetEnv,
    isValidBuildEnv,
} from './constants';

/* eslint-disable no-console */

const execAsync = util.promisify(exec);

/* eslint-disable @typescript-eslint/naming-convention */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
/* eslint-enable @typescript-eslint/naming-convention */

// Constants
const DEFAULT_SIZE_THRESHOLD = 10; // 10% threshold
const SKIP_SIZE_CHECK_VALUE = '-1';
const MAX_MV3_SIZE_BYTES = 30 * 1024 * 1024; // 30MB limit for MV3
const BUILD_DIRNAME = 'build';
const PAGES_DIRNAME = 'pages';
const VENDORS_DIRNAME = 'vendors';
const ZIP_EXTENSION = '.zip';
const ROOT_DIR = path.resolve(__dirname, '../');
const SIZES_FILE_PATH = path.resolve(ROOT_DIR, '.bundle-sizes.json');

// Interface for bundle statistics
type BundleSizes = {
    /**
     * For compare bundled zips.
     */
    zip: number;

    /**
     * For compare unzipped files in pages/ folder.
     */
    pages: Record<string, number>;

    /**
     * For compare unzipped files in vendors/ folder.
     */
    vendors: Record<string, number>;
};

/**
 * Contains the bundle size for a specific target.
 */
type TargetInfo = {
  stats: BundleSizes;
  version: string;
  updatedAt: string;
};

/**
 * Describes sizes for all builds and targets.
 */
type SizesFile = {
    [buildType in BuildTargetEnv]: {
        [target in Browser]: TargetInfo;
    };
};

type CheckResult = {
    target: Browser;
    hasSizeIssues: boolean;
};

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
            throw new Error(`Sizes file does not exist at the expected path: ${SIZES_FILE_PATH}`);
        }

        const sizesData = await fs.promises.readFile(SIZES_FILE_PATH, 'utf-8');

        return JSON.parse(sizesData);
    } catch (error) {
        throw new Error(`Failed to read sizes file: ${error}`);
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
        throw new Error(`Failed to get file size: ${error}`);
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
        throw new Error(`Failed to get all files in directory: ${error}`);
    }
}

/**
 * Get the size statistics for the current build
 */
async function getCurrentBuildStats(buildType: string, target: string): Promise<TargetInfo> {
    const buildDir = path.resolve(ROOT_DIR, BUILD_DIRNAME, buildType);

    // Get zip file size
    let fileName = `${target}${ZIP_EXTENSION}`;
    // TODO: Remove this
    if (buildType !== BuildTargetEnv.Dev && (target === Browser.FirefoxAmo || target === Browser.FirefoxStandalone)) {
        fileName = `firefox${ZIP_EXTENSION}`;
    }
    const zip = await getFileSize(path.join(buildDir, fileName));

    if (!fs.existsSync(path.join(buildDir, target))) {
        throw new Error(`Target directory ${path.join(buildDir, target)} does not exist`);
    }

    // Find unzipped directory for the specified target
    const targetDir = path.join(buildDir, target);

    // Get pages sizes
    const pages: Record<string, number> = {};
    const pagesDir = path.join(targetDir, PAGES_DIRNAME);
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
    const vendorsDir = path.join(targetDir, VENDORS_DIRNAME);
    if (!fs.existsSync(vendorsDir)) {
        throw new Error(`Vendors directory ${vendorsDir} does not exist`);
    }
    const filesInVendorsDir = await getAllFilesInDir(vendorsDir);
    filesInVendorsDir.forEach(async (file) => {
        const relativePath = path.relative(vendorsDir, file);
        vendors[relativePath] = await getFileSize(file);
    });

    // Get version from package.json
    const packageJsonPath = path.resolve(ROOT_DIR, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
        throw new Error('package.json does not exist');
    }
    const packageJson = await fs.promises.readFile(packageJsonPath, 'utf-8');
    const parsedPackageJson = JSON.parse(packageJson);

    return {
        stats: { zip, pages, vendors },
        version: parsedPackageJson.version,
        updatedAt: new Date().toISOString(),
    };
}

/**
 * Helper to handle async iteration without await in loop
 */
async function processDependencies(dependencies: any[]): Promise<boolean> {
    // Process dependencies in sequence with Promise.all
    const results = await Promise.all(dependencies.map(async (pkg) => {
        const pkgName = Object.keys(pkg)[0] || '';
        if (!pkgName) {
            return null;
        }

        let { stdout } = await execAsync(`pnpm why ${pkgName}`);

        // Ignore devDependencies
        const devDependenciesIndex = stdout.indexOf('devDependencies:');
        stdout = stdout.slice(0, devDependenciesIndex !== -1 ? devDependenciesIndex : undefined);

        // Check if there are multiple versions
        const escapedPkgName = pkgName.replaceAll('/', '\\/');
        const packageNameAsRegex = new RegExp(`^.*\\s${escapedPkgName}\\s(.*)$`, 'gm');
        const instanceMatches = stdout.matchAll(packageNameAsRegex);

        const packageAllVersions = Array.from(instanceMatches).map((match) => match[1]?.replace(' peer', ''));
        const uniqueVersions = new Set(packageAllVersions);

        if (uniqueVersions.size > 1) {
            console.log(`\n❌ Multiple versions of ${pkgName} found:`);
            console.log('\n', uniqueVersions);
            console.log(stdout);

            return { isDuplicate: true };
        }

        return { isDuplicate: false };
    }));

    // Process results
    const duplicateFound = results
        .filter((item) => item !== null)
        .some((item) => item && item.isDuplicate);

    return duplicateFound;
}

/**
 * Check for duplicate package versions using pnpm why
 */
async function checkForDuplicatePackages(): Promise<boolean> {
    // Get a list of all packages
    const { stdout: packageListOutput } = await execAsync('pnpm list --json');
    let packageData;
    try {
        packageData = JSON.parse(packageListOutput);
    } catch (error) {
        throw new Error(`Failed to parse package list output: ${error}`);
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
        throw new Error('No dependencies found in package list output');
    }

    console.log('Checking for duplicate package versions:\n');

    const duplicateFound = await processDependencies(dependencies);

    if (!duplicateFound) {
        console.log('All packages have single versions. ✅\n');
    }

    return duplicateFound;
}

/**
 * Compare current build sizes with reference sizes
 *
 * @returns Boolean indicating if there are any issues.
 */
function compareBuildSizes(
    current: TargetInfo,
    reference: TargetInfo,
    buildType: BuildTargetEnv,
    target: Browser,
    threshold: number,
): boolean {
    console.log('Size comparison results:\n');
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
    console.log('\nZIP File:\n');
    const newSize = current.stats.zip;
    const oldSize = reference.stats.zip;
    const changePercent = oldSize > 0 ? ((newSize - oldSize) / oldSize) * 100 : 0;

    let fileName = `${target}${ZIP_EXTENSION}`;
    // TODO: Remove this
    if (buildType !== BuildTargetEnv.Dev && (target === Browser.FirefoxAmo || target === Browser.FirefoxStandalone)) {
        fileName = `firefox${ZIP_EXTENSION}`;
    }

    if (target === Browser.ChromeMv3 && newSize > MAX_MV3_SIZE_BYTES) {
        hasIssues = true;
        console.log(`- ${fileName}: ${formatSize(newSize)} - Exceeds maximum allowed size of 30MB!`);
    } else if (oldSize > 0 && changePercent > threshold) {
        hasIssues = true;
        console.log(`- ${fileName}: ${formatSize(oldSize)} → ${formatSize(newSize)} (${formatChange(oldSize, newSize)}) - Exceeds ${threshold}% threshold! ❌`);
    } else {
        console.log(`- ${fileName}: ${formatSize(oldSize)} → ${formatSize(newSize)} ${oldSize > 0 ? `(${formatChange(oldSize, newSize)}) ✅` : '(new file) ✅'}`);
    }

    // Compare pages files if they exist in reference
    if (Object.keys(reference.stats.pages).length > 0) {
        console.log('\nPages Files:\n');
        Object.entries(current.stats.pages).forEach(([fileName, newSize]) => {
            const oldSize = reference.stats.pages[fileName] || 0;
            const changePercent = oldSize > 0 ? ((newSize - oldSize) / oldSize) * 100 : 0;

            if (oldSize > 0 && changePercent > threshold) {
                hasIssues = true;
                console.log(`- ${fileName}: ${formatSize(oldSize)} → ${formatSize(newSize)} (${formatChange(oldSize, newSize)}) - Exceeds ${threshold}% threshold! ❌`);
            } else {
                console.log(`- ${fileName}: ${formatSize(oldSize)} → ${formatSize(newSize)} ${oldSize > 0 ? `(${formatChange(oldSize, newSize)}) ✅` : '(new file) ✅'}`);
            }
        });
    }

    // Compare vendors files if they exist in reference
    if (Object.keys(reference.stats.vendors).length > 0) {
        console.log('\nVendors Files:\n');
        Object.entries(current.stats.vendors).forEach(([fileName, newSize]) => {
            const oldSize = reference.stats.vendors[fileName] || 0;
            const changePercent = oldSize > 0 ? ((newSize - oldSize) / oldSize) * 100 : 0;

            if (oldSize > 0 && changePercent > threshold) {
                hasIssues = true;
                console.log(`- ${fileName}: ${formatSize(oldSize)} → ${formatSize(newSize)} (${formatChange(oldSize, newSize)}) - Exceeds ${threshold}% threshold! ❌`);
            } else {
                console.log(`- ${fileName}: ${formatSize(oldSize)} → ${formatSize(newSize)} ${oldSize > 0 ? `(${formatChange(oldSize, newSize)}) ✅` : '(new file) ✅'}`);
            }
        });
    }

    return hasIssues;
}

/**
 * Save build stats to the sizes file
 */
async function saveBuildStats(
    buildType: BuildTargetEnv,
    target: Browser,
    stats: TargetInfo,
): Promise<void> {
    const sizesData: SizesFile = await readSizesFile();

    Object.assign(sizesData, {
        [buildType]: {
            [target]: {
                ...sizesData[buildType]?.[target]?.stats,
                ...stats,
            },
            ...sizesData[buildType],
        },
    });

    await fs.promises.writeFile(SIZES_FILE_PATH, JSON.stringify(sizesData, null, 2));
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

    if (!isValidBuildEnv(buildType)) {
        throw new Error(`Invalid BUILD_ENV: ${buildType}`);
    }

    // Get the size threshold
    const threshold = getSizeThreshold();
    if (threshold === Number(SKIP_SIZE_CHECK_VALUE)) {
        console.log(`Skipping size check, because threshold is set to special skip value: ${threshold}`);
        return;
    }

    // Read the sizes file
    const sizesData = await readSizesFile();

    // Define all possible targets to check
    const targets = Object.values(Browser);

    // Process all targets asynchronously and collect results
    const targetResults: CheckResult[] = [];

    // Use a for loop to ensure sequential logging.
    for (let i = 0; i < targets.length; i += 1) {
        const target = targets[i]!;

        console.log(`\n\nChecking target: ${target}`);

        // Get current build stats for this target
        // eslint-disable-next-line no-await-in-loop
        const currentStats = await getCurrentBuildStats(buildType, target);

        // Compare with reference sizes if available
        if (sizesData[buildType] && sizesData[buildType][target]) {
            const hasBuildSizesIssue = compareBuildSizes(
                currentStats,
                sizesData[buildType][target],
                buildType,
                target,
                threshold,
            );

            targetResults.push({ target, hasSizeIssues: hasBuildSizesIssue });
            continue;
        }

        // No reference sizes available, save current stats as reference
        console.log(`No reference sizes available for comparison for ${target}. This build will be used as reference.`);
        // eslint-disable-next-line no-await-in-loop
        await saveBuildStats(buildType, target, currentStats);

        // Check only MV3 max size for chrome-mv3 target
        if (target === Browser.ChromeMv3) {
            const mv3Size = currentStats.stats.zip;
            if (mv3Size && mv3Size > MAX_MV3_SIZE_BYTES) {
                console.error(`${Browser.ChromeMv3}${ZIP_EXTENSION}: ${(mv3Size / (1024 * 1024)).toFixed(2)}MB - Exceeds maximum allowed size of 30MB!`);
                targetResults.push({ target, hasSizeIssues: true });
            }
        }

        targetResults.push({ target, hasSizeIssues: false });
    }

    // Check for duplicate packages (do this only once for all targets)
    const hasDuplicates = await checkForDuplicatePackages();

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
