/**
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
import { TIME_RANGES } from '../../../constants';
import { reactTranslator } from '../../../../../common/translators/reactTranslator';
import { Select } from '../../../../common/components/ui/Select';

export const Filters = observer(() => {
    const store = useContext(popupStore);

    const { stats } = store;

    if (!stats) {
        return null;
    }

    const statsData = store.statsDataByType;

    const existingGroupsOptions = stats.blockedGroups
        .filter((group) => {
            return statsData.find((data) => data.groupId === group.groupId);
        })
        .map(({ groupId, groupName }) => ({
            value: groupId,
            title: groupName,
        }));

    const handleBlockedTypeChange = (value) => {
        store.setSelectedBlockedType(value);
    };

    const handleTimeRangeChange = (value) => {
        store.setSelectedTimeRange(value);
    };

    const timeRangeOptions = [
        {
            value: TIME_RANGES.DAY,
            title: reactTranslator.getMessage('popup_statistics_time_day'),
        },
        {
            value: TIME_RANGES.WEEK,
            title: reactTranslator.getMessage('popup_statistics_time_week'),
        },
        {
            value: TIME_RANGES.MONTH,
            title: reactTranslator.getMessage('popup_statistics_time_month'),
        },
        {
            value: TIME_RANGES.YEAR,
            title: reactTranslator.getMessage('popup_statistics_time_year'),
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
                name="blocked-type"
                handler={handleBlockedTypeChange}
                value={store.selectedBlockedType}
                options={existingGroupsOptions}
                className="stats-chart__select-in"
                popupModification
            />
            <Select
                id="time-range"
                name="time-range"
                className="stats-chart__select-in"
                handler={handleTimeRangeChange}
                value={store.selectedTimeRange}
                options={timeRangeOptions}
                popupModification
            />
        </div>
    );
});
