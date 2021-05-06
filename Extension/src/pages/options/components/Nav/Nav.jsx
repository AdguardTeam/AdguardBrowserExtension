import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { COMPARE_URL } from '../../../constants';

import { reactTranslator } from '../../../../common/translators/reactTranslator';

import './nav.pcss';

const SIDEBAR_COMPARE_HIDE = 'sidebar_compare_hide';

const Nav = ({ closeSidebar }) => {
    const [isSidebarCompareHide, setSidebarCompareHide] = useState(false);
    const sidebarCompareHide = isSidebarCompareHide || localStorage.getItem(SIDEBAR_COMPARE_HIDE);
    const hideCompare = () => {
        setSidebarCompareHide(true);
        localStorage.setItem(SIDEBAR_COMPARE_HIDE, 'true');
    };
    return (
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
            {!sidebarCompareHide && (
                <div className="nav__desc">
                    <div className="nav__message">
                        {reactTranslator.getMessage('options_nav_better_than_extension')}
                    </div>
                    <a
                        className="nav__link"
                        href={COMPARE_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        {reactTranslator.getMessage('options_nav_compare')}
                    </a>
                    <button
                        type="button"
                        className="nav__hide"
                        onClick={hideCompare}
                    >
                        {reactTranslator.getMessage('options_nav_hide')}
                    </button>
                </div>
            )}
        </div>
    );
};

export { Nav };
