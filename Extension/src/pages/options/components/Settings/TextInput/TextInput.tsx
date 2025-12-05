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

// TODO: remove this line after eslint config will be updated.
/* eslint-disable react/require-default-props */

import React, {
    useState,
    useCallback,
    type ChangeEventHandler,
    type FC,
} from 'react';

import cn from 'classnames';
import { debounce, type DebouncedFunc } from 'lodash-es';

import { type SettingHandler } from '../../../types';
import { type SettingOption } from '../../../../../background/schema/settings';

import './input.pcss';

export type TextInputValue = string | number;

export type TextEventHandler = ChangeEventHandler<HTMLInputElement>;

export type TextInputProps = {
    id: SettingOption;
    value: TextInputValue;
    handler: SettingHandler;
    placeholder?: string;
    disabled?: boolean;
    required?: boolean;
    minValue?: number;
    step?: number;
    className?: string;
};

const HANDLE_TEXT_INPUT_DEBOUNCE_MS = 1000;

/**
 * Sync the state of the text input and creates debounced version of passed {@link handler}
 * with {@link HANDLE_TEXT_INPUT_DEBOUNCE_MS} timeout.
 *
 * @param value Text input value.
 * @param handler Setting change handler.
 *
 * @returns Tuple of the current value and the debounced setting change handler.
 */
const useTextInput = (
    value: TextInputValue,
    handler: SettingHandler,
): [TextInputValue, TextEventHandler] => {
    const [inputValue, setInputValue] = useState(value);

    // The `debounce` function is imported from lodash, so we can disable the rule here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const debouncedChangeHandler = useCallback<DebouncedFunc<SettingHandler>>(
        debounce((payload) => {
            handler(payload);
        }, HANDLE_TEXT_INPUT_DEBOUNCE_MS),
        // create new debounced version of handler only on passed function change
        [handler],
    );

    const changeHandler = useCallback<TextEventHandler>(
        (e) => {
            const { name: id, value: data } = e.target;
            setInputValue(data);
            debouncedChangeHandler({ id: id as SettingOption, data, event: e });
        },
        // create new change handler only on debounced change handler re-creation
        [debouncedChangeHandler],
    );

    return [inputValue, changeHandler];
};

export const TextInput: FC<TextInputProps> = ({
    id,
    value,
    handler,
    placeholder = '',
    disabled = false,
    required = false,
    minValue,
    step,
    className,
}) => {
    const [inputValue, changeHandler] = useTextInput(value, handler);

    return (
        <div className="input">
            <input
                disabled={disabled}
                type="number"
                name={id}
                value={inputValue}
                onChange={changeHandler}
                id={id}
                className={cn('input__in', className)}
                placeholder={placeholder}
                min={minValue}
                required={required}
                step={step}
            />
        </div>
    );
};
