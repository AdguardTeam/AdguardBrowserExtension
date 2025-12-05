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

/* eslint-disable no-console, no-restricted-syntax */
import { program } from 'commander';

import { BuildTargetEnv } from '../constants';

import { bundleRunner } from './bundle/bundle-runner';
import { copyExternals } from './bundle/copy-external';
import { Browser, BUILD_ENV } from './constants';
import { getRspackConfig } from './bundle/get-rspack-config';
import { crx } from './bundle/crx';
import { buildInfo } from './bundle/build-info';
import { buildUpdateJson } from './bundle/firefox/updateJson';
import { type BuildOptions } from './bundle/common-constants';

/**
 * Commander options.
 */
type CommanderOptions = {
    /**
     * Whether to run in watch mode.
     */
    watch?: boolean;

    /**
     * Whether to enable caching.
     */
    cache?: boolean;

    /**
     * Whether to create zip archives after build.
     */
    zip?: boolean;
};

/**
 * Creates build options from commander options.
 *
 * @param options Commander options.
 *
 * @returns Build options for rspack config.
 */
const getBuildOptions = (options: CommanderOptions): BuildOptions => ({
    isWatchMode: options.watch,
    zip: options.zip ?? false,
});

const bundleChrome = (options: CommanderOptions) => {
    const rspackConfig = getRspackConfig(Browser.Chrome, getBuildOptions(options));
    return bundleRunner(rspackConfig, options);
};

const bundleChromeMv3 = (options: CommanderOptions) => {
    const rspackConfig = getRspackConfig(Browser.ChromeMv3, getBuildOptions(options));
    return bundleRunner(rspackConfig, options);
};

const bundleFirefoxAmo = (options: CommanderOptions) => {
    const rspackConfig = getRspackConfig(Browser.FirefoxAmo, getBuildOptions(options));
    return bundleRunner(rspackConfig, options);
};

const bundleEdge = (options: CommanderOptions) => {
    const rspackConfig = getRspackConfig(Browser.Edge, getBuildOptions(options));
    return bundleRunner(rspackConfig, options);
};

const bundleOpera = (options: CommanderOptions) => {
    const rspackConfig = getRspackConfig(Browser.Opera, getBuildOptions(options));
    return bundleRunner(rspackConfig, options);
};

const bundleChromeCrx = async () => {
    const key = 'Building CRX for Chrome';
    console.log(`${key}...`);
    console.time(key);
    await crx(Browser.Chrome);
    console.timeEnd(key);
};

/**
 * Runs a single task with options, and logs the time taken.
 *
 * @param task Task to run.
 * @param options Command line options.
 */
const runSingleTask = async (
    task: (options: CommanderOptions) => Promise<void>,
    options: CommanderOptions,
) => {
    console.log(`Running task: ${task.name}...`);
    console.time(`Time for task ${task.name}`);
    await task(options);
    console.timeEnd(`Time for task ${task.name}`);
};

/**
 * Runs multiple tasks in parallel with options, and logs the time taken.
 *
 * @param tasks Tasks to run in parallel.
 * @param options Command line options.
 */
const runTasksInParallel = async (
    tasks: ((options: CommanderOptions) => Promise<void>)[],
    options: CommanderOptions,
) => {
    console.log(`Running ${tasks.length} tasks in parallel: ${tasks.map((t) => t.name).join(', ')}...`);
    console.time('Parallel tasks completed');
    await Promise.all(tasks.map((task) => task(options)));
    console.timeEnd('Parallel tasks completed');
};

/**
 * Runs the main build plan with parallel execution where possible.
 *
 * Build strategy:
 * 1. Run copyExternals first (required before any builds)
 * 2. Run all MV2 browser builds in parallel (Chrome, Firefox, Edge, Opera)
 * 3. Run Chrome MV3 build (separate due to different config)
 * 4. Run buildInfo last
 *
 * @param options Command line options.
 */
