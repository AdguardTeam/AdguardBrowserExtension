import React from 'react';
import { NavLink } from 'react-router-dom';
import './nav.pcss';

const Nav = () => (
    <div className="nav">
        {/* TODO translate */}
        <NavLink className="nav__item" exact activeClassName="nav__item--active" to="/">General</NavLink>
        <NavLink className="nav__item" activeClassName="nav__item--active" to="/filters">Filters</NavLink>
        <NavLink className="nav__item" activeClassName="nav__item--active" to="/stealth">Stealth Mode</NavLink>
        <NavLink className="nav__item" activeClassName="nav__item--active" to="/whitelist">Whitelist</NavLink>
        <NavLink className="nav__item" activeClassName="nav__item--active" to="/user-filter">User rules</NavLink>
        <NavLink className="nav__item" activeClassName="nav__item--active" to="/miscellaneous">Miscellaneous</NavLink>
        <NavLink className="nav__item" activeClassName="nav__item--active" to="/about">About</NavLink>
    </div>
);

export default Nav;
