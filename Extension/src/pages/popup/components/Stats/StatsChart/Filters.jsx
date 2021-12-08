import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { popupStore } from '../../../stores/PopupStore';
import { TIME_RANGES } from '../../../constants';
import { reactTranslator } from '../../../../../common/translators/reactTranslator';
import { Icon } from '../../../../common/components/ui/Icon';

export const Filters = observer(() => {
    const store = useContext(popupStore);

    const { stats } = store;

    if (!stats) {
        return null;
    }

    const statsData = store.statsDataByType;

    const existingGroups = stats.blockedGroups.filter((group) => {
        return statsData.find((data) => data.groupId === group.groupId);
    });

    const handleBlockedTypeChange = (e) => {
        store.setSelectedBlockedType(e.target.value);
    };

    const handleTimeRangeChange = (e) => {
        store.setSelectedTimeRange(e.target.value);
    };

    const timeRangeOptions = {
        [TIME_RANGES.DAY]: {
            id: TIME_RANGES.DAY,
            title: reactTranslator.getMessage('popup_statistics_time_day'),
        },
        [TIME_RANGES.WEEK]: {
            id: TIME_RANGES.WEEK,
            title: reactTranslator.getMessage('popup_statistics_time_week'),
        },
        [TIME_RANGES.MONTH]: {
            id: TIME_RANGES.MONTH,
            title: reactTranslator.getMessage('popup_statistics_time_month'),
        },
        [TIME_RANGES.YEAR]: {
            id: TIME_RANGES.YEAR,
            title: reactTranslator.getMessage('popup_statistics_time_year'),
        },
    };

    return (
        <div className="stats-chart__filters">
            <div className="stats-chart__select stats-chart__select--left">
                <Icon id="#select" classname="icon--select stats-chart__icon" />
                <select
                    className="stats-chart__select-in"
                    name="blocked-type"
                    id="blocked-type"
                    onChange={handleBlockedTypeChange}
                    value={store.selectedBlockedType}
                >
                    {existingGroups.map((group) => {
                        return (
                            <option
                                key={group.groupId}
                                value={group.groupId}
                            >
                                {group.groupName}
                            </option>
                        );
                    })}
                </select>
            </div>
            <div className="stats-chart__select stats-chart__select--left">
                <Icon id="#select" classname="icon--select stats-chart__icon" />
                <select
                    className="stats-chart__select-in"
                    name="time-range"
                    id="time-range"
                    onChange={handleTimeRangeChange}
                    value={store.selectedTimeRange}
                >
                    {Object.values(timeRangeOptions).map((timeRange) => {
                        return (
                            <option
                                key={timeRange.id}
                                value={timeRange.id}
                            >
                                {timeRange.title}
                            </option>
                        );
                    })}
                </select>
            </div>
        </div>
    );
});
