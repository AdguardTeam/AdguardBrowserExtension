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

import browser from 'webextension-polyfill';

import {
    TooManyRegexpRulesError,
    TooManyRulesError,
    RULE_SET_NAME_PREFIX,
    type LimitationError,
    type ConfigurationResult,
} from '@adguard/tswebextension/mv3';

import {
    type CanEnableStaticFilterMessageMv3,
    type CanEnableStaticGroupMessageMv3,
    MessageType,
} from '../../../common/messages';
import {
    Categories,
    CommonFilterApi,
    CustomFilterApi,
    type FilterMetadata,
    FiltersApi,
} from '../../api';
import { filterStateStorage, settingsStorage } from '../../storages';
import { rulesLimitsStorage } from '../../storages/rules-limits';
import { rulesLimitsStorageDataValidator } from '../../schema/rules-limits';
import { logger } from '../../../common/logger';
import { canEnableStaticFilterSchema, canEnableStaticGroupSchema } from '../../../common/messages/schema';
// Note: due to circular dependencies, import message-handler.ts after all
// other imports.
import { messageHandler } from '../../message-handler';
import { arraysAreEqual } from '../../utils/arrays-are-equal';
import { SettingOption } from '../../schema/settings/main';
import { AntiBannerFiltersId } from '../../../common/constants';

import type {
    StaticLimitsCheckResult,
    IRulesLimits,
    DynamicLimitsCheckResult,
    Mv3LimitsCheckResult,
} from './interface';

const {
    MAX_NUMBER_OF_DYNAMIC_AND_SESSION_RULES,
    MAX_NUMBER_OF_REGEX_RULES,
    MAX_NUMBER_OF_ENABLED_STATIC_RULESETS,
} = browser.declarativeNetRequest;

/**
 * RuleSetCounter interface.
 */
interface RuleSetCounter {
    filterId: number;
    rulesCount: number;
    regexpRulesCount: number;
}

/**
 * Map of ruleset counters.
 */
interface RuleSetCountersMap {
    [key: number]: RuleSetCounter;
}

/**
 * Service to work with configuration result.
 */
export class RulesLimitsService {
    configurationResult: ConfigurationResult | null = null;

    /**
     * Is filtering enabled or not. If disabled - service will turn off all
     * checks for limitations.
     */
    isFilteringEnabled: boolean = true;

    /**
     * Subscribes to messages from the options' page.
     */
    public async init(): Promise<void> {
        // Rules limits page overall status with all counters.
        messageHandler.addListener(MessageType.GetRulesLimitsCountersMv3, this.onGetRulesLimitsCounters.bind(this));

        // Static filters checks before enable them.
        messageHandler.addListener(MessageType.CanEnableStaticFilterMv3, this.canEnableStaticFilter.bind(this));
        messageHandler.addListener(MessageType.CanEnableStaticGroupMv3, this.canEnableStaticGroup.bind(this));

        // Checks for possible limits exceeding based on the current configuration result.
        messageHandler.addListener(MessageType.CurrentLimitsMv3, this.getRulesLimits.bind(this));

        // Drop warning.
        messageHandler.addListener(
            MessageType.ClearRulesLimitsWarningMv3,
            RulesLimitsService.cleanExpectedEnabledFilters,
        );

        // First read from storage and set data to cache.
        await RulesLimitsService.initStorage();
    }

    /**
     * Get the number of enabled static filters.
     *
     * @returns The number of enabled static filters.
     */
    private static getStaticEnabledFiltersCount(): number {
        return FiltersApi.getEnabledFiltersWithMetadata()
            .filter((f) => !CustomFilterApi.isCustomFilter(f.filterId)).length;
    }

    /**
     * Returns a map of ruleset counters.
     *
     * @param result Configuration result.
     * @returns A map of ruleset counters.
     */
    private static getRuleSetsCountersMap = (result: ConfigurationResult): RuleSetCountersMap => {
        const counters = result.staticFilters.reduce((acc: { [key: number]: RuleSetCounter }, ruleset) => {
            const filterId = Number(ruleset.getId().slice(RULE_SET_NAME_PREFIX.length));

            acc[filterId] = {
                filterId,
                rulesCount: ruleset.getRulesCount(),
                regexpRulesCount: ruleset.getRegexpRulesCount(),
            };

            return acc;
        }, {});

        // It is like "syntax sugar" for the quick fixes filter to emulate it
        // like an "empty" ruleset, because it looks like usual filter
        // in the UI, but it actually applied dynamically, so enabling it will
        // never change quota of the used static rules.
        counters[AntiBannerFiltersId.QuickFixesFilterId] = {
            filterId: AntiBannerFiltersId.QuickFixesFilterId,
            rulesCount: 0,
            regexpRulesCount: 0,
        };

        return counters;
    };

