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
import { debounce } from 'lodash';
import {
    TsWebExtension,
    ConfigurationMV2,
    MESSAGE_HANDLER_NAME,
} from '@adguard/tswebextension';
import { Log } from '../common/log';
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
import { UserAgent } from '../common/user-agent';
import { WEB_ACCESSIBLE_RESOURCES_OUTPUT } from '../../../constants';

export type { Message as EngineMessage } from '@adguard/tswebextension';

export class Engine {
    static api = new TsWebExtension(WEB_ACCESSIBLE_RESOURCES_OUTPUT);

    static updateTimeoutMs = 1000;

    static messageHandlerName = MESSAGE_HANDLER_NAME;

    static debounceUpdate = debounce(() => {
        Engine.update();
    }, Engine.updateTimeoutMs);

    static handleMessage = Engine.api.getMessageHandler();

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
        if (UserAgent.isFirefox) {
            const localScriptRules = await network.getLocalScriptRules();

            Engine.api.setLocalScriptRules(localScriptRules);
        }

        const configuration = await Engine.getConfiguration();

        Log.info('Start tswebextension...');
        await Engine.api.start(configuration);

        const rulesCount = Engine.api.getRulesCount();
        Log.info(`tswebextension is started. Rules count: ${rulesCount}`);
        // TODO: remove after frontend refactoring
        listeners.notifyListeners(listeners.RequestFilterUpdated, {
            rulesCount,
        });
    }

    static async update(): Promise<void> {
        const configuration = await Engine.getConfiguration();

        Log.info('Update tswebextension configuration...');
        await Engine.api.configure(configuration);

        const rulesCount = Engine.api.getRulesCount();
        Log.info(`tswebextension configuration is updated. Rules count: ${rulesCount}`);
        // TODO: remove after frontend refactoring
        listeners.notifyListeners(listeners.RequestFilterUpdated, {
            rulesCount,
        });
    }

    /**
     * Creates tswebextension configuration based on current app state
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

            /**
             * remove empty strings
             */
            userrules = userrules.filter(rule => !!rule);

            /**
             * remove duplicates
             */
            userrules = Array.from(new Set(userrules));

            /**
             * Convert user rules
             */
            userrules = UserRulesApi.convertRules(userrules);
        }

        const trustedDomains = await DocumentBlockApi.getTrustedDomains();

        return {
            verbose: false,
            filters,
            userrules,
            allowlist,
            settings,
            trustedDomains,
        };
    }
}
