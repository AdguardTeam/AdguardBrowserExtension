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
import zod from 'zod';

/**
 * Default state of the language filters auto-disable feature.
 */
export const defaultAutoDisableFiltersState = {
    /**
     * Number of active days since the observation started.
     */
    activeDayCounter: 0,

    /**
     * Last UTC date which increased the active day counter, `YYYY-MM-DD`.
     */
    lastCountedDayUtc: null,

    /**
     * Last active day when each language was detected.
     */
    lastVisitedActiveDayByLanguage: {},

    /**
     * Active day when each language filter was last enabled.
     */
    enabledAtActiveDayByFilter: {},

    /**
     * Ids of language filters disabled as unused which are not shown
     * to the user yet.
     */
    pendingNotificationFilterIds: [],
};

/**
 * Runtime validator for the language filters auto-disable state.
 */
export const autoDisableFiltersStorageDataValidator = zod.object({
    /**
     * Number of active days since the observation started.
     */
    activeDayCounter: zod.number().int().nonnegative()
        .default(defaultAutoDisableFiltersState.activeDayCounter),

    /**
     * Last UTC date which increased the active day counter, `YYYY-MM-DD`.
     */
    lastCountedDayUtc: zod.string().nullable()
        .default(defaultAutoDisableFiltersState.lastCountedDayUtc),

    /**
     * Last active day when each language was detected.
     *
     * Key is a language code returned by the language detector,
     * for example `tr` or `zh-CN`.
     */
    lastVisitedActiveDayByLanguage: zod.record(zod.string(), zod.number().int().nonnegative())
        .default(defaultAutoDisableFiltersState.lastVisitedActiveDayByLanguage),

    /**
     * Active day of the latest transition to enabled, keyed by filter ID.
     */
    enabledAtActiveDayByFilter: zod.record(zod.string(), zod.number().int().nonnegative())
        .default(defaultAutoDisableFiltersState.enabledAtActiveDayByFilter),

    /**
     * Ids of language filters disabled as unused which are not shown
     * to the user yet.
     */
    pendingNotificationFilterIds: zod.array(zod.number())
        .default(defaultAutoDisableFiltersState.pendingNotificationFilterIds),
});

/**
 * State of the language filters auto-disable feature.
 */
export type AutoDisableFiltersStorageData = zod.infer<typeof autoDisableFiltersStorageDataValidator>;
