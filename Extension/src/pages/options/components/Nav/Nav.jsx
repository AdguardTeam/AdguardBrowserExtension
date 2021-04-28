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
            {reactTranslator.getMessage('options_filters')}
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
        <div className="nav__desc">
            <div className="nav__message">
                {reactTranslator.getMessage('nav_better_than_extension')}
            </div>
            <a
                className="nav__link"
                href="#"
                target="_blank"
                rel="noopener noreferrer"
            >
                {reactTranslator.getMessage('nav_compare')}
            </a>
            <div className="nav__hide">
                {reactTranslator.getMessage('hide')}
            </div>
        </div>
    </div>
);

export { Nav };