    /**
     * Returns an array of ruleset counters.
     *
     * @param filters List of filters with metadata.
     * @param ruleSetsCounters A map of ruleset counters.
     * @returns An array of ruleset counters by filters ids.
     */
    private static getRuleSetCounters(
        filters: FilterMetadata[],
        ruleSetsCounters: RuleSetCountersMap,
    ): RuleSetCounter[] {
        return filters
            .filter((f) => !CustomFilterApi.isCustomFilter(f.filterId))
            .map((filter) => ruleSetsCounters[filter.filterId])
            .filter((ruleSet): ruleSet is RuleSetCounter => ruleSet !== undefined);
    }

    /**
     * Gets the static ruleset counter by filter id.
     *
     * @param result Configuration result.
     * @param filterId Filter id.
     * @returns The static ruleset counter.
     * @throws Error if the ruleset counter is not found.
     */
    private static getStaticRuleSetCounter(result: ConfigurationResult, filterId: number): RuleSetCounter {
        const ruleSetsCounters = RulesLimitsService.getRuleSetsCountersMap(result);
        const ruleSetsCounter = ruleSetsCounters[filterId];
        if (!ruleSetsCounter) {
            throw new Error(`RuleSetCounter for filterId ${filterId} not found`);
        }
        return ruleSetsCounter;
    }

    /**
     * Get the number of static rules enabled.
     *
     * @param result Configuration result.
     * @param filters Filters with metadata.
     * @returns The number of static rules enabled.
     */
    private static getStaticRulesEnabledCount(result: ConfigurationResult, filters: FilterMetadata[]): number {
        const ruleSetsCounters = RulesLimitsService.getRuleSetsCountersMap(result);

        const ruleSets = RulesLimitsService.getRuleSetCounters(filters, ruleSetsCounters);

        return ruleSets.reduce((sum, ruleSet) => {
            return sum + ruleSet.rulesCount;
        }, 0);
    }

    /**
     * Calculates how many regexp rules are in the rulesets.
     *
     * @param result Configuration result.
     * @param filters Filters with metadata.
     * @returns Count of the regexp rules.
     */
    private static getStaticRulesRegexpsCount(result: ConfigurationResult, filters: FilterMetadata[]): number {
        const ruleSetsCounters = RulesLimitsService.getRuleSetsCountersMap(result);

        const ruleSets = RulesLimitsService.getRuleSetCounters(filters, ruleSetsCounters);

        return ruleSets.reduce((sum, ruleSet) => {
            return sum + ruleSet.regexpRulesCount;
        }, 0);
    }

    /**
     * Finds first found limitation error.
     *
     * @param result Configuration result.
     * @returns Limitation error.
     */
    private static getRegexpRulesLimitExceedErr = (result: ConfigurationResult): LimitationError | undefined => {
        return result.dynamicRules?.limitations
            .find((e) => e instanceof TooManyRegexpRulesError);
    };

    /**
     * Finds first too many rules error.
     *
     * @param result Configuration result.
     * @returns Too many rules error.
     */
    private static getRulesLimitExceedErr = (result: ConfigurationResult): LimitationError | undefined => {
        return result.dynamicRules?.limitations
            .find((e) => e instanceof TooManyRulesError);
    };

    /**
     * How many dynamic rules are enabled.
     *
     * @param result Configuration result.
     * @returns Count of enabled user rules.
     */
    private static getDynamicRulesEnabledCount(result: ConfigurationResult): number {
        const rulesLimitExceedErr = RulesLimitsService.getRulesLimitExceedErr(result);
        const declarativeRulesCount = result.dynamicRules?.ruleSet.getRulesCount() || 0;
        return rulesLimitExceedErr?.numberOfMaximumRules || declarativeRulesCount;
    }

