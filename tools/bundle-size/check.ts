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
import path from 'path';

import { program } from 'commander';

import { BuildTargetEnv } from '../../constants';
import {
    Browser,
    isValidBrowserTarget,
    isValidBuildEnv,
} from '../constants';
import { getBrowserConf } from '../bundle/helpers';

import type {
    BundleSizes,
    CheckBundleSizesParams,
    Dependency,
    TargetInfo,
} from './constants';
import {
    DEFAULT_SIZE_THRESHOLD_PERCENTAGE,
    MAX_MV3_SIZE_BYTES,
    ZIP_EXTENSION,
    BUILD_DIRNAME,
    MAX_FIREFOX_SIZE_BYTES,
    MAX_FIREFOX_AMO_SIZE_BYTES,
} from './constants';
import {
    getCurrentBuildStats,
    readSizesFile,
    saveBuildStats,
    formatPercentage,
    formatSize,
    getFilesWithSizes,
} from './utils';

/* eslint-disable no-console */

const execAsync = util.promisify(exec);

/**
 * Pure function to determine if there are duplicate versions in the pnpm why output.
 *
 * @param pkgName Name of the package.
 * @param whyOutput Output string from `pnpm why <pkgName>`.
 *
 * @returns Object containing unique versions and relevant output with devDependencies removed.
 */
function countUniqueVersions(pkgName: string, whyOutput: string): {
    uniqueVersions: Set<string>;
    relevantOutput: string;
 } {
    // Ignore version from devDependencies
    const devDependenciesIndex = whyOutput.indexOf('devDependencies:');
    const relevantOutput = whyOutput.slice(0, devDependenciesIndex !== -1 ? devDependenciesIndex : undefined);

    // Check if there are multiple versions
    const escapedPkgName = pkgName.replaceAll('/', '\\/');
    const packageNameAsRegex = new RegExp(`^.*\\s${escapedPkgName}\\s(.*)$`, 'gm');
    const instanceMatches = relevantOutput.matchAll(packageNameAsRegex);

    const packageAllVersions = Array.from(instanceMatches)
        .map((match) => match[1]?.replace(' peer', ''))
        .filter((version) => version !== undefined);

    const uniqueVersions = new Set(packageAllVersions);

    return {
        uniqueVersions,
        relevantOutput,
    };
}

/**
 * Wrapper to fetch pnpm why outputs and check for duplicates (side effects isolated here).
 *
 * @param dependencies List of dependency objects from pnpm why.
 *
 * @returns True if duplicates found, else false.
 */
async function processDependencies(dependencies: Dependency[]): Promise<boolean> {
    const dependencyNames = dependencies
        .map((pkg) => Object.keys(pkg)[0])
        .filter((pkgName) => pkgName !== undefined);

    const packagesWithReason = await Promise.all(dependencyNames.map(async (pkgName) => {
        const { stdout } = await execAsync(`pnpm why ${pkgName}`);

        return {
            pkgName,
            versions: stdout,
        };
    }));

    let hasDuplicates = false;

    // Don't use .some to list all packages with duplicates inside one call to script.
    packagesWithReason.forEach(({ pkgName, versions }) => {
        const { uniqueVersions, relevantOutput } = countUniqueVersions(pkgName, versions);

        if (uniqueVersions.size === 1) {
            return;
        }

        hasDuplicates = true;

        console.error(`\n❌ Multiple versions of ${pkgName} found:`, uniqueVersions.size);
        console.error(Array.from(uniqueVersions).map((version) => `- ${version}`).join('\n'));
        console.error(`\nInstalled version:\n${relevantOutput}`);
    });

    return hasDuplicates;
}

/**
 * Check for duplicate package versions using pnpm.
 *
 * @returns True if duplicates found, else false.
 */
async function checkForDuplicatePackages(): Promise<boolean> {
    try {
        console.log('\nChecking for duplicate package versions...');

        // Run pnpm list command to get dependency tree
        const { stdout } = await execAsync('pnpm list --json');

        // Parse JSON response
        const [result] = JSON.parse(stdout);

        if (!result.dependencies) {
            throw new Error('Invalid output from pnpm why command');
        }

        const dependenciesAsArr = Object.entries(result.dependencies)
            .map(([key, value]) => ({ [key]: value }));

        const hasDuplicates = await processDependencies(dependenciesAsArr);

        if (!hasDuplicates) {
            console.log('✅ No duplicate package versions found!\n');
        }

        return hasDuplicates;
    } catch (error) {
        console.error(`Error checking for duplicate packages: ${error}`);
        return true;
    }
}

