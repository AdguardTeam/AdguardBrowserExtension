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

import React from 'react';

import c3 from 'c3';
import { cleanup, render } from '@testing-library/react';
import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

import { type GetStatisticsDataResponse } from '../../../../../../../Extension/src/background/api/page-stats';
import { Chart } from '../../../../../../../Extension/src/pages/popup/components/Stats/StatsChart/Chart';
import { TimeRange } from '../../../../../../../Extension/src/pages/popup/constants';

vi.mock('c3', () => ({
    default: { generate: vi.fn() },
}));

vi.mock('../../../../../../../Extension/src/common/translators/translator', () => ({
    translator: { getMessage: (key: string) => key },
}));

const monthLabel = (month: string): string => `popup_statistics_months_${month}`;
const dayLabel = (day: string): string => `popup_statistics_week_days_${day}`;

const createStats = (values: number[]): GetStatisticsDataResponse => ({
    today: Array.from({ length: 24 }, () => ({ Advertising: 0 })),
    lastWeek: Array.from({ length: 7 }, () => ({ Advertising: 0 })),
    lastMonth: Array.from({ length: 31 }, () => ({ Advertising: 0 })),
    lastYear: values.map((value) => ({ Advertising: value })),
    overall: [],
    blockedCategories: [],
});

const renderChart = (range: TimeRange, values: number[]) => {
    render(
        <Chart
            stats={createStats(values)}
            range={range}
            type="Advertising"
            small={false}
            isAndroidBrowser={false}
        />,
    );

    expect(c3.generate).toHaveBeenCalled();
    return vi.mocked(c3.generate).mock.calls.at(-1)![0];
};

describe('Chart category labels', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 8, 16, 12));
        vi.clearAllMocks();
    });

    afterEach(() => {
        cleanup();
        vi.useRealTimers();
    });

    it.each([
        {
            name: 'a year ending in September',
            currentMonth: 8,
            expected: [monthLabel('oct'), '11', '12', '1', '2', '3', '4', '5', '6', '7', '8', monthLabel('sep')],
        },
        {
            name: 'a year ending in January',
            currentMonth: 0,
            expected: [monthLabel('feb'), '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', monthLabel('jan')],
        },
        {
            name: 'a year ending in December',
            currentMonth: 11,
            expected: [monthLabel('jan'), '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', monthLabel('dec')],
        },
        {
            name: 'one month',
            currentMonth: 8,
            expected: [monthLabel('sep')],
        },
        {
            name: 'two months across a year boundary',
            currentMonth: 0,
            expected: [monthLabel('dec'), monthLabel('jan')],
        },
        {
            name: 'three months across a year boundary',
            currentMonth: 0,
            expected: [monthLabel('nov'), '12', monthLabel('jan')],
        },
    ])('formats $name without changing the data', ({ currentMonth, expected }) => {
        vi.setSystemTime(new Date(2026, currentMonth, 16, 12));
        const values = Array.from({ length: expected.length }, (_, index) => index + 1);

        const options = renderChart(TimeRange.Year, values);

        expect(options.axis?.x?.categories).toEqual(expected);
        expect(options.data.columns).toEqual([['data1', ...values]]);
    });

    it('keeps month labels when all counts are zero', () => {
        const options = renderChart(TimeRange.Year, [0, 0, 0]);

        expect(options.axis?.x?.categories).toEqual([monthLabel('jul'), '8', monthLabel('sep')]);
        expect(options.data.columns).toEqual([['data1', 0, 0, 0]]);
    });

    it.each([
        {
            range: TimeRange.Day,
            expected: [
                '', '', '15', '', '', '18', '', '', '21', '', '', '0',
                '', '', '3', '', '', '6', '', '', '9', '', '', '12',
            ],
        },
        {
            range: TimeRange.Week,
            expected: ['thu', 'fri', 'sat', 'sun', 'mon', 'tue', 'wed'].map(dayLabel),
        },
        {
            range: TimeRange.Month,
            expected: [
                '17', '', '', '20', '', '', '23', '', '', '26', '', '', '29', '', '', '1',
                '', '', '4', '', '', '7', '', '', '10', '', '', '13', '', '', '16',
            ],
        },
    ])('preserves labels for $range', ({ range, expected }) => {
        const options = renderChart(range, [0, 0, 0]);

        expect(options.axis?.x?.categories).toEqual(expected);
    });
});
