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

import { Icon } from '../../../common/components/ui/Icon';

import './search.pcss';

export interface SearchProps extends React.ComponentPropsWithoutRef<'input'> {
    /**
     * Optional controls to be rendered inside the search input.
     * If not provided, a default magnifying glass icon will be rendered.
     */
    controls?: React.ReactNode;
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
            {controls || (
                <Icon
                    id="#magnifying"
                    classname="icon--24 icon--gray-default search__ico"
                    aria-hidden="true"
                />
            )}
        </div>
    );
});
