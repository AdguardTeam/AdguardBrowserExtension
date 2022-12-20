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

import { Checkbox } from '../../../common/components/ui/Checkbox';
import { Select } from '../../../common/components/ui/Select';
import { TextInput } from './TextInput';
import { Textarea } from './Textarea';

export const SETTINGS_TYPES = {
    CHECKBOX: 'checkbox',
    SELECT: 'select',
    INPUT: 'input',
    TEXTAREA: 'textarea',
};

export const Setting = (props) => {
    const { type } = props;

    switch (type) {
        case SETTINGS_TYPES.CHECKBOX: {
            const {
                id,
                handler,
                inverted,
                value,
                label,
                className,
                disabled,
            } = props;
            return (
                <Checkbox
                    id={id}
                    handler={handler}
                    inverted={inverted}
                    value={value}
                    label={label}
                    className={className}
                    disabled={disabled}
                />
            );
        }
        case SETTINGS_TYPES.SELECT: {
            const {
                id,
                handler,
                options,
                value,
            } = props;
            const changeHandler = (currentValue) => {
                let dataValue = parseInt(currentValue, 10);
                if (Number.isNaN(dataValue)) {
                    dataValue = currentValue;
                }

                handler({ id, data: dataValue });
            };
            return (
                <Select
                    id={id}
                    handler={changeHandler}
                    options={options}
                    value={value}
                />
            );
        }
        case SETTINGS_TYPES.INPUT: {
            const {
                id, value, handler, placeholder, disabled,
            } = props;
            return (
                <TextInput
                    id={id}
                    disabled={disabled}
                    value={value}
                    handler={handler}
                    placeholder={placeholder}
                />
            );
        }
        case SETTINGS_TYPES.TEXTAREA: {
            const {
                id,
                value,
                handler,
                placeholder,
                disabled,
            } = props;
            return (
                <Textarea
                    id={id}
                    disabled={disabled}
                    value={value}
                    handler={handler}
                    placeholder={placeholder}
                />
            );
        }
        default:
            throw new Error(`
                There is no right component for a type: "${type}".
                Available types: ${Object.values(SETTINGS_TYPES).join(', ')}
            `);
    }
};
