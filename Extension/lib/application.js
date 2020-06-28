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

adguard.application = (function (adguard) {
    let engine;

    const createFilterLists = (rulesFilterMap) => {
        const lists = [];

        // eslint-disable-next-line guard-for-in,no-restricted-syntax
        for (let filterId in rulesFilterMap) {
            // To number
            filterId -= 0;

            const isTrustedFilter = adguard.subscriptions.isTrustedFilter(filterId);
            adguard.rulesStorage.read(filterId, (rulesText) => {
                if (rulesText) {
                    lists.push(new StringRuleList(filterId, rulesText, false, !isTrustedFilter));
                }
            });
        }

        return lists;
    };

    // TODO: Use filterids only
    const startEngine = (rulesFilterMap) => {
        console.log('Starting url filter engine');

        const lists = createFilterLists(rulesFilterMap);
        const ruleStorage = new RuleStorage(lists);

        const config = {
            engine: 'extension',
            version: adguard.app.getVersion(),
            verbose: true,
        };

        this.engine = new Engine(ruleStorage, config);
        // this.dnsEngine = new AGUrlFilter.DnsEngine(ruleStorage);
        // this.contentFiltering = new AGUrlFilter.ContentFiltering(this.filteringLog);
        // this.stealthService = new AGUrlFilter.StealthService(stealthConfig);
        // await this.redirectsService.init();

        console.log('Starting url filter engine..ok');
    };

    const getEngine = () => engine;

    return {
        startEngine,
        getEngine,
    };
})(adguard);
