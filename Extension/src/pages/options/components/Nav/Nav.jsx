import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { observer } from 'mobx-react';

import { COMPARE_URL } from '../../../constants';
import { reactTranslator } from '../../../../common/translators/reactTranslator';
import { rootStore } from '../../stores/RootStore';

import './nav.pcss';

const Nav = observer(({ closeSidebar }) => {
    const { settingsStore } = useContext(rootStore);
    const hideCompare = async () => {
        await settingsStore.hideAdguardPromoInfo();
    };

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
            {settingsStore.showAdguardPromoInfo && (
                <div className="nav__desc">
                    <div className="nav__message">
                        {reactTranslator.getMessage('options_nav_better_than_extension')}
                    </div>
                    <div>
                        <a
                            className="nav__link"
                            href={COMPARE_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {reactTranslator.getMessage('options_nav_compare')}
                        </a>
                    </div>
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
});

export { Nav };
