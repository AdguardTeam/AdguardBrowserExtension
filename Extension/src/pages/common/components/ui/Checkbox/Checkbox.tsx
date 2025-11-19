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

import React, { useEffect, useState } from 'react';

import cn from 'classnames';

import { getErrorMessage } from '@adguard/logger';

import { logger } from '../../../../../common/logger';

import './checkbox.pcss';

/**
 * Props for the Checkbox component
 */
interface CheckboxProps {
    /**
     * Unique identifier for the checkbox
     */
    id: string | number;

    /**
     * Initial value of the checkbox
     */
    value: boolean;

    /**
     * If true, the checked state will be inverted
     */
    inverted?: boolean;

    /**
     * Function to handle the change event.
     * Can be synchronous or asynchronous.
     */
    handler: (data: { id: string | number; data: boolean }) => void | Promise<void>;

    /**
     * Label for the checkbox
     */
    label: string;

    /**
     * Label ID for the select (used only for screen readers).
     * If not provided, the label will be used.
     */
    labelId?: string;

    /**
     * Additional CSS classes for customization
     */
    className?: string;

    /**
     * If true, the checkbox will be disabled
     */
    disabled?: boolean;

    /**
     * If true, the checkbox will update optimistically
     */
    optimistic?: boolean;
}

/**
 * Checkbox component that supports both optimistic and pessimistic state updates.
 * - When `optimistic` is true, the checkbox state updates immediately upon user interaction.
 * - When `optimistic` is false, the checkbox state updates only after the handler completes.
 *
 * @param props CheckboxProps
 */
const Checkbox = (props: CheckboxProps) => {
    const {
        id,
        handler,
        inverted = false,
        label = '',
        labelId,
        value = false,
        className,
        disabled,
        optimistic = true,
    } = props;

    const computedValue = inverted ? !value : value;
    const [state, setState] = useState(computedValue);
    const [pending, setPending] = useState(false);

    useEffect(() => {
        setState(computedValue);
    }, [computedValue]);

    const changeHandler = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = !state;
        if (optimistic) {
            setState(newValue);
        } else {
            setPending(true);
        }

        try {
            const { target: { name: targetId, checked: data } } = e;
            await handler({ id: targetId, data: inverted ? !data : data });
            if (!optimistic) {
                setState(newValue);
            }
        } catch (error) {
            // TODO: Dirty hack, need to refactor. Maybe pass some new prop like 'revertOnError'?
            if (!getErrorMessage(error).includes('[revert-checkbox]')) {
                logger.error('[ext.Checkbox]: handler execution failed:', error);
            }
            if (optimistic) {
                setState(!newValue); // revert state on error
            }
        } finally {
            if (!optimistic) {
                setPending(false);
            }
        }
    };

    return (
        <div className="checkbox">
            <input
                type="checkbox"
                name={String(id)}
                checked={state}
                onChange={changeHandler}
                id={String(id)}
                className="checkbox__in"
                tabIndex={0}
                disabled={disabled || pending}
                aria-labelledby={labelId}
            />
            <label
                htmlFor={String(id)}
                className={cn('checkbox__label', className)}
                // We hide from Screen Readers if labelId is provided to avoid duplication
                aria-hidden={!!labelId}
            >
                {label}
            </label>
        </div>
    );
};

export { Checkbox };
