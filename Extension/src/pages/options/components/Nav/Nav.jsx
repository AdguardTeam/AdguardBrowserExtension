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

import { OptionsPageSections } from '../../../../common/nav';
import { reactTranslator } from '../../../../common/translators/reactTranslator';

import './nav.pcss';

export const Nav = ({ closeSidebar }) => {
    const onClick = () => {
        closeSidebar();
        // Add a small delay to ensure the new content is rendered
        setTimeout(() => {
            // Check if any modal is open before changing focus
            const modalRoot = document.querySelector('.ReactModal__Overlay--after-open');
            if (modalRoot) {
                // If a modal is open, don't change focus
                return;
            }

            const mainContent = document.querySelector('[role="main"]');
            if (mainContent) {
                mainContent.focus();
                // If there's a title in the main content, focus it instead
                const title = mainContent.querySelector('h1, h2, .title');
                if (title) {
                    title.focus();
                }
            }
        }, 100);
    };

    const getNavLinkClassName = (navData) => (navData.isActive ? 'nav__item nav__item--active' : 'nav__item');

    return (
        <div className="nav" role="navigation">
            <div role="tablist">
                <NavLink
                    className={getNavLinkClassName}
                    to="/"
                    onClick={onClick}
                    end
                    role="tab"
                    aria-selected={({ isActive }) => isActive}
                >
                    {reactTranslator.getMessage('options_general_settings')}
                </NavLink>
                <NavLink
                    className={getNavLinkClassName}
                    to={`/${OptionsPageSections.filters}`}
                    onClick={onClick}
                    role="tab"
                    aria-selected={({ isActive }) => isActive}
                >
                    {reactTranslator.getMessage('options_filters')}
                </NavLink>
                <NavLink
                    className={getNavLinkClassName}
                    to={`/${OptionsPageSections.stealth}`}
                    onClick={onClick}
                    role="tab"
                    aria-selected={({ isActive }) => isActive}
                >
                    {reactTranslator.getMessage('options_privacy')}
                </NavLink>
                <NavLink
                    className={getNavLinkClassName}
                    to={`/${OptionsPageSections.allowlist}`}
                    onClick={onClick}
                    role="tab"
                    aria-selected={({ isActive }) => isActive}
                >
                    {reactTranslator.getMessage('options_allowlist')}
                </NavLink>
                <NavLink
                    className={getNavLinkClassName}
                    to={`/${OptionsPageSections.userFilter}`}
                    onClick={onClick}
                    role="tab"
                    aria-selected={({ isActive }) => isActive}
                >
                    {reactTranslator.getMessage('options_userfilter')}
                </NavLink>
                <NavLink
                    className={getNavLinkClassName}
                    to={`/${OptionsPageSections.miscellaneous}`}
                    onClick={onClick}
                    role="tab"
                    aria-selected={({ isActive }) => isActive}
                >
                    {reactTranslator.getMessage('options_miscellaneous_settings')}
                </NavLink>
                {
                    __IS_MV3__
                        && (
                            <NavLink
                                className={getNavLinkClassName}
                                to={`/${OptionsPageSections.ruleLimits}`}
                                onClick={onClick}
                                role="tab"
                                aria-selected={({ isActive }) => isActive}
                            >
                                {reactTranslator.getMessage('options_rule_limits')}
                            </NavLink>
                        )
                }
                <NavLink
                    className={getNavLinkClassName}
                    to={`/${OptionsPageSections.about}`}
                    onClick={onClick}
                    role="tab"
                    aria-selected={({ isActive }) => isActive}
                >
                    {reactTranslator.getMessage('options_about')}
                </NavLink>
            </div>
        </div>
    );
};
