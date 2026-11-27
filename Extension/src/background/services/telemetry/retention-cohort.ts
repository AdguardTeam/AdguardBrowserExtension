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
import { TelemetryRetentionCohort } from '../../../common/telemetry';

/**
 * Number of milliseconds in one day.
 */
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Number of milliseconds in one week.
 */
const WEEK_MS = 7 * DAY_MS;

/**
 * Number of milliseconds in thirty days.
 */
const MONTH_MS = 30 * DAY_MS;

/**
 * Computes the telemetry retention cohort based on the extension install time.
 *
 * @param installTime Extension install time in milliseconds, or `undefined`
 * if it was not stored.
 * @param now Current time in milliseconds.
 *
 * @returns Retention cohort for the given install time.
 */
export const getRetentionCohort = (
    installTime: number | undefined,
    now: number,
): TelemetryRetentionCohort => {
    if (installTime === undefined) {
        return TelemetryRetentionCohort.Longtime;
    }

    const elapsed = now - installTime;

    if (elapsed < DAY_MS) {
        return TelemetryRetentionCohort.Day1;
    }

    if (elapsed < WEEK_MS) {
        return TelemetryRetentionCohort.Week1;
    }

    if (elapsed < MONTH_MS) {
        return TelemetryRetentionCohort.Month1;
    }

    return TelemetryRetentionCohort.Longtime;
};
