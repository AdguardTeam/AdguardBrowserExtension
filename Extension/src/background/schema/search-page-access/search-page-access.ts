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
import zod from 'zod';

export const searchPageAccessStorageDataValidator = zod.object({
    /**
     * Whether the search page access permission is granted.
     *
     * Defaults to false - we show warning by default until the first successful
     * script injection on a search page confirms the permission is granted.
     */
    isPermissionGranted: zod.boolean().default(false),
    /**
     * Whether to show the notification to the user.
     */
    shouldShowNotification: zod.boolean().default(true),
}).default({});

/**
 * State for search page access permission detection.
 */
export type SearchPageAccessStorageData = zod.infer<typeof searchPageAccessStorageDataValidator>;
