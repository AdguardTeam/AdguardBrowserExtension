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
    type Configuration,
    TsWebExtension,
    type MessageHandler,
    type Message as EngineMessage,
    type ConfigurationResult,
} from '@adguard/tswebextension/mv3';

import { logger } from '../../common/logger';
import { WEB_ACCESSIBLE_RESOURCES_OUTPUT_REDIRECTS } from '../../../../constants';
import { notifier } from '../notifier';
import {
    FiltersApi,
    AllowlistApi,
    UserRulesApi,
    SettingsApi,
    toasts,
    filteringLogApi,
    iconsApi,
    DocumentBlockApi,
    CustomFilterApi,
} from '../api';
import { RulesLimitsService, rulesLimitsService } from '../services/rules-limits/rules-limits-service-mv3';
import { UserRulesService } from '../services/userrules';
import { emptyPreprocessedFilterList, NotifierType } from '../../common/constants';
import { SettingOption } from '../schema/settings/enum';
import { localScriptRules } from '../../../filters/chromium-mv3/local_script_rules';
import { FiltersStorage } from '../storages/filters';
import { CommonFilterUtils } from '../../common/common-filter-utils';
import { isUserScriptsApiSupported } from '../../common/user-scripts-api';

import { type TsWebExtensionEngine } from './interface';

export { type EngineMessage };

/**
 * Engine is a wrapper around the tswebextension to provide a better public
 * interface with some internal business logic: updates rules counters,
 * checks for some specific browsers actions.
 */
export class Engine implements TsWebExtensionEngine {
    readonly api: TsWebExtension;

    readonly handleMessage: MessageHandler;

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
         * By the rules of Chrome Web Store, we cannot use remotely hosted scripts,
         * which is why we prebuild them.
         *
         * If userScripts API is available, we don't need to set local script rules,
         * because we will use browser API to inject them.
         *
         * This is STEP 2: Local script and scriptlet rules are passed to the engine.
         *
         * The whole process is explained below.
         *
         * To fully comply with Chrome Web Store policies regarding remote code execution,
         * we implement a strict security-focused approach for Scriptlet and JavaScript rules execution.
         *
         * 1. Default - regular users that did not grant User scripts API permission explicitly:
         *    - We collect and pre-build script rules from the filters and statically bundle
         *      them into the extension - STEP 1. See 'updateLocalResourcesForChromiumMv3' in our build tools.
         *      IMPORTANT: all scripts and their arguments are local and bundled within the extension.
         *    - These pre-verified local scripts are passed to the engine - STEP 2.
         *    - At runtime before the execution, we check if each script rule is included
         *      in our local scripts list (STEP 3).
         *    - Only pre-verified local scripts are executed via chrome.scripting API (STEP 4.1 and 4.2).
         *      All other scripts are discarded.
         *    - Custom filters are NOT allowed for regular users to prevent any possibility
         *      of remote code execution, regardless of rule interpretation.
         *
         * 2. For advanced users that explicitly granted User scripts API permission -
         *    via enabling the Developer mode or Allow user scripts in the extension details:
         *    - Custom filters are allowed and may contain Scriptlet and JS rules
         *      that can be executed using the browser's built-in userScripts API (STEP 4.3),
         *      which provides a secure sandbox.
         *    - This execution bypasses the local script verification process but remains
         *      isolated and secure through Chrome's native sandboxing.
         *    - This mode requires explicit user activation and is intended for advanced users only.
         *
         * IMPORTANT:
         * Custom filters are ONLY supported when User scripts API permission is explicitly enabled.
         * This strict policy prevents Chrome Web Store rejection due to potential remote script execution.
         * When custom filters are allowed, they may contain:
         * 1. Network rules – converted to DNR rules and applied via dynamic rules.
         * 2. Cosmetic rules – interpreted directly in the extension code.
         * 3. Scriptlet and JS rules – executed via the browser's userScripts API (userScripts.execute)
         *    with Chrome's native sandboxing providing security isolation.
         *
         * For regular users without User scripts API permission (default case):
         * - Only pre-bundled filters with statically verified scripts are supported.
         * - Downloading custom filters or any rules from remote sources is blocked entirely
         *   to ensure compliance with the store policies.
         *
         * This implementation ensures perfect compliance with Chrome Web Store policies
         * by preventing any possibility of remote code execution for regular users.
         *
         * It is possible to follow all places using this logic by searching JS_RULES_EXECUTION.
         */
        if (!isUserScriptsApiSupported()) {
            TsWebExtension.setLocalScriptRules(localScriptRules);
        }

