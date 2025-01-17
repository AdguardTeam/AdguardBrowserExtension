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

import React, {
    useContext,
    useLayoutEffect,
    useState,
} from 'react';
import { observer } from 'mobx-react';

import classNames from 'classnames';

import { Icon } from '../../../common/components/ui/Icon';
import { rootStore } from '../../stores/RootStore';
import { Nav } from '../Nav';
import { messenger } from '../../../services/messenger';
import { translator } from '../../../../common/translators/translator';

import { Compare } from './Compare';

import './sidebar.pcss';

const Sidebar = observer(() => {
    const { settingsStore, uiStore } = useContext(rootStore);

    const { isSidebarOpen, openSidebar, closeSidebar } = uiStore;

    const desktopQuery = '(min-width: 640px)';
    const [isTabletAndAboveScreen, setIsTabletAndAboveScreen] = useState(window.matchMedia(desktopQuery).matches);

    useLayoutEffect(() => {
        const matchMedia = window.matchMedia(desktopQuery);

        const handleScreenChange = (e: MediaQueryListEvent) => {
            setIsTabletAndAboveScreen(e.matches);
        };

        // Triggered at the first client-side load and if query changes
        setIsTabletAndAboveScreen(matchMedia.matches);

        matchMedia.addEventListener('change', handleScreenChange);

        return () => {
            matchMedia.removeEventListener('change', handleScreenChange);
        };
    }, []);

    // Lock sidebar from tab focus if sidebar is closed and it's below tablet screen size.
    const isSidebarLocked = !isSidebarOpen && !isTabletAndAboveScreen;

    /**
     * Close sidebar and remove specific limit warning, e.g. on reaching dynamic rules limit on custom filter enabling.
     */
    const closeSidebarWrapper = () => {
        closeSidebar();
    };

    const handleCompareClick = async () => {
        await messenger.openComparePage();
    };

    const hideCompare = async () => {
        await settingsStore.hideAdguardPromoInfo();
    };

    const className = classNames('sidebar', {
        /* styles only for mobile markup */
        'sidebar--open': isSidebarOpen,
    });
    const overlayClassName = classNames('sidebar__overlay', {
        'sidebar__overlay--visible': isSidebarOpen,
    });

    return (
        <>
            <div className="sidebar__menu" inert={isSidebarOpen ? '' : undefined}>
                <button
                    type="button"
                    className="sidebar__open-button"
                    aria-label="FIXME: Open sidebar"
                    onClick={openSidebar}
                >
                    <Icon
                        id="#menu"
                        classname="icon--menu"
                        aria-hidden="true"
                    />
                </button>
            </div>
            {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */}
            <div className={overlayClassName} onClick={closeSidebar}>
                <button
                    type="button"
                    className="sidebar__close-button"
                    aria-label={translator.getMessage('close_button_title')}
                    onClick={closeSidebar}
                >
                    <Icon
                        id="#cross"
                        classname="icon--24 icon--gray-default"
                        aria-hidden="true"
                    />
                </button>
            </div>
            <div className={className} inert={isSidebarLocked ? '' : undefined}>
                <Icon
                    id="#logo"
                    classname="icon--logo sidebar__logo"
                    aria-hidden="true"
                />
                <Nav onLinkClick={closeSidebarWrapper} />
                {settingsStore.showAdguardPromoInfo && (
                    <Compare
                        onCompareClick={handleCompareClick}
                        onCloseClick={hideCompare}
                    />
                )}
            </div>
        </>
    );
});

export { Sidebar };
