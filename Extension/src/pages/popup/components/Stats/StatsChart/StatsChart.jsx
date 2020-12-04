import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { popupStore } from '../../../stores/PopupStore';
import { Filters } from './Filters';
import { Chart } from './Chart';

import './stats-chart.pcss';

export const StatsChart = observer(() => {
    const store = useContext(popupStore);

    const { stats } = store;

    if (!stats) {
        return null;
    }

    return (
        <div className="stats-chart">
            <Filters />
            <Chart
                stats={stats}
                range={store.selectedTimeRange}
                type={store.selectedBlockedType}
            />
        </div>
    );
});