        const configuration = await Engine.getConfiguration();

        logger.info('[ext.Engine.start]: Start tswebextension...');
        const result = await this.api.start(configuration);

        rulesLimitsService.updateConfigurationResult(result, configuration.settings.filteringEnabled);
        UserRulesService.checkUserRulesRegexpErrors(result);

        await Engine.checkAppliedStealthSettings(configuration.settings, result.stealthResult);

        const rulesCount = this.api.getRulesCount();
        logger.info(`[ext.Engine.start]: tswebextension is started. Rules count: ${rulesCount}`);
        // TODO: remove after frontend refactoring
        notifier.notifyListeners(NotifierType.RequestFilterUpdated);

        await RulesLimitsService.checkFiltersLimitsChange(this.update.bind(this));

        if (await RulesLimitsService.areFilterLimitsExceeded()) {
            toasts.showRuleLimitsAlert();
        }
        /**
         * Updates extension icon state after engine initialization in Manifest V3.
         *
         * Context:
         * 1. This is called at the end of Engine.start() after all filters are initialized
         * 2. In MV3, extension icon needs immediate update after engine start to prevent
         *    incorrect 'warning' icon state.
         *
         * Warning icon behavior:
         * - Without this update, warning icon persists until next UiApi.update() call
         *   (which happens on tab change or window focus)
         * - Warning icon may be valid during initialization when:
         *   - Base filter (ID: 2) is enabled in manifest
         *   - Default filters (IDs: 2, 10) are pending enablement.
         */
        iconsApi.update();
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

        logger.info('[ext.Engine.update]: Update tswebextension configuration...');
        if (skipLimitsCheck) {
            logger.info('[ext.Engine.update]: With skip limits check.');
        }
        const result = await this.api.configure(configuration);

        rulesLimitsService.updateConfigurationResult(result, configuration.settings.filteringEnabled);
        UserRulesService.checkUserRulesRegexpErrors(result);

        await Engine.checkAppliedStealthSettings(configuration.settings, result.stealthResult);

        const rulesCount = this.api.getRulesCount();
        logger.info(`[ext.Engine.update]: tswebextension configuration is updated. Rules count: ${rulesCount}`);
        // TODO: remove after frontend refactoring
        notifier.notifyListeners(NotifierType.RequestFilterUpdated);