/**
 * Compare current build sizes with reference sizes.
 *
 * @param current Current build stats.
 * @param reference Reference build stats.
 * @param target Browser target.
 * @param threshold Allowed percentage increase.
 *
 * @returns True if issues found, else false.
 */
function compareBuildSizes(
    current: TargetInfo,
    reference: TargetInfo,
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

    const zipArchiveName = `${getBrowserConf(target).zipName}${ZIP_EXTENSION}`;

    if (oldSize > 0 && changePercent > threshold) {
        hasIssues = true;
        console.error(`- ❌ ${zipArchiveName}: ${formatSize(oldSize)} → ${formatSize(newSize)} (${formatPercentage(oldSize, newSize)}) - Exceeds ${threshold}% threshold!`);
    } else {
        console.log(`- ✅ ${zipArchiveName}: ${formatSize(oldSize)} → ${formatSize(newSize)} ${oldSize > 0 ? `(${formatPercentage(oldSize, newSize)})` : '(new file)'}`);
    }

    // Compare pages files if they exist in reference
    if (Object.keys(reference.stats.pages).length > 0) {
        console.log('\nPages Files:\n');
        Object.entries(current.stats.pages).forEach(([fileName, newSize]) => {
            const oldSize = reference.stats.pages[fileName] || 0;
            const changePercent = oldSize > 0 ? ((newSize - oldSize) / oldSize) * 100 : 0;

            if (oldSize > 0 && changePercent > threshold) {
                hasIssues = true;
                console.error(`- ❌ ${fileName}: ${formatSize(oldSize)} → ${formatSize(newSize)} (${formatPercentage(oldSize, newSize)}) - Exceeds ${threshold}% threshold!`);
            } else {
                console.log(`- ✅ ${fileName}: ${formatSize(oldSize)} → ${formatSize(newSize)} ${oldSize > 0 ? `(${formatPercentage(oldSize, newSize)})` : '(new file)'}`);
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
                console.error(`- ❌ ${fileName}: ${formatSize(oldSize)} → ${formatSize(newSize)} (${formatPercentage(oldSize, newSize)}) - Exceeds ${threshold}% threshold!`);
            } else {
                console.log(`- ✅ ${fileName}: ${formatSize(oldSize)} → ${formatSize(newSize)} ${oldSize > 0 ? `(${formatPercentage(oldSize, newSize)})` : '(new file)'}`);
            }
        });
    }

    // Compare shared files if they exist in reference
    if (Object.keys(reference.stats.shared).length > 0) {
        console.log('\nShared Files:\n');
        Object.entries(current.stats.shared).forEach(([fileName, newSize]) => {
            const oldSize = reference.stats.shared[fileName] || 0;
            const changePercent = oldSize > 0 ? ((newSize - oldSize) / oldSize) * 100 : 0;

            if (oldSize > 0 && changePercent > threshold) {
                hasIssues = true;
                console.error(`- ❌ ${fileName}: ${formatSize(oldSize)} → ${formatSize(newSize)} (${formatPercentage(oldSize, newSize)}) - Exceeds ${threshold}% threshold!`);
            } else {
                console.log(`- ✅ ${fileName}: ${formatSize(oldSize)} → ${formatSize(newSize)} ${oldSize > 0 ? `(${formatPercentage(oldSize, newSize)})` : '(new file)'}`);
            }
        });
    }

    return hasIssues;
}

/**
 * Check the size of the Chrome MV3 bundle.
 *
 * @param buildType Build environment (beta, release, etc.).
 *
 * @returns True if the size exceeds the limit, else false.
 */
async function checkChromeMv3BundleSize(buildType: BuildTargetEnv): Promise<boolean> {
    console.log('\n\nChecking Chrome MV3 bundle size...');

    try {
        // Get current build stats for this target
        const currentStats = await getCurrentBuildStats(buildType, Browser.ChromeMv3);

        const mv3Size = currentStats.stats.zip;
        const zipArchiveName = `${getBrowserConf(Browser.ChromeMv3).zipName}${ZIP_EXTENSION}`;

        if (mv3Size && mv3Size > MAX_MV3_SIZE_BYTES) {
            console.error(`${zipArchiveName}: ${(mv3Size / (1024 * 1024)).toFixed(2)}MB - Exceeds maximum allowed size of 30MB! ❌`);

            return true;
        }

        console.log('✅ Chrome MV3 bundle size is ok!');

        return false;
    } catch (e) {
        console.error(`Error checking Chrome MV3 bundle size: ${e}`);

        return true;
    }
}

