import React, { useEffect } from 'react';
import c3 from 'c3';
import 'c3/c3.css';

import { reactTranslator } from '../../../../reactCommon/reactTranslator';
import { TIME_RANGES } from '../../../constants';

import './chart.pcss';

const DAYS_OF_WEEK = [
    reactTranslator.translate('popup_statistics_week_days_mon'),
    reactTranslator.translate('popup_statistics_week_days_tue'),
    reactTranslator.translate('popup_statistics_week_days_wed'),
    reactTranslator.translate('popup_statistics_week_days_thu'),
    reactTranslator.translate('popup_statistics_week_days_fri'),
    reactTranslator.translate('popup_statistics_week_days_sat'),
    reactTranslator.translate('popup_statistics_week_days_sun'),
];

const dayOfWeekAsString = (dayIndex) => {
    return DAYS_OF_WEEK[dayIndex];
};

const MONTHS_OF_YEAR = [
    reactTranslator.translate('popup_statistics_months_jan'),
    reactTranslator.translate('popup_statistics_months_feb'),
    reactTranslator.translate('popup_statistics_months_mar'),
    reactTranslator.translate('popup_statistics_months_apr'),
    reactTranslator.translate('popup_statistics_months_may'),
    reactTranslator.translate('popup_statistics_months_jun'),
    reactTranslator.translate('popup_statistics_months_jul'),
    reactTranslator.translate('popup_statistics_months_aug'),
    reactTranslator.translate('popup_statistics_months_sep'),
    reactTranslator.translate('popup_statistics_months_oct'),
    reactTranslator.translate('popup_statistics_months_nov'),
    reactTranslator.translate('popup_statistics_months_dec'),
];

const monthsAsString = (monthIndex) => {
    return MONTHS_OF_YEAR[monthIndex];
};

const selectRequestsStatsData = (stats, range, type) => {
    const result = [];
    switch (range) {
        case TIME_RANGES.DAY:
            stats.today.forEach((d) => {
                result.push(d[type]);
            });
            break;
        case TIME_RANGES.WEEK:
            stats.lastWeek.forEach((d) => {
                result.push(d[type]);
            });
            break;
        case TIME_RANGES.MONTH:
            stats.lastMonth.forEach((d) => {
                result.push(d[type]);
            });
            break;
        case TIME_RANGES.YEAR:
            stats.lastYear.forEach((d) => {
                result.push(d[type]);
            });
            break;
        default:
            break;
    }
    return result.map((val) => (val === undefined ? 0 : val));
};

const getCategoriesLines = (statsData, range) => {
    const now = new Date();
    const day = now.getDay();
    const month = now.getMonth();
    const lastDayOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0).getDate();

    let categories = [];
    const lines = [];

    const HOURS_PER_DAY = 24;
    const DAYS_PER_WEEK = 7;
    const DAYS_PER_MONTH = 30;
    const MONTHS_PER_YEAR = 12;

    switch (range) {
        case TIME_RANGES.DAY:
            for (let i = 1; i <= HOURS_PER_DAY; i += 1) {
                if (i % 3 === 0) {
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
        case TIME_RANGES.WEEK:
            for (let i = 0; i < DAYS_PER_WEEK; i += 1) {
                categories.push(dayOfWeekAsString((day + i) % DAYS_PER_WEEK));
                lines.push({
                    value: i,
                });
            }
            break;
        case TIME_RANGES.MONTH:
            for (let i = 0; i <= DAYS_PER_MONTH; i += 1) {
                if (i % 3 === 0) {
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
        case TIME_RANGES.YEAR:
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

export const Chart = ({ stats, range, type }) => {
    useEffect(() => {
        const statsData = selectRequestsStatsData(stats, range, type);
        const categoriesLines = getCategoriesLines(statsData, range);
        const { categories } = categoriesLines;
        const { lines } = categoriesLines;

        const grad1 = '<linearGradient id="grad1" x1="50%" y1="0%" x2="50%" y2="100%">'
            + '  <stop offset="0%" style="stop-color:#73BE66;stop-opacity:1" />'
            + '  <stop offset="23%" style="stop-color:#6DBE85;stop-opacity:1" />'
            + '  <stop offset="100%" style="stop-color:#65BDA8;stop-opacity:1" />'
            + '</linearGradient>';

        c3.generate({
            bindTo: '#chart',
            size: {
                height: 230,
            },
            data: {
                columns: [
                    ['data1'].concat(statsData),
                ],
                types: {
                    data1: 'area-spline',
                },
                colors: {
                    data1: 'url(#grad1)',
                },
            },
            padding: {
                left: 15,
                right: 15,
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
                    const elementRect = element.getBoundingClientRect();
                    const elementCenterPosition = elementRect.left + (elementRect.width / 2);
                    const tooltipHalfWidth = chart.querySelector('.chart__tooltip').clientWidth / 2;
                    const tooltipLeft = elementCenterPosition - tooltipHalfWidth;
                    // eslint-disable-next-line no-undef
                    const top = d3.mouse(element)[1] - 50;
                    return {
                        top,
                        left: tooltipLeft,
                    };
                },
                contents(d) {
                    const [{ value }] = d;
                    return `<div id="tooltip" class="chart__tooltip">${value}</div>`;
                },
            },
            oninit() {
                // eslint-disable-next-line react/no-this-in-sfc
                this.svg[0][0].getElementsByTagName('defs')[0].innerHTML += grad1;
            },
        });
    }, [range, type]);

    return <div className="chart" id="chart" />;
};
