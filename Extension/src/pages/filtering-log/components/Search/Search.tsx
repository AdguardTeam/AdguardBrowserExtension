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

import React, { forwardRef } from 'react';

import classNames from 'classnames';

import './search.pcss';

export interface SearchProps extends React.ComponentPropsWithoutRef<'input'> {
    controls: React.ReactNode;
}

export const Search = forwardRef<HTMLInputElement, SearchProps>(({
    controls,
    className,
    ...inputProps
}, passedRef) => {
    const inputClasses = classNames('search__input', className);

    return (
        <div className="search">
            <input
                ref={passedRef}
                type="text"
                autoComplete="off"
                className={inputClasses}
                {...inputProps}
            />
            {controls}
        </div>
    );
});