/**
 * Check the size of the Firefox Amo unpacked directory.
 *
 * @param buildType Build environment — beta or release.
 *
 * @returns True if new size exceeds the limit
 * or if new size is more than threshold compared to previous size,
 * otherwise false.
 */
async function checkFirefoxAmoUnpackedSize(
    buildType: BuildTargetEnv,
    prevStats: BundleSizes,
    threshold: number,
): Promise<boolean> {
    if (buildType !== BuildTargetEnv.Beta && buildType !== BuildTargetEnv.Release) {
        throw new Error('Invalid build type for Firefox AMO unpacked size check, expected beta or release');
    }

    console.log('\n\nChecking Firefox AMO unpacked size...');

    try {
        // Get current build stats for this target
        const currentStats = await getCurrentBuildStats(buildType, Browser.FirefoxAmo);

        const currentSize = currentStats.stats.raw;
        if (!currentSize) {
            console.error('No current size found for Firefox AMO unpacked size check!');
            return true;
        }

        const rawDirName = `${getBrowserConf(Browser.FirefoxAmo).buildDir}`;

        if (currentSize > MAX_FIREFOX_AMO_SIZE_BYTES) {
            console.error(`${rawDirName}: ${(currentSize / (1024 * 1024)).toFixed(2)} MB - Exceeds maximum allowed size of ${MAX_FIREFOX_AMO_SIZE_BYTES} MB! ❌`);
            return true;
        }

        const prevSize = prevStats.raw;
        if (!prevSize) {
            console.error('No previous size found for Firefox AMO unpacked size check!');
            return true;
        }

        const changePercent = ((currentSize - prevSize) / prevSize) * 100;

        if (prevSize > 0 && changePercent > threshold) {
            console.error(`❌ ${rawDirName}: ${formatSize(prevSize)} → ${formatSize(currentSize)} (${formatPercentage(prevSize, currentSize)}) - Exceeds ${threshold}% threshold!`);
            return true;
        }

        console.log(`✅ ${rawDirName}: ${formatSize(prevSize)} → ${formatSize(currentSize)} (${formatPercentage(prevSize, currentSize)}) - ok!`);

        return false;
    } catch (e) {
        console.error(`Error checking Firefox AMO unpacked size: ${e}`);

        return true;
    }
}

/**
 * Checks that no .js, .css, .json file in Firefox builds exceeds 4MB (Firefox Add-ons Store limit).
 * Logs errors and returns true if any offending files are found.
 *
 * @param buildType Build environment (beta, release, etc.).
 *
 * @returns True if some files exceed 4MB, else false.
 */
async function checkFirefoxJsFileSizes(buildType: BuildTargetEnv): Promise<boolean> {
    const FIREFOX_TARGETS = [Browser.FirefoxAmo, Browser.FirefoxStandalone];

    console.log('\n\nChecking Firefox Add-ons Store file sizes (.js, .css, .json)...');

    try {
        const fileChecks = await Promise.all(FIREFOX_TARGETS.map(async (target) => {
            const dir = path.join(
                BUILD_DIRNAME,
                buildType,
                getBrowserConf(target).buildDir,
            );

            const allFiles = await getFilesWithSizes(dir);
            return Object.entries(allFiles)
                .filter(([file]) => file.endsWith('.js') || file.endsWith('.css') || file.endsWith('.json'))
                .map(([file, size]) => ({ file, size }));
        }));

        let found = false;

        const bytesToMB = (bytes: number) => (bytes / (1024 * 1024)).toFixed(2);

        fileChecks
            .flat()
            .forEach(({ file, size }) => {
                if (size > MAX_FIREFOX_SIZE_BYTES) {
                    found = true;
                    console.error(`Firefox Add-ons Store limit exceeded: ${file} is ${bytesToMB(size)}MB (> ${bytesToMB(MAX_FIREFOX_SIZE_BYTES)}MB) ❌`);
                }
            });

        if (found) {
            console.error('❌ Some file sizes for Firefox Add-ons Store exceed the limit!');
        } else {
            console.log('✅ All file sizes for Firefox Add-ons Store are ok!');
        }

        return found;
    } catch (error) {
        console.error(`Error checking Firefox file sizes: ${error}`);
        return false;
    }
}

/**
 * Main function to check bundle sizes.
 *
 * @param data Check bundle sizes parameters.
 * @param data.buildEnv The build environment.
 * @param data.targetBrowser The target browser. Optional, defaults to all browsers.
 * @param data.threshold The threshold for bundle size comparison.
 *
 * @throws Error if any size or duplicate issues are detected.
 */
