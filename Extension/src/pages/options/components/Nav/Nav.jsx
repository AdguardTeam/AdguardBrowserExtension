import React from 'react';
import { NavLink } from 'react-router-dom';

import { reactTranslator } from '../../../../common/translators/reactTranslator';

import './nav.pcss';

const Nav = ({ closeSidebar }) => {
    const onClick = () => {
        closeSidebar();
    };

    return (
        <div className="nav">
            <NavLink
                className="nav__item"
                exact
                activeClassName="nav__item--active"
                to="/"
                onClick={onClick}
            >
                {reactTranslator.getMessage('options_general_settings')}
            </NavLink>
            <NavLink
                className="nav__item"
                activeClassName="nav__item--active"
                to="/filters"
                onClick={onClick}
            >
                {reactTranslator.getMessage('options_filters')}
            </NavLink>
            <NavLink
                className="nav__item"
                activeClassName="nav__item--active"
                to="/stealth"
                onClick={onClick}
            >
                {reactTranslator.getMessage('options_privacy')}
            </NavLink>
            <NavLink
                className="nav__item"
                activeClassName="nav__item--active"
                to="/allowlist"
                onClick={onClick}
            >
                {reactTranslator.getMessage('options_allowlist')}
            </NavLink>
            <NavLink
                className="nav__item"
                activeClassName="nav__item--active"
                to="/user-filter"
                onClick={onClick}
            >
                {reactTranslator.getMessage('options_userfilter')}
            </NavLink>
            <NavLink
                className="nav__item"
                activeClassName="nav__item--active"
                to="/miscellaneous"
                onClick={onClick}
            >
                {reactTranslator.getMessage('options_miscellaneous_settings')}
            </NavLink>
            <NavLink
                className="nav__item"
                activeClassName="nav__item--active"
                to="/about"
                onClick={onClick}
            >
                {reactTranslator.getMessage('options_about')}
            </NavLink>
        </div>
    );
};

export { Nav };
