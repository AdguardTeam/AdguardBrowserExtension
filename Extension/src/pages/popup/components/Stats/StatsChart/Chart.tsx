/**
 * Copyright (c) 2015-2025 Adguard Software Ltd.
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

import React, {
    useEffect,
    useState,
    useRef,
} from 'react';

import c3 from 'c3';
import 'c3/c3.css';

import { translator } from '../../../../../common/translators/translator';
import { TimeRange } from '../../../constants';
import { useObservePopupHeight, POPUP_DEFAULT_HEIGHT } from '../../../hooks/useObservePopupHeight';
import { type GetStatisticsDataResponse } from '../../../../../background/api/page-stats';

import './chart.pcss';

/**
 * Number of hours to show per category label on day chart.
 */
const HOURS_PER_CATEGORY_LABEL = 3;

/**
 * Vertical offset for tooltip positioning.
 */
const TOOLTIP_OFFSET_PX = 10;

/**
 * Horizontal padding for chart.
 */
const CHART_PADDING_PX = 15;

/**
 * Height difference when chart is in small mode.
 * Based on height of one action button.
 */
const SMALL_MODE_HEIGHT_DIFF_PX = 40;

const DAYS_OF_WEEK = [
    translator.getMessage('popup_statistics_week_days_mon'),
    translator.getMessage('popup_statistics_week_days_tue'),
    translator.getMessage('popup_statistics_week_days_wed'),
    translator.getMessage('popup_statistics_week_days_thu'),
    translator.getMessage('popup_statistics_week_days_fri'),
    translator.getMessage('popup_statistics_week_days_sat'),
    translator.getMessage('popup_statistics_week_days_sun'),
];

/**
 * Get localized day of week string by index.
 *
 * @param dayIndex Day index (0-6, where 0 is Monday).
 *
 * @returns Localized day name.
 */
const dayOfWeekAsString = (dayIndex: number): string => {
    return DAYS_OF_WEEK[dayIndex] || '';
};

const MONTHS_OF_YEAR = [
    translator.getMessage('popup_statistics_months_jan'),
    translator.getMessage('popup_statistics_months_feb'),
    translator.getMessage('popup_statistics_months_mar'),
    translator.getMessage('popup_statistics_months_apr'),
    translator.getMessage('popup_statistics_months_may'),
    translator.getMessage('popup_statistics_months_jun'),
    translator.getMessage('popup_statistics_months_jul'),
    translator.getMessage('popup_statistics_months_aug'),
    translator.getMessage('popup_statistics_months_sep'),
    translator.getMessage('popup_statistics_months_oct'),
    translator.getMessage('popup_statistics_months_nov'),
    translator.getMessage('popup_statistics_months_dec'),
];

/**
 * Get localized month string by index.
 *
 * @param monthIndex Month index (0-11, where 0 is January).
 *
 * @returns Localized month name.
 */
const monthsAsString = (monthIndex: number): string => {
    return MONTHS_OF_YEAR[monthIndex] || '';
};

/**
 * Select statistics data based on time range and type.
 *
 * @param stats Statistics object containing data for different time ranges.
 * @param range Time range to select data from.
 * @param type Type of statistics category to extract.
 *
 * @returns Array of statistics values.
 */
const selectRequestsStatsData = (stats: GetStatisticsDataResponse, range: TimeRange, type: string): number[] => {
    const result: number[] = [];
    switch (range) {
        case TimeRange.Day:
            stats.today.forEach((d) => {
                result.push(d[type] ?? 0);
            });
            break;
        case TimeRange.Week:
            stats.lastWeek.forEach((d) => {
                result.push(d[type] ?? 0);
            });
            break;
        case TimeRange.Month:
            stats.lastMonth.forEach((d) => {
                result.push(d[type] ?? 0);
            });
            break;
        case TimeRange.Year:
            stats.lastYear.forEach((d) => {
                result.push(d[type] ?? 0);
            });
            break;
        default:
            break;
    }
    return result;
};

/**
 * Generate chart categories and grid lines based on time range.
 *
 * @param statsData Array of statistics values.
 * @param range Time range for the chart.
 *
 * @returns Object containing categories labels and grid line positions.
 *
 * @throws Error if range type is invalid.
 */
const getCategoriesLines = (
    statsData: number[],
    range: TimeRange,
): {
    categories: string[];
    lines: Array<{ value: number }>;
} => {
    const now = new Date();
    const day = now.getDay();
    const month = now.getMonth();
    const lastDayOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0).getDate();

    let categories: string[] = [];
    const lines: Array<{ value: number }> = [];

    const HOURS_PER_DAY = 24;
    const DAYS_PER_WEEK = 7;
    const DAYS_PER_MONTH = 30;
    const MONTHS_PER_YEAR = 12;

    switch (range) {
        case TimeRange.Day:
            for (let i = 1; i <= HOURS_PER_DAY; i += 1) {
                if (i % HOURS_PER_CATEGORY_LABEL === 0) {
                    const hour = (i + now.getHours()) % HOURS_PER_DAY;
                    categories.push(hour.toString());
                    lines.push({
                        value: i - 1,
                    });
                } else {
                    categories.push('');
                }
            }
            break;
        case TimeRange.Week:
            for (let i = 0; i < DAYS_PER_WEEK; i += 1) {
                categories.push(dayOfWeekAsString((day + i) % DAYS_PER_WEEK));
                lines.push({
                    value: i,
                });
            }
            break;
        case TimeRange.Month:
            for (let i = 0; i <= DAYS_PER_MONTH; i += 1) {
                if (i % HOURS_PER_CATEGORY_LABEL === 0) {
                    const c = ((i + now.getDate()) % lastDayOfPrevMonth) + 1;
                    categories.push(c.toString());
                    lines.push({
                        value: i,
                    });
                } else {
                    categories.push('');
                }
            }
            break;
        case TimeRange.Year:
            for (let i = 0; i <= MONTHS_PER_YEAR; i += 1) {
                categories.push(monthsAsString((month + i) % MONTHS_PER_YEAR));
                categories = categories.slice(-statsData.length);
                lines.push({
                    value: i,
                });
            }
            break;
        default:
            throw new Error(`Wrong range type: ${range}`);
    }

    return {
        categories,
        lines,
    };
};

