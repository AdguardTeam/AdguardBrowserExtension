/**
 * This file is part of Adguard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * Adguard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Adguard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Adguard Browser Extension.  If not, see <http://www.gnu.org/licenses/>.
 */

adguard.engine = (function (adguard) {
    let engine;

    const startEngine = async (lists) => {
        adguard.console.info('Starting url filter engine');

        const ruleStorage = new RuleStorage(lists);

        const config = {
            engine: 'extension',
            version: adguard.app && adguard.app.getVersion(),
            verbose: true,
        };

        engine = new Engine(ruleStorage, config, true);

        /*
         * UI thread becomes blocked on the options page while request filter is created
         * that't why we create filter rules using chunks of the specified length
         * Request filter creation is rather slow operation so we should
         * use setTimeout calls to give UI thread some time.
        */
        await engine.loadRulesAsync(1000);

        adguard.console.info('Starting url filter engine..ok');

        return engine;
    };

    /**
     * Gets matching result for request.
     *
     * @param requestUrl    Request URL
     * @param documentUrl   Document URL
     * @param requestType   Request content type (one of UrlFilterRule.contentTypes)
     * @returns matching result or null
     * @private
     */
    const createMatchingResult = (requestUrl, documentUrl, requestType) => {
        // eslint-disable-next-line max-len
        adguard.console.debug('Filtering http request for url: {0}, document: {1}, requestType: {2}', requestUrl, documentUrl, requestType);

        const request = new Request(
            requestUrl, documentUrl, adguard.RequestTypes.transformRequestType(requestType)
        );

        if (!engine) {
            adguard.console.warn('Filtering engine is not ready');
            return null;
        }

        const result = engine.matchRequest(request);
        adguard.console.debug(
            'Result {0} found for url: {1}, document: {2}, requestType: {3}',
            result.getBasicResult(),
            requestUrl,
            documentUrl,
            requestType
        );

        return result;
    };

    /**
     * Gets cosmetic result for the specified hostname and cosmetic options
     *
     * @param hostname
     * @param option
     * @returns cosmetic result
     */
    const getCosmeticResult = (hostname, option) => {
        if (!engine) {
            return new CosmeticResult();
        }

        return engine.getCosmeticResult(hostname, option);
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

        createMatchingResult,
        getCosmeticResult,
    };
})(adguard);
