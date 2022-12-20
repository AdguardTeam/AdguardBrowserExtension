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
