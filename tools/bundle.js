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
import { BROWSERS, ENVS } from './constants';
import { getWebpackConfig } from './bundle/webpack-config';
import { crx } from './bundle/crx';
import { xpi } from './bundle/xpi';
import { buildInfo } from './bundle/build-info';

const bundleChrome = (watch) => {
    const webpackConfig = getWebpackConfig(BROWSERS.CHROME, watch);
    return bundleRunner(webpackConfig, watch);
};

const bundleFirefoxAmo = (watch) => {
    const webpackConfig = getWebpackConfig(BROWSERS.FIREFOX_AMO, watch);
    return bundleRunner(webpackConfig, watch);
};

const bundleFirefoxStandalone = () => {
    const webpackConfig = getWebpackConfig(BROWSERS.FIREFOX_STANDALONE);
    return bundleRunner(webpackConfig);
};

const bundleEdge = () => {
    const webpackConfig = getWebpackConfig(BROWSERS.EDGE);
    return bundleRunner(webpackConfig);
};

const bundleOpera = () => {
    const webpackConfig = getWebpackConfig(BROWSERS.OPERA);
    return bundleRunner(webpackConfig);
};

const bundleChromeCrx = async () => {
    await crx(BROWSERS.CHROME);
};

const bundleFirefoxXpi = async () => {
    await xpi(BROWSERS.FIREFOX_STANDALONE);
};

const devPlan = [
    copyExternals,
    bundleChrome,
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
    bundleFirefoxStandalone,
    bundleFirefoxXpi,
    bundleEdge,
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

const runBuild = async (tasks) => {
    for (const task of tasks) {
        await task();
    }
};

const mainBuild = async () => {
    switch (process.env.BUILD_ENV) {
        case ENVS.DEV: {
            await runBuild(devPlan);
            break;
        }
        case ENVS.BETA: {
            await runBuild(betaPlan);
            break;
        }
        case ENVS.RELEASE: {
            await runBuild(releasePlan);
            break;
        }
        default:
            throw new Error('Provide BUILD_ENV to choose correct build plan');
    }
};

const main = async () => {
    try {
        await mainBuild();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

const chrome = async (watch) => {
    try {
        await bundleChrome(watch);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

const firefox = async (watch) => {
    try {
        await bundleFirefoxAmo(watch);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

program
    .option('--watch', 'Builds in watch mode', false);

program
    .command('chrome')
    .description('Builds extension for chrome browser')
    .action(() => {
        chrome(program.watch);
    });

program
    .command('firefox')
    .description('Builds extension for firefox browser')
    .action(() => {
        firefox(program.watch);
    });

program
    .description('By default builds for all platforms')
    .action(main);

program.parse(process.argv);
