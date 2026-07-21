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

import { type NotificationParams } from '../types';

/**
 * Checks whether an existing notification is a duplicate of the one being added.
 *
 * Two notifications are considered duplicates when their `type` matches and:
 * - either side provides a `dedupeKey`: compared by `dedupeKey` (required for
 *   `ReactNode`/JSX text, which is never referentially equal); OR
 * - neither provides a `dedupeKey`: falls back to `text` comparison (only
 *   meaningful for plain-string notifications).
 *
 * @param existing Notification already present in the list.
 * @param params Notification parameters about to be added.
 *
 * @returns `true` if `existing` is a duplicate of `params`.
 */
export const isDuplicateNotification = (
    existing: NotificationParams,
    params: NotificationParams,
): boolean => {
    if (existing.type !== params.type) {
        return false;
    }
    if (params.dedupeKey !== undefined || existing.dedupeKey !== undefined) {
        return existing.dedupeKey === params.dedupeKey;
    }
    return existing.text === params.text;
};
