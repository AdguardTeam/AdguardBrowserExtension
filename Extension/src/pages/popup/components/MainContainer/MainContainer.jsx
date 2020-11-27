import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { Main } from '../Main';
import { VIEW_STATES } from '../../constants';
import { StatsGraph } from '../Stats/StatsGraph';
import { popupStore } from '../../stores/PopupStore';

import './main-container.pcss';

export const MainContainer = observer(() => {
    const store = useContext(popupStore);

    const contentMap = {
        [VIEW_STATES.ACTIONS]: <Main />,
        [VIEW_STATES.STATS]: <StatsGraph />,
    };

    const content = contentMap[store.viewState];

    return (
        <div className="main-container">
            {content}
        </div>
    );
});
