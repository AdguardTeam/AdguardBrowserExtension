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

import cn from 'classnames';

import { isTransitionAppState } from '../../../state-machines/app-state-machine';
import { popupStore } from '../../../stores/PopupStore';

import { Filters } from './Filters';
import { Chart } from './Chart';

import './stats-chart.pcss';

export const StatsChart = observer(() => {
    const store = useContext(popupStore);

    const { stats, appState, isAndroidBrowser } = store;

    if (!stats) {
        return null;
    }

    return (
        <div
            className={cn('stats-chart', {
                'stats-chart--non-active': isTransitionAppState(appState),
            })}
        >
            <Filters />
            <Chart
                stats={stats}
                range={store.selectedTimeRange}
                type={store.selectedBlockedType}
                small={store.hasUserRulesToReset}
                isAndroidBrowser={isAndroidBrowser}
            />
        </div>
    );
});
