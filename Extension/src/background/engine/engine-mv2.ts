/**
 * Copyright (c) 2015-2025 Adguard Software Ltd.
 *
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

// Because this file is already MV2 replacement module, we can import directly
// from basic MV2 tswebextension without using aliases.
import {
    type ConfigurationMV2,
    MESSAGE_HANDLER_NAME,
    createTsWebExtension,
    type Message as EngineMessage,
    FilterList,
} from '@adguard/tswebextension';

import { logger } from '../../common/logger';
import { WEB_ACCESSIBLE_RESOURCES_OUTPUT } from '../../../../constants';
import { notifier } from '../notifier';
import { FiltersStorage } from '../storages';
import {
    FiltersApi,
    AllowlistApi,
    UserRulesApi,
    SettingsApi,
    DocumentBlockApi,
    network,
} from '../api';
import { NotifierType } from '../../common/constants';

import { type TsWebExtensionEngine } from './interface';

export { type EngineMessage };

/**
 * Engine is a wrapper around the tswebextension to provide a better public
 * interface with some internal business logic: updates rules counters,
 * checks for some specific browsers actions.
 */
export class Engine implements TsWebExtensionEngine {
    readonly api = createTsWebExtension(WEB_ACCESSIBLE_RESOURCES_OUTPUT);

    private static readonly UPDATE_TIMEOUT_MS = 1000;

    static readonly messageHandlerName = MESSAGE_HANDLER_NAME;

    debounceUpdate = debounce(this.update.bind(this), Engine.UPDATE_TIMEOUT_MS);

    handleMessage = this.api.getMessageHandler();

    /**
     * Starts the tswebextension and updates the counter of active rules.
     */
    async start(): Promise<void> {
        /**
         * By the rules of Firefox AMO, we cannot use remote scripts (and our JS rules can be counted as such).
         * Because of that, we use the following approach (that was accepted by AMO reviewers):
         *
         * 1. We pre-build JS rules from AdGuard filters into the JSON file.
         * 2. At runtime we check every JS rule if it is included into JSON.
         *    If it is included we allow this rule to work since it is pre-built. Other rules are discarded.
         * 3. We also allow "User rules" and "Custom filters" to work since those rules are added manually by the user.
         *    This way filters maintainers can test new rules before including them in the filters.
         */
        if (IS_FIREFOX_AMO) {
            const localScriptRules = await network.getLocalScriptRules();

            this.api.setLocalScriptRules(localScriptRules);
        }

        const configuration = await Engine.getConfiguration();

        logger.info('[ext.Engine.start]: Start tswebextension...');
        await this.api.start(configuration);

        const rulesCount = this.api.getRulesCount();
        logger.info(`[ext.Engine.start]: tswebextension is started. Rules count: ${rulesCount}`);
        // TODO: remove after frontend refactoring
        notifier.notifyListeners(NotifierType.RequestFilterUpdated);
    }

    /**
     * Updates tswebextension configuration and after that updates the counter
     * of active rules.
     */
    async update(): Promise<void> {
        const configuration = await Engine.getConfiguration();

        logger.info('[ext.Engine.update]: Update tswebextension configuration...');
        await this.api.configure(configuration);

        const rulesCount = this.api.getRulesCount();
        logger.info(`[ext.Engine.update]: tswebextension configuration is updated. Rules count: ${rulesCount}`);
        // TODO: remove after frontend refactoring
        notifier.notifyListeners(NotifierType.RequestFilterUpdated);
    }

    /**
     * Creates tswebextension configuration based on current app state.
     *
     * @returns Configuration for tswebextension.
     */
    private static async getConfiguration(): Promise<ConfigurationMV2> {
        const enabledFilters = FiltersApi.getEnabledFilters();

        const filters: ConfigurationMV2['filters'] = [];

        const tasks = enabledFilters.map(async (filterId) => {
            try {
                const filter = await FiltersStorage.get(filterId);

                if (!filter) {
                    logger.error(`[ext.Engine.getConfiguration]: Failed to get filter ${filterId}`);
                    return;
                }

                const trusted = FiltersApi.isFilterTrusted(filterId);

                filters.push({
                    filterId,
                    content: filter.getContent(),
                    conversionData: filter.getConversionData(),
                    trusted,
                });
            } catch (e) {
                logger.error(`[ext.Engine.getConfiguration]: Failed to get filter ${filterId}`, e);
            }
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

        const trustedDomains = await DocumentBlockApi.getTrustedDomains();

        let userrules: FilterList;

        if (UserRulesApi.isEnabled()) {
            userrules = await UserRulesApi.getUserRules();
        } else {
            userrules = FilterList.createEmpty();
        }

        const result: ConfigurationMV2 = {
            verbose: !!(IS_RELEASE || IS_BETA),
            logLevel: logger.currentLevel,
            filters,
            userrules: {
                content: userrules.getContent(),
                conversionData: userrules.getConversionData(),
            },
            allowlist,
            settings,
            trustedDomains,
        };

        return result;
    }

    /**
     * Sets the filtering state.
     *
     * @param isFilteringEnabled - The filtering state.
     */
    public async setFilteringState(isFilteringEnabled: boolean): Promise<void> {
        await this.api.setFilteringEnabled(isFilteringEnabled);
    }
}
