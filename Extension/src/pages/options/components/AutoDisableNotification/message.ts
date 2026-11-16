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

import { type AutoDisabledFilter } from '../../../../common/auto-disable-notification';
import { translator } from '../../../../common/translators/translator';

/**
 * Formats a prepared batch using the existing localization system.
 *
 * @param filters Prepared batch of automatically disabled filters.
 *
 * @returns Formatted message or null for an empty batch.
 */
export const getAutoDisableNotificationMessage = (filters: AutoDisabledFilter[]): string | null => {
    const [filter] = filters;

    if (!filter) {
        return null;
    }
    if (filters.length === 1) {
        return translator.getMessage('options_auto_disabled_one_filter_notification', {
            filter_name: filter.name,
        });
    }
    return translator.getPlural('options_auto_disabled_multiple_filters_notification', filters.length);
};
