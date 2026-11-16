/**
 * Copyright (c) 2015-2026 Adguard Software Ltd.
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

import browser from 'webextension-polyfill';

import {
    TooManyRegexpRulesError,
    TooManyUnsafeRulesError,
    TooManyRulesError,
    RULESET_NAME_PREFIX,
    type ConfigurationResult,
    type LimitationError,
} from '@adguard/tswebextension/mv3';

import {
    type CanEnableStaticFilterMv3Message,
    type CanEnableStaticGroupMv3Message,
    MessageType,
} from '../../../common/messages';
import {
    Categories,
    type FilterMetadata,
    FiltersApi,
    iconsApi,
} from '../../api';
import { filterStateStorage, settingsStorage } from '../../storages';
import { rulesLimitsStorage } from '../../storages/rules-limits';
import { rulesLimitsStorageDataValidator } from '../../schema/rules-limits';
import { CommonFilterUtils } from '../../../common/common-filter-utils';
import { CustomFilterUtils } from '../../../common/custom-filter-utils';
import { logger } from '../../../common/logger';
// Note: due to circular dependencies, import message-handler.ts after all
// other imports.
import { messageHandler } from '../../message-handler';
import { arraysAreEqual } from '../../utils/arrays-are-equal';
import { SettingOption } from '../../schema/settings/enum';
import { getZodErrorMessage } from '../../../common/error';

import {
    type StaticLimitsCheckResult,
    type IRulesLimits,
    type DynamicLimitsCheckResult,
    type Mv3LimitsCheckResult,
} from './interface';

const {
    MAX_NUMBER_OF_DYNAMIC_RULES,
    MAX_NUMBER_OF_REGEX_RULES,
    MAX_NUMBER_OF_ENABLED_STATIC_RULESETS,

    /**
     * @see {@link https://developer.chrome.com/docs/extensions/reference/api/declarativeNetRequest#property-MAX_NUMBER_OF_UNSAFE_DYNAMIC_RULES}
     */
    // TODO: remove default value and following ts-ignore
    // when the value is available in webextension-polyfill
    // @ts-ignore
    MAX_NUMBER_OF_UNSAFE_DYNAMIC_RULES = 5000,
} = browser.declarativeNetRequest;

/**
 * RulesetCounter interface.
 */
interface RulesetCounter {
    filterId: number;
    rulesCount: number;
    regexpRulesCount: number;
    metadataRulesCount: number;
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
     * Counters of the static rulesets by filter id.
     *
     * The counters of a bundled ruleset do not depend on the configuration,
     * so they are kept across configuration results. This lets the service
     * load the rulesets of disabled filters only once and reuse their
     * counters for the later checks.
     */
    private staticRulesetCounters = new Map<number, RulesetCounter>();

    /**
     * Pending loading of the static rulesets of disabled filters, or `null`
     * if there is none.
     *
     * Their counters are needed only to check whether a disabled filter can be
     * enabled, so these checks wait for it, see
     * {@link RulesLimitsService.waitForStaticRulesetCounters}.
     */
    private disabledStaticRulesetsLoading: Promise<void> | null = null;

    /**
     * Whether the static rulesets of disabled filters have been loaded.
     *
     * They are loaded once per service worker lifetime: the counters do not
     * depend on the configuration, and loading them on every configuration
     * result would create all disabled rulesets again.
     */
    private disabledStaticRulesetsLoaded: boolean = false;

    /**
     * Resolver of {@link RulesLimitsService.configurationResultChanged}.
     */
    private resolveConfigurationResultChanged: (() => void) | null = null;

