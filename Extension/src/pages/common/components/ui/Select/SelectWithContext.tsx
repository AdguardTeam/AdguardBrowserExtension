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

import { useSelect } from './SelectProvider';
import { Select, type SelectWrapperProps } from './Select';

import './select.pcss';

export const SelectWithContext = ({
    id,
    handler,
    options,
    value,
    popupModification = false,
    label,
    labelId,
}: Omit<SelectWrapperProps, 'withContext'>) => {
    const [hidden, setHidden] = useSelect(id);

    return (
        <Select
            id={id}
            handler={handler}
            options={options}
            value={value}
            hidden={hidden}
            setHidden={setHidden}
            popupModification={popupModification}
            label={label}
            labelId={labelId}
        />
    );
};
