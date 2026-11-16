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

import { getZodErrorMessage } from '../../common/error';
import { logger } from '../../common/logger';
import {
    type AutoDisableFiltersStorageData,
    type RegularFilterMetadata,
    SettingOption,
} from '../schema';
import {
    autoDisableFiltersStorage,
    filterStateStorage,
    metadataStorage,
    settingsStorage,
} from '../storages';
import { FiltersApi } from '../api/filters/main';
import { engine } from '../engine';
import { I18n } from '../utils/i18n';
import { getUtcDate } from '../utils/date-utils';

/**
 * Number of active days without visits to any language of a filter after
 * which the filter is considered unused.
 */
export const UNUSED_FILTERS_THRESHOLD_ACTIVE_DAYS = 30;

/**
 * Applies a processed page to the tracking state.
 *
 * A page on a UTC date later than the last counted one increases the active
 * day counter by one. Pages on already counted or earlier dates keep the
 * counter unchanged, so missed days are never backfilled and a clock rollback
 * neither decreases nor repeats it. A detected language stores the current
 * counter value.
 *
 * @param state Current tracking state.
 * @param language Detected page language; `undefined` when it was not detected.
 * @param timestamp Page processing timestamp.
 *
 * @returns Updated state or the same state when nothing changed.
 */
export const applyProcessedPage = (
    state: AutoDisableFiltersStorageData,
    language: string | undefined,
    timestamp: number,
): AutoDisableFiltersStorageData => {
    const currentDate = getUtcDate(timestamp);
    const shouldCountDay = state.lastCountedDayUtc === null || currentDate > state.lastCountedDayUtc;
    const activeDayCounter = shouldCountDay ? state.activeDayCounter + 1 : state.activeDayCounter;
    const shouldRecordLanguage = language !== undefined
        && language !== ''
        && state.lastVisitedActiveDayByLanguage[language] !== activeDayCounter;

    if (!shouldCountDay && !shouldRecordLanguage) {
        return state;
    }

    const nextState: AutoDisableFiltersStorageData = {
        ...state,
        activeDayCounter,
        lastCountedDayUtc: shouldCountDay ? currentDate : state.lastCountedDayUtc,
    };

    if (shouldRecordLanguage) {
        nextState.lastVisitedActiveDayByLanguage = {
            ...state.lastVisitedActiveDayByLanguage,
            [language]: activeDayCounter,
        };
    }

    return nextState;
};

/**
 * Returns ids of enabled language-specific filters that have no visits in
 * any of their languages for at least
 * {@link UNUSED_FILTERS_THRESHOLD_ACTIVE_DAYS} active days.
 *
 * The filter age is the difference between the current active day counter
 * and the latest active day when it was enabled or any of its languages was detected.
 * Languages without visits and filters without a recorded enable use a baseline of 0.
 * If there is no language history at all, returns an empty list: right after
 * the extension update there is nothing to compare against yet.
 *
 * @param filters Regular filters metadata.
 * @param enabledFilterIds Ids of currently enabled filters.
 * @param state Tracking state.
 *
 * @returns Ids of unused language-specific filters.
 */
export const findUnusedLanguageFilterIds = (
    filters: RegularFilterMetadata[],
    enabledFilterIds: number[],
    state: AutoDisableFiltersStorageData,
): number[] => {
    const { activeDayCounter, lastVisitedActiveDayByLanguage, enabledAtActiveDayByFilter } = state;
    const languageVisits = Object.entries(lastVisitedActiveDayByLanguage);

    if (languageVisits.length === 0 || activeDayCounter < UNUSED_FILTERS_THRESHOLD_ACTIVE_DAYS) {
        return [];
    }

    const enabledFilterIdsSet = new Set(enabledFilterIds);
    const recentVisitedLanguages = languageVisits
        .filter(([, activeDay]) => activeDayCounter - activeDay < UNUSED_FILTERS_THRESHOLD_ACTIVE_DAYS)
        .map(([language]) => language);

    return filters
        .filter((filter) => enabledFilterIdsSet.has(filter.filterId)
            && filter.languages.length > 0
            && activeDayCounter - (enabledAtActiveDayByFilter[filter.filterId] ?? 0)
                >= UNUSED_FILTERS_THRESHOLD_ACTIVE_DAYS
            && !recentVisitedLanguages.some((language) => I18n.find(filter.languages, language) !== null))
        .map((filter) => filter.filterId);
};

