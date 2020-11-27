import React, { useEffect } from 'react';
import c3 from 'c3';

import { reactTranslator } from '../../../../reactCommon/reactTranslator';
import { i18n } from '../../../../../common/i18n';
import { TIME_RANGES } from '../../../constants';

import 'c3/c3.css';

const DAYS_OF_WEEK = [
    i18n.getMessage('popup_statistics_week_days_mon'),
    i18n.getMessage('popup_statistics_week_days_tue'),
    i18n.getMessage('popup_statistics_week_days_wed'),
    i18n.getMessage('popup_statistics_week_days_thu'),
    i18n.getMessage('popup_statistics_week_days_fri'),
    i18n.getMessage('popup_statistics_week_days_sat'),
    i18n.getMessage('popup_statistics_week_days_sun'),
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
        case 'day':
            stats.today.forEach((d) => {
                result.push(d[type]);
            });
            break;
        case 'week':
            stats.lastWeek.forEach((d) => {
                result.push(d[type]);
            });
            break;
        case 'month':
            stats.lastMonth.forEach((d) => {
                result.push(d[type]);
            });
            break;
        case 'year':
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
    switch (range) {
        case TIME_RANGES.DAY:
            for (let i = 1; i < 25; i += 1) {
                if (i % 3 === 0) {
                    const hour = (i + now.getHours()) % 24;
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
            for (let i = 0; i < 7; i += 1) {
                categories.push(dayOfWeekAsString((day + i) % 7));
                lines.push({
                    value: i,
                });
            }

            break;
        case TIME_RANGES.MONTH:
            for (let i = 0; i < 31; i += 1) {
                if (i % 3 === 0) {
                    const c = (i + now.getDate()) % lastDayOfPrevMonth + 1;
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
            for (let i = 0; i < 13; i += 1) {
                categories.push(monthsAsString((month + i) % 12));
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
                    const { value } = d[0];
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
