/**
 * This file is part of Adguard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * Adguard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Adguard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Adguard Browser Extension. If not, see <http://www.gnu.org/licenses/>.
 */

import * as TSUrlFilter from '@adguard/tsurlfilter';
import { log } from '../../common/log';
import { backgroundPage } from '../extension-api/background-page';
import { RequestTypes } from '../utils/request-types';

/**
 * TSUrlFilter Engine wrapper
 */
export const engine = (function () {
    const ASYNC_LOAD_CHUNK_SIZE = 5000;

    let engine;

    const startEngine = async (lists) => {
        log.info('Starting url filter engine');

        const ruleStorage = new TSUrlFilter.RuleStorage(lists);

        const config = {
            engine: 'extension',
            version: backgroundPage.app && backgroundPage.app.getVersion(),
            verbose: true,
            compatibility: TSUrlFilter.CompatibilityTypes.extension,
        };

        TSUrlFilter.setConfiguration(config);

        engine = new TSUrlFilter.Engine(ruleStorage, true);

        /*
         * UI thread becomes blocked on the options page while request filter is created
         * that's why we create filter rules using chunks of the specified length
         * Request filter creation is rather slow operation so we should
         * use setTimeout calls to give UI thread some time.
        */
        await engine.loadRulesAsync(ASYNC_LOAD_CHUNK_SIZE);

        log.info('Starting url filter engine..ok');

        return engine;
    };

    /**
     * @typedef {object} MatchQuery - Request Match Query
     *
     * @property {string} requestUrl    Request URL
     * @property {string} frameUrl      Document URL
     * @property {any} requestType      Request content type (one of UrlFilterRule.contentTypes)
     * @property {any} frameRule        Frame rule
    */

    /**
     * Gets matching result for request.
     *
     * @param {MatchQuery} matchQuery - {@link MatchQuery}
     * @returns matching result or null
     */
    const matchRequest = (matchQuery) => {
        const {
            requestUrl,
            frameUrl,
            requestType,
        } = matchQuery;

        let { frameRule } = matchQuery;

        log.debug(
            'Filtering http request for url: {0}, document: {1}, requestType: {2}',
            requestUrl,
            frameUrl,
            requestType,
        );

        const request = new TSUrlFilter.Request(
            requestUrl,
            frameUrl,
            RequestTypes.transformRequestType(requestType),
        );

        if (!engine) {
            log.warn('Filtering engine is not ready');
            return null;
        }

        if (!frameRule) {
            frameRule = null;
        }

        const result = engine.matchRequest(request, frameRule);

        log.debug(
            'Result {0} found for url: {1}, document: {2}, requestType: {3}',
            result.getBasicResult(),
            requestUrl,
            frameUrl,
            requestType,
        );

        return result;
    };

    /**
     * Matches current frame url and returns document-level rule if found.
     *
     * @param frameUrl    Frame URL
     * @returns matching result or null
     */
    const matchFrame = (frameUrl) => {
        if (!engine) {
            log.warn('Filtering engine is not ready');
            return null;
        }

        return engine.matchFrame(frameUrl);
    };

    /**
     * Gets cosmetic result for the specified hostname and cosmetic options
     *
     * @param hostname
     * @param option
     * @returns CosmeticResult result
     */
    const getCosmeticResult = (hostname, option) => {
        if (!engine) {
            return new TSUrlFilter.CosmeticResult();
        }

        const request = new TSUrlFilter.Request(hostname, null, TSUrlFilter.RequestType.Document);
        return engine.getCosmeticResult(request, option);
    };

    /**
     * @return Engine rules count
     */
    const getRulesCount = () => {
        return engine ? engine.getRulesCount() : 0;
    };

    return {
        startEngine,
        getRulesCount,

        matchRequest,
        matchFrame,
        getCosmeticResult,
    };
})();