    /**
     * Promise that resolves when the configuration result is replaced.
     *
     * A check waiting for the counters of disabled filters races this promise
     * with the loading, so it can stop waiting when the new result makes the
     * wait unnecessary, e.g. when filtering is disabled.
     */
    private configurationResultChanged: Promise<void> = new Promise<void>((resolve) => {
        this.resolveConfigurationResultChanged = resolve;
    });

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
            RulesLimitsService.clearRulesLimitsWarning,
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
            .filter((f) => !CustomFilterUtils.isCustomFilter(f.filterId)).length;
    }

    /**
     * Clears the rules limits warning by resetting the expected enabled filters.
     * This function is intended to be used when the user acknowledges the warning
     * and wants to reset the state to avoid further notifications.
     */
    public static async clearRulesLimitsWarning(): Promise<void> {
        // Reset the warning state by clearing the list of expected enabled filters.
        await RulesLimitsService.cleanExpectedEnabledFilters();
        // Force update the icon state immediately
        // to ensure it reflects the current status without waiting for user actions.
        await iconsApi.update();
    }

    /**
     * Creates a ruleset counter from a static ruleset.
     *
     * @param ruleset Static ruleset.
     *
     * @returns Ruleset counter.
     */
    private static createRulesetCounter(ruleset: ConfigurationResult['staticFilters'][number]): RulesetCounter {
        const filterId = Number(ruleset.getId().slice(RULESET_NAME_PREFIX.length));

        return {
            filterId,
            rulesCount: ruleset.getSafeRulesCount() + ruleset.getUnsafeRulesCount(),
            regexpRulesCount: ruleset.getRegexpRulesCount(),
            metadataRulesCount: ruleset.getMetadataRulesCount(),
        };
    }

    /**
     * Returns a map of counters of the rulesets in the configuration result.
     *
     * @param result Configuration result.
     *
     * @returns A map of ruleset counters by filter id.
     */
    private static getRulesetsCountersMap(result: ConfigurationResult): Map<number, RulesetCounter> {
        return new Map(result.staticFilters.map((ruleset) => {
            const counter = RulesLimitsService.createRulesetCounter(ruleset);

            return [counter.filterId, counter] as const;
        }));
    }

    /**
     * Returns the ids of the common static filters that have a bundled
     * ruleset.
     *
     * @returns Filter ids.
     */
    private static getBundledStaticFilterIds(): number[] {
        return FiltersApi.getFiltersMetadata()
            .filter((filter) => CommonFilterUtils.isCommonFilter(filter.filterId))
            .map((filter) => filter.filterId);
    }

    /**
     * Returns an array of ruleset counters.
     *
     * @param filters List of filters with metadata.
     * @param rulesetsCounters A map of ruleset counters.
     *
     * @returns An array of ruleset counters by filters ids.
     */
    private static getRulesetCounters(
        filters: FilterMetadata[],
        rulesetsCounters: Map<number, RulesetCounter>,
    ): RulesetCounter[] {
        return filters
            .filter((f) => !CustomFilterUtils.isCustomFilter(f.filterId))
            .map((filter) => rulesetsCounters.get(filter.filterId))
            .filter((ruleset): ruleset is RulesetCounter => ruleset !== undefined);
    }

    /**
     * Gets the static ruleset counter by filter id.
     *
     * @param filterId Filter id.
     *
     * @returns The static ruleset counter or `undefined` if there is no
     * counter for the filter.
     */
    private getStaticRulesetCounter(filterId: number): RulesetCounter | undefined {
        return this.staticRulesetCounters.get(filterId);
    }

    /**
     * Get the number of static rules enabled, including metadata rules.
     *
     * NOTE: Each generated static ruleset JSON file starts with metadata
     * rules that carry the ruleset metadata in chunks. Chrome counts them
     * against the global static rule budget, but the ruleset's safe and unsafe
     * counters do not include them, so they are added from
     * `getMetadataRulesCount()`.
     *
     * @param result Configuration result.
     * @param filters Filters with metadata.
     *
     * @returns The number of static rules enabled.
     */
    private static getStaticRulesEnabledCount(result: ConfigurationResult, filters: FilterMetadata[]): number {
        const rulesetsCounters = RulesLimitsService.getRulesetsCountersMap(result);

        const rulesets = RulesLimitsService.getRulesetCounters(filters, rulesetsCounters);

        return rulesets.reduce((sum, ruleset) => {
            return sum + ruleset.rulesCount + ruleset.metadataRulesCount;
        }, 0);
    }

    /**
     * Calculates how many regexp rules are in the rulesets.
     *
     * @param result Configuration result.
     * @param filters Filters with metadata.
     *
     * @returns Count of the regexp rules.
     */
    private static getStaticRulesRegexpsCount(result: ConfigurationResult, filters: FilterMetadata[]): number {
        const rulesetsCounters = RulesLimitsService.getRulesetsCountersMap(result);

        const rulesets = RulesLimitsService.getRulesetCounters(filters, rulesetsCounters);

        return rulesets.reduce((sum, ruleset) => {
            return sum + ruleset.regexpRulesCount;
        }, 0);
    }

    /**
     * Collects limitation errors of the dynamic scope: the dynamic rules
     * (allowlist, user rules, custom filters) and the `$csp` rules rebuilt into
     * the dynamic ruleset.
     *
     * Session rule overflow is never here: session rules have their own quota
     * and their errors live only in `sessionRules.limitations`, so they must not
     * be mixed into the dynamic counters.
     *
     * @param result Configuration result.
     *
     * @returns Limitation errors of the dynamic scope.
     */
    private static getDynamicLimitations = (result: ConfigurationResult): LimitationError[] => (
        result.dynamicRules?.limitations ?? []
    );

    /**
     * Checks whether a limitation error describes a session quota overflow.
     *
     * @param error Limitation error.
     *
     * @returns `true` if the error comes from a session quota.
     */
    private static isSessionLimitExceedErr = (
        error: LimitationError,
    ): error is TooManyUnsafeRulesError | TooManyRegexpRulesError => (
        error instanceof TooManyUnsafeRulesError || error instanceof TooManyRegexpRulesError
    );

    /**
     * Finds the first limitation error of session rules.
     *
     * Session rules hold the unsafe rules of built-in filters and the `$csp`
     * rules rebuilt into session rules, so their overflow is a built-in rules
     * limit. Such errors never appear in `dynamicRules.limitations`, which
     * covers the dynamic scope only.
     *
     * @param result Configuration result.
     *
     * @returns Limitation error or `undefined` if session rules fit the quota.
     */
    private static getSessionLimitExceedErr = (
        result: ConfigurationResult | null,
    ): TooManyUnsafeRulesError | TooManyRegexpRulesError | undefined => (
        result?.sessionRules?.limitations.find(RulesLimitsService.isSessionLimitExceedErr)
    );

    /**
     * Finds first found limitation error about unsafe rules limit.
     *
     * @param result Configuration result.
     *
     * @returns Limitation error.
     */
    private static getUnsafeRulesLimitExceedErr = (
        result: ConfigurationResult,
    ): TooManyUnsafeRulesError | undefined => {
        return RulesLimitsService.getDynamicLimitations(result)
            .find((e): e is TooManyUnsafeRulesError => e instanceof TooManyUnsafeRulesError);
    };

    /**
     * Finds first found limitation error.
     *
     * @param result Configuration result.
     *
     * @returns Limitation error.
     */
    private static getRegexpRulesLimitExceedErr = (
        result: ConfigurationResult,
    ): TooManyRegexpRulesError | undefined => {
        return RulesLimitsService.getDynamicLimitations(result)
            .find((e): e is TooManyRegexpRulesError => e instanceof TooManyRegexpRulesError);
    };

    /**
     * Finds first too many rules error.
     *
     * @param result Configuration result.
     *
     * @returns Too many rules error.
     */
    private static getRulesLimitExceedErr = (
        result: ConfigurationResult,
    ): TooManyRulesError | undefined => {
        return RulesLimitsService.getDynamicLimitations(result)
            .find((e): e is TooManyRulesError => e instanceof TooManyRulesError);
    };

    /**
     * How many dynamic rules are enabled.
     *
     * @param result Configuration result.
     *
     * @returns Count of enabled dynamic rules.
     */
    private static getDynamicRulesEnabledCount(result: ConfigurationResult): number {
        const rulesLimitExceedErr = RulesLimitsService.getRulesLimitExceedErr(result);
        const declarativeRulesCount = result.dynamicRules?.counts.total ?? 0;
        return rulesLimitExceedErr?.numberOfMaximumRules || declarativeRulesCount;
    }

    /**
     * How many dynamic rules are excluded and cannot be enabled.
     *
     * @param result Configuration result.
     *
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
     *
     * @returns Count of rules.
     */
    private static getDynamicRulesMaximumCount(result: ConfigurationResult): number {
        const rulesLimitExceedErr = RulesLimitsService.getRulesLimitExceedErr(result);
        return rulesLimitExceedErr?.numberOfMaximumRules || MAX_NUMBER_OF_DYNAMIC_RULES;
    }

    /**
     * Returns how much dynamic regex rules are enabled.
     *
     * @param result Configuration result.
     *
     * @returns Number rules.
     */
    private static getDynamicRegexpRulesEnabledCount(result: ConfigurationResult): number {
        const regexpsCount = result.dynamicRules?.counts.regexp ?? 0;

        const regexpRulesLimitExceedErr = RulesLimitsService.getRegexpRulesLimitExceedErr(result);
        // `excludedRulesIds` holds source rule ids, while the counter and the
        // quota count declarative rules, and the converter may group several
        // source rules into one.
        const excludedRulesCount = regexpRulesLimitExceedErr?.numberOfExcludedDeclarativeRules ?? 0;

        return regexpsCount + excludedRulesCount;
    }

    /**
     * Returns maximum count of the dynamic regexp rules.
     *
     * @param result Configuration result.
     *
     * @returns Rules count.
     */
    private static getDynamicRegexpRulesMaximumCount(result: ConfigurationResult): number {
        const regexpRulesLimitExceedErr = RulesLimitsService.getRegexpRulesLimitExceedErr(result);
        return regexpRulesLimitExceedErr?.numberOfMaximumRules || MAX_NUMBER_OF_REGEX_RULES;
    }

    /**
     * How many dynamic **unsafe** rules are enabled.
     *
     * @param result Configuration result.
     *
     * @returns Count of enabled dynamic unsafe rules.
     */
    private static getDynamicUnsafeRulesEnabledCount(result: ConfigurationResult): number {
        const unsafeRulesCount = result.dynamicRules?.counts.unsafe ?? 0;

        const unsafeRulesLimitExceedErr = RulesLimitsService.getUnsafeRulesLimitExceedErr(result);
        // `excludedRulesIds` holds source rule ids, while the counter and the
        // quota count declarative rules, and the converter may group several
        // source rules into one ($removeheader, rebuilt $csp rules).
        const excludedRulesCount = unsafeRulesLimitExceedErr?.numberOfExcludedDeclarativeRules ?? 0;

        return unsafeRulesCount + excludedRulesCount;
    }

    /**
     * Returns number of maximum possible dynamic **unsafe** rules.
     *
     * @param result Configuration result.
     *
     * @returns Count of rules.
     */
    private static getDynamicUnsafeRulesMaximumCount(result: ConfigurationResult): number {
        const rulesLimitExceedErr = RulesLimitsService.getUnsafeRulesLimitExceedErr(result);
        return rulesLimitExceedErr?.numberOfMaximumRules || MAX_NUMBER_OF_UNSAFE_DYNAMIC_RULES;
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
            // Ignore custom filters, user rules and allowlist
            // because they are user-defined and do not use quota of the static
            // rules.
            // of them is going via dynamic part of DNR rules.
            .filter((f) => CommonFilterUtils.isCommonFilter(f.filterId))
            .map((filter) => filter.filterId);

        return ids;
    }

    /**
     * Returns filters which rulesets (we have 1 to 1 relation) actually enabled.
     *
     * @returns Filters which rulesets (we have 1 to 1 relation) actually enabled.
     */
    private static async getActuallyEnabledFilters(): Promise<number[]> {
        const enabledRulesetsIds = await chrome.declarativeNetRequest.getEnabledRulesets();

        return enabledRulesetsIds.map((id) => Number.parseInt(id.slice(RULESET_NAME_PREFIX.length), 10));
    }

    /**
     * Determines and returns rules limits.
     *
     * @returns Rules limits or undefined if the configuration result is not ready yet.
     */
    private async onGetRulesLimitsCounters(): Promise<IRulesLimits | undefined> {
        const result = this.configurationResult;
        if (!result) {
            return undefined;
        }

        const filters = FiltersApi.getEnabledFiltersWithMetadata();

        const staticRulesEnabledCount = RulesLimitsService.getStaticRulesEnabledCount(result, filters);
        const availableStaticRulesCount = await browser.declarativeNetRequest.getAvailableStaticRuleCount();
        const sessionRules = await browser.declarativeNetRequest.getSessionRules();

        /**
         * Chrome counts session rules as part of the global static rule limit.
         * We add sessionRules.length here to reflect the actual budget consumed.
         *
         * See Chromium issue: https://issues.chromium.org/u/1/issues/520052960.
         */
        const staticRulesMaximumCount = staticRulesEnabledCount
            + availableStaticRulesCount
            + sessionRules.length;

        return {
            dynamicRulesEnabledCount: RulesLimitsService.getDynamicRulesEnabledCount(result),
            dynamicRulesMaximumCount: RulesLimitsService.getDynamicRulesMaximumCount(result),
            dynamicRulesUnsafeEnabledCount: RulesLimitsService.getDynamicUnsafeRulesEnabledCount(result),
            dynamicRulesUnsafeMaximumCount: RulesLimitsService.getDynamicUnsafeRulesMaximumCount(result),
            dynamicRulesRegexpsEnabledCount: RulesLimitsService.getDynamicRegexpRulesEnabledCount(result),
            dynamicRulesRegexpsMaximumCount: RulesLimitsService.getDynamicRegexpRulesMaximumCount(result),
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
        const filteringDisabled = settingsStorage.get(SettingOption.DisableFiltering);
        if (filteringDisabled) {
            return false;
        }

        const cachedEnabledFilters = RulesLimitsService.getExpectedEnabledFilters();
        const expectedEnabledFilters = RulesLimitsService.getCurrentConfigurationEnabledFilters();
        const actuallyEnabledFilters = await RulesLimitsService.getActuallyEnabledFilters();

        // If there are some filters in storage - it means, that last used
        // configuration is damaged and we should notify user about them until
        // he will fix configuration or turn off this notification.
        // This case needed to save warning if service worker will restart and
        // after successful configuration update we will not notify user about
        // changed configuration or user paused and resumed protection.
        if (cachedEnabledFilters.length > 0 && !arraysAreEqual(actuallyEnabledFilters, cachedEnabledFilters)) {
            return true;
        }

        // Do a full check of the current configuration: if filters from
        // configuration are not same as enabled filters - it means that browser
        // declined update of the configuration and we should notify user about it.
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

        // The counters of the rulesets in the result are valid for any later
        // configuration, so keep them.
        this.cacheStaticRulesetCounters(result.staticFilters);

        // Wake up the checks waiting for the previous result: the new result
        // may make their wait unnecessary, e.g. if filtering is disabled or
        // its rulesets are already loaded.
        this.notifyConfigurationResultChanged();

        // Load the rulesets of disabled filters only once. After that all
        // bundled counters are cached, so later results do not need them.
        if (isFilteringEnabled && !this.disabledStaticRulesetsLoaded && !this.disabledStaticRulesetsLoading) {
            this.loadDisabledStaticRulesets(result);
        }
    }

    /**
     * Saves the counters of the given static rulesets, so they can be reused
     * across configuration results.
     *
     * @param rulesets Static rulesets.
     */
    private cacheStaticRulesetCounters(rulesets: ConfigurationResult['staticFilters']): void {
        rulesets.forEach((ruleset) => {
            const counter = RulesLimitsService.createRulesetCounter(ruleset);

            this.staticRulesetCounters.set(counter.filterId, counter);
        });
    }

    /**
     * Loads the static rulesets of disabled filters in the background, so
     * their counters become available for the checks whether these filters
     * can be enabled.
     *
     * Tswebextension creates only the rulesets of enabled filters during the
     * configuration, because creating a ruleset for the first time prepares
     * its filter list, which is too slow for the startup path.
     *
     * @param result Configuration result to load the disabled rulesets for.
     */
    private loadDisabledStaticRulesets(result: ConfigurationResult): void {
        const loading = result.loadDisabledStaticFilters()
            .then((rulesets) => {
                // Counters of a bundled ruleset do not depend on the
                // configuration, so the result of a superseded loading is
                // still valid.
                this.cacheStaticRulesetCounters(rulesets);
                this.updateDisabledStaticRulesetsLoaded();
            })
            .catch((e) => {
                logger.error('[ext.RulesLimitsService.loadDisabledStaticRulesets]: failed to load static rulesets of disabled filters:', e);
            })
            .finally(() => {
                this.disabledStaticRulesetsLoading = null;
            });

        this.disabledStaticRulesetsLoading = loading;
    }

    /**
     * Updates whether the counters of all bundled static rulesets are
     * available.
     *
     * The library skips a ruleset that fails to be created and still
     * resolves, so a resolved batch is complete only when every bundled
     * filter has a counter. Otherwise the next configuration result retries
     * the loading.
     */
    private updateDisabledStaticRulesetsLoaded(): void {
        this.disabledStaticRulesetsLoaded = RulesLimitsService.getBundledStaticFilterIds()
            .every((filterId) => this.staticRulesetCounters.has(filterId));
    }

    /**
     * Resolves the promise of the previous configuration result and creates a
     * new one for the current result.
     */
    private notifyConfigurationResultChanged(): void {
        this.resolveConfigurationResultChanged?.();
        this.configurationResultChanged = new Promise<void>((resolve) => {
            this.resolveConfigurationResultChanged = resolve;
        });
    }

    /**
     * Waits until the counters of the given static rulesets are available.
     *
     * Only the requested rulesets are loaded on demand, so a single-filter
     * check does not wait for the whole batch. The wait re-checks when the
     * configuration result is replaced and stops when the new result does not
     * need the counters, e.g. when filtering is disabled.
     *
     * @param filterIds Ids of filters whose counters are needed.
     */
    private async waitForStaticRulesetCounters(filterIds: number[]): Promise<void> {
        while (this.isFilteringEnabled) {
            const result = this.configurationResult;
            if (!result) {
                return;
            }

            const missingIds = filterIds.filter((filterId) => !this.staticRulesetCounters.has(filterId));
            if (missingIds.length === 0) {
                return;
            }

            // Load only the counters the check needs, so a single-filter
            // check does not wait for the whole background batch.
            const loading = Promise.all(missingIds.map(async (filterId) => {
                const ruleset = await result.loadDisabledStaticFilter(filterId);

                if (ruleset) {
                    this.cacheStaticRulesetCounters([ruleset]);
                }
            })).catch((e) => {
                logger.error('[ext.RulesLimitsService.waitForStaticRulesetCounters]: failed to load a static ruleset:', e);
            });

            // Re-check when the configuration result is replaced: the new
            // result may not need the counters, e.g. when filtering is
            // disabled.
            // eslint-disable-next-line no-await-in-loop
            await Promise.race([loading, this.configurationResultChanged]);

            // If the result did not change, the requested rulesets have been
            // attempted. Do not loop forever on a counter that cannot be
            // loaded.
            if (this.configurationResult === result) {
                this.updateDisabledStaticRulesetsLoaded();
                return;
            }
        }
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
            logger.warn(`[ext.RulesLimitsService.initStorage]: cannot parse data from "${rulesLimitsStorage.key}" storage, set default states. Origin error:`, getZodErrorMessage(e));
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

        const sessionLimitExceedErr = RulesLimitsService.getSessionLimitExceedErr(this.configurationResult);
        if (sessionLimitExceedErr) {
            /**
             * The counters are exact: `numberOfMaximumRules` is the count of
             * unsafe session rules which can be applied at all — the quota
             * minus the ids reserved for stealth rules — and the overflow means
             * every one of them is taken, so the applied count is the maximum
             * itself and `current` is it plus the omitted rules.
             *
             * Both quotas can overflow at once, and a rule dropped by the
             * regexp quota never takes an id, so the count is summed over all
             * session limitations instead of the first error.
             */
            const excludedCount = (this.configurationResult?.sessionRules?.limitations ?? [])
                .filter(RulesLimitsService.isSessionLimitExceedErr)
                .reduce((sum, limitation) => sum + limitation.numberOfExcludedDeclarativeRules, 0);
            const current = sessionLimitExceedErr.numberOfMaximumRules + excludedCount;
            const maximum = sessionLimitExceedErr.numberOfMaximumRules;

            if (sessionLimitExceedErr instanceof TooManyRegexpRulesError) {
                return {
                    ok: false,
                    data: {
                        type: 'static',
                        rulesRegexpsCount: { current, maximum },
                    },
                };
            }

            return {
                ok: false,
                data: {
                    type: 'static',
                    rulesSessionCount: { current, maximum },
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
        if (!this.isFilteringEnabled) {
            return { ok: true };
        }

        const result = this.configurationResult;
        if (!result) {
            // sometimes configuration result may not be ready yet,
            // e.g. when service worker was not running and options page is opened from the context menu
            // TODO: consider returning something like NOT_READY status which can be handled later if needed
            logger.debug('[ext.RulesLimitsService.getDynamicRulesLimitations]: configuration result is not ready yet');
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
                        current: allRulesCount,
                        maximum: dynamicRulesMaximumCount,
                    },
                },
            };
        }

        const dynamicRulesUnsafeEnabledCount = RulesLimitsService.getDynamicUnsafeRulesEnabledCount(result);
        const dynamicUnsafeRegexpsMaximumCount = RulesLimitsService.getDynamicUnsafeRulesMaximumCount(result);
        if (dynamicRulesUnsafeEnabledCount > dynamicUnsafeRegexpsMaximumCount) {
            return {
                ok: false,
                data: {
                    type: 'dynamic',
                    rulesUnsafeCount: {
                        current: dynamicRulesUnsafeEnabledCount,
                        maximum: dynamicUnsafeRegexpsMaximumCount,
                    },
                },
            };
        }

        const dynamicRulesRegexpsEnabledCount = RulesLimitsService.getDynamicRegexpRulesEnabledCount(result);
        const dynamicRulesRegexpsMaximumCount = RulesLimitsService.getDynamicRegexpRulesMaximumCount(result);
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
        // The filter is usually disabled, so its counter may still be loading.
        await this.waitForStaticRulesetCounters([filterId]);

        const result = this.configurationResult;

        /**
         * Usually, the configuration result should be ready, when this method is called.
         * But even if it's not ready, we should not block the filter enabling.
         * In any case, the filter will not be enabled if it doesn't fit in limits.
         */
        if (!result) {
            logger.error('[ext.RulesLimitsService.doesStaticFilterFitsInLimits]: configuration result is not ready yet');
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
        const filterStaticRulesCount = this.getStaticRulesetCounter(filterId);

        // The filter can have no ruleset counter if the extension bundle has
        // no ruleset for it, or if its ruleset failed to be loaded. Such a
        // filter cannot be enabled, so the check must fail instead of throwing.
        if (!filterStaticRulesCount) {
            logger.error(`[ext.RulesLimitsService.doesStaticFilterFitsInLimits]: ruleset counter for filterId ${filterId} not found`);
            return { ok: false, data: { type: 'static' } };
        }

        // Chrome also counts the metadata rules at the start of each static
        // ruleset (see `getStaticRulesEnabledCount`). Without them the check
        // undercounts and can admit a ruleset Chrome will reject near the
        // global limit.
        const filterStaticRulesTotalCount = filterStaticRulesCount.rulesCount
            + filterStaticRulesCount.metadataRulesCount;
        if (filterStaticRulesTotalCount > availableStaticRulesCount) {
            return {
                ok: false,
                data: {
                    type: 'static',
                    rulesCount: {
                        current: filterStaticRulesTotalCount,
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
    private async canEnableStaticFilter(message: CanEnableStaticFilterMv3Message): Promise<StaticLimitsCheckResult> {
        const { filterId } = message.data;

        if (CustomFilterUtils.isCustomFilter(filterId)) {
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
        // The filters are usually disabled, so their counters may still be loading.
        await this.waitForStaticRulesetCounters(filterIds);

        const result = this.configurationResult;

        /**
         * Usually, the configuration result should be ready when this method is called.
         * But even if it's not ready, we should not block the filter enabling.
         * In any case, the filter will not be enabled if it doesn't fit in limits.
         */
        if (!result) {
            logger.error('[ext.RulesLimitsService.doStaticFiltersFitInLimits]: configuration result is not ready yet.');
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
                const filterStaticRulesCount = this.getStaticRulesetCounter(filterId);

                // Skip filters without a ruleset counter: the extension bundle
                // may have no ruleset for them, or their ruleset failed to be
                // loaded, so they cannot be enabled and must not block the
                // whole group.
                if (!filterStaticRulesCount) {
                    logger.error(`[ext.RulesLimitsService.doStaticFiltersFitInLimits]: ruleset counter for filterId ${filterId} not found`);
                    return acc;
                }

                // Chrome also counts the metadata rules of each ruleset (see
                // `getStaticRulesEnabledCount`), so the admission check
                // matches Chrome's actual static-rule consumption.
                acc.totalStaticRulesCount += filterStaticRulesCount.rulesCount
                    + filterStaticRulesCount.metadataRulesCount;
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
     *
     * @returns Promise that resolves with the result of the check.
     */
    private async canEnableStaticGroup(message: CanEnableStaticGroupMv3Message): Promise<StaticLimitsCheckResult> {
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
