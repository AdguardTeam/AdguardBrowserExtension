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

import { type UIFilteringLogEvent } from '../../../background/api/filtering-log';
import { containsIgnoreCase } from '../../helpers';

export const matchesSearch = (filteringEvent: UIFilteringLogEvent, search: string) => {
    let matches = !search
        || containsIgnoreCase(filteringEvent.requestUrl, search)
        || containsIgnoreCase(filteringEvent.element, search)
        || containsIgnoreCase(filteringEvent.cookieName, search)
        || containsIgnoreCase(filteringEvent.cookieValue, search);

    const { appliedRuleText, filterName } = filteringEvent;

    if (appliedRuleText) {
        matches = matches || containsIgnoreCase(appliedRuleText, search);
    }

    if (filterName) {
        matches = matches
            || containsIgnoreCase(filterName, search);
    }

    // allow to search for Tracking protection events only by the old name
    // to avoid matching of 'AdGuard Tracking Protection filter'
    if (
        (filteringEvent.requestRule && filteringEvent.requestRule.isStealthModeRule)
        || !!filteringEvent?.stealthActions
    ) {
        matches = matches
            || containsIgnoreCase('stealth mode', search);
    }

    return matches;
};

/**
 * Calls a callback function with async/await if the extension is MV3.
 * Otherwise, calls the callback function without async/await.
 *
 * @param callback Callback to execute.
 * @param args Arguments to pass to the callback.
 */
export const asyncWrapper = async (callback: (...args: any) => void, ...args: any[]) => {
    if (__IS_MV3__) {
        await callback(...args);
        return;
    }

    callback(...args);
};
