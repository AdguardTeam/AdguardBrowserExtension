import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { Main } from '../Main';
import { VIEW_STATES } from '../../constants';
import { StatsChart } from '../Stats/StatsChart';
import { popupStore } from '../../stores/PopupStore';

import './main-container.pcss';

export const MainContainer = observer(() => {
    const store = useContext(popupStore);

    const contentMap = {
        [VIEW_STATES.ACTIONS]: Main,
        [VIEW_STATES.STATS]: StatsChart,
    };

    const Content = contentMap[store.viewState];

    return (
        <div className="main-container">
            <Content />
        </div>
    );
});
