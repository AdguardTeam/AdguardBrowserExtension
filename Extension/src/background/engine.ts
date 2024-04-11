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
import { debounce, filter } from 'lodash-es';
import { Configuration, TsWebExtension } from '@adguard/tswebextension/mv3';
import type { MessagesHandlerMV3 } from '@adguard/tswebextension/dist/types/src/lib/mv3/background/messages-api';

// import { MESSAGE_HANDLER_NAME } from '@adguard/tswebextension';

import { Log, LogLevelString } from '../common/log';
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
    CustomFilterApi,
} from './api';

export type { CommonMessageType as EngineMessage } from '@adguard/tswebextension/mv3';

// Variable passed from webpack that will be primitive at runtime.
declare const IS_FIREFOX_AMO: boolean;

/**
 * Engine is a wrapper around the tswebextension to provide a better public
 * interface with some internal business logic: updates rules counters,
 * checks for some specific browsers actions.
 */
export class Engine {
    readonly api: TsWebExtension;

    readonly handleMessage: MessagesHandlerMV3;

    private static readonly UPDATE_TIMEOUT_MS = 1000;

    // FIXME: use MESSAGE_HANDLER_NAME
    static readonly messageHandlerName = 'tsWebExtension';

    /**
     *
     */
    constructor() {
        this.api = new TsWebExtension(`/${WEB_ACCESSIBLE_RESOURCES_OUTPUT}`);

        this.handleMessage = this.api.getMessageHandler();

        this.api.onAssistantCreateRule.subscribe(async (rule) => {
            // FIXME: Add new user rule
            // eslint-disable-next-line no-console
            console.log('onAssistantCreateRule', rule);
            // await userRules.addRule(rule);
            // await this.configure();

            // const updatedRules = await userRules.getRules();
            // // Notify UI about changes
            // notifier.notify(NOTIFIER_EVENTS.SET_RULES, { value: updatedRules });
        });
    }

    debounceUpdate = debounce(() => {
        this.update();
    }, Engine.UPDATE_TIMEOUT_MS);

    // static handleMessage = this.api?.getMessageHandler();

    /**
     * Starts the tswebextension and updates the counter of active rules.
     */
    async start(): Promise<void> {
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
        // if (IS_FIREFOX_AMO) {
        //     const localScriptRules = await network.getLocalScriptRules();

        // FIXME: Add this method
        //     this.api.setLocalScriptRules(localScriptRules);
        // }

        const configuration = await Engine.getConfiguration();

        Log.info('Start tswebextension...');
        await this.api.start(configuration);

        const rulesCount = this.api.getRulesCount();
        Log.info(`tswebextension is started. Rules count: ${rulesCount}`);
        // TODO: remove after frontend refactoring
        listeners.notifyListeners(listeners.RequestFilterUpdated);
    }

    /**
     * Updates tswebextension configuration and after that updates the counter
     * of active rules.
     */
    async update(): Promise<void> {
        const configuration = await Engine.getConfiguration();

        Log.info('Update tswebextension configuration...');
        await this.api.configure(configuration);

        const rulesCount = this.api.getRulesCount();
        Log.info(`tswebextension configuration is updated. Rules count: ${rulesCount}`);
        // TODO: remove after frontend refactoring
        listeners.notifyListeners(listeners.RequestFilterUpdated);
    }

    /**
     * Creates tswebextension configuration based on current app state.
     */
    private static async getConfiguration(): Promise<Configuration> {
        const staticFiltersIds = FiltersApi.getEnabledFilters()
            .filter((filterId) => !CustomFilterApi.isCustomFilter(filterId))
            .concat([14]);

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
            filteringLogEnabled: false,
            customFilters: [],
            verbose: false,
            logLevel: LogLevelString.Info,
            staticFiltersIds,
            userrules,
            allowlist,
            settings,
            trustedDomains,
            filtersPath: 'filters/',
            ruleSetsPath: 'filters/declarative',
        };
    }
}

export const engine = new Engine();
