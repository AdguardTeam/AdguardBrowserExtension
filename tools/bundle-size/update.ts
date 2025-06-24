/**
 * @file Bundle size update script
 * Updates the bundle size record for a specific build environment and target
 * after successful deployment.
 *
 * Usage: Should be run after a build is validated to update the reference size.
 */
/* eslint-disable no-console */
import { program } from 'commander';

import {
    Browser,
    BuildTargetEnv,
    isValidBrowserTarget,
    isValidBuildEnv,
} from '../constants';

import { getCurrentBuildStats, saveBuildStats } from './utils';

/**
 * Main function to update a specific bundle size record.
 *
 * Requires buildEnv and targetBrowser arguments to be set.
 * Updates the .bundle-sizes.json file with the latest build stats for the given target.
 * Throws if invalid build type or target is provided.
 *
 * @param buildEnv The build environment.
 * @param targetBrowser The target browser. Optional, defaults to all browsers.
 */
async function updateBundleSize(buildEnv: BuildTargetEnv, targetBrowser?: Browser): Promise<void> {
    console.log(`Updating bundle size for "${buildEnv}" "${targetBrowser}"...\n`);

    const targets = targetBrowser
        ? [targetBrowser]
        // filter out chrome-crx
        : Object.values(Browser).filter((browser) => !browser.toLowerCase().endsWith('crx'));

    for (let i = 0; i < targets.length; i += 1) {
        const target = targets[i]!;

        const envTargetMsgChunk = `for env "${buildEnv}" and target "${target}"`;

        console.log(`\n\nUpdating bundle size ${envTargetMsgChunk}...`);

        try {
            // Get current build stats
            const currentStats = await getCurrentBuildStats(buildEnv, target);

            // Update the sizes file
            await saveBuildStats(buildEnv, target, currentStats);

            console.log(`Bundle size update completed successfully ${envTargetMsgChunk}\n`);
        } catch (error) {
            throw new Error(`Error updating bundle size ${envTargetMsgChunk}: ${error}\n`);
        }
    }
}

// --- CLI argument parsing with commander ---
program
    .argument('<buildEnv>', `Build environment, one from ${Object.values(BuildTargetEnv).join(', ')}`)
    .argument('[targetBrowser]', `Target browser, one from ${Object.values(Browser).join(', ')}`)
    .action(async (buildEnv, targetBrowser) => {
        if (!isValidBuildEnv(buildEnv)) {
            throw new Error(`Invalid buildEnv: "${buildEnv}"\n`);
        }

        if (targetBrowser !== undefined && !isValidBrowserTarget(targetBrowser)) {
            throw new Error(`Invalid targetBrowser: "${targetBrowser}"`);
        }

        await updateBundleSize(buildEnv, targetBrowser);
    });

program.parse(process.argv);
