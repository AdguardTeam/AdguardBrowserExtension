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

import React, {
    forwardRef,
    useImperativeHandle,
    useRef,
} from 'react';

import classNames from 'classnames';

import { Icon } from '../../../common/components/ui/Icon';
import { translator } from '../../../../common/translators/translator';

import './search.pcss';

type InputPropsWithoutOnChange = Omit<React.ComponentPropsWithoutRef<'input'>, 'onChange'>;

export interface SearchProps extends InputPropsWithoutOnChange {
    /**
     * Control to render instead of glass icon (if value is empty) / clear button (if value is not empty).
     */
    control?: React.ReactNode;

    /**
     * Change event handler.
     *
     * @param value The current value of the search input.
     */
    onChange: (value: string) => void;
}

export const Search = forwardRef<HTMLInputElement, SearchProps>(({
    value,
    className,
    control,
    onChange,
    ...inputProps
}, passedRef) => {
    const localRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(passedRef, () => localRef.current!);

    const inputClasses = classNames('search__input', className);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        onChange(event.target.value);
    };

    const handleClearClick = () => {
        const input = localRef.current;
        if (!input) {
            return;
        }

        onChange('');
        input.focus();
    };

    const renderControl = () => {
        if (control) {
            return control;
        }

        if (value) {
            return (
                <button
                    type="button"
                    className="button search__clear"
                    title={translator.getMessage('clear_button_title')}
                    onClick={handleClearClick}
                >
                    <Icon
                        id="#cross"
                        className="icon--24 icon--gray-default"
                        aria-hidden="true"
                    />
                </button>
            );
        }

        return (
            <Icon
                id="#magnifying"
                className="icon--24 icon--gray-default search__ico"
                aria-hidden="true"
            />
        );
    };

    return (
        <div className="search">
            <input
                ref={localRef}
                type="text"
                value={value}
                onChange={handleChange}
                autoComplete="off"
                className={inputClasses}
                {...inputProps}
            />
            {renderControl()}
        </div>
    );
});
