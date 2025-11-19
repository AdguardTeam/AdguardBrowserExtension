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

import { SelectWithContext } from './SelectWithContext';
import { SelectWithoutContext } from './SelectWithoutContext';
import { type SelectWrapperProps } from './Select';

import './select.pcss';

export const SelectWrapper = ({
    id,
    handler,
    options,
    value,
    // Boolean flag indicating the need to render Select in a popup page with
    // almost the same business logic (useState instead of a hook with
    // Context.Provider), but a different layout: reverse order of icons,
    // smaller text, using all the space of the parent element.
    popupModification,
    label,
    labelId,
    withContext,
}: SelectWrapperProps) => {
    const props = {
        id,
        handler,
        options,
        value,
        popupModification,
        label,
        labelId,
    };

    return withContext
        ? (<SelectWithContext {...props} />)
        : (<SelectWithoutContext {...props} />);
};