async function checkBundleSizes({ buildEnv, targetBrowser, threshold }: CheckBundleSizesParams): Promise<void> {
    // Define all possible targets to check
    const targets = targetBrowser
        ? [targetBrowser]
        // filter out chrome-crx
        : Object.values(Browser).filter((browser) => !browser.toLowerCase().endsWith('crx'));
    const sizesData = await readSizesFile();
    let hasSizeIssues = false;

    // Use a for loop to ensure sequential logging.
    for (let i = 0; i < targets.length; i += 1) {
        const target = targets[i]!;

        console.log(`\n\nChecking target: ${target}`);

        try {
            // Get current build stats for this target
            const currentStats = await getCurrentBuildStats(buildEnv, target);

            if (!sizesData[buildEnv] || !sizesData[buildEnv][target]) {
                throw new Error(`Reference Build size for env ${buildEnv} and target ${target} not found.`);
            }

            // Compare with reference sizes if available
            if (sizesData[buildEnv] && sizesData[buildEnv][target]) {
                const hasBuildSizesIssue = compareBuildSizes(
                    currentStats,
                    sizesData[buildEnv][target],
                    target,
                    threshold,
                );

                hasSizeIssues = hasSizeIssues || hasBuildSizesIssue;

                continue;
            }

            // No reference sizes available, save current stats as reference
            console.log(`No reference sizes available for comparison for ${target}. This build will be used as reference.`);
            await saveBuildStats(buildEnv, target, currentStats);
        } catch (error) {
            // In normal mode, rethrow the error
            throw new Error(`Error processing target ${target}: ${error}`);
        }
    }

    // Check max size only for chrome-mv3 target, because we pack a lot
    // of filters data inside this target.
    let hasChromeMv3SizeIssues = false;
    if (targets.includes(Browser.ChromeMv3)) {
        hasChromeMv3SizeIssues = await checkChromeMv3BundleSize(buildEnv);
    }

    let hasFirefoxAmoSizeIssues = false;
    if (
        targets.includes(Browser.FirefoxAmo)
        && (buildEnv === BuildTargetEnv.Beta || buildEnv === BuildTargetEnv.Release)
    ) {
        hasFirefoxAmoSizeIssues = await checkFirefoxAmoUnpackedSize(
            buildEnv,
            sizesData[buildEnv][Browser.FirefoxAmo].stats,
            threshold,
        );
    }

    // Check for Firefox Add-ons Store file size limit (4MB per each file)
    const hasFirefoxJsIssues = await checkFirefoxJsFileSizes(buildEnv);

    // Check for duplicate packages (do this only once for all targets)
    const hasDuplicates = await checkForDuplicatePackages();

    // Exit with error if there are issues in any target
    if (
        hasSizeIssues
        || hasChromeMv3SizeIssues
        || hasFirefoxAmoSizeIssues
        || hasDuplicates
        || hasFirefoxJsIssues
    ) {
        throw new Error('Bundle size check failed due to size issues. Check the output above.');
    }

    // Exit with error if there are issues in any target
    if (hasDuplicates) {
        throw new Error('Bundle size check failed due to duplicate packages. Check the output above.');
    }

    console.log('Bundle size check completed successfully.');
}

// --- CLI argument parsing with commander ---
program
    .argument('<buildEnv>', `Build environment, one from: ${Object.values(BuildTargetEnv).map((s) => `"${s}"`).join(', ')}`)
    .argument('[targetBrowser]', `Target browser, one from: ${Object.values(Browser).map((s) => `"${s}"`).join(', ')}`)
    .option('--threshold <number>', 'Bundle size threshold in percents', String(DEFAULT_SIZE_THRESHOLD_PERCENTAGE))
    .action(async (buildEnv, targetBrowser, options) => {
        if (!buildEnv) {
            throw new Error('buildEnv argument is required');
        }

        if (!isValidBuildEnv(buildEnv)) {
            throw new Error(`Invalid buildEnv: ${buildEnv}`);
        }

        if (targetBrowser !== undefined && !isValidBrowserTarget(targetBrowser)) {
            throw new Error(`Invalid targetBrowser: ${targetBrowser}`);
        }

        const threshold = Number(options.threshold) || DEFAULT_SIZE_THRESHOLD_PERCENTAGE;

        await checkBundleSizes({ buildEnv, targetBrowser, threshold });
    });

program.parse(process.argv);
