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

import { type FilterMetadata } from '../background/api';

import { translator } from './translators/translator';

/**
 * Message to show when filters are updated.
 */
export interface FilterUpdateMessage {
    /**
     * Title of the message.
     */
    title: string;

    /**
     * Text of the message.
     */
    text: string;
}

/**
 * Returns message with result of updating filters.
 *
 * @param success Whether the update was successful or not.
 * @param updatedFilters List of filters to update.
 *
 * @returns Title and text lines for message.
 */
export function getFiltersUpdateResultMessage(
    success: boolean,
    updatedFilters?: FilterMetadata[],
): FilterUpdateMessage {
    if (!success || !updatedFilters) {
        return {
            title: translator.getMessage('options_popup_update_title_error'),
            text: translator.getMessage('options_popup_update_error'),
        };
    }

    const title = '';

    if (updatedFilters.length === 0) {
        return {
            title,
            text: translator.getMessage('options_popup_update_not_found'),
        };
    }

    let text = updatedFilters
        .sort((a, b) => {
            if (a.groupId === b.groupId) {
                return a.displayNumber - b.displayNumber;
            }
            return Number(a.groupId === b.groupId);
        })
        .map((filter) => filter.name)
        .join(', ');

    if (updatedFilters.length > 1) {
        text += ` ${translator.getMessage('options_popup_update_filters')}`;
    } else {
        text += ` ${translator.getMessage('options_popup_update_filter')}`;
    }

    return {
        title,
        text,
    };
}
