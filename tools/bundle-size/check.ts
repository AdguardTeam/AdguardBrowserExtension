/**
 * @file Bundle size checker script
 * Tracks and compares bundle sizes across builds to detect significant size increases.
 *
 * Functionality:
 * - Compares current build sizes to reference sizes for each build type and browser target.
 * - Detects significant increases using configurable thresholds.
 * - Ensures MV3 bundle stays under 30MB limit.
 * - Checks for duplicate package versions using pnpm.
 * - Stores historical size data in .bundle-sizes.json.
 * - Designed for CI/CD integration.
 */
import util from 'util';
import { exec } from 'child_process';

import { filesize } from 'filesize';

import {
    Browser,
    BuildTargetEnv,
    isValidBrowserTarget,
    isValidBuildEnv,
} from '../constants';

import type { TargetInfo } from './constants';
import {
    DEFAULT_SIZE_THRESHOLD,
    SKIP_SIZE_CHECK_VALUE,
    MAX_MV3_SIZE_BYTES,
    ZIP_EXTENSION,
} from './constants';
import {
    getCurrentBuildStats,
    readSizesFile,
    saveBuildStats,
    formatPercentage,
} from './utils';

/* eslint-disable no-console */

const execAsync = util.promisify(exec);

/**
 * Get the configured size threshold or default.
 *
 * @returns Bundle size threshold as a percentage.
 */
function getSizeThreshold(): number {
    const thresholdVar = process.env.BUNDLE_SIZE_THRESHOLD;
    const threshold = Number(thresholdVar);
    return !Number.isNaN(threshold) ? threshold : DEFAULT_SIZE_THRESHOLD;
}

/**
 * Helper to handle checking for duplicate package versions.
 *
 * @param dependencies List of dependency objects from pnpm why.
 *
 * @returns True if duplicates found, else false.
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
 * Check for duplicate package versions using pnpm.
 *
 * @returns True if duplicates found, else false.
 */
async function checkForDuplicatePackages(): Promise<boolean> {
    try {
        console.log('\nChecking for duplicate package versions...');

        // Run pnpm why command to get dependency tree
        const { stdout } = await execAsync('pnpm why --json');

        // Parse JSON response
        const result = JSON.parse(stdout);
        if (!result.dependencies || !Array.isArray(result.dependencies)) {
            console.error('Invalid output from pnpm why command');
            return false;
        }

        return await processDependencies(result.dependencies);
    } catch (error) {
        console.error(`Error checking for duplicate packages: ${error}`);
        return false;
    }
}

/**
 * Compare current build sizes with reference sizes.
 *
 * @param current Current build stats.
 * @param reference Reference build stats.
 * @param buildType Build environment (beta, release, etc.).
 * @param target Browser target.
 * @param threshold Allowed percentage increase.
 *
 * @returns True if issues found, else false.
 */