    /**
     * How many dynamic rules are excluded and cannot be enabled.
     *
     * @param result Configuration result.
     * @returns Count of excluded rules.
     */
    private static getDynamicRulesExcludedCount(result: ConfigurationResult): number {
        const rulesLimitExceedErr = RulesLimitsService.getRulesLimitExceedErr(result);
        return rulesLimitExceedErr?.numberOfExcludedDeclarativeRules || 0;
    }

    /**
     * Returns number of maximum possible dynamic rules.
     *
     * @param result Configuration result.
     * @returns Count of rules.
     */
    private static getDynamicRulesMaximumCount(result: ConfigurationResult): number {
        const rulesLimitExceedErr = RulesLimitsService.getRulesLimitExceedErr(result);
        return rulesLimitExceedErr?.numberOfMaximumRules || MAX_NUMBER_OF_DYNAMIC_AND_SESSION_RULES;
    }

    /**
     * Returns how much dynamic regex rules are enabled.
     *
     * @param result Configuration result.
     * @returns Number rules.
     */
    private static getDynamicRulesRegexpsEnabledCount(result: ConfigurationResult): number {
        const regexpRulesLimitExceedErr = RulesLimitsService.getRegexpRulesLimitExceedErr(result);
        const regexpsCount = result.dynamicRules?.ruleSet.getRegexpRulesCount() || 0;
        return regexpsCount + (regexpRulesLimitExceedErr?.excludedRulesIds.length || 0);
    }

    /**
     * Returns maximum count of the dynamic regexp rules.
     *
     * @param result Configuration result.
     * @returns Rules count.
     */
    private static getDynamicRulesRegexpsMaximumCount(result: ConfigurationResult): number {
        const regexpRulesLimitExceedErr = RulesLimitsService.getRegexpRulesLimitExceedErr(result);
        return regexpRulesLimitExceedErr?.numberOfMaximumRules || MAX_NUMBER_OF_REGEX_RULES;
    }

    /**
     * Returns filters which where enabled in the last configuration
     * before exceeding limits.
     *
     * @returns Filters which where enabled in the last configuration
     * before exceeding limits.
     */
    public static getExpectedEnabledFilters(): number[] {
        return rulesLimitsStorage.getData();
    }

    /**
     * Returns filters which marked as enabled in the last configuration
     * (current settings in the storage).
     *
     * @returns Filters which marked as enabled in the last configuration
     * (current settings in the storage).
     */
    public static getCurrentConfigurationEnabledFilters(): number[] {
        const ids = FiltersApi.getEnabledFiltersWithMetadata()
            // Ignore custom filters, user rules, allowlist and quick fixes lists
            // because they are user-defined (except quick fixes - it loaded
            // dynamically from the remote) and do not use quota of the static
            // rules.
            // of them is going via dynamic part of DNR rules.
            .filter((f) => CommonFilterApi.isCommonFilter(f.filterId))
            .map((filter) => filter.filterId);

        return ids;
    }

    /**
     * Returns filters which rulesets (we have 1 to 1 relation) actually enabled.
     *
     * @returns Filters which rulesets (we have 1 to 1 relation) actually enabled.
     */
    private static async getActuallyEnabledFilters(): Promise<number[]> {
        const enabledRuleSetsIds = await chrome.declarativeNetRequest.getEnabledRulesets();

        return enabledRuleSetsIds.map((id) => Number.parseInt(id.slice(RULE_SET_NAME_PREFIX.length), 10));
    }

