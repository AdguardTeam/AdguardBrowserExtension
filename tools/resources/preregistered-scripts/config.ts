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

/**
 * List of domains for which preregistered-script bundles are generated.
 *
 * All scriptlets and JS rules from all enabled filters that target a
 * listed domain are automatically included — no manual allowlisting
 * or exclusion configuration needed.
 *
 * To add a new preregistered domain, add it here and run
 * `pnpm resources:mv3`.
 */
export const preregisteredDomains: readonly string[] = [
    'youtube.com',
];