function compareBuildSizes(
    current: TargetInfo,
    reference: TargetInfo,
    buildType: string,
    target: Browser,
    threshold: number,
): boolean {
    console.log('Size comparison results:\n');
    let hasIssues = false;

    // Compare zip files
    console.log('\nZIP File:\n');
    const newSize = current.stats.zip;
    const oldSize = reference.stats.zip;
    const changePercent = oldSize > 0 ? ((newSize - oldSize) / oldSize) * 100 : 0;

    let fileName = `${target}${ZIP_EXTENSION}`;
    // Firefox special case
    // TODO: (AG-41656) Remove this workaround and use the same name for all builds
    if (buildType !== BuildTargetEnv.Dev && (target === Browser.FirefoxAmo || target === Browser.FirefoxStandalone)) {
        fileName = `firefox${ZIP_EXTENSION}`;
    }

    if (target === Browser.ChromeMv3 && newSize > MAX_MV3_SIZE_BYTES) {
        hasIssues = true;
        console.log(`- ${fileName}: ${filesize(newSize)} - Exceeds maximum allowed size of 30MB!`);
    } else if (oldSize > 0 && changePercent > threshold) {
        hasIssues = true;
        console.log(`- ${fileName}: ${filesize(oldSize)} → ${filesize(newSize)} (${formatPercentage(oldSize - newSize)}) - Exceeds ${threshold}% threshold! ❌`);
    } else {
        console.log(`- ${fileName}: ${filesize(oldSize)} → ${filesize(newSize)} ${oldSize > 0 ? `(${formatPercentage(oldSize - newSize)}) ✅` : '(new file) ✅'}`);
    }

    // Compare pages files if they exist in reference
    if (Object.keys(reference.stats.pages).length > 0) {
        console.log('\nPages Files:\n');
        Object.entries(current.stats.pages).forEach(([fileName, newSize]) => {
            const oldSize = reference.stats.pages[fileName] || 0;
            const changePercent = oldSize > 0 ? ((newSize - oldSize) / oldSize) * 100 : 0;

            if (oldSize > 0 && changePercent > threshold) {
                hasIssues = true;
                console.log(`- ${fileName}: ${filesize(oldSize)} → ${filesize(newSize)} (${formatPercentage(oldSize - newSize)}) - Exceeds ${threshold}% threshold! ❌`);
            } else {
                console.log(`- ${fileName}: ${filesize(oldSize)} → ${filesize(newSize)} ${oldSize > 0 ? `(${formatPercentage(oldSize - newSize)}) ✅` : '(new file) ✅'}`);
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
                console.log(`- ${fileName}: ${filesize(oldSize)} → ${filesize(newSize)} (${formatPercentage(oldSize - newSize)}) - Exceeds ${threshold}% threshold! ❌`);
            } else {
                console.log(`- ${fileName}: ${filesize(oldSize)} → ${filesize(newSize)} ${oldSize > 0 ? `(${formatPercentage(oldSize - newSize)}) ✅` : '(new file) ✅'}`);
            }
        });
    }

    return hasIssues;
}

/**
 * Main function to check bundle sizes.
 * Throws if any size or duplicate issues are detected.
 *
 * @returns
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

    // Define specific target if provided
    const specificTarget = process.env.TARGET_BROWSER;

    // specificTarget is optional, but if provided, it must be valid.
    if (specificTarget !== undefined && !isValidBrowserTarget(specificTarget)) {
        throw new Error(`Invalid TARGET_BROWSER: ${specificTarget}`);
    }

    // Define all possible targets to check
    const targets = specificTarget ? [specificTarget] : Object.values(Browser);

    // Get the size threshold
    const threshold = getSizeThreshold();
    if (threshold === Number(SKIP_SIZE_CHECK_VALUE)) {
        console.log(`Skipping size check, because threshold is set to special skip value: ${threshold}`);
        return;
    }

    // Read the sizes file
    const sizesData = await readSizesFile();

    // Indicate if any target has size issues.
    let hasSizeIssues = false;

    // Use a for loop to ensure sequential logging.
    for (let i = 0; i < targets.length; i += 1) {
        const target = targets[i]!;

        console.log(`\n\nChecking target: ${target}`);

        try {
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

                hasSizeIssues = hasSizeIssues || hasBuildSizesIssue;
                continue;
            }

            // No reference sizes available, save current stats as reference
            console.log(`No reference sizes available for comparison for ${target}. This build will be used as reference.`);
            // eslint-disable-next-line no-await-in-loop
            await saveBuildStats(buildType, target, currentStats);

            // Check max size only for chrome-mv3 target, because we pack a lot
            // of filters data inside this target.
            if (target === Browser.ChromeMv3) {
                const mv3Size = currentStats.stats.zip;
                if (mv3Size && mv3Size > MAX_MV3_SIZE_BYTES) {
                    console.error(`${Browser.ChromeMv3}${ZIP_EXTENSION}: ${(mv3Size / (1024 * 1024)).toFixed(2)}MB - Exceeds maximum allowed size of 30MB!`);
                    hasSizeIssues = true;
                    continue;
                }
            }
        } catch (error) {
            // In normal mode, rethrow the error
            throw new Error(`Error processing target ${target}: ${error}`);
        }
    }

    // Check for duplicate packages (do this only once for all targets)
    const hasDuplicates = await checkForDuplicatePackages();

    // Check if any target had issues
    const hasAnyIssues = hasSizeIssues;

    // Exit with error if there are issues in any target
    if (hasAnyIssues || hasDuplicates) {
        throw new Error('Bundle size check failed due to size issues or duplicate packages.');
    }

    console.log('Bundle size check completed successfully.');
}

// Run the script
checkBundleSizes().catch((err) => {
    throw new Error(`Error checking bundle sizes: ${err}`);
});