    /**
     * Determines and returns rules limits.
     *
     * @returns Rules limits.
     */
    private async onGetRulesLimitsCounters(): Promise<IRulesLimits> {
        const result = this.configurationResult;
        if (!result) {
            throw new Error('result should be ready');
        }

        const filters = FiltersApi.getEnabledFiltersWithMetadata();

        const staticRulesEnabledCount = RulesLimitsService.getStaticRulesEnabledCount(result, filters);
        const availableStaticRulesCount = await browser.declarativeNetRequest.getAvailableStaticRuleCount();
        const staticRulesMaximumCount = staticRulesEnabledCount + availableStaticRulesCount;

        return {
            dynamicRulesEnabledCount: RulesLimitsService.getDynamicRulesEnabledCount(result),
            dynamicRulesMaximumCount: RulesLimitsService.getDynamicRulesMaximumCount(result),
            dynamicRulesRegexpsEnabledCount: RulesLimitsService.getDynamicRulesRegexpsEnabledCount(result),
            dynamicRulesRegexpsMaximumCount: RulesLimitsService.getDynamicRulesRegexpsMaximumCount(result),
            staticFiltersEnabledCount: RulesLimitsService.getStaticEnabledFiltersCount(),
            staticFiltersMaximumCount: MAX_NUMBER_OF_ENABLED_STATIC_RULESETS,
            staticRulesEnabledCount,
            staticRulesMaximumCount,
            staticRulesRegexpsEnabledCount: RulesLimitsService.getStaticRulesRegexpsCount(result, filters),
            staticRulesRegexpsMaxCount: MAX_NUMBER_OF_REGEX_RULES,
            actuallyEnabledFilters: await RulesLimitsService.getActuallyEnabledFilters(),
            expectedEnabledFilters: RulesLimitsService.getExpectedEnabledFilters(),
            areFilterLimitsExceeded: await RulesLimitsService.areFilterLimitsExceeded(),
        };
    }

    /**
     * Checks whether the filter limits are exceeded:
     * - if we have cached enabled filters and they are not equal to the actually enabled filters
     * (when state was broken once before);
     * - if filters from current configuration are not equal to the actually enabled filters
     * (when state became broken right now).
     *
     * @returns True if the filter limits are exceeded, false otherwise.
     */
    public static async areFilterLimitsExceeded(): Promise<boolean> {
        const cachedEnabledFilters = RulesLimitsService.getExpectedEnabledFilters();
        const actuallyEnabledFilters = await RulesLimitsService.getActuallyEnabledFilters();

        const filteringDisabled = settingsStorage.get(SettingOption.DisableFiltering);
        if (actuallyEnabledFilters.length === 0 && filteringDisabled) {
            return false;
        }

        // If there are some filters in storage - it means, that last used
        // configuration is damaged and we should notify user about them until
        // he will fix configuration or turn off this notification.
        // This case needed to save warning if service worker will restart and
        // after successful configuration update we will not notify user about
        // changed configuration or user paused and resumed protection.
        if (cachedEnabledFilters.length > 0 && !arraysAreEqual(actuallyEnabledFilters, cachedEnabledFilters)) {
            return true;
        }

        // Else we do a full check of the current configuration: if filters from
        // configuration are not same as enabled filters - it means that browser
        // declined update of the configuration and we should notify user about it.
        const expectedEnabledFilters = RulesLimitsService.getCurrentConfigurationEnabledFilters();

        return !arraysAreEqual(actuallyEnabledFilters, expectedEnabledFilters);
    }

    /**
     * Set configuration result to the service.
     *
     * @param result Configuration result.
     * @param isFilteringEnabled Is filtering enabled or not. If disabled -
     * service will turn off all checks for limitations.
     */
    public updateConfigurationResult(result: ConfigurationResult, isFilteringEnabled: boolean): void {
        this.configurationResult = result;
        this.isFilteringEnabled = isFilteringEnabled;
    }

    /**
     * Check if filters limits have changed and update filters state if needed.
     *
     * @param update Function to update filters state and configure tswebextension.
     */
    public static async checkFiltersLimitsChange(update: (skipCheck: boolean) => Promise<void>): Promise<void> {
        const isStateBroken = await RulesLimitsService.areFilterLimitsExceeded();

        // If state is broken - disable filters that were expected to be enabled
        // and configure tswebextension without them to activate minimal possible
        // defense via saving last enabled filters in the separate storage to
        // show them in the UI.
        if (isStateBroken) {
            const expectedEnabledFilters = RulesLimitsService.getCurrentConfigurationEnabledFilters();
            const actuallyEnabledFilters = await RulesLimitsService.getActuallyEnabledFilters();

            const filtersToDisable = expectedEnabledFilters.filter((id) => !actuallyEnabledFilters.includes(id));

            // Save last expected to be enabled filters to notify UI about them,
            // because we will disable them to run minimal possible configuration.
            // It should be done only if there are no filters in the storage,
            // otherwise previous filters list will be overwritten on successful filter enabling (AG-34194).
            if (RulesLimitsService.getExpectedEnabledFilters().length === 0) {
                await rulesLimitsStorage.setData(expectedEnabledFilters);
            }

            filterStateStorage.enableFilters(actuallyEnabledFilters);
            filterStateStorage.disableFilters(filtersToDisable);

            // Update tswebextension configuration without check limitations to
            // skip recursion.
            await update(true);
        } else {
            // If state is not broken - clear list of "broken" filters
            const prevExpectedEnabledFilters = RulesLimitsService.getExpectedEnabledFilters();
            if (prevExpectedEnabledFilters.length > 0) {
                await this.cleanExpectedEnabledFilters();
            }
        }
    }

