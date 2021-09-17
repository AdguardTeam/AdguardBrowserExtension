import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import classNames from 'classnames';

import { Nav } from '../Nav';
import { Icon } from '../../../common/components/ui/Icon';

import './sidebar.pcss';

const Sidebar = () => {
    const [isOpen, setOpen] = useState(false);

    const openSidebar = () => setOpen(true);
    const closeSidebar = () => setOpen(false);

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
                <Link to="/">
                    <Icon id="#logo" classname="icon--logo sidebar__logo" />
                </Link>
                <Nav closeSidebar={closeSidebar} />
            </div>
        </>
    );
};

export { Sidebar };
