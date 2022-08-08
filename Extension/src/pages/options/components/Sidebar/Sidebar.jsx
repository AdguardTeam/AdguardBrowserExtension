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
