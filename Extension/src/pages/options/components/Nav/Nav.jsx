import React from 'react';
import { NavLink } from 'react-router-dom';

import { reactTranslator } from '../../../../common/translators/reactTranslator';

import './nav.pcss';

const Nav = ({ closeSidebar }) => (
    <div className="nav">
        <NavLink
            className="nav__item"
            exact
            activeClassName="nav__item--active"
            to="/"
            onClick={closeSidebar}
        >
            {reactTranslator.getMessage('options_general_settings')}
        </NavLink>
        <NavLink
            className="nav__item"
            activeClassName="nav__item--active"
            to="/filters"
            onClick={closeSidebar}
        >
            {reactTranslator.getMessage('options_antibanner')}
        </NavLink>
        <NavLink
            className="nav__item"
            activeClassName="nav__item--active"
            to="/stealth"
            onClick={closeSidebar}
        >
            {reactTranslator.getMessage('options_privacy')}
        </NavLink>
        <NavLink
            className="nav__item"
            activeClassName="nav__item--active"
            to="/allowlist"
            onClick={closeSidebar}
        >
            {reactTranslator.getMessage('options_allowlist')}
        </NavLink>
        <NavLink
            className="nav__item"
            activeClassName="nav__item--active"
            to="/user-filter"
            onClick={closeSidebar}
        >
            {reactTranslator.getMessage('options_userfilter')}
        </NavLink>
        <NavLink
            className="nav__item"
            activeClassName="nav__item--active"
            to="/miscellaneous"
            onClick={closeSidebar}
        >
            {reactTranslator.getMessage('options_miscellaneous_settings')}
        </NavLink>
        <NavLink
            className="nav__item"
            activeClassName="nav__item--active"
            to="/about"
            onClick={closeSidebar}
        >
            {reactTranslator.getMessage('options_about')}
        </NavLink>
    </div>
);

export { Nav };
