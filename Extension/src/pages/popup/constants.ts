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

export const VIEW_STATES = {
    ACTIONS: 'actions',
    STATS: 'stats',
};

export const POPUP_STATES = {
    APPLICATION_ENABLED: 'application.enabled',
    APPLICATION_FILTERING_DISABLED: 'application.filtering.disabled',
    APPLICATION_UNAVAILABLE: 'application.unavailable',
    SITE_IN_EXCEPTION: 'site.in.exception',
    SITE_ALLOWLISTED: 'site.allowlisted',
};

export const TIME_RANGES = {
    DAY: 'day',
    WEEK: 'week',
    MONTH: 'month',
    YEAR: 'year',
};