    /**
     * Clean filters that were expected to be enabled.
     */
    private static async cleanExpectedEnabledFilters(): Promise<void> {
        await rulesLimitsStorage.setData([]);
    }

    /**
     * Read stringified domains array from specified allowlist storage,
     * parse it and set memory cache.
     *
     * If data is not exist, set default data.
     */
    private static async initStorage(): Promise<void> {
        try {
            const storageData = await rulesLimitsStorage.read();
            if (typeof storageData === 'string') {
                const validatedData = rulesLimitsStorageDataValidator.parse(JSON.parse(storageData));
                rulesLimitsStorage.setCache(validatedData);
            } else {
                await this.cleanExpectedEnabledFilters();
            }
        } catch (e) {
            // eslint-disable-next-line max-len
            logger.warn(`Cannot parse data from "${rulesLimitsStorage.key}" storage, set default states. Origin error: `, e);
            await this.cleanExpectedEnabledFilters();
        }
    }

    /**
     * Returns current possible limitations of the rules for static filters
     * and dynamic rules based on the current configuration result.
     *
     * @returns Promise that resolves with possible limitations.
     */
    private async getRulesLimits(): Promise<Mv3LimitsCheckResult> {
        const staticFiltersCheck = await this.getStaticFiltersLimitations();
        const dynamicRulesCheck = await this.getDynamicRulesLimitations();

        return {
            ok: staticFiltersCheck.ok && dynamicRulesCheck.ok,
            staticFiltersData: staticFiltersCheck.data,
            dynamicRulesData: dynamicRulesCheck.data,
        };
    }

    /**
     * Returns limits for the dynamic section of rules.
     *
     * @returns Promise that resolves with possible limitations.
     */
    private async getStaticFiltersLimitations(): Promise<StaticLimitsCheckResult> {
        if (!this.isFilteringEnabled) {
            return { ok: true };
        }

        const enabledFiltersCount = RulesLimitsService.getStaticEnabledFiltersCount();
        if (enabledFiltersCount === MAX_NUMBER_OF_ENABLED_STATIC_RULESETS) {
            return {
                ok: false,
                data: {
                    type: 'static',
                    filtersCount: {
                        current: enabledFiltersCount,
                        maximum: MAX_NUMBER_OF_ENABLED_STATIC_RULESETS,
                    },
                },
            };
        }

        const areFilterLimitsExceeded = await RulesLimitsService.areFilterLimitsExceeded();
        if (areFilterLimitsExceeded) {
            const actuallyEnabledFilters = await RulesLimitsService.getActuallyEnabledFilters();
            return {
                ok: false,
                data: {
                    type: 'static',
                    filtersCount: {
                        current: actuallyEnabledFilters.length,
                        expected: RulesLimitsService.getExpectedEnabledFilters().length,
                    },
                },
            };
        }

        return { ok: true };
    }

