import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { Tab } from './Tab';
import { Actions } from '../Actions';
import { StatsTable } from '../Stats/StatsTable';
import { VIEW_STATES } from '../../constants';
import { popupStore } from '../../stores/PopupStore';

import './tabs.pcss';

export const Tabs = observer(() => {
    const store = useContext(popupStore);

    const contentMap = {
        [VIEW_STATES.ACTIONS]: <Actions />,
        [VIEW_STATES.STATS]: <StatsTable />,
    };

    const tabContent = contentMap[store.viewState];

    const handleTabClick = (viewState) => () => {
        console.log(viewState);
        store.setViewState(viewState);
    };

    return (
        <div className="tabs">
            <div className="tabs-panel">
                <Tab
                    title="Actions"
                    active={store.viewState === VIEW_STATES.ACTIONS}
                    onClick={handleTabClick(VIEW_STATES.ACTIONS)}
                />
                <Tab
                    title="Statistics"
                    active={store.viewState === VIEW_STATES.STATS}
                    onClick={handleTabClick(VIEW_STATES.STATS)}
                />
            </div>
            <div className="tab-content">{tabContent}</div>
        </div>
    );
});
