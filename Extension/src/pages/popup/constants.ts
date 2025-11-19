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

import {
    Forward,
    ForwardAction,
    ForwardFrom,
} from '../../common/forward';

export const IOS_URL = Forward.get({
    action: ForwardAction.IOS,
    from: ForwardFrom.Popup,
});

export const ANDROID_URL = Forward.get({
    action: ForwardAction.Android,
    from: ForwardFrom.Popup,
});

export const COMPARE_URL = Forward.get({
    action: ForwardAction.Compare,
    from: ForwardFrom.Popup,
});

export const enum ViewState {
    Actions = 'actions',
    Stats = 'stats',
}

/**
 * Describes specific popup states for:
 * - secure pages where filtering is unavailable;
 * - websites with exceptions in filters.
 */
export const enum SpecificPopupState {
    /**
     * Protection is unavailable, e.g. secure page.
     */
    FilteringUnavailable = 'filtering.unavailable',

    /**
     * Protection is disabled for a website due to an exception in filters,
     * i.e. document exception rule — `@@||example.com^$document` in some filter, **not used rules**.
     */
    SiteInException = 'site.in.exception',
}

export const enum TimeRange {
    Day = 'day',
    Week = 'week',
    Month = 'month',
    Year = 'year',
}
