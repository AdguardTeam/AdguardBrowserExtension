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

/* eslint-disable jsx-a11y/no-noninteractive-tabindex */
import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { popupStore } from '../../../stores/PopupStore';

import './stats-table.pcss';

export const STATS_TAB_ID = 'stats-tab';
export const STATS_PANEL_ID = 'stats-panel';

export const StatsTable = observer(() => {
    const store = useContext(popupStore);

    const { statsDataByType } = store;

    if (!statsDataByType) {
        return null;
    }

    const statsDataByTypeWithoutTotal = statsDataByType
        .filter((group) => group.categoryId !== store.TOTAL_BLOCKED_GROUP_ID);

    if (statsDataByTypeWithoutTotal.length === 0) {
        return null;
    }

    const renderStatsByType = statsDataByTypeWithoutTotal
        .sort((a, b) => b.blocked - a.blocked)
        .map((stats) => {
            return (
                <li className="stats__item" key={stats.categoryId}>
                    <span className="stats__name">{stats.categoryName}</span>
                    <span className="stats__value">{new Intl.NumberFormat().format(stats.blocked)}</span>
                </li>
            );
        });

    return (
        <div
            id={STATS_PANEL_ID}
            role="tabpanel"
            className="stats"
            aria-labelledby={STATS_TAB_ID}
            // A11Y: Allow focus on the tab panel so screen reader can read the content properly
            tabIndex={0}
        >
            <ul className="stats__list">
                {renderStatsByType}
            </ul>
        </div>
    );
});
