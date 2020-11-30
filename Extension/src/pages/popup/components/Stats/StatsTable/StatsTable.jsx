import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { popupStore } from '../../../stores/PopupStore';

import './stats-table.pcss';

export const StatsTable = observer(() => {
    const store = useContext(popupStore);

    const { statsDataByType } = store;

    if (!statsDataByType) {
        return null;
    }

    const statsDataByTypeWithoutTotal = statsDataByType
        .filter((group) => group.groupId !== store.TOTAL_BLOCKED_GROUP_ID);

    if (statsDataByTypeWithoutTotal.length === 0) {
        return null;
    }

    const renderStatsByType = statsDataByTypeWithoutTotal.map((stats) => {
        return (
            <li key={stats.groupId}>
                <span className="group-name">{stats.groupName}</span>
                <span className="group-blocked">{stats.blocked}</span>
            </li>
        );
    });

    return (
        <div className="stats">
            <ul>
                {renderStatsByType}
            </ul>
        </div>
    );
});