    /**
     * Returns limits for the dynamic section of rules.
     *
     * @returns Promise that resolves with possible limitations.
     */
    private async getDynamicRulesLimitations(): Promise<DynamicLimitsCheckResult> {
        const result = this.configurationResult;
        if (!result) {
            logger.error('[canEnableDynamicRules] Configuration result is not ready yet');
            return { ok: true };
        }

        if (!this.isFilteringEnabled) {
            return { ok: true };
        }

        const dynamicRulesEnabledCount = RulesLimitsService.getDynamicRulesEnabledCount(result);
        const dynamicRulesExcludedCount = RulesLimitsService.getDynamicRulesExcludedCount(result);
        const dynamicRulesMaximumCount = RulesLimitsService.getDynamicRulesMaximumCount(result);

        const allRulesCount = dynamicRulesEnabledCount + dynamicRulesExcludedCount;
        if (allRulesCount > dynamicRulesMaximumCount) {
            return {
                ok: false,
                data: {
                    type: 'dynamic',
                    rulesCount: {
                        // return number of all rules (enabled + excluded)
                        // to show how many rules a user is trying to enable
                        current: dynamicRulesEnabledCount + dynamicRulesExcludedCount,
                        maximum: dynamicRulesMaximumCount,
                    },
                },
            };
        }

        // FIXME: Check why getDynamicRulesRegexpsExcludedCount is not used here.
        const dynamicRulesRegexpsEnabledCount = RulesLimitsService.getDynamicRulesRegexpsEnabledCount(result);
        const dynamicRulesRegexpsMaximumCount = RulesLimitsService.getDynamicRulesRegexpsMaximumCount(result);
        if (dynamicRulesRegexpsEnabledCount > dynamicRulesRegexpsMaximumCount) {
            return {
                ok: false,
                data: {
                    type: 'dynamic',
                    rulesRegexpsCount: {
                        current: dynamicRulesRegexpsEnabledCount,
                        maximum: dynamicRulesRegexpsMaximumCount,
                    },
                },
            };
        }

        return { ok: true };
    }

    /**
     * Checks if the static filter can be enabled.
     *
     * @param filterId Filter id.
     *
     * @returns Promise that resolves with the result of the check.
     */
    private async doesStaticFilterFitsInLimits(filterId: number): Promise<StaticLimitsCheckResult> {
        const result = this.configurationResult;

        /**
         * Usually, the configuration result should be ready, when this method is called.
         * But even if it's not ready, we should not block the filter enabling.
         * In any case, the filter will not be enabled if it doesn't fit in limits.
         */
        if (!result) {
            logger.error('[doesStaticFilterFitsInLimits]: configuration result is not ready yet');
            return { ok: true };
        }

        if (!this.isFilteringEnabled) {
            return { ok: true };
        }

        const enabledFiltersCount = RulesLimitsService.getStaticEnabledFiltersCount();
        if (enabledFiltersCount > MAX_NUMBER_OF_ENABLED_STATIC_RULESETS) {
            return {
                ok: false,
                data: {
                    type: 'static',
                    filtersCount: {
                        current: enabledFiltersCount,
                        maximum: MAX_NUMBER_OF_ENABLED_STATIC_RULESETS,
                    },
                },
            };
        }

        const availableStaticRulesCount = await browser.declarativeNetRequest.getAvailableStaticRuleCount();
        const filterStaticRulesCount = RulesLimitsService.getStaticRuleSetCounter(result, filterId);
        if (filterStaticRulesCount.rulesCount > availableStaticRulesCount) {
            return {
                ok: false,
                data: {
                    type: 'static',
                    rulesCount: {
                        current: filterStaticRulesCount.rulesCount,
                        maximum: availableStaticRulesCount,
                    },
                },
            };
        }

        const enabledFilters = FiltersApi.getEnabledFiltersWithMetadata();
        const allEnabledRegexpRulesCount = RulesLimitsService.getStaticRulesRegexpsCount(result, enabledFilters);
        const allPossibleEnabledRegexpRulesCount = allEnabledRegexpRulesCount + filterStaticRulesCount.regexpRulesCount;
        if (allPossibleEnabledRegexpRulesCount > MAX_NUMBER_OF_REGEX_RULES) {
            return {
                ok: false,
                data: {
                    type: 'static',
                    rulesRegexpsCount: {
                        current: filterStaticRulesCount.regexpRulesCount,
                        maximum: MAX_NUMBER_OF_REGEX_RULES,
                    },
                },
            };
        }

        return { ok: true };
    }

    /**
     * Checks if static filter can be enabled.
     *
     * @param message Message with filter id.
     *
     * @returns Promise that resolves with the result of the check — {@link StaticLimitsCheckResult}.
     */
    private async canEnableStaticFilter(message: CanEnableStaticFilterMessageMv3): Promise<StaticLimitsCheckResult> {
        canEnableStaticFilterSchema.parse(message);

        const { filterId } = message.data;

        if (CustomFilterApi.isCustomFilter(filterId)) {
            throw new Error('Custom filters should be checked with canEnableDynamicRules method');
        }

        return this.doesStaticFilterFitsInLimits(filterId);
    }

