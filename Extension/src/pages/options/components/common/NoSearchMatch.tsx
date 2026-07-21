/**
 * Copyright (c) 2015-2026 Adguard Software Ltd.
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

import { Icon } from '../../../common/components/ui/Icon';

import './no-search-match.pcss';

/**
 * Props for the {@link NoSearchMatch} component.
 */
interface NoSearchMatchProps {
    /**
     * The translated text message to display.
     */
    message: string;
}

/**
 * Shared component: icon and message shown when a search yields no results.
 * Used by both the Filters list and the User Rules list.
 *
 * @param props Component props.
 *
 * @returns Centered icon + message placeholder.
 */
export const NoSearchMatch = ({ message }: NoSearchMatchProps) => (
    <div className="no-search-match">
        <Icon
            id="#no-search-match"
            className="icon--48 icon--gray-default"
            aria-hidden="true"
        />
        <div>{message}</div>
    </div>
);
