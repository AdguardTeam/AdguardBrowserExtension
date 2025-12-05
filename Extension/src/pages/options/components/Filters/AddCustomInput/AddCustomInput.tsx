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

/* eslint-disable jsx-a11y/no-autofocus */

import React, {
    type ChangeEventHandler,
    type HTMLInputTypeAttribute,
    useRef,
} from 'react';

import { Icon } from '../../../../common/components/ui/Icon';
import { translator } from '../../../../../common/translators/translator';

import './add-custom-input.pcss';

export type AddCustomInputProps = {
    label?: string;
    type?: HTMLInputTypeAttribute;
    placeholder?: string;
    value?: string;
    onChange?: (value: string) => void;
    autoFocus?: boolean;
    disabled?: boolean;
};

const AddCustomInput = ({
    label,
    type = 'text',
    placeholder,
    value,
    onChange,
    autoFocus,
    disabled,
}: AddCustomInputProps) => {
    const inputRef = useRef<HTMLInputElement>(null);

    const onChangeHandler: ChangeEventHandler<HTMLInputElement> = (e) => {
        if (!onChange) {
            return;
        }

        const { value } = e.target;
        onChange(value);
    };

    const clearHandler = () => {
        if (!inputRef.current) {
            return;
        }

        if (onChange) {
            onChange('');
        } else {
            inputRef.current.value = '';
        }

        inputRef.current.focus();
    };

    return (
        <label className="add-custom-input">
            {label && <span className="add-custom-input__label">{label}</span>}
            <div className="add-custom-input__wrapper">
                <input
                    ref={inputRef}
                    autoFocus={autoFocus}
                    type={type}
                    placeholder={placeholder}
                    className="add-custom-input__input"
                    value={value}
                    disabled={disabled}
                    onChange={onChangeHandler}
                />
                {value && (
                    <button
                        type="button"
                        className="button add-custom-input__clear-btn"
                        aria-label={translator.getMessage('clear_button_title')}
                        onClick={clearHandler}
                    >
                        <Icon
                            id="#cross"
                            className="icon--24 icon--gray-default"
                            aria-hidden="true"
                        />
                    </button>
                )}
            </div>
        </label>
    );
};

export { AddCustomInput };
