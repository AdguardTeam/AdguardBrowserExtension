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

// Allowlist configuration

export const enum AllowlistOption {
    Inverted = 'inverted',
    Domains = 'domains',
    InvertedDomains = 'inverted-domains',
    Enabled = 'enabled',
}

export const allowlistValidator = zod.object({
    /**
     * If `AllowlistOption.Inverted` === false (the default state),
     * the extension will use this list of domains to disable ad blocking on
     * them. In other words, the extension will apply ad blocking everywhere,
     * EXCEPT the domains on this list.
     */
    [AllowlistOption.Domains]: zod.array(zod.string()),
    /**
     * If `AllowlistOption.Inverted` === true, the extension will use this list
     * to disable ad blocking for all sites but not these sites. In other words,
     * the extension will work ONLY on domains from this list.
     */
    [AllowlistOption.InvertedDomains]: zod.array(zod.string()),
    /**
     * Is allowlist list enabled or not.
     */
    [AllowlistOption.Enabled]: zod.boolean().optional(),
    /**
     * If this flag is true, the application will work ONLY with domains from
     * the 'domains' list, otherwise it will work everywhere EXCLUDING domains
     * from the list.
     */
    [AllowlistOption.Inverted]: zod.boolean().optional(),
});

/**
 * Describes a special list of domains on which the extension should work or
 * should exclude them from filtering.
 */
export type AllowlistConfig = zod.infer<typeof allowlistValidator>;
