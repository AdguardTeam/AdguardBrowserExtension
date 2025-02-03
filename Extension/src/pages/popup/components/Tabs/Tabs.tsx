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

import cn from 'classnames';

import { translator } from '../../../../common/translators/translator';
import { isTransitionAppState } from '../../state-machines/app-state-machine';
import { Actions } from '../Actions';
import { StatsTable } from '../Stats/StatsTable';
import { ViewState } from '../../constants';
import { popupStore } from '../../stores/PopupStore';

import { Tab } from './Tab';

import './tabs.pcss';

export const Tabs = observer(() => {
    const store = useContext(popupStore);

    const { viewState, appState } = store;

    const contentMap = {
        [ViewState.Actions]: Actions,
        [ViewState.Stats]: StatsTable,
    };

    const tabContentClassName = cn('tabs__content', {
        'tabs__content--stats': viewState === ViewState.Stats,
        'tabs__content--has-user-rules': store.hasUserRulesToReset,
    });

    const TabContent = contentMap[viewState];

    const handleTabClick = (viewState: ViewState) => () => {
        store.setViewState(viewState);
    };

    return (
        <div
            className={cn('tabs', {
                'tabs--non-active': isTransitionAppState(appState),
            })}
        >
            <div className="tabs__panel">
                <div className="tabs__panel-wrapper">
                    <Tab
                        title={translator.getMessage('popup_tab_actions')}
                        active={viewState === ViewState.Actions}
                        onClick={handleTabClick(ViewState.Actions)}
                    />
                    <Tab
                        title={translator.getMessage('popup_tab_statistics')}
                        active={viewState === ViewState.Stats}
                        onClick={handleTabClick(ViewState.Stats)}
                    />
                </div>
            </div>
            <div
                className={tabContentClassName}
                tabIndex={TabContent === contentMap[ViewState.Stats] ? 0 : -1}
            >
                <TabContent />
            </div>
        </div>
    );
});
