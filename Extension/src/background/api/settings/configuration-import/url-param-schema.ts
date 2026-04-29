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

import { z } from 'zod';

/**
 * Zod schema for a parsed stealth import config (all fields optional).
 */
export const stealthImportConfigSchema = z.object({
    enabled: z.boolean().optional(),
    hideSearchQueries: z.boolean().optional(),
    sendDnt: z.boolean().optional(),
    blockWebrtc: z.boolean().optional(),
    stripUrl: z.boolean().optional(),
    blockTrackers: z.boolean().optional(),
    thirdPartyCookiesMin: z.number().min(0).optional(),
    firstPartyCookiesMin: z.number().min(0).optional(),
    xClient: z.boolean().optional(),
    hideReferrer: z.boolean().optional(),
});

/**
 * Zod schema for the full import configuration object.
 */
export const importConfigurationSchema = z.object({
    schemeVersion: z.union([z.literal(3), z.literal(4)]),
    regularFilters: z.array(z.number().int().positive()),
    customFilters: z.array(z.object({
        title: z.string(),
        url: z.string().url(),
    })),
    stealth: stealthImportConfigSchema.partial(),
    browsingSecurity: z.object({ enabled: z.boolean() }).optional(),
    informational: z.record(z.string()),
});
