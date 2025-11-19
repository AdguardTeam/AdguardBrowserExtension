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

import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { popupStore } from '../../../stores/PopupStore';
import { TimeRange } from '../../../constants';
import { translator } from '../../../../../common/translators/translator';
import { Select } from '../../../../common/components/ui/Select';

export const Filters = observer(() => {
    const store = useContext(popupStore);

    const { stats } = store;

    if (!stats) {
        return null;
    }

    const statsData = store.statsDataByType;

    if (!statsData) {
        return null;
    }

    const existingGroupsOptions = stats.blockedCategories
        .filter((group) => {
            return statsData.find((data) => data.categoryId === group.categoryId);
        })
        .map(({ categoryId, categoryName }) => ({
            value: categoryId,
            title: categoryName,
        }));

    const handleBlockedTypeChange = (value: string) => {
        store.setSelectedBlockedType(value);
    };

    const handleTimeRangeChange = (value: string) => {
        store.setSelectedTimeRange(value as TimeRange);
    };

    const timeRangeOptions = [
        {
            value: TimeRange.Day,
            title: translator.getMessage('popup_statistics_time_day'),
        },
        {
            value: TimeRange.Week,
            title: translator.getMessage('popup_statistics_time_week'),
        },
        {
            value: TimeRange.Month,
            title: translator.getMessage('popup_statistics_time_month'),
        },
        {
            value: TimeRange.Year,
            title: translator.getMessage('popup_statistics_time_year'),
        },
    ];

    /*
     * We cannot use native select because there is a bug in chromium browsers:
     * after a mouse click, chromium browsers activate the ":focus-visible" pseudo-class,
     * which should only be activated when selecting with the keyboard and not the mouse.
     * @see https://bugs.chromium.org/p/chromium/issues/detail?id=1383062
     */
    return (
        <div className="stats-chart__filters">
            <Select
                id="blocked-type"
                handler={handleBlockedTypeChange}
                value={store.selectedBlockedType}
                options={existingGroupsOptions}
                popupModification
                label={translator.getMessage('popup_statistics_category_label')}
            />
            <Select
                id="time-range"
                handler={handleTimeRangeChange}
                value={store.selectedTimeRange}
                options={timeRangeOptions}
                popupModification
                label={translator.getMessage('popup_statistics_time_label')}
            />
        </div>
    );
});
