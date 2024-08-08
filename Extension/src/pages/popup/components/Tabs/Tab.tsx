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

import React from 'react';

import cn from 'classnames';

import { ViewState } from '../../constants';
import { addPopoverForComingSoonElement } from '../../../common/components/react-helpers';

type TabParams = {
    /**
     * Tab title.
     */
    title: string,

    /**
     * Tab id.
     */
    id: string,

    /**
     * Whether the tab is active.
     */
    active: boolean,

    /**
     * Click handler.
     */
    onClick: () => void,
};

export const Tab = ({
    title,
    id,
    active,
    onClick,
}: TabParams) => {
    const tabClass = cn('tabs__tab', { 'tabs__tab--active': active });

    const Tab = (
        <button
            type="button"
            className={tabClass}
            onClick={onClick}
        >
            {title}
        </button>
    );

    return __IS_MV3__ && id === ViewState.Stats
        // FIXME: remove when companiesdb stats are implemented for mv3
        ? addPopoverForComingSoonElement(Tab)
        : Tab;
};
