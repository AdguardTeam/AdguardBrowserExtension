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

import React, { useContext, useState } from 'react';
import { observer } from 'mobx-react';
import classNames from 'classnames';

import { Nav } from '../Nav';
import { rootStore } from '../../stores/RootStore';
import { Icon } from '../../../common/components/ui/Icon';

import './sidebar.pcss';
import { messenger } from '../../../services/messenger';
import { Compare } from './Compare';

const Sidebar = observer(() => {
    const { settingsStore } = useContext(rootStore);

    const [isOpen, setOpen] = useState(false);

    const openSidebar = () => setOpen(true);
    const closeSidebar = () => setOpen(false);

    const handleCompareClick = async () => {
        await messenger.openComparePage();
    };

    const hideCompare = async () => {
        await settingsStore.hideAdguardPromoInfo();
    };

    const className = classNames('sidebar', {
        /* styles only for mobile markup */
        'sidebar--open': isOpen,
    });

    return (
        <>
            {isOpen
                ? (
                    <div
                        role="menu"
                        tabIndex={0}
                        onClick={closeSidebar}
                        onKeyUp={closeSidebar}
                        className="sidebar__overlay"
                    />
                )
                : (
                    <div className="sidebar__menu" role="menu">
                        <button onClick={openSidebar} className="sidebar__open-button" type="button">
                            <Icon id="#menu" classname="icon--menu" />
                        </button>
                    </div>
                )}
            <div className={className}>
                <Icon id="#logo" classname="icon--logo sidebar__logo" />
                <Nav closeSidebar={closeSidebar} />
                {settingsStore.showAdguardPromoInfo && (
                    <Compare
                        click={handleCompareClick}
                        hide={hideCompare}
                    />
                )}
            </div>
        </>
    );
});

export { Sidebar };
