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
import {
    describe,
    expect,
    test,
} from 'vitest';

import { getRetentionCohort } from '../../../../Extension/src/background/services/telemetry/retention-cohort';
import { TelemetryRetentionCohort } from '../../../../Extension/src/common/telemetry';

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;
const MONTH_MS = 30 * DAY_MS;
const NOW = 1_000_000_000;

describe('getRetentionCohort', () => {
    test('returns day 1 cohort for zero elapsed time', () => {
        expect(getRetentionCohort(NOW, NOW)).toBe(TelemetryRetentionCohort.Day1);
    });

    test('returns day 1 cohort just before one day', () => {
        expect(getRetentionCohort(NOW - (DAY_MS - 1), NOW)).toBe(TelemetryRetentionCohort.Day1);
    });

    test('returns week 1 cohort at exactly one day', () => {
        expect(getRetentionCohort(NOW - DAY_MS, NOW)).toBe(TelemetryRetentionCohort.Week1);
    });

    test('returns week 1 cohort just before seven days', () => {
        expect(getRetentionCohort(NOW - (WEEK_MS - 1), NOW)).toBe(TelemetryRetentionCohort.Week1);
    });

    test('returns month 1 cohort at exactly seven days', () => {
        expect(getRetentionCohort(NOW - WEEK_MS, NOW)).toBe(TelemetryRetentionCohort.Month1);
    });

    test('returns month 1 cohort just before thirty days', () => {
        expect(getRetentionCohort(NOW - (MONTH_MS - 1), NOW)).toBe(TelemetryRetentionCohort.Month1);
    });

    test('returns longtime cohort at exactly thirty days', () => {
        expect(getRetentionCohort(NOW - MONTH_MS, NOW)).toBe(TelemetryRetentionCohort.Longtime);
    });

    test('returns longtime cohort when install time is undefined', () => {
        expect(getRetentionCohort(undefined, NOW)).toBe(TelemetryRetentionCohort.Longtime);
    });

    test('returns day 1 cohort when install time is later than now', () => {
        expect(getRetentionCohort(NOW + DAY_MS, NOW)).toBe(TelemetryRetentionCohort.Day1);
    });
});
