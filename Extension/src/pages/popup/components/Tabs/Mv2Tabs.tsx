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

import { translator } from '../../../../common/translators/translator';
import { Actions } from '../Actions';
import { StatsTable } from '../Stats/StatsTable';
import { ViewState } from '../../constants';
import { popupStore } from '../../stores/PopupStore';

import { Tab } from './Tab';

import './tabs.pcss';

const Mv2Tabs = observer(() => {
    const store = useContext(popupStore);

    const contentMapMv2 = {
        [ViewState.Actions]: Actions,
        [ViewState.Stats]: StatsTable,
    };

    const TabContentMv2 = contentMapMv2[store.viewState];

    const handleTabClick = (viewState: string) => () => {
        store.setViewState(viewState);
    };

    return (
        <div className="tabs">
            <div className="tabs__panel">
                <Tab
                    title={translator.getMessage('popup_tab_actions')}
                    active={store.viewState === ViewState.Actions}
                    onClick={handleTabClick(ViewState.Actions)}
                />
                <Tab
                    title={translator.getMessage('popup_tab_statistics')}
                    active={store.viewState === ViewState.Stats}
                    onClick={handleTabClick(ViewState.Stats)}
                />
            </div>
            <div
                className="tabs__content"
                tabIndex={TabContentMv2 === contentMapMv2[ViewState.Stats] ? 0 : -1}
            >
                <TabContentMv2 />
            </div>
        </div>
    );
});

export { Mv2Tabs as Tabs };
