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
import zod from 'zod';

// User filter configuration

export const enum UserFilterOption {
    Rules = 'rules',
    DisabledRules = 'disabled-rules',
    Enabled = 'enabled',
}

export const userFilterValidator = zod.object({
    /**
     * User rules concatenated with '\n'.
     */
    [UserFilterOption.Rules]: zod.string(),
    /**
     * In previous versions, rules could be marked as disabled.
     * Currently not in use.
     *
     * @deprecated
     */
    [UserFilterOption.DisabledRules]: zod.string(),
    /**
     * Is enabled user rules or not.
     */
    [UserFilterOption.Enabled]: zod.boolean().optional(),
});

/**
 * Contains the user rules filter and its status: enabled or disabled.
 */
export type UserFilterConfig = zod.infer<typeof userFilterValidator>;
