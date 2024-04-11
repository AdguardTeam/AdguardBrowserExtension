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
import { debounce } from 'lodash-es';

import {
    ConfigurationMV2,
    MESSAGE_HANDLER_NAME,
    createTsWebExtension,
} from '@adguard/tswebextension';

import { logger, LogLevel } from '../common/logger';
import { WEB_ACCESSIBLE_RESOURCES_OUTPUT } from '../../../constants';

import { listeners } from './notifier';
import { FiltersStorage } from './storages';
import {
    FiltersApi,
    AllowlistApi,
    UserRulesApi,
    SettingsApi,
    DocumentBlockApi,
    network,
} from './api';

export type { Message as EngineMessage } from '@adguard/tswebextension';

// Variable passed from webpack that will be primitive at runtime.
declare const IS_FIREFOX_AMO: boolean;

/**
 * Engine is a wrapper around the tswebextension to provide a better public
 * interface with some internal business logic: updates rules counters,
 * checks for some specific browsers actions.
 */
export class Engine {
    static readonly api = createTsWebExtension(WEB_ACCESSIBLE_RESOURCES_OUTPUT);

    private static readonly UPDATE_TIMEOUT_MS = 1000;

    static readonly messageHandlerName = MESSAGE_HANDLER_NAME;

    static debounceUpdate = debounce(() => {
        Engine.update();
    }, Engine.UPDATE_TIMEOUT_MS);

    static handleMessage = Engine.api.getMessageHandler();

    /**
     * Starts the tswebextension and updates the counter of active rules.
     */
    static async start(): Promise<void> {
        /**
         * By the rules of Firefox AMO we cannot use remote scripts (and our JS rules can be counted as such).
         * Because of that we use the following approach (that was accepted by AMO reviewers):
         *
         * 1. We pre-build JS rules from AdGuard filters into the JSON file.
         * 2. At runtime we check every JS rule if it's included into JSON.
         *  If it is included we allow this rule to work since it's pre-built. Other rules are discarded.
         * 3. We also allow "User rules" to work since those rules are added manually by the user.
         *  This way filters maintainers can test new rules before including them in the filters.
         */
        if (IS_FIREFOX_AMO) {
            const localScriptRules = await network.getLocalScriptRules();

            Engine.api.setLocalScriptRules(localScriptRules);
        }

        const configuration = await Engine.getConfiguration();

        logger.info('Start tswebextension...');
        await Engine.api.start(configuration);

        const rulesCount = Engine.api.getRulesCount();
        logger.info(`tswebextension is started. Rules count: ${rulesCount}`);
        // TODO: remove after frontend refactoring
        listeners.notifyListeners(listeners.RequestFilterUpdated);
    }

    /**
     * Updates tswebextension configuration and after that updates the counter
     * of active rules.
     */
    static async update(): Promise<void> {
        const configuration = await Engine.getConfiguration();

        logger.info('Update tswebextension configuration...');
        await Engine.api.configure(configuration);

        const rulesCount = Engine.api.getRulesCount();
        logger.info(`tswebextension configuration is updated. Rules count: ${rulesCount}`);
        // TODO: remove after frontend refactoring
        listeners.notifyListeners(listeners.RequestFilterUpdated);
    }

    /**
     * Creates tswebextension configuration based on current app state.
     */
    private static async getConfiguration(): Promise<ConfigurationMV2> {
        const enabledFilters = FiltersApi.getEnabledFilters();

        const filters: ConfigurationMV2['filters'] = [];

        const tasks = enabledFilters.map(async (filterId) => {
            const rules = await FiltersStorage.get(filterId);

            const trusted = FiltersApi.isFilterTrusted(filterId);

            const rulesTexts = rules.join('\n');

            filters.push({
                filterId,
                content: rulesTexts,
                trusted,
            });
        });

        await Promise.all(tasks);

        const settings = SettingsApi.getTsWebExtConfiguration();

        let allowlist: string[] = [];

        if (AllowlistApi.isEnabled()) {
            if (settings.allowlistInverted) {
                allowlist = AllowlistApi.getInvertedAllowlistDomains();
            } else {
                allowlist = AllowlistApi.getAllowlistDomains();
            }
        }

        let userrules: string[] = [];

        if (UserRulesApi.isEnabled()) {
            userrules = await UserRulesApi.getUserRules();

            // Remove empty strings.
            userrules = userrules.filter(rule => !!rule);

            // Remove duplicates.
            userrules = Array.from(new Set(userrules));

            // Convert user rules.
            userrules = UserRulesApi.convertRules(userrules);
        }

        const trustedDomains = await DocumentBlockApi.getTrustedDomains();

        return {
            verbose: false,
            logLevel: LogLevel.Info,
            filters,
            userrules,
            allowlist,
            settings,
            trustedDomains,
        };
    }
}
