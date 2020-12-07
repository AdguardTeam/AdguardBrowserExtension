import React from 'react';
import { NavLink } from 'react-router-dom';

import { reactTranslator } from '../../../reactCommon/reactTranslator';

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
            {reactTranslator.translate('options_general_settings')}
        </NavLink>
        <NavLink
            className="nav__item"
            activeClassName="nav__item--active"
            to="/filters"
            onClick={closeSidebar}
        >
            {reactTranslator.translate('options_antibanner')}
        </NavLink>
        <NavLink
            className="nav__item"
            activeClassName="nav__item--active"
            to="/stealth"
            onClick={closeSidebar}
        >
            {reactTranslator.translate('options_privacy')}
        </NavLink>
        <NavLink
            className="nav__item"
            activeClassName="nav__item--active"
            to="/allowlist"
            onClick={closeSidebar}
        >
            {reactTranslator.translate('options_allowlist')}
        </NavLink>
        <NavLink
            className="nav__item"
            activeClassName="nav__item--active"
            to="/user-filter"
            onClick={closeSidebar}
        >
            {reactTranslator.translate('options_userfilter')}
        </NavLink>
        <NavLink
            className="nav__item"
            activeClassName="nav__item--active"
            to="/miscellaneous"
            onClick={closeSidebar}
        >
            {reactTranslator.translate('options_miscellaneous_settings')}
        </NavLink>
        <NavLink
            className="nav__item"
            activeClassName="nav__item--active"
            to="/about"
            onClick={closeSidebar}
        >
            {reactTranslator.translate('options_about')}
        </NavLink>
    </div>
);

export { Nav };
