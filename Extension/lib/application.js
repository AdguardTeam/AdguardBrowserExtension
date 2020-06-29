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

    const startEngine = (lists) => {
        console.log('Starting url filter engine');

        const ruleStorage = new RuleStorage(lists);

        const config = {
            engine: 'extension',
            version: adguard.app && adguard.app.getVersion(),
            verbose: true,
        };

        engine = new Engine(ruleStorage, config);
        // this.dnsEngine = new AGUrlFilter.DnsEngine(ruleStorage);
        // this.contentFiltering = new AGUrlFilter.ContentFiltering(this.filteringLog);
        // this.stealthService = new AGUrlFilter.StealthService(stealthConfig);
        // await this.redirectsService.init();

        console.log('Starting url filter engine..ok');

        return engine;
    };

    const getEngine = () => engine;

    return {
        startEngine,
        getEngine,
    };
})(adguard);
