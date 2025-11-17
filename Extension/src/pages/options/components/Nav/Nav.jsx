/**
 * Copyright (c) 2015-2025 Adguard Software Ltd.
 *
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

import { OptionsPageSections } from '../../../../common/nav';
import { translator } from '../../../../common/translators/translator';

import { NavItem } from './NavItem';

import './nav.pcss';

export const Nav = ({ onLinkClick }) => {
    return (
        <nav className="nav">
            <ul className="nav__list">
                <NavItem
                    to="/"
                    onClick={onLinkClick}
                    end
                >
                    {translator.getMessage('options_general_settings')}
                </NavItem>
                <NavItem
                    to={`/${OptionsPageSections.filters}`}
                    onClick={onLinkClick}
                >
                    {translator.getMessage('options_filters')}
                </NavItem>
                <NavItem
                    to={`/${OptionsPageSections.stealth}`}
                    onClick={onLinkClick}
                >
                    {translator.getMessage('options_privacy')}
                </NavItem>
                <NavItem
                    to={`/${OptionsPageSections.allowlist}`}
                    onClick={onLinkClick}
                >
                    {translator.getMessage('options_allowlist')}
                </NavItem>
                <NavItem
                    to={`/${OptionsPageSections.userFilter}`}
                    onClick={onLinkClick}
                >
                    {translator.getMessage('options_userfilter')}
                </NavItem>
                <NavItem
                    to={`/${OptionsPageSections.miscellaneous}`}
                    onClick={onLinkClick}
                >
                    {translator.getMessage('options_miscellaneous_settings')}
                </NavItem>
                {
                    __IS_MV3__
                    && (
                        <NavItem
                            to={`/${OptionsPageSections.ruleLimits}`}
                            onClick={onLinkClick}
                        >
                            {translator.getMessage('options_rule_limits')}
                        </NavItem>
                    )
                }
                <NavItem
                    to={`/${OptionsPageSections.about}`}
                    onClick={onLinkClick}
                >
                    {translator.getMessage('options_about')}
                </NavItem>
            </ul>
        </nav>
    );
};
