/**
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

/* eslint-disable no-console,no-restricted-syntax,no-await-in-loop */
import { program } from 'commander';

import { bundleRunner } from './bundle/bundle-runner';
import { copyExternals } from './bundle/copy-external';
import {
    Browser,
    BUILD_ENV,
    BuildTargetEnv,
} from './constants';
import { getWebpackConfig } from './bundle/webpack-config';
import { crx } from './bundle/crx';
import { buildInfo } from './bundle/build-info';
import { buildUpdateJson } from './bundle/firefox/updateJson';

const bundleChrome = (options) => {
    const webpackConfig = getWebpackConfig(Browser.Chrome, options.watch);
    return bundleRunner(webpackConfig, options);
};

const bundleChromeMv3 = (options) => {
    const webpackConfig = getWebpackConfig(Browser.ChromeMv3, options.watch);
    return bundleRunner(webpackConfig, options);
};

const bundleFirefoxAmo = (options) => {
    const webpackConfig = getWebpackConfig(Browser.FirefoxAmo, options.watch);
    return bundleRunner(webpackConfig, options);
};

const bundleFirefoxStandalone = async (options) => {
    const webpackConfig = getWebpackConfig(Browser.FirefoxStandalone, options.watch);
    await buildUpdateJson();
    return bundleRunner(webpackConfig, options);
};

const bundleEdge = (options) => {
    const webpackConfig = getWebpackConfig(Browser.Edge, options.watch);
    return bundleRunner(webpackConfig, options);
};

const bundleOpera = (options) => {
    const webpackConfig = getWebpackConfig(Browser.Opera, options.watch);
    return bundleRunner(webpackConfig, options);
};

const bundleChromeCrx = async () => {
    await crx(Browser.Chrome);
};

const devPlan = [
    copyExternals,
    bundleChrome,
    bundleChromeMv3,
    bundleFirefoxAmo,
    bundleFirefoxStandalone,
    bundleEdge,
    bundleOpera,
    buildInfo,
];

const betaPlan = [
    copyExternals,
    bundleChrome,
    bundleChromeCrx,
    bundleEdge,
    buildInfo,
];

const firefoxStandalonePlan = [
    copyExternals,
    bundleFirefoxStandalone,
    buildInfo,
];

const releasePlan = [
    copyExternals,
    bundleChrome,
    bundleFirefoxAmo,
    bundleEdge,
    bundleOpera,
    buildInfo,
];

const runBuild = async (tasks, options) => {
    for (const task of tasks) {
        await task(options);
    }
};

const mainBuild = async (options) => {
    switch (BUILD_ENV) {
        case BuildTargetEnv.Dev: {
            await runBuild(devPlan, options);
            break;
        }
        case BuildTargetEnv.Beta: {
            await runBuild(betaPlan, options);
            break;
        }
        case BuildTargetEnv.Release: {
            await runBuild(releasePlan, options);
            break;
        }
        default:
            throw new Error('Provide BUILD_ENV to choose correct build plan');
    }
};

const main = async (options) => {
    try {
        await mainBuild(options);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

const chrome = async (options) => {
    try {
        await bundleChrome(options);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

const chromeMv3 = async (options) => {
    try {
        await bundleChromeMv3(options);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

const edge = async (options) => {
    try {
        await bundleEdge(options);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

const opera = async (options) => {
    try {
        await bundleOpera(options);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

const firefox = async (options) => {
    try {
        await bundleFirefoxAmo(options);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

const firefoxStandalone = async (options) => {
    try {
        await runBuild(firefoxStandalonePlan, options);
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
        false,
    );

program
    .command('chrome')
    .description('Builds extension for chrome browser')
    .action(() => {
        chrome(program.opts());
    });

program
    .command('chrome-mv3')
    .description('Builds extension for chrome-mv3 browser')
    .action(() => {
        chromeMv3(program.opts());
    });

program
    .command('edge')
    .description('Builds extension for edge browser')
    .action(() => {
        edge(program.opts());
    });

program
    .command('opera')
    .description('Builds extension for opera browser')
    .action(() => {
        opera(program.opts());
    });

program
    .command('firefox')
    .description('Builds extension for firefox browser')
    .action(() => {
        firefox(program.opts());
    });

program
    .command('firefox-standalone')
    .description('Builds signed extension for firefox browser')
    .action(() => {
        firefoxStandalone();
    });

program
    .description('By default builds for all platforms')
    .action(() => {
        main(program.opts());
    });

program.parse(process.argv);