        if (!skipLimitsCheck) {
            await RulesLimitsService.checkFiltersLimitsChange(this.update.bind(this));

            // show the alert only if limits checking is not skipped and limits are exceeded
            if (await RulesLimitsService.areFilterLimitsExceeded()) {
                toasts.showRuleLimitsAlert();
            }
        }
        // Updates extension icon state to reflect current filtering status.
        iconsApi.update();
        filteringLogApi.onEngineUpdated(configuration.settings.allowlistInverted);
    }

    /**
     * Creates tswebextension configuration based on current app state.
     *
     * @returns The {@link Configuration} for tswebextension.
     */
    private static async getConfiguration(): Promise<Configuration> {
        const staticFiltersIds = FiltersApi.getEnabledFilters()
            .filter((filterId) => CommonFilterUtils.isCommonFilter(filterId));

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

        const quickFixesRules: Configuration['quickFixesRules'] = {
            ...emptyPreprocessedFilterList,
            /**
             * Quick fixes are always trusted because it is the one of
             * AdGuard's filter.
             */
            trusted: true,
        };

        // TODO: revert if Quick Fixes filter is back
        // if (QuickFixesRulesApi.isEnabled()) {
        //     Object.assign(quickFixesRules, await QuickFixesRulesApi.getQuickFixesRules());
        // }

        let customFilters: Configuration['customFilters'] = [];

        /**
         * Custom filters are NOT allowed for users by default. To have them enabled,
         * user must explicitly grant User scripts API permission.
         *
         * To fully comply with Chrome Web Store policies regarding remote code execution,
         * we implement a strict security-focused approach for JavaScript rule execution.
         *
         * 1. Default - regular users that did not grant User scripts API permission explicitly:
         *    - We collect and pre-build script rules from the filters and statically bundle
         *      them into the extension - STEP 1. See 'updateLocalResourcesForChromiumMv3' in our build tools.
         *      IMPORTANT: all scripts and their arguments are local and bundled within the extension.
         *    - These pre-verified local scripts are passed to the engine - STEP 2.
         *    - At runtime before the execution, we check if each script rule is included
         *      in our local scripts list (STEP 3).
         *    - Only pre-verified local scripts are executed via chrome.scripting API (STEP 4.1 and 4.2).
         *      All other scripts are discarded.
         *    - Custom filters are NOT allowed for regular users to prevent any possibility
         *      of remote code execution, regardless of rule interpretation.
         *
         * 2. For advanced users that explicitly granted User scripts API permission -
         *    via enabling the Developer mode or Allow user scripts in the extension details:
         *    - Custom filters are allowed and may contain Scriptlet and JS rules
         *      that can be executed using the browser's built-in userScripts API (STEP 4.3),
         *      which provides a secure sandbox.
         *    - This execution bypasses the local script verification process but remains
         *      isolated and secure through Chrome's native sandboxing.
         *    - This mode requires explicit user activation and is intended for advanced users only.
         *
         * IMPORTANT:
         * Custom filters are ONLY supported when User scripts API permission is explicitly enabled.
         * This strict policy prevents Chrome Web Store rejection due to potential remote script execution.
         * When custom filters are allowed, they may contain:
         * 1. Network rules – converted to DNR rules and applied via dynamic rules.
         * 2. Cosmetic rules – interpreted directly in the extension code.
         * 3. Scriptlet and JS rules – executed via the browser's userScripts API (userScripts.execute)
         *    with Chrome's native sandboxing providing security isolation.
         *
         * For regular users without User scripts API permission (default case):
         * - Only pre-bundled filters with statically verified scripts are supported.
         * - Downloading custom filters or any rules from remote sources is blocked entirely
         *   to ensure compliance with the store policies.
         *
         * This implementation ensures perfect compliance with Chrome Web Store policies
         * by preventing any possibility of remote code execution for regular users.
         *
         * It is possible to follow all places using this logic by searching JS_RULES_EXECUTION.
         */
        if (isUserScriptsApiSupported()) {
            const customFiltersWithMetadata = FiltersApi.getEnabledFiltersWithMetadata()
                .filter((f) => CustomFilterApi.isCustomFilterMetadata(f));

            customFilters = await Promise.all(customFiltersWithMetadata.map(async ({ filterId, trusted }) => {
                const preprocessedFilterList = await FiltersStorage.get(filterId);

                return {
                    filterId,
                    trusted,
                    ...(preprocessedFilterList || emptyPreprocessedFilterList),
                };
            }));
        }

        const trustedDomains = await DocumentBlockApi.getTrustedDomains();

        return {
            declarativeLogEnabled: filteringLogApi.isOpen(),
            customFilters,
            quickFixesRules,
            verbose: !!(IS_RELEASE || IS_BETA) || logger.isVerbose(),
            logLevel: logger.currentLevel,
            staticFiltersIds,
            userrules,
            allowlist,
            settings,
            filtersPath: 'filters/',
            ruleSetsPath: 'filters/declarative',
            trustedDomains,
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

    /**
     * Checks if the applied stealth settings are different from the current stealth settings.
     * If the setting was not applied, we need to revert it back for the user
     * in the UI and in the storage for configuration persistence.
     *
     * @param currentSettings Current settings in the storage and UI.
     * @param appliedStealthSettings Applied stealth settings from last update of the engine.
     *
     * @returns Promise that resolves when the check is done.
     */
    private static checkAppliedStealthSettings = async (
        currentSettings: Configuration['settings'],
        appliedStealthSettings: ConfigurationResult['stealthResult'],
    ): Promise<void> => {
        if (!appliedStealthSettings || !currentSettings.stealthModeEnabled) {
            return;
        }

        const { stealth } = currentSettings;

        if (stealth.hideReferrer !== appliedStealthSettings.hideReferrer) {
            await SettingsApi.setSetting(SettingOption.HideReferrer, appliedStealthSettings.hideReferrer);
        }
        if (stealth.blockWebRTC !== appliedStealthSettings.blockWebRTC) {
            await SettingsApi.setSetting(SettingOption.BlockWebRTC, appliedStealthSettings.blockWebRTC);
        }
        if (stealth.blockChromeClientData !== appliedStealthSettings.blockChromeClientData) {
            await SettingsApi.setSetting(SettingOption.RemoveXClientData, appliedStealthSettings.blockChromeClientData);
        }
        if (stealth.sendDoNotTrack !== appliedStealthSettings.sendDoNotTrack) {
            await SettingsApi.setSetting(SettingOption.SendDoNotTrack, appliedStealthSettings.sendDoNotTrack);
        }
        if (stealth.hideSearchQueries !== appliedStealthSettings.hideSearchQueries) {
            await SettingsApi.setSetting(SettingOption.HideSearchQueries, appliedStealthSettings.hideSearchQueries);
        }
    };
}
