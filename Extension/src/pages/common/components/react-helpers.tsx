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

import { translator } from '../../../common/translators/translator';

import { Popover } from './ui/Popover';

/**
 * Returns the same element for MV2,
 * adds a popover with 'Coming soon' text for MV3 and disables the element.
 *
 * @param element Element to handle.
 *
 * @returns Disabled element with popover for MV3 or the same element for MV2.
 */
export const addPopoverForComingSoonElement = (element: React.JSX.Element): React.JSX.Element => {
    if (!__IS_MV3__) {
        return element;
    }

    const comingSoonText = translator.getMessage('options_coming_soon');
    const disabledClassName = `disabled ${element.props.className}`;

    return (
        <Popover text={comingSoonText} comingSoon>
            {React.cloneElement(element, { className: disabledClassName })}
        </Popover>
    );
};
