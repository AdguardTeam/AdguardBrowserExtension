import React from 'react';
import Nav from '../Nav/Nav';
import './sidebar.pcss';

const Sidebar = () => (
    <div className="sidebar">
        <div className="logo sidebar__logo" />
        <Nav />
    </div>
);

export default Sidebar;
