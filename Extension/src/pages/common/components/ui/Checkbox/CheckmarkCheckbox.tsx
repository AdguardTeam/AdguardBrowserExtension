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

import { Icon } from '../Icon';

/**
 * Props for the CheckmarkCheckbox component
 */
interface CheckmarkCheckboxProps {
    /**
     * Unique identifier for the checkbox
     */
    id: string;

    /**
     * Function to handle the change event.
     * Can be synchronous or asynchronous.
     */
    handler: (data: { id: string; data: boolean }) => void | Promise<void>;

    /**
     * Label for the checkbox
     */
    label: string;

    /**
     * If true, the checkbox will be checked
     */
    checked: boolean;
}

const CheckMarkCheckbox = (props: CheckmarkCheckboxProps) => {
    const {
        id,
        handler,
        label,
        checked,
    } = props;

    return (
        <div className="checkbox-wrapper">
            <input
                id={id}
                className="checkbox-input"
                type="checkbox"
                name={id}
                onChange={() => handler({ id, data: !checked })}
                checked={checked}
            />
            <label
                htmlFor={id}
                className="checkbox-label"
            >
                <div className="custom-checkbox">
                    <Icon id="#checked" className="icon--18" />
                </div>
                <div className="checkbox-label__desc">
                    {label}
                </div>
            </label>
        </div>
    );
};

export { CheckMarkCheckbox };
