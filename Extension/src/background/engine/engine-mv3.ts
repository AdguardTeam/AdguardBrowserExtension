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

// Because this file is already MV3 replacement module, we can import directly
// from mv3 tswebextension without using aliases.
import {
    MESSAGE_HANDLER_NAME,
    Configuration,
    TsWebExtension,
    type MessagesHandlerMV3,
} from '@adguard/tswebextension/mv3';

import { logger, LogLevel } from '../../common/logger';
import { WEB_ACCESSIBLE_RESOURCES_OUTPUT_REDIRECTS } from '../../../../constants';
import { listeners } from '../notifier';
import {
    FiltersApi,
    AllowlistApi,
    UserRulesApi,
    SettingsApi,
    CustomFilterApi,
    toasts,
    network,
} from '../api';
import { RulesLimitsService, rulesLimitsService } from '../services/rules-limits/rules-limits-service-mv3';
import { FiltersStorage } from '../storages';

import { TsWebExtensionEngine } from './interface';

// Because this file is already MV3 replacement module, we can import directly
// from mv3 tswebextension without using aliases.
export type { Message as EngineMessage } from '@adguard/tswebextension/mv3';

/**
 * Engine is a wrapper around the tswebextension to provide a better public
 * interface with some internal business logic: updates rules counters,
 * checks for some specific browsers actions.
 */
export class Engine implements TsWebExtensionEngine {
    readonly api: TsWebExtension;

    readonly handleMessage: MessagesHandlerMV3;

    private static readonly UPDATE_TIMEOUT_MS = 1000;

    static readonly messageHandlerName = MESSAGE_HANDLER_NAME;

    /**
     * Creates new Engine.
     */
    constructor() {
        this.api = new TsWebExtension(`/${WEB_ACCESSIBLE_RESOURCES_OUTPUT_REDIRECTS}`);

        this.handleMessage = this.api.getMessageHandler();
    }

    debounceUpdate = debounce(this.update.bind(this), Engine.UPDATE_TIMEOUT_MS);

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
        if (IS_FIREFOX_AMO) {
            const localScriptRules = await network.getLocalScriptRules();
            this.api.setLocalScriptRules(localScriptRules);
        }

        const configuration = await Engine.getConfiguration();

        logger.info('Start tswebextension...');
        const result = await this.api.start(configuration);
        rulesLimitsService.set(result);

        const rulesCount = this.api.getRulesCount();
        logger.info(`tswebextension is started. Rules count: ${rulesCount}`);
        // TODO: remove after frontend refactoring
        listeners.notifyListeners(listeners.RequestFilterUpdated);

        await RulesLimitsService.checkFiltersLimitsChange(this.update.bind(this));

        if (await RulesLimitsService.areFilterLimitsExceeded()) {
            toasts.showRuleLimitsAlert();
        }
    }

    /**
     * Updates tswebextension configuration and after that updates the counter
     * of active rules.
     *
     * @param skipLimitsCheck Skip limits check.
     */
    async update(skipLimitsCheck: boolean = false): Promise<void> {
        const configuration = await Engine.getConfiguration();

        logger.info('Update tswebextension configuration...');
        if (skipLimitsCheck) {
            logger.info('With skip limits check.');
        }
        const result = await this.api.configure(configuration);
        rulesLimitsService.set(result);

        const rulesCount = this.api.getRulesCount();
        logger.info(`tswebextension configuration is updated. Rules count: ${rulesCount}`);
        // TODO: remove after frontend refactoring
        listeners.notifyListeners(listeners.RequestFilterUpdated);

        if (!skipLimitsCheck) {
            await RulesLimitsService.checkFiltersLimitsChange(this.update.bind(this));
        }

        if (await RulesLimitsService.areFilterLimitsExceeded()) {
            toasts.showRuleLimitsAlert();
        }
    }

    /**
     * Creates tswebextension configuration based on current app state.
     */
    private static async getConfiguration(): Promise<Configuration> {
        const staticFiltersIds = FiltersApi.getEnabledFilters()
            .filter((filterId) => !CustomFilterApi.isCustomFilter(filterId));

        const settings = SettingsApi.getTsWebExtConfiguration(true);

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

        const customFiltersWithMetadata = FiltersApi.getEnabledFiltersWithMetadata()
            .filter((f) => CustomFilterApi.isCustomFilterMetadata(f));

        const customFilters = await Promise.all(customFiltersWithMetadata
            .map(async ({ filterId, trusted }) => {
                const filterLines = await FiltersStorage.get(filterId);
                return {
                    filterId,
                    content: filterLines.join('\n'),
                    trusted,
                };
            }));

        return {
            filteringLogEnabled: false,
            customFilters,
            verbose: false,
            logLevel: LogLevel.Info,
            staticFiltersIds,
            userrules,
            allowlist,
            settings,
            filtersPath: 'filters/',
            ruleSetsPath: 'filters/declarative',
        };
    }

    /**
     * Sets the filtering state.
     *
     * @param isFilteringEnabled - The filtering state.
     *
     * Note: we do not pass the parameter to engine because we suppose that
     * settings already changed and tswebextension will generate configuration
     * itself based on the current settings.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public async setFilteringState(isFilteringEnabled: boolean): Promise<void> {
        // Configure tswebextension with the new settings without checking limits
        // if we paused filtering.
        const skipCheck = isFilteringEnabled === false;
        await this.update(skipCheck);
    }
}