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

import { Tab } from './Tab';
import { Actions } from '../Actions';
import { StatsTable } from '../Stats/StatsTable';
import { VIEW_STATES } from '../../constants';
import { popupStore } from '../../stores/PopupStore';
import { reactTranslator } from '../../../../common/translators/reactTranslator';

import './tabs.pcss';

export const Tabs = observer(() => {
    const store = useContext(popupStore);

    const contentMap = {
        [VIEW_STATES.ACTIONS]: Actions,
        [VIEW_STATES.STATS]: StatsTable,
    };

    const TabContent = contentMap[store.viewState];

    const handleTabClick = (viewState) => () => {
        store.setViewState(viewState);
    };

    return (
        <div className="tabs">
            <div className="tabs__panel">
                <Tab
                    title={reactTranslator.getMessage('popup_tab_actions')}
                    active={store.viewState === VIEW_STATES.ACTIONS}
                    onClick={handleTabClick(VIEW_STATES.ACTIONS)}
                />
                <Tab
                    title={reactTranslator.getMessage('popup_tab_statistics')}
                    active={store.viewState === VIEW_STATES.STATS}
                    onClick={handleTabClick(VIEW_STATES.STATS)}
                />
            </div>
            <div
                className="tabs__content"
                tabIndex={TabContent === contentMap[VIEW_STATES.STATS] ? 0 : -1}
            >
                <TabContent />
            </div>
        </div>
    );
});
