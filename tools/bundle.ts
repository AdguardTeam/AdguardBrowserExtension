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
import { getWebpackConfig } from './bundle/get-webpack-config';
import { crx } from './bundle/crx';
import { buildInfo } from './bundle/build-info';
import { buildUpdateJson } from './bundle/firefox/updateJson';

type CommanderOptions = {
    [key: string]: any;
};

const bundleChrome = (options: CommanderOptions) => {
    const webpackConfig = getWebpackConfig(Browser.Chrome, options.watch);
    return bundleRunner(webpackConfig, options);
};

const bundleChromeMv3 = (options: CommanderOptions) => {
    const webpackConfig = getWebpackConfig(Browser.ChromeMv3, options.watch);
    return bundleRunner(webpackConfig, options);
};

const bundleFirefoxAmo = (options: CommanderOptions) => {
    const webpackConfig = getWebpackConfig(Browser.FirefoxAmo, options.watch);
    return bundleRunner(webpackConfig, options);
};

const bundleFirefoxStandalone = async (options: CommanderOptions) => {
    const webpackConfig = getWebpackConfig(Browser.FirefoxStandalone, options.watch);
    await buildUpdateJson();
    return bundleRunner(webpackConfig, options);
};

const bundleEdge = (options: CommanderOptions) => {
    const webpackConfig = getWebpackConfig(Browser.Edge, options.watch);
    return bundleRunner(webpackConfig, options);
};

const bundleOpera = (options: CommanderOptions) => {
    const webpackConfig = getWebpackConfig(Browser.Opera, options.watch);
    return bundleRunner(webpackConfig, options);
};

const bundleChromeCrx = async () => {
    const key = 'Building CRX for Chrome';
    console.log(`${key}...`);
    console.time(key);
    await crx(Browser.Chrome);
    console.timeEnd(key);
};

const devPlanTasks = [
    copyExternals,
    bundleChrome,
    bundleChromeMv3,
    bundleFirefoxAmo,
    bundleFirefoxStandalone,
    bundleEdge,
    bundleOpera,
    buildInfo,
];

const betaPlanTasks = [
    copyExternals,
    bundleChrome,
    bundleChromeMv3,
    bundleFirefoxAmo,
    bundleFirefoxStandalone,
    bundleEdge,
    bundleOpera,
    buildInfo,
];

const firefoxStandalonePlanTasks = [
    copyExternals,
    bundleFirefoxStandalone,
    buildInfo,
];

const releasePlanTasks = [
    copyExternals,
    bundleChrome,
    bundleChromeMv3,
    bundleFirefoxAmo,
    bundleEdge,
    bundleOpera,
    buildInfo,
];

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
 * Runs a list of tasks.
 *
 * @param tasks List of tasks to run.
 * @param options Command line options.
 */
const runBuildPlanTasks = async (
    tasks: ((options: CommanderOptions) => Promise<void>)[],
    options: CommanderOptions,
) => {
    for (const task of tasks) {
        await runSingleTask(task, options);
    }
};

/**
 * Runs the main build plan.
 *
 * @param options Command line options.
 */
const mainBuild = async (options: CommanderOptions) => {
    switch (BUILD_ENV) {
        case BuildTargetEnv.Dev: {
            await runBuildPlanTasks(devPlanTasks, options);
            break;
        }
        case BuildTargetEnv.Beta: {
            await runBuildPlanTasks(betaPlanTasks, options);
            break;
        }
        case BuildTargetEnv.Release: {
            await runBuildPlanTasks(releasePlanTasks, options);
            break;
        }
        default:
            throw new Error('Provide BUILD_ENV to choose correct build plan');
    }
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
        await runBuildPlanTasks(firefoxStandalonePlanTasks, options);
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
    );

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
