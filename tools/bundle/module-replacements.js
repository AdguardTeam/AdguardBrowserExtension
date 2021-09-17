/* eslint-disable no-console */
import { NormalModuleReplacementPlugin } from 'webpack';
import { BROWSERS } from '../constants';

/**
 * Returns module replacement plugins
 * Yes, this way is looking ugly. If you know better way to build with different implementation
 * please feel free to fix
 * @param browserConfig
 */
export const getModuleReplacements = (browserConfig) => {
    const apiRegexp = /(\.\/.*)__ABSTRACT_API__(\.*)/;
    const browsersRegexp = /(\.\/.*)__ABSTRACT_BROWSERS__(\.*)/;

    const apiModuleReplacement = new NormalModuleReplacementPlugin(apiRegexp, (resource) => {
        const from = resource.request;
        if (browserConfig.browser === BROWSERS.ADGUARD_API) {
            resource.request = resource.request.replace(apiRegexp, '$1adguard-api$2');
        } else {
            resource.request = resource.request.replace(apiRegexp, '$1browsers$2');
        }
        const to = resource.request;
        console.info(`resource.request was replaced from: "${from}" to: "${to}"`);
    });

    const browserModuleReplacement = new NormalModuleReplacementPlugin(browsersRegexp, (resource) => {
        const from = resource.request;
        if (browserConfig.browser === BROWSERS.FIREFOX_STANDALONE
                || browserConfig.browser === BROWSERS.FIREFOX_AMO) {
            resource.request = resource.request.replace(browsersRegexp, '$1firefox$2');
        } else {
            resource.request = resource.request.replace(browsersRegexp, '$1chrome$2');
        }
        const to = resource.request;
        console.info(`resource.request was replaced from: "${from}" to: "${to}"`);
    });

    return [apiModuleReplacement, browserModuleReplacement];
};
