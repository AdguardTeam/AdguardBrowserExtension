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

import { logger } from '../../common/logger';
import { WEB_ACCESSIBLE_RESOURCES_OUTPUT_REDIRECTS } from '../../../../constants';
import { listeners } from '../notifier';
import {
    FiltersApi,
    AllowlistApi,
    UserRulesApi,
    SettingsApi,
    CustomFilterApi,
    toasts,
    filteringLogApi,
    CommonFilterApi,
} from '../api';
import { RulesLimitsService, rulesLimitsService } from '../services/rules-limits/rules-limits-service-mv3';
import { FiltersStorage } from '../storages';
import { emptyPreprocessedFilterList } from '../../common/constants';
import { localScriptRules } from '../../../filters/chromium-mv3/local_script_rules';

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

        // Expose for integration tests.
        // eslint-disable-next-line no-restricted-globals
        Object.assign(self, {
            adguard: {
                // eslint-disable-next-line no-restricted-globals
                ...self.adguard,
                configure: this.api.configure.bind(this.api),
            },
        });
    }

    debounceUpdate = debounce(this.update.bind(this), Engine.UPDATE_TIMEOUT_MS);

    /**
     * Starts the tswebextension and updates the counter of active rules.
     *
     * TODO: Set local script rules for MV3 version if we decided
     * to use MV3 in Firefox.
     */
    async start(): Promise<void> {
        /**
         * By the rules of Chrome Web Store, we cannot use remote scripts (and our JS rules can be counted as such).
         *
         * It is possible to follow all places using this logic by searching JS_RULES_EXECUTION.
         *
         * This is STEP 2.1: Local script rules are passed to the engine.
         */
        TsWebExtension.setLocalScriptRules(localScriptRules);

        const configuration = await Engine.getConfiguration();

        logger.info('Start tswebextension...');
        const result = await this.api.start(configuration);
        rulesLimitsService.updateConfigurationResult(result, configuration.settings.filteringEnabled);

        const rulesCount = this.api.getRulesCount();
        logger.info(`tswebextension is started. Rules count: ${rulesCount}`);
        // TODO: remove after frontend refactoring
        listeners.notifyListeners(listeners.RequestFilterUpdated);

        await RulesLimitsService.checkFiltersLimitsChange(this.update.bind(this));

        if (await RulesLimitsService.areFilterLimitsExceeded()) {
            toasts.showRuleLimitsAlert();
        }

        filteringLogApi.onEngineUpdated(configuration.settings.allowlistInverted);
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
        rulesLimitsService.updateConfigurationResult(result, configuration.settings.filteringEnabled);

        const rulesCount = this.api.getRulesCount();
        logger.info(`tswebextension configuration is updated. Rules count: ${rulesCount}`);
        // TODO: remove after frontend refactoring
        listeners.notifyListeners(listeners.RequestFilterUpdated);

        if (!skipLimitsCheck) {
            await RulesLimitsService.checkFiltersLimitsChange(this.update.bind(this));

            // show the alert only if limits checking is not skipped and limits are exceeded
            if (await RulesLimitsService.areFilterLimitsExceeded()) {
                toasts.showRuleLimitsAlert();
            }
        }

        filteringLogApi.onEngineUpdated(configuration.settings.allowlistInverted);
    }

    /**
     * Creates tswebextension configuration based on current app state.
     *
     * @returns The {@link Configuration} for tswebextension.
     */
    private static async getConfiguration(): Promise<Configuration> {
        const staticFiltersIds = FiltersApi.getEnabledFilters()
            .filter((filterId) => CommonFilterApi.isCommonFilter(filterId));

        const settings = SettingsApi.getTsWebExtConfiguration(true);

        let allowlist: string[] = [];

        if (AllowlistApi.isEnabled()) {
            if (settings.allowlistInverted) {
                allowlist = AllowlistApi.getInvertedAllowlistDomains();
            } else {
                allowlist = AllowlistApi.getAllowlistDomains();
            }
        }

        const userrules: Configuration['userrules'] = {
            ...emptyPreprocessedFilterList,
            /**
             * User rules are always trusted.
             */
            trusted: true,
        };

        if (UserRulesApi.isEnabled()) {
            Object.assign(userrules, await UserRulesApi.getUserRules());
        }

        // Quick fixes filter was disabled in mv3 to comply with CWR policies.
        // TODO: remove code totally later, and for now we just set it to empty.
        const quickFixesRules: Configuration['quickFixesRules'] = {
            ...emptyPreprocessedFilterList,
            /**
             * Quick fixes are always trusted because it is the one of
             * AdGuard's filter.
             */
            trusted: true,
        };

        // Quick fixes filter was disabled in mv3 to comply with CWR policies.
        // TODO: remove code totally later.
        // if (QuickFixesRulesApi.isEnabled()) {
        //     Object.assign(quickFixesRules, await QuickFixesRulesApi.getQuickFixesRules());
        // }

        const customFiltersWithMetadata = FiltersApi.getEnabledFiltersWithMetadata()
            .filter((f) => CustomFilterApi.isCustomFilterMetadata(f));

        const customFilters = await Promise.all(customFiltersWithMetadata.map(async ({ filterId, trusted }) => {
            const preprocessedFilterList = await FiltersStorage.getAllFilterData(filterId);

            return {
                filterId,
                trusted,
                ...(preprocessedFilterList || emptyPreprocessedFilterList),
            };
        }));

        return {
            declarativeLogEnabled: filteringLogApi.isOpen(),
            customFilters,
            // Quick fixes filter was disabled in mv3 to comply with CWR policies.
            // TODO: remove code totally later.
            quickFixesRules,
            verbose: !!(IS_RELEASE || IS_BETA),
            logLevel: logger.currentLevel,
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
    public async setFilteringState(isFilteringEnabled: boolean): Promise<void> {
        // Configure tswebextension with the new settings without checking limits
        // if we paused filtering.
        const skipCheck = isFilteringEnabled === false;
        await this.update(skipCheck);
    }
}
