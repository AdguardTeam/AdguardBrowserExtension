/**
 * @file
 * This file is part of AdGuard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * AdGuard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * AdGuard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with AdGuard Browser Extension. If not, see <http://www.gnu.org/licenses/>.
 */

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
