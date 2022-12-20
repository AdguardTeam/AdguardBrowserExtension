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
import zod from 'zod';

// Allowlist configuration

export const enum AllowlistOption {
    Inverted = 'inverted',
    Domains = 'domains',
    InvertedDomains = 'inverted-domains',
    Enabled = 'enabled',
}

export const allowlistValidator = zod.object({
    [AllowlistOption.Domains]: zod.array(zod.string()),
    [AllowlistOption.InvertedDomains]: zod.array(zod.string()),
    [AllowlistOption.Enabled]: zod.boolean().optional(),
    [AllowlistOption.Inverted]: zod.boolean().optional(),
});

export type AllowlistConfig = zod.infer<typeof allowlistValidator>;
