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
import {
    NavLink,
    type NavLinkProps,
    type NavLinkRenderProps,
} from 'react-router-dom';

export interface NavItemProps extends Pick<NavLinkProps, 'to' | 'end' | 'children'> {
    /**
     * Click event handler.
     */
    onClick: () => void;
}

export const NavItem = ({
    to,
    end,
    children,
    onClick,
}: NavItemProps) => {
    const getClassName = ({ isActive }: NavLinkRenderProps) => {
        return isActive ? 'nav__item nav__item--active' : 'nav__item';
    };

    return (
        <li className="nav__list-item">
            <NavLink
                to={to}
                end={end}
                className={getClassName}
                onClick={onClick}
            >
                {children}
            </NavLink>
        </li>
    );
};