const mainBuild = async (options: CommanderOptions) => {
    const startTime = Date.now();

    // Step 1: Copy externals (must run first)
    await runSingleTask(copyExternals, options);

    // Step 2: Prepare Firefox Standalone update.json (needed before its build)
    await buildUpdateJson();

    // Step 3: Run all browser builds in parallel
    // MV2 builds: Chrome, Firefox AMO, Firefox Standalone, Edge, Opera
    // MV3 builds: Chrome MV3
    const mv2Builds = [
        bundleChrome,
        bundleFirefoxAmo,
        bundleFirefoxStandaloneOnly,
        bundleEdge,
        bundleOpera,
    ];

    const mv3Builds = [
        bundleChromeMv3,
    ];

    // For dev builds, run all builds in parallel for maximum speed
    // For beta/release, we could be more conservative if needed
    if (BUILD_ENV === BuildTargetEnv.Dev) {
        // Run all builds in parallel
        await runTasksInParallel([...mv2Builds, ...mv3Builds], options);
    } else {
        // For beta/release, run MV2 and MV3 separately to reduce memory pressure
        await runTasksInParallel(mv2Builds, options);
        await runTasksInParallel(mv3Builds, options);
    }

    // Step 4: Build info
    await runSingleTask(buildInfo, options);

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n✨ Total build time: ${totalTime}s`);
};

/**
 * Firefox Standalone build without the update.json step (for parallel execution).
 */
const bundleFirefoxStandaloneOnly = (options: CommanderOptions) => {
    const rspackConfig = getRspackConfig(Browser.FirefoxStandalone, getBuildOptions(options));
    return bundleRunner(rspackConfig, options);
};

const main = async (options: CommanderOptions) => {
    try {
        await mainBuild(options);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

const chrome = async (options: CommanderOptions) => {
    try {
        await runSingleTask(bundleChrome, options);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

/**
 * Runs CRX build of Chrome MV2 for mobile testing
 * should be run separately since it takes too much time
 * so it is better to run as a separate (parallel) job in test specs.
 */
const chromeCrx = async (options: CommanderOptions) => {
    try {
        // crx build depends on chrome build so it should be done first
        await runSingleTask(bundleChrome, options);
        await bundleChromeCrx();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

const chromeMv3 = async (options: CommanderOptions) => {
    try {
        await runSingleTask(bundleChromeMv3, options);
        if (!options.watch) {
            await buildInfo();
        }
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

const edge = async (options: CommanderOptions) => {
    try {
        await runSingleTask(bundleEdge, options);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

const opera = async (options: CommanderOptions) => {
    try {
        await runSingleTask(bundleOpera, options);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

const firefoxAmo = async (options: CommanderOptions) => {
    try {
        await runSingleTask(bundleFirefoxAmo, options);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

const firefoxStandalone = async (options: CommanderOptions) => {
    try {
        await runSingleTask(copyExternals, options);
        await buildUpdateJson();
        await runSingleTask(bundleFirefoxStandaloneOnly, options);
        await runSingleTask(buildInfo, options);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

program
    .option('--watch', 'Builds in watch mode', false)
    .option(
        '--no-cache',
        'Builds without cache. Is useful when watch mode rebuild on the changes from the linked dependencies',
        true,
    )
    .option('--zip', 'Create zip archives after build');

program
    .command(Browser.Chrome)
    .description('Builds extension for chrome browser')
    .action(() => {
        chrome(program.opts());
    });

program
    .command(Browser.ChromeCrx)
    .description('Builds CRX build of Chrome MV2 for mobile testing')
    .action(() => {
        chromeCrx(program.opts());
    });

program
    .command(Browser.ChromeMv3)
    .description('Builds extension for chrome-mv3 browser')
    .action(() => {
        chromeMv3(program.opts());
    });

program
    .command(Browser.Edge)
    .description('Builds extension for edge browser')
    .action(() => {
        edge(program.opts());
    });

program
    .command(Browser.Opera)
    .description('Builds extension for opera browser')
    .action(() => {
        opera(program.opts());
    });

program
    .command(Browser.FirefoxAmo)
    .description('Builds extension for firefox browser')
    .action(() => {
        firefoxAmo(program.opts());
    });

program
    .command(Browser.FirefoxStandalone)
    .description('Builds signed extension for firefox browser')
    .action(() => {
        firefoxStandalone(program.opts());
    });

program
    .description('By default builds for all platforms')
    .action(() => {
        main(program.opts());
    });

program.parse(process.argv);
