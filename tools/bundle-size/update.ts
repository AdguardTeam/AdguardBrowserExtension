/**
 * @file Bundle size update script
 * Updates the bundle size record for a specific build environment and target
 * after successful deployment.
 *
 * Usage: Should be run after a build is validated to update the reference size.
 */
/* eslint-disable no-console */
import { isValidBrowserTarget, isValidBuildEnv } from '../constants';

import { getCurrentBuildStats, saveBuildStats } from './utils';

/**
 * Main function to update a specific bundle size record.
 *
 * Requires BUILD_ENV and TARGET_BROWSER environment variables to be set.
 * Updates the .bundle-sizes.json file with the latest build stats for the given target.
 * Throws if invalid build type or target is provided.
 */
async function updateBundleSize(): Promise<void> {
    // Require BUILD_ENV and TARGET to be set
    const buildType = process.env.BUILD_ENV;
    const target = process.env.TARGET_BROWSER;

    if (!isValidBuildEnv(buildType)) {
        throw new Error(`Invalid BUILD_ENV: ${buildType}\n`);
    }

    if (!isValidBrowserTarget(target)) {
        throw new Error(`Invalid TARGET_BROWSER: ${buildType}`);
    }

    console.log(`Updating bundle size for "${buildType}" "${target}"...\n`);

    try {
        // Get current build stats
        const currentStats = await getCurrentBuildStats(buildType, target);

        // Update the sizes file
        await saveBuildStats(buildType, target, currentStats);

        console.log('Bundle size update completed successfully.\n');
    } catch (error) {
        throw new Error(`Error updating bundle size: ${error}\n`);
    }
}

// Run the script
updateBundleSize().catch((err) => {
    throw new Error(`Error updating bundle size: ${err}\n`);
});
