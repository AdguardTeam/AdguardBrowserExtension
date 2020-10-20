import React from 'react';

import { NavLink } from 'react-router-dom';
import { reactTranslator } from '../../../reactCommon/reactTranslator';

import './nav.pcss';

const Nav = () => (
    <div className="nav">
        <NavLink
            className="nav__item"
            exact
            activeClassName="nav__item--active"
            to="/"
        >
            {reactTranslator.translate('options_general_settings')}
        </NavLink>
        <NavLink
            className="nav__item"
            activeClassName="nav__item--active"
            to="/filters"
        >
            {reactTranslator.translate('options_antibanner')}
        </NavLink>
        <NavLink
            className="nav__item"
            activeClassName="nav__item--active"
            to="/stealth"
        >
            {reactTranslator.translate('options_privacy')}
        </NavLink>
        <NavLink
            className="nav__item"
            activeClassName="nav__item--active"
            to="/allowlist"
        >
            {reactTranslator.translate('options_allowlist')}
        </NavLink>
        <NavLink
            className="nav__item"
            activeClassName="nav__item--active"
            to="/user-filter"
        >
            {reactTranslator.translate('options_userfilter')}
        </NavLink>
        <NavLink
            className="nav__item"
            activeClassName="nav__item--active"
            to="/miscellaneous"
        >
            {reactTranslator.translate('options_miscellaneous_settings')}
        </NavLink>
        <NavLink
            className="nav__item"
            activeClassName="nav__item--active"
            to="/about"
        >
            {reactTranslator.translate('options_about')}
        </NavLink>
    </div>
);

export { Nav };
