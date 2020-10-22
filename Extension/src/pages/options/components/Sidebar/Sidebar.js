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
            <div className="sidebar__menu">
                <button onClick={openSidebar} className="sidebar__button" />
            </div>
            <div className={className}>
                <div className="logo sidebar__logo" />
                <Nav closeSidebar={closeSidebar} />
            </div>
            <div onClick={closeSidebar} className="overlay" />
        </>
    );
};

export default Sidebar;
