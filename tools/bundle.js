/* eslint-disable no-console,no-restricted-syntax,no-await-in-loop */
import { program } from 'commander';

import { bundleRunner } from './bundle/bundle-runner';
import { copyExternals } from './bundle/copy-external';
import { BROWSERS, ENVS } from './constants';
import { getWebpackConfig } from './bundle/webpack-config';
import { crx } from './bundle/crx';
import { xpi } from './bundle/xpi';
import { buildInfo } from './bundle/build-info';
import { genValidators } from './genValidators';

const bundleChrome = (watch) => {
    const webpackConfig = getWebpackConfig(BROWSERS.CHROME);
    return bundleRunner(webpackConfig, watch);
};

const bundleFirefoxAmo = (watch) => {
    const webpackConfig = getWebpackConfig(BROWSERS.FIREFOX_AMO);
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

const bundleAdguardApi = async () => {
    const webpackConfig = getWebpackConfig(BROWSERS.ADGUARD_API);
    return bundleRunner(webpackConfig);
};

const devPlan = [
    genValidators,
    copyExternals,
    bundleChrome,
    bundleFirefoxAmo,
    bundleFirefoxStandalone,
    bundleEdge,
    bundleOpera,
    bundleAdguardApi,
    buildInfo,
];

const betaPlan = [
    genValidators,
    copyExternals,
    bundleChrome,
    bundleChromeCrx,
    bundleFirefoxStandalone,
    bundleFirefoxXpi,
    bundleEdge,
    bundleAdguardApi,
    buildInfo,
];

const releasePlan = [
    genValidators,
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

const adguardApi = async () => {
    try {
        await bundleAdguardApi();
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
    .command('adguard-api')
    .description('Builds sample extension with adguard api')
    .action(adguardApi);

program
    .description('By default builds for all platforms')
    .action(main);

program.parse(process.argv);