/**
 * Service for auto-disabling language-specific filters that were not used
 * for a long time.
 *
 * Filter age is measured in active days: UTC dates with at least one processed
 * page. Days without processed pages do not consume the allowance.
 *
 * @note This service is only used in Manifest V2 extensions: MV3 never
 * auto-enables language filters by page language.
 */
export class AutoDisableFiltersService {
    /**
     * How often the check for unused language filters runs.
     * 1 hour.
     */
    private static readonly CHECK_PERIOD_MS = 60 * 60 * 1000;

    /**
     * Timer id of the scheduled check.
     */
    private static timerId: number | null = null;

    /**
     * Starts periodic checking of unused language filters.
     */
    public static init(): void {
        if (AutoDisableFiltersService.timerId !== null) {
            // eslint-disable-next-line no-restricted-globals
            self.clearTimeout(AutoDisableFiltersService.timerId);
            AutoDisableFiltersService.timerId = null;
        }

        AutoDisableFiltersService.runCheck();
    }

    /**
     * Records a processed page: counts its active day and remembers the
     * detected language of the page.
     *
     * @param language Detected page language; `undefined` when it was not detected.
     * @param now Page processing timestamp.
     */
    public static async recordVisit(language?: string, now: number = Date.now()): Promise<void> {
        try {
            await autoDisableFiltersStorage.update((state) => applyProcessedPage(state, language, now));
        } catch (e) {
            logger.error('[ext.AutoDisableFiltersService.recordVisit]: cannot record visit:', getZodErrorMessage(e));
        }
    }

    /**
     * Disables enabled language-specific filters that have no visits in any of
     * their languages for {@link UNUSED_FILTERS_THRESHOLD_ACTIVE_DAYS} active
     * days, marks them as disabled as unused and adds them to the pending
     * notification.
     *
     * Does nothing while automatic filter selection is turned off.
     */
    public static async checkAndDisableUnusedFilters(): Promise<void> {
        if (settingsStorage.get(SettingOption.DisableDetectFilters)) {
            return;
        }

        await autoDisableFiltersStorage.update((state) => {
            if (settingsStorage.get(SettingOption.DisableDetectFilters)) {
                return state;
            }

            const unusedFilterIds = findUnusedLanguageFilterIds(
                metadataStorage.getFilters(),
                FiltersApi.getEnabledFilters(),
                state,
            );

            if (unusedFilterIds.length === 0) {
                return state;
            }

            // Disable in the same synchronous step as the check,
            // so a manual change in between cannot be reported as automatic.
            filterStateStorage.disableFiltersAsUnused(unusedFilterIds);
            const filters = unusedFilterIds
                .map((id) => `${id} (enabled at active day ${state.enabledAtActiveDayByFilter[id] ?? 0})`)
                .join(', ');
            logger.info(`[ext.AutoDisableFiltersService.checkAndDisableUnusedFilters]: no visits in filter languages during the last ${UNUSED_FILTERS_THRESHOLD_ACTIVE_DAYS} active days, active day ${state.activeDayCounter}, disabling filters: ${filters}`);
            engine.debounceUpdate();

            return {
                ...state,
                pendingNotificationFilterIds: [...new Set([...state.pendingNotificationFilterIds, ...unusedFilterIds])],
            };
        });
    }

    /**
     * Runs the check and schedules the next one.
     */
    private static async runCheck(): Promise<void> {
        try {
            await AutoDisableFiltersService.checkAndDisableUnusedFilters();
        } catch (e) {
            logger.error('[ext.AutoDisableFiltersService.runCheck]: cannot check unused language filters:', getZodErrorMessage(e));
        } finally {
            if (AutoDisableFiltersService.timerId !== null) {
                // eslint-disable-next-line no-restricted-globals
                self.clearTimeout(AutoDisableFiltersService.timerId);
            }

            // eslint-disable-next-line no-restricted-globals
            AutoDisableFiltersService.timerId = self.setTimeout(() => {
                AutoDisableFiltersService.runCheck();
            }, AutoDisableFiltersService.CHECK_PERIOD_MS);
        }
    }
}
