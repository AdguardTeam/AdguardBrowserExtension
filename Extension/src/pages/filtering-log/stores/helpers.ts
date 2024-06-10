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

import { containsIgnoreCase } from '../../helpers';
import type { UIFilteringLogEvent } from '../types';

export const matchesSearch = (filteringEvent: UIFilteringLogEvent, search: string) => {
    let matches = !search
        || containsIgnoreCase(filteringEvent.requestUrl, search)
        || containsIgnoreCase(filteringEvent.element, search)
        || containsIgnoreCase(filteringEvent.cookieName, search)
        || containsIgnoreCase(filteringEvent.cookieValue, search);

    const { ruleText, filterName } = filteringEvent;

    if (ruleText) {
        matches = matches || containsIgnoreCase(ruleText, search);
    }

    if (filterName) {
        matches = matches
            || containsIgnoreCase(filterName, search);
    }

    // allow to search for Tracking protection rules by the current module name and its old name
    if (
        (filteringEvent.requestRule && filteringEvent.requestRule.isStealthModeRule)
        || !!filteringEvent?.stealthActions
    ) {
        matches = matches
            || containsIgnoreCase('tracking protection', search)
            || containsIgnoreCase('stealth mode', search);
    }

    return matches;
};