    /**
     * Checks if the static filters can be enabled.
     *
     * @param filterIds Filter ids list.
     *
     * @returns Promise that resolves with the result of the check.
     */
    private async doStaticFiltersFitInLimits(filterIds: number[]): Promise<StaticLimitsCheckResult> {
        const result = this.configurationResult;

        /**
         * Usually, the configuration result should be ready when this method is called.
         * But even if it's not ready, we should not block the filter enabling.
         * In any case, the filter will not be enabled if it doesn't fit in limits.
         */
        if (!result) {
            logger.error('[doStaticFiltersFitInLimits]: Configuration result is not ready yet.');
            return { ok: true };
        }

        if (!this.isFilteringEnabled) {
            return { ok: true };
        }

        const enabledFiltersCount = RulesLimitsService.getStaticEnabledFiltersCount();
        const isWithinRulesetsLimit = enabledFiltersCount + filterIds.length <= MAX_NUMBER_OF_ENABLED_STATIC_RULESETS;
        if (!isWithinRulesetsLimit) {
            return {
                ok: false,
                data: {
                    type: 'static',
                    filtersCount: {
                        current: enabledFiltersCount,
                        maximum: MAX_NUMBER_OF_ENABLED_STATIC_RULESETS,
                    },
                },
            };
        }

        const availableStaticRulesCount = await browser.declarativeNetRequest.getAvailableStaticRuleCount();

        const { totalStaticRulesCount, totalRegexpRulesCount } = filterIds.reduce(
            (acc, filterId) => {
                const filterStaticRulesCount = RulesLimitsService.getStaticRuleSetCounter(result, filterId);
                acc.totalStaticRulesCount += filterStaticRulesCount.rulesCount;
                acc.totalRegexpRulesCount += filterStaticRulesCount.regexpRulesCount;
                return acc;
            },
            { totalStaticRulesCount: 0, totalRegexpRulesCount: 0 },
        );

        const isWithinStaticRulesLimit = availableStaticRulesCount >= totalStaticRulesCount;
        if (!isWithinStaticRulesLimit) {
            return {
                ok: false,
                data: {
                    type: 'static',
                    rulesCount: {
                        current: totalStaticRulesCount,
                        maximum: availableStaticRulesCount,
                    },
                },
            };
        }

        const enabledFilters = FiltersApi.getEnabledFiltersWithMetadata();
        const allEnabledRegexpRulesCount = RulesLimitsService.getStaticRulesRegexpsCount(result, enabledFilters);
        const regexpRulesIfFiltersEnabled = allEnabledRegexpRulesCount + totalRegexpRulesCount;
        const isWithinRegexRulesLimit = regexpRulesIfFiltersEnabled <= MAX_NUMBER_OF_REGEX_RULES;

        if (!isWithinRegexRulesLimit) {
            return {
                ok: false,
                data: {
                    type: 'static',
                    rulesRegexpsCount: {
                        current: totalRegexpRulesCount,
                        maximum: MAX_NUMBER_OF_REGEX_RULES,
                    },
                },
            };
        }

        return {
            ok: true,
        };
    }

    /**
     * Checks if the static group can be enabled.
     *
     * @param message Message with group id.
     * @returns Promise that resolves with the result of the check.
     */
    private async canEnableStaticGroup(message: CanEnableStaticGroupMessageMv3): Promise<StaticLimitsCheckResult> {
        canEnableStaticGroupSchema.parse(message);

        const { groupId } = message.data;

        const group = Categories.getGroupState(groupId);
        if (!group) {
            throw new Error(`There is no group with such id: ${groupId}`);
        }

        let filters = [];
        if (group.touched) {
            filters = Categories.getEnabledFiltersIdsByGroupId(groupId);
        } else {
            filters = Categories.getRecommendedFilterIdsByGroupId(groupId);
        }

        return this.doStaticFiltersFitInLimits(filters);
    }
}

export const rulesLimitsService = new RulesLimitsService();