/**
 * Calculate chart height based on popup height.
 *
 * Adjust height of chart proportionally if actual height of popup (popupHeight)
 * becomes smaller that default height of popup in desktops (POPUP_DEFAULT_HEIGHT).
 * Design specified height with value DEFAULT_CHART_HEIGHT will be base
 * with min MIN_CHART_HEIGHT height.
 * This is needed for extension running on mobile browsers where popup height is dynamic.
 *
 * @param popupHeight Height of the popup (Default: window.innerHeight).
 *
 * @returns Height of the chart.
 */
const calculateChartHeight = (popupHeight = window.innerHeight) => {
    /**
     * Default size of chart in desktop extension.
     */
    const DEFAULT_CHART_HEIGHT = 218;

    /**
     * Min height of chart.
     */
    const MIN_CHART_HEIGHT = 168;

    return Math.max(
        MIN_CHART_HEIGHT,
        DEFAULT_CHART_HEIGHT - (POPUP_DEFAULT_HEIGHT - popupHeight),
    );
};

/**
 * Statistics chart component.
 *
 * Displays a spline chart with statistics data based on selected time range.
 * Supports responsive height adjustment for mobile browsers.
 */
export const Chart = ({
    stats,
    range,
    type,
    small,
    isAndroidBrowser,
}: {
    stats: GetStatisticsDataResponse;
    range: TimeRange;
    type: string;
    small: boolean;
    isAndroidBrowser: boolean;
}) => {
    const [chartHeight, setChartHeight] = useState(calculateChartHeight());
    const mouseYRef = useRef<number>(0);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            mouseYRef.current = e.clientY;
        };

        document.addEventListener('mousemove', handleMouseMove);

        const statsData = selectRequestsStatsData(stats, range, type);
        const categoriesLines = getCategoriesLines(statsData, range);
        const { categories } = categoriesLines;
        const { lines } = categoriesLines;

        const grad1 = '<linearGradient id="grad1" x1="50%" y1="0%" x2="50%" y2="100%">'
            + '  <stop offset="0%" style="stop-color:#73BE66;stop-opacity:1" />'
            + '  <stop offset="23%" style="stop-color:#6DBE85;stop-opacity:1" />'
            + '  <stop offset="100%" style="stop-color:#65BDA8;stop-opacity:1" />'
            + '</linearGradient>';

        const heightDiff = small ? SMALL_MODE_HEIGHT_DIFF_PX : 0;

        c3.generate({
            bindto: '#chart',
            size: {
                height: chartHeight - heightDiff,
            },
            data: {
                columns: [
                    ['data1', ...statsData],
                ],
                types: {
                    data1: 'area-spline',
                },
                colors: {
                    data1: 'url(#grad1)',
                },
            },
            padding: {
                left: CHART_PADDING_PX,
                right: CHART_PADDING_PX,
            },
            axis: {
                x: {
                    show: true,
                    type: 'category',
                    categories,
                    tick: {
                        outer: false,
                        multiline: false,
                    },
                },
                y: {
                    show: false,
                },
            },
            legend: {
                show: false,
            },
            grid: {
                lines: {
                    front: false,
                },
                x: {
                    lines,
                },
                focus: {
                    show: true,
                },
            },
            spline: {
                interpolation: {
                    type: 'basis',
                },
            },
            point: {
                show: false,
            },
            tooltip: {
                position(data, width, height, element) {
                    const chart = document.querySelector('#chart');
                    if (!chart) {
                        return { top: 0, left: 0 };
                    }
                    const elementRect = element.getBoundingClientRect();
                    const chartRect = chart.getBoundingClientRect();

                    const elementCenter = elementRect.left + elementRect.width / 2;
                    const left = elementCenter - chartRect.left - (width / 2);

                    const mouseY = mouseYRef.current;
                    const top = mouseY - chartRect.top - height - TOOLTIP_OFFSET_PX;

                    return {
                        top,
                        left,
                    };
                },
                contents(d: Array<{ value: number }>) {
                    const value = d[0]?.value ?? 0;

                    return `<div id="tooltip" class="chart__tooltip">${value}</div>`;
                },
            },
            oninit() {
                // eslint-disable-next-line react/no-this-in-sfc
                this.svg[0][0].getElementsByTagName('defs')[0].innerHTML += grad1;
            },
        });

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
        };
    }, [range, type, stats, small, chartHeight]);

    /**
     * Handle popup resize.
     *
     * @param newPopupHeight New height of the popup.
     */
    const handleResize = (newPopupHeight: number) => {
        setChartHeight(calculateChartHeight(newPopupHeight));
    };

    /**
     * Handle popup resize cleanup.
     */
    const handleCleanUp = () => {
        setChartHeight(calculateChartHeight());
    };

    /**
     * Update chart height on Android browsers based on window height.
     */
    useObservePopupHeight(isAndroidBrowser, handleResize, handleCleanUp);

    return <div className="chart" id="chart" aria-hidden="true" />;
};
