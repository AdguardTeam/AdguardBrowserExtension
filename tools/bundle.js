/* eslint-disable no-console,no-restricted-syntax,no-await-in-loop */
import { program } from 'commander';

import { bundleRunner } from './bundle/bundle-runner';
import { copyExternals } from './bundle/copy-external';
import { BROWSERS, ENVS } from './constants';
import { webpackConfig } from './bundle/webpack-config';
import { crx } from './bundle/crx';
import { xpi } from './bundle/xpi';
import { buildInfo } from './bundle/build-info';

const bundleChrome = () => {
    const config = webpackConfig(BROWSERS.CHROME);
    return bundleRunner(config);
};

const bundleFirefoxAmo = () => {
    const config = webpackConfig(BROWSERS.FIREFOX_AMO);
    return bundleRunner(config);
};

const bundleFirefoxStandalone = () => {
    const config = webpackConfig(BROWSERS.FIREFOX_STANDALONE);
    return bundleRunner(config);
};

const bundleEdge = () => {
    const config = webpackConfig(BROWSERS.EDGE);
    return bundleRunner(config);
};

const bundleOpera = () => {
    const config = webpackConfig(BROWSERS.OPERA);
    return bundleRunner(config);
};

const bundleChromeCrx = async () => {
    await crx(BROWSERS.CHROME);
};

const bundleFirefoxXpi = async () => {
    await xpi(BROWSERS.FIREFOX_STANDALONE);
};

const bundleAdguardApi = async () => {
    const config = webpackConfig(BROWSERS.ADGUARD_API);
    return bundleRunner(config);
};

const devPlan = [
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

program
    .command('adguard-api')
    .description('Builds sample extension with adguard api')
    .action(adguardApi);

program
    .description('By default builds for all platforms')
    .action(main);

program.parse(process.argv);
