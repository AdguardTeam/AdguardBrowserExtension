import React, { useState } from 'react';
import classNames from 'classnames';

import { Nav } from '../Nav';

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
                ? <div onClick={closeSidebar} className="sidebar__overlay" />
                : (
                    <div className="sidebar__menu" role="menu">
                        <button onClick={openSidebar} className="sidebar__open-button" type="button" />
                    </div>
                )}
            <div className={className}>
                <div className="logo sidebar__logo" />
                <Nav closeSidebar={closeSidebar} />
            </div>
        </>
    );
};

export { Sidebar };
